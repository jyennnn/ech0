'use client'

import React, { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { LogOut, Plus, Menu, Search, MoreHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface JournalEntry {
  id: string
  created_at: string
  type: string
  title: string | null
  content: string
  tags: string[] | null
}

// Removed grouping interfaces - keeping it simple

interface NotesListProps {
  user: User
}

export default function NotesList({ user }: NotesListProps) {
  const [notes, setNotes] = useState<JournalEntry[]>([])
  const router = useRouter()

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setNotes(data)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const handleCreateNote = async () => {
    try {
      // Create new note immediately in database
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          type: 'idea',
          title: '',
          content: ''
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to create note:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        return
      }

      // Navigate to the new note with its ID
      router.push(`/note/${data.id}`)
    } catch (error) {
      console.error('Failed to create note:', error)
    }
  }

  const handleEditNote = (noteId: string) => {
    router.push(`/note/${noteId}`)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto">
        {/* Top Navigation Bar */}
        <div className="flex justify-between items-center px-4 py-3">
          <button className="p-2 hover:bg-gray-100 rounded-md">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-md">
              <Search className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={signOut}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Ideas Header */}
        <div className="flex justify-between items-center px-4 py-2 mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Notes</h1>
          <div className="flex gap-2">
            <button
              onClick={handleCreateNote}
              className="w-8 h-8 bg-gray-700 hover:bg-gray-800 rounded-full flex items-center justify-center transition-colors"
              title="Create new note"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Simple Notes List */}
        <div className="px-4">
          {notes.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="mb-4">No notes yet.</p>
              <button
                onClick={handleCreateNote}
                className="text-blue-500 hover:text-blue-600 text-sm"
              >
                Create your first note
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => handleEditNote(note.id)}
                  className="cursor-pointer hover:bg-gray-50 rounded-lg p-4 transition-colors border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-gray-900 font-medium text-base leading-tight">
                      {note.title || 'Untitled Note'}
                    </h3>
                    <span className="text-xs text-gray-400 ml-4 flex-shrink-0">
                      {new Date(note.created_at).toLocaleDateString('en-US', { 
                        month: '2-digit', 
                        day: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 line-clamp-2">
                    {note.content.substring(0, 120)}
                    {note.content.length > 120 ? '...' : ''}
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