"""
MT5 Trading Bot - Executes AI-generated trading signals
Run this script on your computer while MT5 is open
"""

import MetaTrader5 as mt5
from supabase import create_client, Client
import time
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://ohuzblalbmgykwaaecds.supabase.co')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')
MT5_LOGIN = int(os.getenv('MT5_LOGIN', '0'))
MT5_PASSWORD = os.getenv('MT5_PASSWORD', '')
MT5_SERVER = os.getenv('MT5_SERVER', 'XMGlobal-MT5')
POLL_INTERVAL = int(os.getenv('POLL_INTERVAL', '30'))  # seconds

# Initialize Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def connect_mt5():
    """Connect to MetaTrader 5"""
    if not mt5.initialize():
        print("❌ MT5 initialization failed")
        return False
    
    if not mt5.login(MT5_LOGIN, MT5_PASSWORD, MT5_SERVER):
        print(f"❌ MT5 login failed: {mt5.last_error()}")
        mt5.shutdown()
        return False
    
    account_info = mt5.account_info()
    print(f"✅ Connected to MT5")
    print(f"   Account: {account_info.login}")
    print(f"   Balance: ${account_info.balance:.2f}")
    print(f"   Leverage: 1:{account_info.leverage}")
    return True

def fetch_new_signals():
    """Fetch unexecuted trading signals from Supabase"""
    try:
        response = supabase.table('trading_signals')\
            .select('*')\
            .in_('signal_type', ['BUY', 'SELL'])\
            .gte('confidence_score', 70)\
            .is_('executed', 'null')\
            .gte('expires_at', datetime.now().isoformat())\
            .execute()
        return response.data
    except Exception as e:
        print(f"⚠️  Error fetching signals: {e}")
        return []

def execute_trade(signal):
    """Execute trade in MT5"""
    symbol = signal['stock_symbol']
    
    # Validate symbol exists in MT5
    if not mt5.symbol_select(symbol, True):
        error_msg = f"Symbol {symbol} not found in MT5"
        print(f"❌ {error_msg}")
        log_failed_execution(signal, error_msg)
        return None
    
    # Get current price
    tick = mt5.symbol_info_tick(symbol)
    if tick is None:
        error_msg = f"Failed to get tick for {symbol}"
        print(f"❌ {error_msg}")
        log_failed_execution(signal, error_msg)
        return None
    
    # Determine order type and price
    signal_type = signal['signal_type']
    if signal_type == 'BUY':
        order_type = mt5.ORDER_TYPE_BUY
        price = tick.ask
    elif signal_type == 'SELL':
        order_type = mt5.ORDER_TYPE_SELL
        price = tick.bid
    else:
        error_msg = f"Unknown signal type: {signal_type}"
        print(f"❌ {error_msg}")
        log_failed_execution(signal, error_msg)
        return None
    
    # Calculate volume (start small: 0.01 lots)
    volume = 0.01
    
    # Prepare request
    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": symbol,
        "volume": volume,
        "type": order_type,
        "price": price,
        "sl": float(signal.get('stop_loss', 0)),
        "tp": float(signal.get('target_price', 0)),
        "deviation": 20,
        "magic": 234000,
        "comment": f"AI_{signal['id'][:8]}",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }
    
    # Send order
    print(f"📤 Placing {signal_type} order for {symbol} @ {price:.5f}")
    result = mt5.order_send(request)
    
    if result.retcode != mt5.TRADE_RETCODE_DONE:
        error_msg = f"Order failed: {result.comment}"
        print(f"❌ {error_msg}")
        log_failed_execution(signal, error_msg)
        return None
    
    print(f"✅ Order executed: Ticket #{result.order}")
    log_successful_execution(signal, result, volume, price)
    
    return result

def log_failed_execution(signal, error_message):
    """Log failed trade execution"""
    try:
        supabase.table('trade_executions').insert({
            'signal_id': signal['id'],
            'symbol': signal['stock_symbol'],
            'action': signal['signal_type'],
            'volume': 0.01,
            'status': 'failed',
            'error_message': error_message,
        }).execute()
    except Exception as e:
        print(f"⚠️  Failed to log error: {e}")

def log_successful_execution(signal, result, volume, price):
    """Log successful trade execution"""
    try:
        # Insert trade execution record
        supabase.table('trade_executions').insert({
            'signal_id': signal['id'],
            'order_id': str(result.order),
            'symbol': signal['stock_symbol'],
            'action': signal['signal_type'],
            'volume': volume,
            'entry_price': price,
            'stop_loss': signal.get('stop_loss'),
            'take_profit': signal.get('target_price'),
            'status': 'executed',
            'executed_at': datetime.now().isoformat(),
        }).execute()
        
        # Mark signal as executed
        supabase.table('trading_signals').update({
            'executed': True,
            'executed_at': datetime.now().isoformat(),
        }).eq('id', signal['id']).execute()
        
    except Exception as e:
        print(f"⚠️  Failed to log execution: {e}")

def monitor_positions():
    """Monitor open positions and update P&L"""
    positions = mt5.positions_get()
    if positions is None or len(positions) == 0:
        return
    
    for position in positions:
        try:
            supabase.table('trade_executions').update({
                'current_price': position.price_current,
                'profit_loss': position.profit,
            }).eq('order_id', str(position.ticket)).execute()
        except Exception as e:
            print(f"⚠️  Failed to update position {position.ticket}: {e}")

def main():
    """Main bot loop"""
    print("=" * 60)
    print("MT5 Trading Bot - AI Signal Executor")
    print("=" * 60)
    
    if not SUPABASE_SERVICE_KEY:
        print("❌ SUPABASE_SERVICE_ROLE_KEY not set in .env file")
        return
    
    if MT5_LOGIN == 0:
        print("❌ MT5 credentials not configured in .env file")
        return
    
    if not connect_mt5():
        return
    
    print(f"\n🤖 Bot started. Polling every {POLL_INTERVAL} seconds...")
    print("Press Ctrl+C to stop\n")
    
    try:
        while True:
            # Fetch new signals
            signals = fetch_new_signals()
            
            if signals:
                print(f"\n📊 Found {len(signals)} new signal(s)")
                for signal in signals:
                    print(f"\n🎯 Signal: {signal['stock_symbol']} {signal['signal_type']}")
                    print(f"   Confidence: {signal['confidence_score']}%")
                    print(f"   Entry: {signal.get('current_price', 'N/A')}")
                    print(f"   Target: {signal.get('target_price', 'N/A')}")
                    print(f"   Stop Loss: {signal.get('stop_loss', 'N/A')}")
                    
                    execute_trade(signal)
                    time.sleep(2)  # Wait between orders
            
            # Monitor existing positions
            monitor_positions()
            
            # Wait before next poll
            time.sleep(POLL_INTERVAL)
            
    except KeyboardInterrupt:
        print("\n\n⏹️  Bot stopped by user")
    finally:
        mt5.shutdown()
        print("👋 MT5 connection closed")

if __name__ == "__main__":
    main()
