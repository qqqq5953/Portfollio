import { supabaseClient } from '../shared/supabaseClient.ts'
import { jsonResponse, corsJsonResponse } from '../shared/helper.ts'
import { createSupabaseClient } from '../shared/supabaseClient.ts'

Deno.serve(async (req) => {
  console.log('request received',req);
  
  if (req.method === 'OPTIONS') return corsJsonResponse()

  const isLocal = Deno.env.get('LOCAL_DEV') === 'true'
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  const supabaseClient = createSupabaseClient()

  if(!isLocal){
    const { data: { user }, error } = await supabaseClient.auth.getUser(jwt)
    if (error || !user) {
      return jsonResponse({
        data: null,
        error,
        status: 401,
      })
    }
  }

  const reqBody = await req.json();
  console.log("reqBody", reqBody);

  const { data, error } = await supabaseClient
    .from('transactions')
    .select('id, symbol, price, share, side, currency, exchange_rate, date, created_at')
    .eq('user_id', reqBody.userId)
    .order('date', { ascending: true })
  
  console.log("read result - data:", data);
  console.log("read result - error:", error);

  const symbols = data?.map(item => item.symbol) ?? [];
  const uniqueSymbols = [...new Set(symbols)];
  // console.log("uniqueSymbols", uniqueSymbols);

  // fetch current price from cnyes
  const res = await Promise.allSettled([
    ...uniqueSymbols.map(symbol => fetch(`https://ws.api.cnyes.com/ws/api/v1/quote/quotes/USS:${symbol}:STOCK?column=E`))
  ])

  const result = await Promise.allSettled(
    res.map(item =>
      item.status === "fulfilled" ? item.value.json() : Promise.resolve(null)
    )
  ).then(results => {
    return results.map(result => result.status === "fulfilled" ? result.value : null)
  })

  // console.log("result", result);

  const currentPrices = result.reduce((acc, item) => {
    if (item.statusCode === 200) {
      const symbol = item.data[0]['200010']
      const close = item.data[0]['6']
      acc[symbol] = close
    }
    return acc
  }, {})

  console.log("currentPrices", currentPrices);

  const unrealized = getUnrealizedHoldings(data, currentPrices);

  return jsonResponse({ data: {
    unrealized,
    currentPrices,
  }, error });
})  

type Trade = {
  id: string;
  symbol: string;
  price: number;
  share: number;
  side: 'buy' | 'sell';
  currency: 'USD';
  exchange_rate: number;
  date: string;
  created_at: string;
};

type RemainingHolding = {
  id: string;
  symbol: string;
  profit: number;
  profitPercentage: number;
  remaingShare: number;
  side: 'buy';
  currency: 'USD';
  exchange_rate: number;
};

function getUnrealizedHoldings(trades: Trade[], currentPrices: Record<string, number>): RemainingHolding[] {
  const buyQueues: Record<string, Trade[]> = {};
  
  for (const trade of trades) {
    const { symbol } = trade;
    
    if (!buyQueues[symbol]) buyQueues[symbol] = [];
    
    if (trade.side === 'buy') {
      buyQueues[symbol].push({ ...trade });
    } else if (trade.side === 'sell') {
      let qtyToSell = trade.share;
      
      while (qtyToSell > 0 && buyQueues[symbol]?.length > 0) {
        const buy = buyQueues[symbol][0];
        const qtyUsed = Math.min(buy.share, qtyToSell);
        buy.share -= qtyUsed;
        qtyToSell -= qtyUsed;
        if (buy.share === 0) {
          buyQueues[symbol].shift();
        }
      }
    }
  }
  
  console.log("buyQueues", buyQueues);
  
  const results: Record<string, { cost: number; marketValue: number; remaingShare: number; exchange_rate: number; currency: string; remainingBuys: Trade[] }> = {};

  for (const symbol in buyQueues) {
    const buys = buyQueues[symbol];
    const remaining = buys.filter(b => b.share > 0);

    if (remaining.length === 0) continue;

    const cost = remaining.reduce((acc, b) => acc + b.price * b.share, 0);
    const remaingShare = remaining.reduce((acc, b) => acc + b.share, 0);
    const marketValue = currentPrices[symbol] * remaingShare;

    const profit = marketValue - cost;
    const profitPercentage = cost > 0 ? (profit / cost) * 100 : 0;

    results[symbol] = {
      cost,
      marketValue,
      remaingShare,
      exchange_rate: remaining[0].exchange_rate,
      currency: remaining[0].currency,
      remainingBuys: remaining,
      profit,
      profitPercentage
    };
  }

  console.log("results", results);

  return Object.entries(results).map(([symbol, info]) => ({
    id: info.remainingBuys[0].id,
    symbol,
    cost: parseFloat(info.cost.toFixed(2)),
    profit: parseFloat(info.profit.toFixed(2)),
    profitPercentage: parseFloat(info.profitPercentage.toFixed(2)),
    remaingShare: info.remaingShare,
    side: 'buy',
    currency: info.currency,
    exchange_rate: info.exchange_rate,
  }));
}
