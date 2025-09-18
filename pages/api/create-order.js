import { createAdminClient } from '../../lib/supabaseClient'

// Node fetch is available in newer Node versions; if not, Next provides fetch.
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { productId, owner_id } = req.body || {}
    if (!productId) return res.status(400).json({ error: 'productId required' })

    const supabase = createAdminClient()
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .limit(1)

    if (prodErr) throw prodErr
    const product = products && products[0]
    if (!product) return res.status(400).json({ error: 'product not found' })

    const amountPaise = product.price_inr * 100

    const orderPayload = {
      amount: amountPaise,
      currency: 'INR',
      receipt: `receipt_${product.sku || product.id}_${Date.now()}`,
      notes: { product_id: product.id, sku: product.sku || '', owner_id: owner_id || '' }
    }

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keyId || !keySecret) {
      return res.status(500).json({ error: 'Razorpay credentials not configured' })
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

    const resp = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderPayload)
    })

    const data = await resp.json()
    return res.status(resp.status).json(data)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message || 'internal' })
  }
}
