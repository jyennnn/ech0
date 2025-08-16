'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { redirect, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import NoteCard from '@/components/dashboard/NoteCard'

interface JournalEntry {
  id: string
  created_at: string
  type: string
  title: string | null
  content: string
  tags: string[] | null
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<JournalEntry[]>([])
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        redirect('/login')
        return
      }
      setUser(session.user)
      setLoading(false)
      fetchEntries()
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session?.user) {
          redirect('/login')
          return
        }
        setUser(session.user)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch notes:', error)
      return
    }

    if (data) {
      setNotes(data)
    }
  }


  const handleCreateNote = async () => {
    if (!user) return

    try {
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
        return
      }

      router.push(`/dashboard/note/${data.id}`)
    } catch (error) {
      console.error('Failed to create note:', error)
    }
  }

  const handleEditNote = (noteId: string) => {
    router.push(`/dashboard/note/${noteId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    redirect('/login')
    return null
  }

  return (
    <div>
      <Header onCreateNote={handleCreateNote} />

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
              <NoteCard
                key={note.id}
                note={note}
                onClick={handleEditNote}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}