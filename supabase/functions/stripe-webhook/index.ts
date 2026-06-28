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
      const reunionId = session.metadata?.reunionId
      const type = session.metadata?.type || 'new_reunion'
      const userEmail = session.customer_details?.email || ''

      if (!userId) {
        throw new Error('Missing userId in session')
      }

      // 0. Ensure profile exists (in case trigger failed)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: userEmail,
          nom: userEmail ? userEmail.split('@')[0] : 'Membre',
        }, { onConflict: 'id', ignoreDuplicates: true })

      if (profileError) {
        console.error('Profile upsert error (non-fatal):', profileError)
      }

      if (type === 'upgrade_reunion' && reunionId) {
        console.log(`Upgrading reunion ${reunionId} to Premium`)
        const { error: updateError } = await supabase
          .from('reunions')
          .update({ is_premium: true })
          .eq('id', reunionId)

        if (updateError) throw updateError
        console.log(`Successfully upgraded reunion ${reunionId} to Premium`)
      } else {
        if (!reunionName) {
          throw new Error('Missing reunionName in session metadata for new creation')
        }

        console.log(`Payment successful for user ${userId}, creating paid reunion: ${reunionName}`)

        const expiryDate = new Date()
        expiryDate.setFullYear(expiryDate.getFullYear() + 2) // 2 years duration

        // 1. Create Reunion
        const { data: reunionData, error: reunionError } = await supabase
          .from('reunions')
          .insert({
            nom: reunionName,
            description: "Nouvelle réunion KapTontine (Premium)",
            date_expiration: expiryDate.toISOString(),
            id_createur: userId,
            is_premium: true
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
          console.log(`Successfully created premium reunion ${reunionData.id} and added member ${userId}`)
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
