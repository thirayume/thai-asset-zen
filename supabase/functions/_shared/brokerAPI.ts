/**
 * Broker API Abstraction Layer
 * Supports: SET Trade, IRIS, KT Zmico
 */

export interface OrderParams {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price?: number; // Optional for market orders
  orderType: 'MARKET' | 'LIMIT';
  timeInForce?: 'DAY' | 'GTC'; // Good Till Cancel
}

export interface OrderResult {
  orderId: string;
  status: 'pending' | 'filled' | 'partial' | 'rejected' | 'cancelled';
  filledQuantity: number;
  filledPrice?: number;
  message?: string;
}

export interface Position {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  unrealizedPnL: number;
}

export interface BrokerAPI {
  authenticate(): Promise<boolean>;
  placeOrder(params: OrderParams): Promise<OrderResult>;
  getOrderStatus(orderId: string): Promise<OrderResult>;
  getAccountBalance(): Promise<{ cash: number; totalValue: number }>;
  getPositions(): Promise<Position[]>;
  cancelOrder(orderId: string): Promise<boolean>;
}

/**
 * SET Trade API Implementation
 * Official Stock Exchange of Thailand API
 */
export class SetTradeAPI implements BrokerAPI {
  private apiKey: string;
  private accountId: string;
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(apiKey: string, accountId: string) {
    this.apiKey = apiKey;
    this.accountId = accountId;
    this.baseUrl = 'https://api.settrade.com/api/v2'; // Example URL
  }

  async authenticate(): Promise<boolean> {
    try {
      console.log('Authenticating with SET Trade API...');
      
      const response = await fetch(`${this.baseUrl}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          account_id: this.accountId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      
      console.log('✅ SET Trade authentication successful');
      return true;
    } catch (error) {
      console.error('❌ SET Trade authentication failed:', error);
      return false;
    }
  }

  async placeOrder(params: OrderParams): Promise<OrderResult> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      console.log(`Placing ${params.side} order: ${params.quantity} shares of ${params.symbol}`);

      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          account_id: this.accountId,
          symbol: params.symbol,
          side: params.side,
          quantity: params.quantity,
          order_type: params.orderType,
          price: params.price,
          time_in_force: params.timeInForce || 'DAY',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Order placement failed: ${errorData.message}`);
      }

      const data = await response.json();
      
      console.log(`✅ Order placed successfully: ${data.order_id}`);
      
      return {
        orderId: data.order_id,
        status: data.status,
        filledQuantity: data.filled_quantity || 0,
        filledPrice: data.filled_price,
        message: data.message,
      };
    } catch (error) {
      console.error('❌ Order placement failed:', error);
      throw error;
    }
  }

  async getOrderStatus(orderId: string): Promise<OrderResult> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get order status: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        orderId: data.order_id,
        status: data.status,
        filledQuantity: data.filled_quantity || 0,
        filledPrice: data.filled_price,
        message: data.message,
      };
    } catch (error) {
      console.error('❌ Failed to get order status:', error);
      throw error;
    }
  }

  async getAccountBalance(): Promise<{ cash: number; totalValue: number }> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      const response = await fetch(`${this.baseUrl}/accounts/${this.accountId}/balance`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get balance: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        cash: data.cash_balance,
        totalValue: data.total_value,
      };
    } catch (error) {
      console.error('❌ Failed to get account balance:', error);
      throw error;
    }
  }

  async getPositions(): Promise<Position[]> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      const response = await fetch(`${this.baseUrl}/accounts/${this.accountId}/positions`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get positions: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.positions.map((pos: any) => ({
        symbol: pos.symbol,
        quantity: pos.quantity,
        averagePrice: pos.average_price,
        currentPrice: pos.current_price,
        unrealizedPnL: pos.unrealized_pnl,
      }));
    } catch (error) {
      console.error('❌ Failed to get positions:', error);
      throw error;
    }
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Failed to cancel order:', error);
      return false;
    }
  }
}

/**
 * Factory function to get broker API instance
 */
export function getBrokerAPI(
  brokerName: string,
  apiKey: string,
  accountId: string
): BrokerAPI {
  switch (brokerName.toLowerCase()) {
    case 'settrade':
    case 'set_trade':
      return new SetTradeAPI(apiKey, accountId);
    
    // Add other brokers here
    // case 'iris':
    //   return new IrisAPI(apiKey, accountId);
    // case 'kt_zmico':
    //   return new KTZmicoAPI(apiKey, accountId);
    
    default:
      throw new Error(`Unsupported broker: ${brokerName}`);
  }
}
