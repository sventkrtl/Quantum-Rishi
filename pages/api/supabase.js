import { supabase, createAdminClient } from '../../lib/supabaseClient'

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res)
      case 'POST':
        return await handlePost(req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Supabase API error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}

async function handleGet(req, res) {
  const { action } = req.query

  switch (action) {
    case 'test':
      // Test Supabase connection
      try {
        const { error } = await supabase.from('_supabase_migrations').select('*').limit(1)
        const connectionTest = {
          success: !error || error.code === 'PGRST116', // PGRST116 = table not found (which is fine)
          message: !error || error.code === 'PGRST116' ? 'Connected to Supabase successfully' : error.message
        }
        return res.status(200).json({
          message: 'Supabase test endpoint',
          connection: connectionTest,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        return res.status(200).json({
          message: 'Supabase test endpoint',
          connection: { success: false, message: error.message },
          timestamp: new Date().toISOString()
        })
      }

    case 'episodes':
      // Get all episodes
      try {
        const { data, error } = await supabase
          .from('episodes')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        return res.status(200).json({
          success: true,
          data: data,
          count: data.length
        })
      } catch (error) {
        return res.status(200).json({
          success: false,
          message: 'Episodes table might not exist yet',
          error: error.message,
          data: []
        })
      }

    case 'payments':
      // Get all payments
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        return res.status(200).json({
          success: true,
          data: data,
          count: data.length
        })
      } catch (error) {
        return res.status(200).json({
          success: false,
          message: 'Payments table might not exist yet',
          error: error.message,
          data: []
        })
      }

    default:
      return res.status(200).json({
        message: 'Quantum Rishi Supabase API',
        endpoints: {
          'GET /api/supabase?action=test': 'Test Supabase connection',
          'GET /api/supabase?action=episodes': 'Get all episodes',
          'GET /api/supabase?action=payments': 'Get all payments',
          'POST /api/supabase': 'Create episode or payment (see body examples)'
        },
        examples: {
          createEpisode: {
            method: 'POST',
            body: {
              type: 'episode',
              data: {
                title: 'Episode 1',
                content: 'Episode content here',
                status: 'draft'
              }
            }
          },
          createPayment: {
            method: 'POST',
            body: {
              type: 'payment',
              data: {
                amount: 1000,
                currency: 'INR',
                status: 'pending',
                razorpay_payment_id: 'pay_example123'
              }
            }
          }
        }
      })
  }
}

async function handlePost(req, res) {
  const { type, data } = req.body

  if (!type || !data) {
    return res.status(400).json({
      error: 'Missing required fields: type and data'
    })
  }

  try {
    const adminClient = createAdminClient()

    switch (type) {
      case 'episode':
        try {
          const { data: episode, error } = await adminClient
            .from('episodes')
            .insert([{
              ...data,
              created_at: new Date().toISOString()
            }])
            .select()
            .single()
          
          if (error) throw error
          
          return res.status(201).json({
            success: true,
            message: 'Episode created successfully',
            data: episode
          })
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: 'Failed to create episode. Table might not exist.',
            error: error.message
          })
        }

      case 'payment':
        try {
          const { data: payment, error } = await adminClient
            .from('payments')
            .insert([{
              ...data,
              created_at: new Date().toISOString()
            }])
            .select()
            .single()
          
          if (error) throw error
          
          return res.status(201).json({
            success: true,
            message: 'Payment record created successfully',
            data: payment
          })
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: 'Failed to create payment record. Table might not exist.',
            error: error.message
          })
        }

      default:
        return res.status(400).json({
          error: 'Invalid type. Supported types: episode, payment'
        })
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to create admin client',
      message: error.message
    })
  }
}