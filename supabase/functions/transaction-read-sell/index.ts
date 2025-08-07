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
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('id, symbol, price, share, side, currency, exchange_rate, date, created_at')
    .eq('user_id', reqBody.userId)
    .order('date', { ascending: false })
  
  console.log("read result - data:", data);
  console.log("read result - error:", error);

  const enrichedSells = enrichSellTradesWithGainData(data);
  console.log("enrichedSells", enrichedSells);

  return jsonResponse({ data: enrichedSells, error });
})

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
  side: 'buy' | 'sell';
  share: number;
  price: number;
  date: string;
};

type SellResult = {
  sellDate: string;
  share: number;
  sellPrice: number;
  costBasis: number;
  gainAmount: number;
  gainPercentage: number;
  breakdown: {
    buyDate: string;
    share: number;
    buyPrice: number;
  }[];
};

type EnrichedSellTrade = InputTrade & {
  costBasis: number;
  gainAmount: number;
  gainPercentage: number;
  breakdown: {
    buyDate: string;
    share: number;
    buyPrice: number;
  }[];
}

// 🔁 Convert and process
function enrichSellTradesWithGainData(inputTrades: InputTrade[]): EnrichedSellTrade[] {
  const groupedTrades: Record<string, Trade[]> = {};

  // 按 symbol 分組
  for (const t of inputTrades) {
    if (!groupedTrades[t.symbol]) groupedTrades[t.symbol] = [];
    groupedTrades[t.symbol].push({
      side: t.side,
      share: t.share,
      price: t.price,
      date: t.date,
    });
  }

  const enrichedSells: EnrichedSellTrade[] = [];

  for (const symbol in groupedTrades) {
    const fifoResults = calculateFIFOGainPerSell(groupedTrades[symbol]);

    const sellTrades = inputTrades.filter(t => t.side === 'sell' && t.symbol === symbol);

    for (const sell of sellTrades) {
      const matched = fifoResults.find(
        r =>
          r.sellDate === sell.date &&
          r.share === sell.share &&
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
  }

  return enrichedSells;
}


function calculateFIFOGainPerSell(trades: Trade[]): SellResult[] {
  const buyQueue: { share: number; price: number; date: string }[] = [];
  const results: SellResult[] = [];

  const sortedTrades = [...trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const trade of sortedTrades) {
    if (trade.side === 'buy') {
      buyQueue.push(trade);
    } else if (trade.side === 'sell') {
      let remainingToSell = trade.share;
      let costBasis = 0;
      const breakdown: SellResult['breakdown'] = [];

      while (remainingToSell > 0 && buyQueue.length > 0) {
        const currentBuy = buyQueue[0];
        const usedQty = Math.min(remainingToSell, currentBuy.share);

        costBasis += usedQty * currentBuy.price;
        breakdown.push({
          buyDate: currentBuy.date,
          share: usedQty,
          buyPrice: currentBuy.price,
        });

        currentBuy.share -= usedQty;
        if (currentBuy.share === 0) buyQueue.shift();
        remainingToSell -= usedQty;
      }

      const income = trade.share * trade.price;
      const gainAmount = income - costBasis;
      const gainPercentage = costBasis > 0 ? (gainAmount / costBasis) * 100 : 0;

      results.push({
        sellDate: trade.date,
        share: trade.share,
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
  

  
  