import { supabaseClient } from '../shared/supabaseClient.ts'
import { jsonResponse, corsJsonResponse } from '../shared/helper.ts'
import { createSupabaseClient } from '../shared/supabaseClient.ts'

Deno.serve(async (req) => {
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

  const { userId } = reqBody;
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('id, symbol, price, share, side, currency, exchange_rate, date, created_at')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  const trades = data?.map((item) => {
    return {
      type: item.side,
      quantity: item.share,
      price: item.price,
      date: item.date,
    };
  }) ?? [];
  console.log("trades", trades);

//   const sellResults = calculateFIFOGainPerSell(trades);
  const enrichedSells = enrichSellTradesWithGainData(data);
//   console.log("sellResults", sellResults);
  console.log("enrichedSells", enrichedSells);
  console.log("read result - data:", data);
  console.log("read result - error:", error);

  return jsonResponse({ data: enrichedSells, error });
})

// const trades: Trade[] = [
//     { type: 'buy',  quantity: 10, price: 100, date: '2024-01-01' },
//     { type: 'buy',  quantity: 10, price: 120, date: '2024-02-01' },
//     { type: 'buy',  quantity: 5,  price: 130, date: '2024-03-01' },
//     { type: 'sell', quantity: 8,  price: 150, date: '2024-04-01' },
//     { type: 'sell', quantity: 7,  price: 160, date: '2024-05-01' },
//     { type: 'sell', quantity: 5,  price: 140, date: '2024-06-01' },
// ];

type InputTrade = {
    id: string;
    symbol: string;
    price: number;
    share: number;
    side: 'buy' | 'sell';
    currency: "USD" | "TWD";
    exchange_rate: number;
    date: string;
    created_at: string;
  };
  
  type Trade = {
    type: 'buy' | 'sell';
    quantity: number;
    price: number;
    date: string;
  };
  
  type SellResult = {
    sellDate: string;
    quantity: number;
    sellPrice: number;
    costBasis: number;
    gainAmount: number;
    gainPercentage: number;
    breakdown: {
      buyDate: string;
      quantity: number;
      buyPrice: number;
    }[];
  };

  type EnrichedSellTrade = InputTrade & {
    costBasis: number;
    gainAmount: number;
    gainPercentage: number;
    breakdown: {
      buyDate: string;
      quantity: number;
      buyPrice: number;
    }[];
  }
  
  function calculateFIFOGainPerSell(trades: Trade[]): SellResult[] {
    const buyQueue: { quantity: number; price: number; date: string }[] = [];
    const results: SellResult[] = [];
  
    const sortedTrades = [...trades].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  
    for (const trade of sortedTrades) {
      if (trade.type === 'buy') {
        buyQueue.push({ quantity: trade.quantity, price: trade.price, date: trade.date });
      } else if (trade.type === 'sell') {
        let remainingToSell = trade.quantity;
        let costBasis = 0;
        const breakdown: SellResult['breakdown'] = [];
  
        while (remainingToSell > 0 && buyQueue.length > 0) {
          const currentBuy = buyQueue[0];
          const usedQty = Math.min(remainingToSell, currentBuy.quantity);
  
          costBasis += usedQty * currentBuy.price;
          breakdown.push({
            buyDate: currentBuy.date,
            quantity: usedQty,
            buyPrice: currentBuy.price,
          });
  
          currentBuy.quantity -= usedQty;
          if (currentBuy.quantity === 0) buyQueue.shift();
          remainingToSell -= usedQty;
        }
  
        const income = trade.quantity * trade.price;
        const gainAmount = income - costBasis;
        const gainPercentage = costBasis > 0 ? (gainAmount / costBasis) * 100 : 0;
  
        results.push({
          sellDate: trade.date,
          quantity: trade.quantity,
          sellPrice: trade.price,
          costBasis,
          gainAmount,
          gainPercentage,
          breakdown,
        });
      }
    }
  
    return results;
  }
  
  // 🔁 Convert and process
  function enrichSellTradesWithGainData(inputTrades: InputTrade[]): EnrichedSellTrade[] {
    const simplifiedTrades: Trade[] = inputTrades.map(t => ({
      type: t.side,
      quantity: t.share,
      price: t.price,
      date: t.date,
    }));
  
    const fifoResults = calculateFIFOGainPerSell(simplifiedTrades);
  
    // match enriched data back to sell trades
    const enrichedSells: InputTrade[] = [];
  
    for (const sell of inputTrades.filter(t => t.side === 'sell')) {
      const matched = fifoResults.find(
        r =>
          r.sellDate === sell.date &&
          r.quantity === sell.share &&
          r.sellPrice === sell.price
      );
  
      if (matched) {
        enrichedSells.push({
          ...sell,
          costBasis: matched.costBasis,
          gainAmount: matched.gainAmount,
          gainPercentage: matched.gainPercentage,
          breakdown: matched.breakdown,
        });
      }
    }
  
    return enrichedSells;
  }
  
  