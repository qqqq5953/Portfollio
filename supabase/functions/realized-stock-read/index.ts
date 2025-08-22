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
  const { userId, symbol } = reqBody;
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('id, symbol, price, share, side, currency, exchange_rate, date, created_at')
    .eq('user_id', userId)
    .eq('symbol', symbol)
    .order('date', { ascending: true })

  if (error) {
    return jsonResponse({
      data: null,
      error,
      status: 500,
    })
  }

  if (!data || data.length === 0) {
    return jsonResponse({
      data: {
        transactions: [],
      },
      error: null
    })
  }

  const enrichedSells = enrichSellTradesWithGainData(data);
  console.log("enrichedSells", enrichedSells);

  return jsonResponse({ 
    data: {
      transactions: enrichedSells,
    }, error 
  });
});

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
  profit: number;
  profitPercentage: number;
  breakdown: {
    buyDate: string;
    share: number;
    buyPrice: number;
  }[];
};

type EnrichedSellTrade = InputTrade & {
  costBasis: number;
  profit: number;
  profitPercentage: number;
  breakdown: {
    buyDate: string;
    share: number;
    buyPrice: number;
  }[];
}

// 🔁 Convert and process
function enrichSellTradesWithGainData(inputTrades: InputTrade[]): EnrichedSellTrade[] {
  const simplifiedTrades: Trade[] = inputTrades.map(t => ({
    side: t.side,
    share: t.share,
    price: t.price,
    date: t.date,
  }));

  const fifoResults = calculateFIFOGainPerSell(simplifiedTrades);
  console.log("fifoResults", fifoResults);

  // match enriched data back to sell trades
  const enrichedSells: EnrichedSellTrade[] = [];

  for (const sell of inputTrades) {
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
        profit: matched.profit,
        profitPercentage: matched.profitPercentage,
        breakdown: matched.breakdown,
      });
    }
  }

  return enrichedSells;
}


function calculateFIFOGainPerSell(trades: Trade[]): SellResult[] {
  const buyQueue: { share: number; price: number; date: string }[] = [];
  const results: SellResult[] = [];
  // console.log("trades", trades);


  // const sortedTrades = [...trades].sort(
  //   (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  // );

  // console.log("sortedTrades", sortedTrades);
  for (const trade of trades) {
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
      const profit = income - costBasis;
      const profitPercentage = costBasis > 0 ? (profit / costBasis) * 100 : 0;

      results.push({
        sellDate: trade.date,
        share: trade.share,
        sellPrice: trade.price,
        costBasis,
        profit,
        profitPercentage,
        breakdown,
      });
    }
  }

  return results;
}