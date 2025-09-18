import { createAdminClient } from '../../lib/supabaseClient'

export default async function handler(req, res) {
  try {
    const supabase = createAdminClient()

    const { id } = req.query

    if (id) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .limit(1)

      if (error) throw error

      const product = data && data[0]
      if (!product) return res.status(404).json({ error: 'Product not found' })

      product.price_paise = product.price_inr * 100
      return res.status(200).json(product)
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const rows = (data || []).map(p => ({ ...p, price_paise: p.price_inr * 100 }))

    res.status(200).json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
