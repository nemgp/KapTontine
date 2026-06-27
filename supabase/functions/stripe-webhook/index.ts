import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.17.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

// Use service role key to bypass RLS when inserting the reunion
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 })
  }

  try {
    const body = await req.text()
    
    // Verify the webhook signature
    let event
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      )
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      
      const userId = session.metadata?.userId || session.client_reference_id
      const reunionName = session.metadata?.reunionName

      if (!userId || !reunionName) {
        throw new Error('Missing metadata in session')
      }

      console.log(`Payment successful for user ${userId}, creating reunion: ${reunionName}`)

      const expiryDate = new Date()
      expiryDate.setFullYear(expiryDate.getFullYear() + 2) // 2 years duration

      // 1. Create Reunion
      const { data: reunionData, error: reunionError } = await supabase
        .from('reunions')
        .insert({
          nom: reunionName,
          description: "Nouvelle réunion KapTontine",
          date_expiration: expiryDate.toISOString(),
          id_createur: userId
        })
        .select()
        .single()

      if (reunionError) throw reunionError

      // 2. Add user as admin
      if (reunionData) {
        const { error: memberError } = await supabase
          .from('membres_reunion')
          .insert({
            id_reunion: reunionData.id,
            id_profile: userId,
            role: 'admin',
            poste: 'Président'
          })

        if (memberError) throw memberError
        console.log(`Successfully created reunion ${reunionData.id} and added member ${userId}`)
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
