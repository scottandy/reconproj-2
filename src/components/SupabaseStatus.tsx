import React, { useState, useEffect } from 'react'
import { testSupabaseConnection, isSupabaseConfigured } from '../lib/supabase'
import { AlertCircle, CheckCircle, ExternalLink } from 'lucide-react'

export const SupabaseStatus: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error' | 'not-configured'>('checking')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const checkConnection = async () => {
      if (!isSupabaseConfigured()) {
        setStatus('not-configured')
        setMessage('Supabase credentials not configured')
        return
      }

      const result = await testSupabaseConnection()
      setStatus(result.success ? 'connected' : 'error')
      setMessage(result.message)
    }

    checkConnection()
  }, [])

  if (status === 'not-configured') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              Supabase Setup Required
            </h3>
            <p className="text-sm text-yellow-700 mb-3">
              To use this application, you need to configure your Supabase credentials:
            </p>
            <ol className="text-sm text-yellow-700 space-y-1 mb-3 ml-4 list-decimal">
              <li>Create a Supabase project at <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center">supabase.com <ExternalLink className="h-3 w-3 ml-1" /></a></li>
              <li>Go to Settings → API in your project dashboard</li>
              <li>Copy your Project URL and anon/public key</li>
              <li>Update the .env file in your project root with these credentials</li>
              <li>Restart your development server</li>
            </ol>
            <div className="bg-yellow-100 rounded p-2 text-xs font-mono text-yellow-800">
              VITE_SUPABASE_URL=https://your-project-id.supabase.co<br />
              VITE_SUPABASE_ANON_KEY=your-anon-key-here
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'checking') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-sm text-blue-700">Checking Supabase connection...</span>
        </div>
      </div>
    )
  }

  if (status === 'connected') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
          <span className="text-sm text-green-700">Connected to Supabase successfully</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium text-red-800 mb-1">Connection Error</h3>
          <p className="text-sm text-red-700">{message}</p>
        </div>
      </div>
    </div>
  )
}

export default SupabaseStatus