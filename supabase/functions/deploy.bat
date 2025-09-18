@echo off
REM Deployment script for Razorpay Webhook Supabase Edge Function
REM Windows PowerShell version

echo ================================
echo Deploying Razorpay Webhook Function
echo ================================

echo.
echo Step 1: Checking Supabase CLI installation...
supabase --version
if %ERRORLEVEL% neq 0 (
    echo Error: Supabase CLI not found. Please install it first:
    echo npm install -g supabase
    exit /b 1
)

echo.
echo Step 2: Getting project list...
supabase projects list

echo.
echo Step 3: Please copy the correct PROJECT_REF from above and run:
echo supabase link --project-ref YOUR_PROJECT_REF
echo.
echo Step 4: After linking, deploy the function with:
echo supabase functions deploy razorpay-webhook
echo.
echo Step 5: Set environment variables in Supabase dashboard:
echo - SUPABASE_URL
echo - SUPABASE_SERVICE_ROLE_KEY  
echo - RAZORPAY_KEY_SECRET
echo.
echo Step 6: Update Razorpay webhook URL to:
echo https://YOUR_PROJECT_REF.supabase.co/functions/v1/razorpay-webhook
echo.
echo ================================
echo Deployment guide complete!
echo ================================