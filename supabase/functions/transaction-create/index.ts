import { supabaseClient } from '../shared/supabaseClient.ts'
import { corsHeaders } from '../shared/helper.ts'
import { createSupabaseClient } from '../shared/supabaseClient.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  // Add this right after creating the supabaseClient
  console.log("Available environment variables:");
  console.log("LOCAL_DEV_SUPABASE_URL:", Deno.env.get("LOCAL_DEV_SUPABASE_URL"));
  console.log("SUPABASE_URL:", Deno.env.get("SUPABASE_URL"));
  console.log("LOCAL_DEV_SUPABASE_SERVICE_ROLE_KEY:", Deno.env.get("LOCAL_DEV_SUPABASE_SERVICE_ROLE_KEY"));
  console.log("SUPABASE_SERVICE_ROLE_KEY:", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  console.log("All env vars:", Object.keys(Deno.env.toObject()));
  
  const isLocal = Deno.env.get('LOCAL_DEV') === 'true'
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  const supabaseClient = createSupabaseClient()

  if(!isLocal){
    const { data: { user }, error } = await supabaseClient.auth.getUser(jwt)

    if (error || !user) {
      return new Response(JSON.stringify({ data: { user, jwt }, error }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
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
    transactionType,
    currency,
    date,
    fee,
    tax,
    note,
  } = reqBody;

  // store data to supabase
  const { data, error } = await supabaseClient.from('transactions').insert({
    user_id: userId,
    transaction_type: transactionType,
    symbol,
    share,
    price,
    currency,
    date,
    fee,
    tax,
    note,
  })

  console.log("Insert result - data:", data);
  console.log("Insert result - error:", error);
  console.log("User ID being inserted:", userId);
  
  // Add this query to verify the insert worked
  const { data: checkData, error: checkError } = await supabaseClient
    .from('transactions')
    .select('*')
    .eq('user_id', userId);

  console.log("Verification query - data:", checkData);
  console.log("Verification query - error:", checkError);

  return new Response(
    JSON.stringify({ success: true, message: "Transaction received" }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    }
  );
})
