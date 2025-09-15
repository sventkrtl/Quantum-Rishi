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
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
# Add other environment variables as needed
```

## Features

- 🤖 Ethical AI storytelling
- 💝 Charity-driven mission
- 🔒 Secure payment processing via Razorpay
- 📊 Dataset platform for AI training
- 🌍 Transparent and responsible AI usage

## API Routes

### Webhook Handler
- `POST /api/razorpay-webhook` - Handles Razorpay payment webhooks

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
