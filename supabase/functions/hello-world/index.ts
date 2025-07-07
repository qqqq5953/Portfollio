// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js"

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  // 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // const isLocal = Deno.env.get('LOCAL_DEV') === 'true'

  // 法一
  // if(!isLocal){
  //   // ✅ Get JWT from the frontend request
  //   const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')

  //   // ✅ Create a Supabase client using the SERVICE_ROLE key (server-side only)
  //   const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  //   const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  //   const supabase = createClient(
  //     supabaseUrl,
  //     supabaseServiceRoleKey,
  //     {
  //       global: {
  //         headers: { Authorization: `Bearer ${jwt}` },
  //       },
  //     }
  //   )

  //   // ✅ Verify and extract the user
  //   const { data: { user }, error } = await supabase.auth.getUser()

    // if (!user) {
    //   return new Response(JSON.stringify({user, error, isLocal}), { status: 401 })
    // }
  // }

  // 法二
  // const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  // const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  // const supabaseClient = createClient(
  //   supabaseUrl,
  //   supabaseAnonKey,
  //   {
  //     global: {
  //       headers: { Authorization: req.headers.get('Authorization')! },
  //     },
  //   }
  // )
  
  // const authHeader = req.headers.get('Authorization')!
  // const token = authHeader.replace('Bearer ', '')
  // const { data: { user }, error } = await supabaseClient.auth.getUser(token)

  // if (!user) {
  //   return new Response(JSON.stringify({user, error, token}), { status: 401 })
  // }

  if (req.method === 'OPTIONS') {
    // Preflight request
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    const { name } = await req.json()
    const data = {
      message: `Hello ${name}!`,
    }
  
    return new Response(JSON.stringify({data}), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})


/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/hello-world' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
