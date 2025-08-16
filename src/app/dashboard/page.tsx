'use client'

import { useState, useEffect } from 'react'
import { JournalEntry } from '@/types/database'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import NoteCard from '@/components/dashboard/NoteCard'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { noteService } from '@/services/noteService'
import { authService } from '@/services/authService'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'


export default function DashboardPage() {
  const [notesLoading, setNotesLoading] = useState(true)
  const [notes, setNotes] = useState<JournalEntry[]>([])
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const router = useRouter()
  const { user, loading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      fetchEntries()
    }
  }, [isAuthenticated])

  const fetchEntries = async () => {
    setNotesLoading(true)
    try {
      const data = await noteService.fetchAllNotes()
      setNotes(data)
    } catch (error) {
      console.error('Failed to fetch notes:', error)
      toast.error('Failed to load notes. Please try again.')
    } finally {
      setNotesLoading(false)
    }
  }


  const handleCreateNote = async () => {
    if (!user) return

    try {
      const newNote = await noteService.createNote(user.id)
      router.push(`/dashboard/note/${newNote.id}`)
    } catch (error) {
      console.error('Failed to create note:', error)
      toast.error('Failed to create note. Please try again.')
    }
  }

  const handleEditNote = (noteId: string) => {
    router.push(`/dashboard/note/${noteId}`)
  }

  const handleDeleteNote = async (noteId: string) => {
    const noteToDelete = notes.find(n => n.id === noteId)
    const title = noteToDelete?.title || 'Untitled Note'
    
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return
    }

    try {
      const accessToken = await authService.getAccessToken()
      if (!accessToken) {
        toast.error('Please log in again.')
        router.push('/login')
        return
      }

      await noteService.deleteNote(noteId, accessToken)
      toast.success('Note deleted successfully!')
      fetchEntries()
    } catch (error) {
      toast.error('Failed to delete note. Please try again.')
    }
  }

  if (loading || notesLoading) {
    return <Loading />
  }

  if (!user) {
    return null
  }

  return (
    <div>
      <Header onCreateNote={handleCreateNote} />

      {/* Simple Notes List */}
      <div className="px-4">
        {notes.length === 0 ? (
          <EmptyState
            title="No notes yet."
            action={{
              label: "Create your first note",
              onClick: handleCreateNote
            }}
          />
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={handleEditNote}
                onDelete={handleDeleteNote}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}