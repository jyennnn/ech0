'use client'

import React, { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Plus, Lightbulb, FileText, LogOut } from 'lucide-react'
import SmartIdeaInput from './SmartIdeaInput'

interface JournalEntry {
  id: string
  created_at: string
  type: string
  title: string | null
  content: string
  tags: string[] | null
}

interface ContentJournalProps {
  user: User
}

export default function ContentJournal({ user }: ContentJournalProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([])

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setEntries(data)
  }


  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center py-4 px-4">
          <h1 className="text-lg font-medium text-gray-900">Notes</h1>
          <button
            onClick={signOut}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            Sign Out
          </button>
        </div>

        {/* Smart Idea Input */}
        <SmartIdeaInput user={user} onIdeaSaved={fetchEntries} />

        {/* Notes List */}
        <div className="px-4">
          {entries.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>No notes yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="text-sm text-gray-400 mb-1">
                    {new Date(entry.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: new Date(entry.created_at).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                    })}
                  </div>
                  <div className="text-gray-900 text-sm leading-relaxed">
                    {entry.content.length > 100 
                      ? entry.content.substring(0, 100) + '...' 
                      : entry.content
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}