#!/bin/bash
# Deployment script for Supabase Edge Functions
# Run this script to deploy the Razorpay webhook function

echo "🚀 Deploying Razorpay Webhook Edge Function..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Deploy the function
echo "📦 Deploying razorpay-webhook function..."
supabase functions deploy razorpay-webhook

if [ $? -eq 0 ]; then
    echo "✅ Function deployed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set environment variables in Supabase dashboard:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY" 
    echo "   - RAZORPAY_KEY_SECRET"
    echo ""
    echo "2. Update Razorpay webhook URL to:"
    echo "   https://<your-project-ref>.supabase.co/functions/v1/razorpay-webhook"
    echo ""
    echo "3. Test the webhook with a test payment"
else
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi