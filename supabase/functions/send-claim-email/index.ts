// This is a Supabase Edge Function that would be deployed to Supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    })

    // Get the request body
    const { discId, discName, ownerEmail, claimerEmail } = await req.json()

    // Validate required fields
    if (!discId || !discName || !ownerEmail || !claimerEmail) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      })
    }

    // In a real implementation, you would use an email service like SendGrid, Mailgun, etc.
    // For this example, we'll just log the email details
    console.log(`
      Sending email to: ${ownerEmail}
      Subject: Someone has claimed your lost disc
      Body: 
        Hello,
        
        ${claimerEmail} has claimed the ${discName} that you reported as found.
        
        Please contact them to arrange returning the disc.
        
        Thank you for helping return lost discs to their owners!
    `)

    // For a real implementation, you would use something like:
    // await fetch('https://api.sendgrid.com/v3/mail/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     personalizations: [{ to: [{ email: ownerEmail }] }],
    //     from: { email: 'noreply@yourdomain.com' },
    //     subject: 'Someone has claimed your lost disc',
    //     content: [{ type: 'text/plain', value: emailBody }],
    //   }),
    // })

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})
