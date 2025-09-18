# Supabase Edge Function Configuration
# This file helps with deployment and environment setup

# Function: razorpay-webhook
# Purpose: Process Razorpay payment webhooks securely
# Runtime: Deno (Supabase Edge Functions)

# Required Environment Variables:
# - SUPABASE_URL: Your Supabase project URL
# - SUPABASE_SERVICE_ROLE_KEY: Service role key (server-side only)
# - RAZORPAY_KEY_SECRET: Webhook secret from Razorpay dashboard

# Deployment Command:
# supabase functions deploy razorpay-webhook

# Function URL after deployment:
# https://<project-ref>.supabase.co/functions/v1/razorpay-webhook

# Security Notes:
# - This function uses the service role key for database operations
# - Signature verification ensures requests come from Razorpay
# - Never expose service role key to client-side code
# - Function runs in isolated Deno environment

# Features:
# - HMAC SHA256 signature verification
# - Payment success/failure tracking
# - Automatic credit assignment to users
# - Comprehensive error handling and logging
# - Support for payment.captured, payment.authorized, payment.failed events