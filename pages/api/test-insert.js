import { createAdminClient } from '../../lib/supabaseClient'

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  try {
    // Create admin client with service role key
    const adminClient = createAdminClient()
    
    // Create test episode data
    const testEpisode = {
      title: `Test Episode ${new Date().toISOString()}`,
      content: `This is a test episode created at ${new Date().toLocaleString()}`,
      status: 'draft',
      created_at: new Date().toISOString()
    }

    // Insert into episodes table
    const { data, error } = await adminClient
      .from('episodes')
      .insert([testEpisode])
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return res.status(500).json({ 
        error: 'Failed to insert episode',
        details: error.message,
        hint: 'Make sure the episodes table exists in your Supabase database'
      })
    }

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Episode inserted successfully',
      data: data
    })

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}