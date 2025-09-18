// Supabase Edge Function for Razorpay Webhook Processing
// Deploy with: supabase functions deploy razorpay-webhook
// Requires environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RAZORPAY_KEY_SECRET

// Import statements for Deno runtime
// @ts-expect-error - Deno runtime will resolve these
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-expect-error - Deno runtime will resolve these  
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.5';

// @ts-expect-error - Deno global available at runtime
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
// @ts-expect-error - Deno global available at runtime
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
// @ts-expect-error - Deno global available at runtime
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// HMAC SHA256 verification function for Deno
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return expectedSignature === signature;
}

serve(async (req: Request): Promise<Response> => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    // Verify Razorpay signature (HMAC SHA256)
    const isValidSignature = await verifySignature(body, signature, RAZORPAY_KEY_SECRET);
    if (!isValidSignature) {
      console.error('Invalid Razorpay signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const payload = JSON.parse(body);
    const event = payload.event || payload['event'];

    console.log(`Processing Razorpay webhook event: ${event}`);

    // Handle payment success events
    if (event === 'payment.captured' || event === 'payment.authorized') {
      const payment = payload.payload.payment.entity;
      const razorpay_order_id = payment.order_id;
      const razorpay_payment_id = payment.id;
      const amount = Math.floor(payment.amount / 100); // Convert paise to rupees
      const currency = payment.currency;

      // Upsert payment record
      const { error: upsertErr } = await supabase
        .from('payments')
        .upsert({
          razorpay_payment_id,
          razorpay_order_id,
          owner_id: null, // Will be set below if available in notes
          amount,
          currency,
          status: 'succeeded',
          meta: payment,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'razorpay_payment_id' });

      if (upsertErr) {
        console.error('Payment upsert error:', upsertErr);
        return new Response(JSON.stringify({ error: 'Database error' }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Extract owner_id from payment notes if available
      const ownerId = payment.notes?.owner_id || null;
      
      if (ownerId) {
        console.log(`Processing credits for owner: ${ownerId}`);
        
        // Calculate credits to add (customize this mapping as needed)
        const creditsToAdd = amount; // 1 INR = 1 credit (adjust as needed)
        
        // First, get current credits
        const { data: currentCredits, error: fetchError } = await supabase
          .from('credits')
          .select('credits')
          .eq('owner_id', ownerId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error('Error fetching current credits:', fetchError);
        }

        const newCreditsTotal = (currentCredits?.credits || 0) + creditsToAdd;

        // Upsert credits record
        const { error: creditErr } = await supabase
          .from('credits')
          .upsert({
            owner_id: ownerId,
            credits: newCreditsTotal,
            updated_at: new Date().toISOString()
          }, { onConflict: 'owner_id' });

        if (creditErr) {
          console.error('Credits upsert error:', creditErr);
          // Don't fail the webhook for credit errors - payment was successful
        } else {
          console.log(`Successfully added ${creditsToAdd} credits to user ${ownerId}. New total: ${newCreditsTotal}`);
        }

        // Update payment record with owner_id
        const { error: updatePaymentErr } = await supabase
          .from('payments')
          .update({ owner_id: ownerId })
          .eq('razorpay_payment_id', razorpay_payment_id);

        if (updatePaymentErr) {
          console.error('Error updating payment with owner_id:', updatePaymentErr);
        }
      }

      console.log(`Successfully processed payment: ${razorpay_payment_id}`);
      return new Response(JSON.stringify({ 
        ok: true, 
        message: 'Payment processed successfully',
        payment_id: razorpay_payment_id
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle payment failure events
    if (event === 'payment.failed') {
      const payment = payload.payload.payment.entity;
      const razorpay_order_id = payment.order_id;
      const razorpay_payment_id = payment.id;
      const amount = Math.floor(payment.amount / 100);
      const currency = payment.currency;

      // Record failed payment
      const { error: failedPaymentErr } = await supabase
        .from('payments')
        .upsert({
          razorpay_payment_id,
          razorpay_order_id,
          owner_id: payment.notes?.owner_id || null,
          amount,
          currency,
          status: 'failed',
          meta: payment,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'razorpay_payment_id' });

      if (failedPaymentErr) {
        console.error('Failed payment record error:', failedPaymentErr);
      }

      console.log(`Recorded failed payment: ${razorpay_payment_id}`);
      return new Response(JSON.stringify({ 
        ok: true, 
        message: 'Failed payment recorded',
        payment_id: razorpay_payment_id
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle other events (order.paid, subscription events, etc.)
    console.log(`Unhandled webhook event: ${event}`);
    return new Response(JSON.stringify({ 
      ok: true, 
      message: `Event ${event} received but not processed` 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Razorpay webhook error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: errorMessage 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});