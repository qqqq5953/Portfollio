// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders } from "../shared/helper.ts"
import { createSupabaseClient } from '../shared/supabaseClient.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    // Preflight request
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }
  
  
  // 法一
  const isLocal = Deno.env.get('LOCAL_DEV') === 'true'
  if(!isLocal){
    const supabaseClient = createSupabaseClient()
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
    const { data: { user }, error } = await supabaseClient.auth.getUser(jwt)

    if (error || !user) {
      return new Response(JSON.stringify({ data: { user, jwt }, error}), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      })
    }
  }

  try {
    const { name } = await req.json()
    const supabaseClient = createSupabaseClient()
    const {
      data,
      error,
    } = await supabaseClient.auth.getSession()
  
    return new Response(JSON.stringify({
      message: `Hello ${name}!`,
      data,
      user,
      error
    }), {
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
