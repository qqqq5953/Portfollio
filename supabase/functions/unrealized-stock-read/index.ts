import { supabaseClient } from '../shared/supabaseClient.ts'
import { jsonResponse, corsJsonResponse } from '../shared/helper.ts'
import { createSupabaseClient } from '../shared/supabaseClient.ts'

Deno.serve(async (req) => {
  console.log('request received', req);
  
  if (req.method === 'OPTIONS') return corsJsonResponse()

  const isLocal = Deno.env.get('LOCAL_DEV') === 'true'
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  const supabaseClient = createSupabaseClient()

  if (!isLocal) {
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

  // Validate required parameters
  if (!reqBody.userId || !reqBody.symbol) {
    return jsonResponse({
      data: null,
      error: { message: 'userId and symbol are required' },
      status: 400,
    })
  }

  // Fetch transactions for the specific symbol
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('id, symbol, price, share, side, currency, exchange_rate, date, created_at')
    .eq('user_id', reqBody.userId)
    .eq('symbol', reqBody.symbol)
    .order('date', { ascending: true })
  
  console.log("read result - data:", data);
  console.log("read result - error:", error);

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

  // Calculate unrealized holdings for this symbol
  const unrealizedTransactions = getUnrealizedHoldings(data);

  return jsonResponse({
    data: {
      transactions: unrealizedTransactions,
    },
    error: null
  });
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

function getUnrealizedHoldings(trades: Trade[]): Trade[] {
  const buyQueue: Trade[] = [];
  
  for (const trade of trades) {
    if (trade.side === 'buy') {
      buyQueue.push({ ...trade });
    } else if (trade.side === 'sell') {
      let qtyToSell = trade.share;
      
      while (qtyToSell > 0 && buyQueue.length > 0) {
        const buy = buyQueue[0];
        const qtyUsed = Math.min(buy.share, qtyToSell);
        buy.share -= qtyUsed;
        qtyToSell -= qtyUsed;
        if (buy.share === 0) {
          buyQueue.shift();
        }
      }
    }
  }

  return buyQueue;
}
