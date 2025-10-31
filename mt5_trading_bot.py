"""
MT5 Trading Bot - Executes AI-generated trading signals
Run this script on your computer while MT5 is open

⚠️  SECURITY:
- Store credentials in .env file (never commit to Git)
- Use service role key (not anon key)
- Bot logs are sanitized (masked account numbers)
- All trades are audited in security_audit_log
"""

import MetaTrader5 as mt5
from supabase import create_client, Client
import time
from datetime import datetime
import os
import logging
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('mt5_bot.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://ohuzblalbmgykwaaecds.supabase.co')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')
MT5_LOGIN = int(os.getenv('MT5_LOGIN', '0'))
MT5_PASSWORD = os.getenv('MT5_PASSWORD', '')
MT5_SERVER = os.getenv('MT5_SERVER', 'XMGlobal-MT5')
POLL_INTERVAL = int(os.getenv('POLL_INTERVAL', '30'))  # seconds

# Bot user ID (for audit trail)
BOT_USER_ID = os.getenv('BOT_USER_ID', '')

# Initialize Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Error counter for auto-shutdown
error_count = 0
MAX_ERRORS = 10

def connect_mt5():
    """Connect to MetaTrader 5"""
    if not mt5.initialize():
        logger.error("MT5 initialization failed")
        return False
    
    if not mt5.login(MT5_LOGIN, MT5_PASSWORD, MT5_SERVER):
        logger.error(f"MT5 login failed: {mt5.last_error()}")
        mt5.shutdown()
        return False
    
    account_info = mt5.account_info()
    
    # ✅ Secure logging - mask account number, don't log balance
    masked_account = f"***{str(account_info.login)[-4:]}"
    logger.info("✅ Connected to MT5")
    logger.info(f"   Account: {masked_account}")
    logger.info(f"   Server: {MT5_SERVER}")
    logger.info(f"   Currency: {account_info.currency}")
    # Do NOT log: balance, leverage, margin, equity (sensitive financial data)
    
    # Audit log connection
    try:
        supabase.table('security_audit_log').insert({
            'user_id': BOT_USER_ID if BOT_USER_ID else None,
            'event_type': 'mt5_bot_connected',
            'details': {
                'server': MT5_SERVER,
                'account': masked_account
            }
        }).execute()
    except Exception as e:
        logger.warning(f"Failed to log connection audit: {e}")
    
    return True

def fetch_new_signals():
    """Fetch unexecuted trading signals from Supabase"""
    global error_count
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
        error_count += 1
        logger.error(f"Error fetching signals: {e}")
        if error_count >= MAX_ERRORS:
            logger.critical(f"Max errors ({MAX_ERRORS}) reached. Shutting down bot.")
            raise
        return []

def execute_trade(signal):
    """Execute trade in MT5"""
    symbol = signal['stock_symbol']
    
    # Validate symbol exists in MT5
    if not mt5.symbol_select(symbol, True):
        error_msg = f"Symbol {symbol} not found in MT5"
        logger.error(error_msg)
        log_failed_execution(signal, error_msg)
        return None
    
    # Get current price
    tick = mt5.symbol_info_tick(symbol)
    if tick is None:
        error_msg = f"Failed to get tick for {symbol}"
        logger.error(error_msg)
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
        logger.error(error_msg)
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
    logger.info(f"📤 Placing {signal_type} order for {symbol} @ {price:.5f}")
    result = mt5.order_send(request)
    
    if result.retcode != mt5.TRADE_RETCODE_DONE:
        error_msg = f"Order failed: {result.comment}"
        logger.error(error_msg)
        log_failed_execution(signal, error_msg)
        return None
    
    logger.info(f"✅ Order executed: Ticket #{result.order}")
    log_successful_execution(signal, result, volume, price)
    
    return result

def log_failed_execution(signal, error_message):
    """Log failed trade execution"""
    try:
        supabase.table('trade_executions').insert({
            'signal_id': signal['id'],
            'user_id': BOT_USER_ID,  # ✅ Always set user_id
            'symbol': signal['stock_symbol'],
            'action': signal['signal_type'],
            'volume': 0.01,
            'status': 'failed',
            'error_message': error_message,
        }).execute()
        
        # Audit log
        supabase.table('security_audit_log').insert({
            'user_id': BOT_USER_ID if BOT_USER_ID else None,
            'event_type': 'mt5_trade_failed',
            'details': {
                'symbol': signal['stock_symbol'],
                'signal_type': signal['signal_type'],
                'error': error_message
            }
        }).execute()
    except Exception as e:
        logger.error(f"Failed to log failed execution: {e}")

def log_successful_execution(signal, result, volume, price):
    """Log successful trade execution"""
    try:
        # Insert trade execution record
        supabase.table('trade_executions').insert({
            'signal_id': signal['id'],
            'user_id': BOT_USER_ID,  # ✅ Always set user_id
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
        
        # Audit log
        supabase.table('security_audit_log').insert({
            'user_id': BOT_USER_ID if BOT_USER_ID else None,
            'event_type': 'mt5_trade_executed',
            'details': {
                'symbol': signal['stock_symbol'],
                'action': signal['signal_type'],
                'order_id': str(result.order),
                'volume': volume,
                'price': price
            }
        }).execute()
        
    except Exception as e:
        logger.error(f"Failed to log execution: {e}")

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
            logger.warning(f"Failed to update position {position.ticket}: {e}")

def main():
    """Main bot loop"""
    logger.info("=" * 60)
    logger.info("MT5 Trading Bot v2.0 (Secure) - AI Signal Executor")
    logger.info("=" * 60)
    
    # Validate configuration
    if not SUPABASE_SERVICE_KEY:
        logger.error("❌ SUPABASE_SERVICE_ROLE_KEY not set in .env file")
        return
    
    if MT5_LOGIN == 0:
        logger.error("❌ MT5 credentials not configured in .env file")
        return
    
    if not BOT_USER_ID:
        logger.error("❌ BOT_USER_ID not set in .env file")
        logger.error("   Add BOT_USER_ID=your-user-uuid to .env")
        logger.error("   Get your UUID from the web app or Supabase auth.users table")
        return
    
    if not connect_mt5():
        return
    
    logger.info(f"\n🤖 Bot started. Polling every {POLL_INTERVAL} seconds...")
    logger.info("Press Ctrl+C to stop\n")
    
    try:
        while True:
            # Fetch new signals
            signals = fetch_new_signals()
            
            if signals:
                logger.info(f"\n📊 Found {len(signals)} new signal(s)")
                for signal in signals:
                    logger.info(f"\n🎯 Signal: {signal['stock_symbol']} {signal['signal_type']}")
                    logger.info(f"   Confidence: {signal['confidence_score']}%")
                    logger.info(f"   Entry: {signal.get('current_price', 'N/A')}")
                    logger.info(f"   Target: {signal.get('target_price', 'N/A')}")
                    logger.info(f"   Stop Loss: {signal.get('stop_loss', 'N/A')}")
                    
                    execute_trade(signal)
                    time.sleep(2)  # Wait between orders
            
            # Monitor existing positions
            monitor_positions()
            
            # Wait before next poll
            time.sleep(POLL_INTERVAL)
            
    except KeyboardInterrupt:
        logger.info("\n\n⏹️  Bot stopped by user")
    except Exception as e:
        logger.critical(f"Bot crashed: {e}", exc_info=True)
    finally:
        # Audit log disconnection
        try:
            supabase.table('security_audit_log').insert({
                'user_id': BOT_USER_ID if BOT_USER_ID else None,
                'event_type': 'mt5_bot_stopped',
                'details': {'reason': 'shutdown'}
            }).execute()
        except:
            pass
        
        mt5.shutdown()
        logger.info("👋 MT5 connection closed")

if __name__ == "__main__":
    main()
