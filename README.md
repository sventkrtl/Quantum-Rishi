# Quantum Rishi

Quantum Rishi — ethical, charity-driven AI storytelling + dataset platform

## Overview

Quantum Rishi is a Next.js application that combines AI-powered storytelling with ethical practices and charitable giving. Our platform ensures that AI-generated content serves positive purposes while maintaining transparency and user privacy.

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/sventkrtl/quantum-rishi.git
cd quantum-rishi

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Environment Variables

Create a `.env.local` file with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Razorpay Configuration
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Add other environment variables as needed
```

Copy from `.env.local.example` and fill in your actual values.

## Features

- 🤖 Ethical AI storytelling
- 💝 Charity-driven mission
- 🔒 Secure payment processing via Razorpay
- 🗄️ Supabase database integration for data persistence
- 📊 Dataset platform for AI training
- 🌍 Transparent and responsible AI usage

## API Routes

### Webhook Handler
- `POST /api/razorpay-webhook` - Handles Razorpay payment webhooks (Vercel)
- Supabase Edge Function: `https://<project-ref>.supabase.co/functions/v1/razorpay-webhook` (Recommended)

### Supabase Operations
- `GET /api/supabase` - API documentation and status
- `GET /api/supabase?action=test` - Test database connection
- `GET /api/supabase?action=episodes` - Get all episodes
- `GET /api/supabase?action=payments` - Get all payments
- `POST /api/supabase` - Create episodes or payment records

## Supabase Edge Functions

### Razorpay Webhook Edge Function

A secure, scalable webhook handler deployed as a Supabase Edge Function:

**Location:** `supabase/functions/razorpay-webhook/index.ts`

**Features:**
- HMAC SHA256 signature verification
- Automatic payment processing and credit assignment
- Comprehensive error handling and logging
- Support for payment.captured, payment.authorized, payment.failed events

**Deployment:**
```bash
# Install Supabase CLI
npm install -g supabase

# Deploy the function
supabase functions deploy razorpay-webhook

# Or use the deployment script
chmod +x supabase/functions/deploy.sh
./supabase/functions/deploy.sh
```

**Environment Variables (Set in Supabase Dashboard):**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)
- `RAZORPAY_KEY_SECRET` - Webhook secret from Razorpay dashboard

**Security Notes:**
- Uses service role key for secure database operations
- Signature verification ensures requests come from Razorpay
- Never expose service role key to client-side code
- Function runs in isolated Deno environment

### Testing the API

Test Supabase connection:
```bash
curl http://localhost:3000/api/supabase?action=test
```

Create a test episode:
```bash
curl -X POST http://localhost:3000/api/supabase \
  -H "Content-Type: application/json" \
  -d '{"type": "episode", "data": {"title": "Test Episode", "content": "Hello World", "status": "draft"}}'
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing to this project.

## Security

For security concerns, please review our [Security Policy](SECURITY.md).

## License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.

## Support

For support and questions, please create an issue in the GitHub repository.

---

Built with ❤️ for ethical AI and charitable impact.

## Development Branch

For the latest features and updates, please refer to the [development branch](https://github.com/sventkrtl/quantum-rishi/pull/new/feature/supabase-integration).

## Database Schema

-- Episodes table
CREATE TABLE episodes (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table  
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending',
  razorpay_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
