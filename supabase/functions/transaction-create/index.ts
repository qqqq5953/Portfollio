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
    cost,
    side,
    market,
    closingPrice,
    exchangeRate,
    date,
    fee,
    tax,
    note,
  } = reqBody;

  const currency = market === "US" ? "USD" : "TWD"
  const payload = {
    user_id: userId,
    side,
    symbol,
    share,
    cost,
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

  return jsonResponse({ data, error });
})
