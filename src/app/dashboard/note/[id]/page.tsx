'use client'

import { useState, useEffect, useCallback } from 'react'
import { JournalEntry } from '@/types/database'
import { useParams, useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Loading } from '@/components/ui/Loading'
import { NotesMode } from '@/components/noteEditor/NotesMode'
import { ScriptMode } from '@/components/noteEditor/ScriptMode'
import { CaptionsMode } from '@/components/noteEditor/CaptionsMode'
import { useSaveNote } from '@/hooks/useSaveNote'
import { useAuth } from '@/hooks/useAuth'
import { NoteActionsProvider } from '@/components/layout/NoteActionsProvider'
import { noteService } from '@/services/noteService'
import { authService } from '@/services/authService'
import { toast } from 'sonner'


export default function EditNotePage() {
  const [note, setNote] = useState<JournalEntry | null>(null)
  const [noteLoading, setNoteLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  
  const params = useParams()
  const router = useRouter()
  const noteId = params.id as string
  const { user, loading, isAuthenticated } = useAuth()

  // Custom hooks
  const { saveStatus, hasUnsavedChanges, forceSave, scheduleAutoSave } = useSaveNote(note || undefined)

  useEffect(() => {
    if (isAuthenticated && noteId) {
      fetchNote()
    }
  }, [isAuthenticated, noteId])

  // Update title and content when note is loaded
  useEffect(() => {
    if (note) {
      setTitle(note.title || '')
      setContent(note.content || '')
    }
  }, [note])

  // Auto-save effect
  useEffect(() => {
    scheduleAutoSave(title, content)
  }, [title, content, scheduleAutoSave])

  // Handle page unload and visibility changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges || !note) return
      
      noteService.saveNoteWithBeacon({
        id: note.id,
        content: content,
        title: title
      })
      
      e.preventDefault()
      e.returnValue = ''
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasUnsavedChanges) {
        forceSave(title, content)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [hasUnsavedChanges, note, title, content, forceSave])

  const fetchNote = async () => {
    if (!noteId) return
    
    setNoteLoading(true)
    try {
      const data = await noteService.fetchNote(noteId)
      setNote(data)
    } catch (error) {
      console.error('Error fetching note:', error)
      router.push('/dashboard')
    } finally {
      setNoteLoading(false)
    }
  }

  // Content change handlers
  const handleContentChange = useCallback((value: string) => {
    setContent(value)
  }, [])

  const handleDeleteNote = async () => {
    if (!note?.id) {
      console.warn('No existing note ID found')
      return
    }

    const ok = window.confirm(
      'Are you sure you want to delete this note? This action cannot be undone.'
    )
    if (!ok) return

    try {
      const accessToken = await authService.getAccessToken()
      if (!accessToken) {
        toast.error('Please log in again.')
        router.push('/login')
        return
      }

      await noteService.deleteNote(note.id, accessToken)
      toast.success('Note deleted successfully!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error('Failed to delete note. Please try again.')
    }
  }

  if (loading || noteLoading) {
    return <Loading />
  }

  if (!user) {
    return null
  }

  if (!note) {
    return <Loading message="Note not found" />
  }

  return (
    <NoteActionsProvider
      noteActions={{
        onSave: forceSave,
        onDelete: handleDeleteNote,
        saveStatus,
        title,
        content
      }}
    >
      {/* Tabs */}
      <Tabs defaultValue="notes" className="flex-1">
        <div className="px-4 py-2">
          <TabsList>
            <TabsTrigger value="notes">notes</TabsTrigger>
            <TabsTrigger value="script">script</TabsTrigger>
            <TabsTrigger value="captions">captions</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="notes">
          <NotesMode
            title={title}
            content={content}
            onTitleChange={setTitle}
            onContentChange={handleContentChange}
          />
        </TabsContent>

        <TabsContent value="script">
          <ScriptMode
            title={title}
            content={content}
          />
        </TabsContent>

        <TabsContent value="captions">
          <CaptionsMode
            title={title}
            content={content}
          />
        </TabsContent>
      </Tabs>
    </NoteActionsProvider>
  )
}