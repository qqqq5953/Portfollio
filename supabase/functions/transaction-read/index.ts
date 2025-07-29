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

  const { userId, side } = reqBody;
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('id, symbol, cost, closing_price, share, side, currency, exchange_rate, date, created_at')
    .eq('user_id', userId)
    .eq('side', side)
    .order('date', { ascending: false })

  console.log("read result - data:", data);
  console.log("read result - error:", error);

  return jsonResponse({ data, error });
})
