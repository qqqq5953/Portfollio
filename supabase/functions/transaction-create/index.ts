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

  const {
    userId,
    symbol,
    share,
    price,
    side,
    market,
    closingPrice,
    exchangeRate,
    date,
    fee,
    tax,
    note,
  } = reqBody;

  // if side === "sell", select transactions of this user where side === "buy" and check if the share is enough to sell
  if (side === "sell") {
    const { data, error } = await supabaseClient
      .from('transactions')
      .select('share, side')
      .eq('user_id', userId)
      .eq('symbol', symbol)
    
    if (error) return jsonResponse({ data, error})

    const buyTransactions = data.filter((transaction: any) => transaction.side === "buy")
    const sellTransactions = data.filter((transaction: any) => transaction.side === "sell")
    const totalBuyShares = buyTransactions.reduce((acc, curr) => acc + curr.share, 0)
    const totalSellShares = sellTransactions.reduce((acc, curr) => acc + curr.share, 0)
    const remainingShares = totalBuyShares - totalSellShares

    if (remainingShares < share) {
      return jsonResponse({ data, error: { msg: "Not enough shares to sell" }, status: 400 })
    }
  }

  const currency = market === "US" ? "USD" : "TWD"
  const payload = {
    user_id: userId,
    side,
    symbol,
    share,
    price,
    currency,
    closing_price: closingPrice,
    exchange_rate: exchangeRate,
    date,
    fee,
    tax,
    note,
  }
  console.log("payload", payload);

  const { data, error } = await supabaseClient.from('transactions').insert(payload)

  console.log("Insert result - data:", data);
  console.log("Insert result - error:", error);

  return jsonResponse({ data: { symbol, share, price }, error });
})
