'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function HomePage() {
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [inserting, setInserting] = useState(false)
  const [error, setError] = useState(null)

  // Load episodes from Supabase
  const loadEpisodes = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setEpisodes(data || [])
    } catch (err) {
      console.error('Error loading episodes:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Insert test episode via API
  const insertTestEpisode = async () => {
    try {
      setInserting(true)
      setError(null)

      const response = await fetch('/api/test-insert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to insert episode')
      }

      // Refresh the episodes list
      await loadEpisodes()
      
      alert('Test episode inserted successfully!')
    } catch (err) {
      console.error('Error inserting episode:', err)
      setError(err.message)
      alert(`Error: ${err.message}`)
    } finally {
      setInserting(false)
    }
  }

  // Load episodes on component mount
  useEffect(() => {
    loadEpisodes()
  }, [])

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Quantum Rishi - Supabase Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={insertTestEpisode}
          disabled={inserting}
          style={{
            padding: '10px 20px',
            backgroundColor: inserting ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: inserting ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {inserting ? 'Inserting...' : 'Insert Test Episode'}
        </button>
        
        <button 
          onClick={loadEpisodes}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : 'Refresh Episodes'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <h2>Episodes ({episodes.length})</h2>
      
      {loading ? (
        <p>Loading episodes...</p>
      ) : episodes.length === 0 ? (
        <div style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          <p>No episodes found.</p>
          <p>Click &quot;Insert Test Episode&quot; to create one!</p>
        </div>
      ) : (
        <div>
          {episodes.map((episode) => (
            <div 
              key={episode.id} 
              style={{
                border: '1px solid #ddd',
                borderRadius: '5px',
                padding: '15px',
                marginBottom: '10px',
                backgroundColor: '#f9f9f9'
              }}
            >
              <h3 style={{ margin: '0 0 10px 0' }}>{episode.title}</h3>
              <p style={{ margin: '0 0 10px 0', color: '#666' }}>{episode.content}</p>
              <div style={{ fontSize: '12px', color: '#999' }}>
                <span><strong>ID:</strong> {episode.id}</span> | 
                <span><strong>Status:</strong> {episode.status}</span> | 
                <span><strong>Created:</strong> {new Date(episode.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '5px' }}>
        <h3>Environment Setup Required:</h3>
        <p>Make sure your <code>.env.local</code> file contains:</p>
        <pre style={{ backgroundColor: '#f1f1f1', padding: '10px', borderRadius: '3px' }}>
{`NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`}
        </pre>
      </div>
    </div>
  )
}