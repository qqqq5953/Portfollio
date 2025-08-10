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

  const { userId, symbol, side } = reqBody;
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('id, price, symbol, share, side, currency, exchange_rate, date, created_at')
    .eq('user_id', userId)
    .eq('symbol', symbol)
    .eq('side', side)
    .order('date', { ascending: false })

  console.log("read result - data:", data);
  console.log("read result - error:", error);

  const res = await fetch(`https://ws.api.cnyes.com/ws/api/v1/quote/quotes/USS:${symbol}:STOCK?column=E`)
  const result = await res.json()
  console.log("result", result);

  return jsonResponse({ data: {
    transactions: data,
    info:{
      currentPrice: result.data[0]['6'],
      name: result.data[0]['200009'],
      timestamp: result.data[0]['200007'],
    }
  }, error });
});
