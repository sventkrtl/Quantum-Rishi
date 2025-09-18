import { useState, useEffect } from 'react'

export default function ProductDemo() {
  const [product, setProduct] = useState(null)
  const PRODUCT_ID = process.env.NEXT_PUBLIC_DEMO_PRODUCT_ID || '' // set this in .env.local for demo

  useEffect(() => {
    if (!PRODUCT_ID) return
    fetch(`/api/products?id=${PRODUCT_ID}`)
      .then(r => r.json())
      .then(p => setProduct(p))
      .catch(console.error)

    // dynamically load Razorpay checkout script
    if (!window.Razorpay) {
      const s = document.createElement('script')
      s.src = 'https://checkout.razorpay.com/v1/checkout.js'
      s.async = true
      document.body.appendChild(s)
    }
  }, [PRODUCT_ID])

  async function createOrderAndOpen() {
    if (!product) return alert('No product loaded')

    const res = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id })
    })

    const order = await res.json()
    if (!order || !order.id) return alert('Failed to create order')

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXXXXXXXXXX',
      amount: order.amount,
      currency: order.currency,
      name: 'Quantum Rishi',
      description: order.receipt,
      order_id: order.id,
      prefill: { name: '', email: '' },
      notes: order.notes || {},
      handler: function (response){
        // For demo, post to verify endpoint or redirect to thank-you
        fetch('/api/verify-payment', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ ...response, order_id: order.id, productId: product.id })
        }).then(()=> window.location.href = '/thank-you?order=' + order.id)
      },
      modal: { exit_on_esc: true }
    }

    // Open Razorpay checkout
    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Product demo</h1>
      {!product && <p>Loading product... (set NEXT_PUBLIC_DEMO_PRODUCT_ID in .env.local)</p>}
      {product && (
        <div>
          <h2>{product.title}</h2>
          <p>{product.description}</p>
          <p>Price: ₹{product.price_inr} ({product.price_paise} paise)</p>
          <button onClick={createOrderAndOpen}>Buy now</button>
        </div>
      )}
    </div>
  )
}
