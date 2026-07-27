export interface MarketInstrument {
  id: string;
  symbol: string;
  name: string;
  category: 'Forex' | 'Crypto' | 'Stocks' | 'Indices' | 'Metals' | 'Energy' | 'ETFs' | 'Futures';
  price: number;
  bid: number;
  ask: number;
  spread: number; // in pips/cents
  change24h: number; // percentage
  high24h: number;
  low24h: number;
  leverage: string;
  swapLong: number;
  swapShort: number;
  minTrade: number;
  tradingHours: string;
  isFavorite?: boolean;
}

export const INITIAL_MARKETS: MarketInstrument[] = [
  // Forex
  { id: 'eurusd', symbol: 'EUR/USD', name: 'Euro / US Dollar', category: 'Forex', price: 1.0845, bid: 1.0844, ask: 1.0846, spread: 0.2, change24h: +0.34, high24h: 1.0880, low24h: 1.0820, leverage: '1:500', swapLong: -1.2, swapShort: 0.4, minTrade: 0.01, tradingHours: '24/5' },
  { id: 'gbpusd', symbol: 'GBP/USD', name: 'British Pound / US Dollar', category: 'Forex', price: 1.2715, bid: 1.2714, ask: 1.2716, spread: 0.5, change24h: -0.18, high24h: 1.2760, low24h: 1.2690, leverage: '1:500', swapLong: -1.5, swapShort: 0.2, minTrade: 0.01, tradingHours: '24/5' },
  { id: 'usdjpy', symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', category: 'Forex', price: 154.20, bid: 154.19, ask: 154.21, spread: 0.4, change24h: +0.65, high24h: 154.80, low24h: 153.50, leverage: '1:500', swapLong: 2.1, swapShort: -3.4, minTrade: 0.01, tradingHours: '24/5' },
  { id: 'audusd', symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', category: 'Forex', price: 0.6580, bid: 0.6579, ask: 0.6581, spread: 0.3, change24h: +0.42, high24h: 0.6610, low24h: 0.6540, leverage: '1:500', swapLong: -0.8, swapShort: 0.1, minTrade: 0.01, tradingHours: '24/5' },
  { id: 'usdcad', symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', category: 'Forex', price: 1.3650, bid: 1.3649, ask: 1.3651, spread: 0.4, change24h: -0.22, high24h: 1.3690, low24h: 1.3620, leverage: '1:500', swapLong: 0.5, swapShort: -1.1, minTrade: 0.01, tradingHours: '24/5' },

  // Crypto
  { id: 'btc', symbol: 'BTC/USD', name: 'Bitcoin / US Dollar', category: 'Crypto', price: 67450.00, bid: 67445.00, ask: 67455.00, spread: 10.0, change24h: +3.85, high24h: 68200.00, low24h: 64900.00, leverage: '1:100', swapLong: -0.01, swapShort: -0.01, minTrade: 0.001, tradingHours: '24/7' },
  { id: 'eth', symbol: 'ETH/USD', name: 'Ethereum / US Dollar', category: 'Crypto', price: 3520.50, bid: 3520.00, ask: 3521.00, spread: 1.0, change24h: +2.40, high24h: 3580.00, low24h: 3410.00, leverage: '1:100', swapLong: -0.01, swapShort: -0.01, minTrade: 0.01, tradingHours: '24/7' },
  { id: 'sol', symbol: 'SOL/USD', name: 'Solana / US Dollar', category: 'Crypto', price: 184.30, bid: 184.25, ask: 184.35, spread: 0.1, change24h: +5.12, high24h: 189.00, low24h: 172.50, leverage: '1:50', swapLong: -0.02, swapShort: -0.02, minTrade: 0.1, tradingHours: '24/7' },
  { id: 'xrp', symbol: 'XRP/USD', name: 'Ripple / US Dollar', category: 'Crypto', price: 0.5840, bid: 0.5839, ask: 0.5841, spread: 0.001, change24h: -1.15, high24h: 0.6020, low24h: 0.5750, leverage: '1:50', swapLong: -0.02, swapShort: -0.02, minTrade: 10, tradingHours: '24/7' },

  // Stocks
  { id: 'aapl', symbol: 'AAPL', name: 'Apple Inc.', category: 'Stocks', price: 166.00, bid: 165.95, ask: 166.05, spread: 0.1, change24h: +2.40, high24h: 168.00, low24h: 162.50, leverage: '1:20', swapLong: -0.05, swapShort: 0.01, minTrade: 1, tradingHours: '09:30-16:00 EST' },
  { id: 'tsla', symbol: 'TSLA', name: 'Tesla Inc.', category: 'Stocks', price: 248.50, bid: 248.40, ask: 248.60, spread: 0.2, change24h: +4.75, high24h: 252.00, low24h: 236.00, leverage: '1:20', swapLong: -0.06, swapShort: 0.01, minTrade: 1, tradingHours: '09:30-16:00 EST' },
  { id: 'nvda', symbol: 'NVDA', name: 'NVIDIA Corp', category: 'Stocks', price: 122.80, bid: 122.75, ask: 122.85, spread: 0.1, change24h: +6.10, high24h: 125.00, low24h: 115.20, leverage: '1:20', swapLong: -0.05, swapShort: 0.01, minTrade: 1, tradingHours: '09:30-16:00 EST' },
  { id: 'googl', symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'Stocks', price: 175.40, bid: 175.35, ask: 175.45, spread: 0.1, change24h: -0.85, high24h: 178.20, low24h: 174.10, leverage: '1:20', swapLong: -0.05, swapShort: 0.01, minTrade: 1, tradingHours: '09:30-16:00 EST' },
  { id: 'amzn', symbol: 'AMZN', name: 'Amazon.com Inc.', category: 'Stocks', price: 182.20, bid: 182.15, ask: 182.25, spread: 0.1, change24h: +1.15, high24h: 184.50, low24h: 180.00, leverage: '1:20', swapLong: -0.05, swapShort: 0.01, minTrade: 1, tradingHours: '09:30-16:00 EST' },

  // Indices
  { id: 'us500', symbol: 'US500', name: 'S&P 500 Index', category: 'Indices', price: 5460.20, bid: 5459.80, ask: 5460.60, spread: 0.8, change24h: +0.82, high24h: 5485.00, low24h: 5410.00, leverage: '1:100', swapLong: -0.3, swapShort: 0.1, minTrade: 0.1, tradingHours: '23 Hours' },
  { id: 'nas100', symbol: 'US100', name: 'NASDAQ 100 Index', category: 'Indices', price: 19850.00, bid: 19849.00, ask: 19851.00, spread: 2.0, change24h: +1.45, high24h: 19980.00, low24h: 19550.00, leverage: '1:100', swapLong: -0.5, swapShort: 0.1, minTrade: 0.1, tradingHours: '23 Hours' },
  { id: 'us30', symbol: 'US30', name: 'Dow Jones Industrial', category: 'Indices', price: 39120.00, bid: 39118.00, ask: 39122.00, spread: 4.0, change24h: +0.31, high24h: 39300.00, low24h: 38950.00, leverage: '1:100', swapLong: -0.8, swapShort: 0.2, minTrade: 0.1, tradingHours: '23 Hours' },

  // Metals & Commodities & Energy
  { id: 'xauusd', symbol: 'XAU/USD', name: 'Gold / US Dollar', category: 'Metals', price: 2385.50, bid: 2385.30, ask: 2385.70, spread: 0.4, change24h: +0.95, high24h: 2402.00, low24h: 2362.00, leverage: '1:200', swapLong: -2.1, swapShort: 0.8, minTrade: 0.01, tradingHours: '23 Hours' },
  { id: 'xagusd', symbol: 'XAG/USD', name: 'Silver / US Dollar', category: 'Metals', price: 30.45, bid: 30.43, ask: 30.47, spread: 0.04, change24h: +1.80, high24h: 31.10, low24h: 29.80, leverage: '1:200', swapLong: -0.4, swapShort: 0.1, minTrade: 0.1, tradingHours: '23 Hours' },
  { id: 'wti', symbol: 'USOIL', name: 'Crude Oil (WTI)', category: 'Energy', price: 81.20, bid: 81.17, ask: 81.23, spread: 0.06, change24h: -1.10, high24h: 82.80, low24h: 80.50, leverage: '1:100', swapLong: -0.5, swapShort: 0.1, minTrade: 0.1, tradingHours: '23 Hours' },
  { id: 'natgas', symbol: 'NATGAS', name: 'Natural Gas', category: 'Energy', price: 2.78, bid: 2.77, ask: 2.79, spread: 0.02, change24h: +3.20, high24h: 2.85, low24h: 2.65, leverage: '1:50', swapLong: -0.1, swapShort: 0.02, minTrade: 1, tradingHours: '23 Hours' },

  // ETFs
  { id: 'spy', symbol: 'SPY', name: 'SPDR S&P 500 ETF', category: 'ETFs', price: 544.10, bid: 544.00, ask: 544.20, spread: 0.2, change24h: +0.78, high24h: 546.00, low24h: 540.20, leverage: '1:20', swapLong: -0.02, swapShort: 0.01, minTrade: 1, tradingHours: '09:30-16:00 EST' },
  { id: 'qqq', symbol: 'QQQ', name: 'Invesco QQQ Trust', category: 'ETFs', price: 478.90, bid: 478.80, ask: 479.00, spread: 0.2, change24h: +1.35, high24h: 482.00, low24h: 472.00, leverage: '1:20', swapLong: -0.02, swapShort: 0.01, minTrade: 1, tradingHours: '09:30-16:00 EST' }
];

export function generateCandlesForSymbol(symbol: string, count: number = 14) {
  const baseInst = INITIAL_MARKETS.find(m => m.symbol === symbol) || INITIAL_MARKETS[0];
  const basePrice = baseInst.price;
  const candles = [];
  let current = basePrice * 0.94;

  const now = new Date();
  for (let i = count; i >= 0; i--) {
    const timeStr = new Date(now.getTime() - i * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const deltaPercent = (Math.random() - 0.47) * 0.025;
    const open = current;
    const close = open * (1 + deltaPercent);
    const high = Math.max(open, close) * (1 + Math.random() * 0.008);
    const low = Math.min(open, close) * (1 - Math.random() * 0.008);
    current = close;

    candles.push({
      time: timeStr,
      open: Number(open.toFixed(basePrice > 1000 ? 2 : 4)),
      close: Number(close.toFixed(basePrice > 1000 ? 2 : 4)),
      high: Number(high.toFixed(basePrice > 1000 ? 2 : 4)),
      low: Number(low.toFixed(basePrice > 1000 ? 2 : 4)),
      isUp: close >= open,
      openClose: [Math.min(open, close), Math.max(open, close)]
    });
  }
  return candles;
}
