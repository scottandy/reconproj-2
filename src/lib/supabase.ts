import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if environment variables are properly configured
const isConfigured = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url' && 
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey !== 'your_supabase_anon_key' &&
  supabaseAnonKey !== 'your-anon-key-here'

if (!isConfigured) {
  console.error('⚠️  Supabase not configured properly!')
  console.error('Please update your .env file with actual Supabase credentials.')
  console.error('Visit https://supabase.com/dashboard to get your credentials.')
}

// Create a mock client for development when not configured
const createMockClient = () => ({
  from: () => ({
    select: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') }),
    insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    update: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    delete: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
  }),
  auth: {
    signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    signOut: () => Promise.resolve({ error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  }
})

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient() as any

// Test connection function
export const testSupabaseConnection = async () => {
  if (!isConfigured) {
    return { 
      success: false, 
      message: 'Supabase not configured. Please update your .env file with actual credentials.' 
    }
  }
  
  try {
    const { data, error } = await supabase.from('dealerships').select('count').limit(1)
    if (error) throw error
    return { success: true, message: 'Connected successfully' }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Connection failed' }
  }
}

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => isConfigured