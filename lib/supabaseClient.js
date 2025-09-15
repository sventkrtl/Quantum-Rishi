import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for common operations
export const supabaseHelpers = {
  // Test connection
  async testConnection() {
    try {
      const { error } = await supabase.from('_supabase_migrations').select('*').limit(1)
      if (error && error.code !== 'PGRST116') { // PGRST116 = table not found (which is fine)
        throw error
      }
      return { success: true, message: 'Connected to Supabase successfully' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  },

  // Episodes table operations
  episodes: {
    async getAll() {
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },

    async create(episode) {
      const { data, error } = await supabase
        .from('episodes')
        .insert([episode])
        .select()
      
      if (error) throw error
      return data[0]
    },

    async getById(id) {
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    }
  },

  // Payments table operations
  payments: {
    async getAll() {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },

    async create(payment) {
      const { data, error } = await supabase
        .from('payments')
        .insert([payment])
        .select()
      
      if (error) throw error
      return data[0]
    },

    async updateStatus(paymentId, status) {
      const { data, error } = await supabase
        .from('payments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', paymentId)
        .select()
      
      if (error) throw error
      return data[0]
    }
  }
}

export default supabase