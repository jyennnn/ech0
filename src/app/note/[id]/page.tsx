'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import AuthComponent from '@/components/Auth'
import NoteEditor from '@/components/NoteEditor/index'
import { useParams, useRouter } from 'next/navigation'

interface JournalEntry {
  id: string
  created_at: string
  type: string
  title: string | null
  content: string
  tags: string[] | null
}

export default function EditNotePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState<JournalEntry | null>(null)
  const [noteLoading, setNoteLoading] = useState(true)
  const params = useParams()
  const router = useRouter()
  const noteId = params.id as string

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user && noteId) {
      fetchNote()
    }
  }, [user, noteId])

  const fetchNote = async () => {
    if (!noteId) return
    
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', noteId)
      .single()

    if (data) {
      setNote(data)
    } else if (error) {
      console.error('Error fetching note:', error)
      router.push('/')
    }
    setNoteLoading(false)
  }

  if (loading || noteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <AuthComponent />
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-foreground">Note not found</div>
      </div>
    )
  }

  return <NoteEditor user={user} existingNote={note} />
}