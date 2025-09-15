import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the Razorpay signature from headers
    const razorpaySignature = req.headers['x-razorpay-signature'];
    
    if (!razorpaySignature) {
      return res.status(400).json({ error: 'Missing Razorpay signature' });
    }

    // Get the webhook secret from environment variables
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Generate expected signature
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    // Verify signature
    if (razorpaySignature !== expectedSignature) {
      console.error('Invalid signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Process the webhook payload
    const { event, payload } = req.body;
    
    console.log(`Received Razorpay webhook: ${event}`);
    
    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        console.log('Payment captured:', payload.payment.entity);
        // Add your payment captured logic here
        break;
        
      case 'payment.failed':
        console.log('Payment failed:', payload.payment.entity);
        // Add your payment failed logic here
        break;
        
      case 'order.paid':
        console.log('Order paid:', payload.order.entity);
        // Add your order paid logic here
        break;
        
      default:
        console.log(`Unhandled event: ${event}`);
    }

    // Return success response
    res.status(200).json({ status: 'success' });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Disable body parsing to get raw body for signature verification
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};