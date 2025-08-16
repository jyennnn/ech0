'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { useParams, useRouter } from 'next/navigation'
import { GenerationStates, ContentStates, Captions } from '@/types/noteEditor'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { NotesMode } from '@/components/noteEditor/NotesMode'
import { ScriptMode } from '@/components/noteEditor/ScriptMode'
import { CaptionsMode } from '@/components/noteEditor/CaptionsMode'
import { useSaveNote } from '@/hooks/useSaveNote'
import { useVisualNotes } from '@/hooks/useVisualNotes'
import { NoteActionsProvider } from '@/components/layout/NoteActionsProvider'

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
  const supabase = createClient()

  // NoteEditor state moved here
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [showScriptMenu, setShowScriptMenu] = useState(false)
  
  const [generationStates, setGenerationStates] = useState<GenerationStates>({
    script: false,
    visualNotes: false,
    captions: false
  })
  
  const [contentStates, setContentStates] = useState<ContentStates>({
    script: '',
    videoType: '30-45s instagram video, emotional and relatable script',
    captions: {
      instagram: '',
      linkedin: '',
      x: '',
      tiktok: ''
    } as Captions
  })

  const scriptTextareaRef = useRef<HTMLTextAreaElement>(null!)

  // Custom hooks
  const { saveStatus, hasUnsavedChanges, saveNote, forceSave, scheduleAutoSave } = useSaveNote(note || undefined)
  const { addVisualNotes } = useVisualNotes(scriptTextareaRef, setContentStates, setGenerationStates)

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
      
      const noteTitle = title.trim() || content.substring(0, 50) + (content.length > 50 ? '...' : '')
      const payload = JSON.stringify({
        id: note.id,
        content: content,
        title: noteTitle
      })
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/note-save', payload)
      } else {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/note-save', false)
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.send(payload)
      }
      
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

  // Menu handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showScriptMenu && !target.closest('[data-menu="script"]')) {
        setShowScriptMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showScriptMenu])

  const fetchNote = async () => {
    if (!noteId) return
    
    setNoteLoading(true)
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', noteId)
      .single()

    if (data) {
      setNote(data)
    } else if (error) {
      console.error('Error fetching note:', error)
      router.push('/dashboard')
    }
    setNoteLoading(false)
  }

  // Content change handlers
  const handleContentChange = useCallback((value: string) => {
    setContent(value)
  }, [])

  const handleVideoTypeChange = useCallback((value: string) => {
    setContentStates(prev => ({ ...prev, videoType: value }))
  }, [])

  // Generation handlers
  const generateFirstCaption = async () => {
    const fullContent = (title.trim() ? title + '\n\n' + content : content).trim()
    if (fullContent.length < 30) {
      alert('Please write more content in notes mode before generating captions.')
      return
    }

    setGenerationStates(prev => ({ ...prev, captions: true }))
    
    try {
      const response = await fetch('/api/ai/caption-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: fullContent }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.captions) {
          setContentStates(prev => ({ ...prev, captions: data.captions }))
        }
      } else {
        alert('Failed to generate captions. Please try again.')
      }
    } catch (error) {
      console.error('Caption generation failed:', error)
      alert('Failed to generate captions. Please try again.')
    } finally {
      setGenerationStates(prev => ({ ...prev, captions: false }))
    }
  }

  const generateFirstDraft = async () => {
    const fullContent = (title.trim() ? title + '\n\n' + content : content).trim()
    if (fullContent.length < 30) {
      alert('Please write more content in notes mode before generating a script.')
      return
    }

    setGenerationStates(prev => ({ ...prev, script: true }))
    
    try {
      const response = await fetch('/api/ai/script-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: fullContent,
          videoType: contentStates.videoType 
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.script) {
          setContentStates(prev => ({ ...prev, script: data.script }))
        }
      } else {
        alert('Failed to generate script. Please try again.')
      }
    } catch (error) {
      console.error('Script generation failed:', error)
      alert('Failed to generate script. Please try again.')
    } finally {
      setGenerationStates(prev => ({ ...prev, script: false }))
    }
  }

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
      const { data: { session }, error: sessErr } = await supabase.auth.getSession()
      if (sessErr) {
        console.error('Session error:', sessErr)
        alert('Please log in again.')
        router.push('/login')
        return
      }
      const token = session?.access_token
      if (!token) {
        alert('Please log in again.')
        router.push('/login')
        return
      }

      const res = await fetch('/api/note-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: note.id }),
      })

      if (!res.ok) {
        let msg = 'Failed to delete note.'
        try {
          const err = await res.json()
          msg = err?.error || JSON.stringify(err)
        } catch {
          msg = await res.text()
        }
        console.error('Delete failed:', res.status, msg)
        alert('Failed to delete note. Please try again.')
        return
      }

      router.push('/dashboard')
    } catch (e) {
      console.error('Delete failed:', e)
      alert('Failed to delete note. Please try again.')
    }
  }

  if (loading || noteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    router.push(`/login`)
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-foreground">Note not found</div>
      </div>
    )
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
            contentStates={contentStates}
            generationStates={generationStates}
            showScriptMenu={showScriptMenu}
            onVideoTypeChange={handleVideoTypeChange}
            onGenerateFirstDraft={generateFirstDraft}
            onAddVisualNotes={() => addVisualNotes(contentStates.script)}
            onToggleScriptMenu={() => setShowScriptMenu(!showScriptMenu)}
          />
        </TabsContent>

        <TabsContent value="captions">
          <CaptionsMode
            title={title}
            content={content}
            contentStates={contentStates}
            generationStates={generationStates}
            onGenerateFirstCaption={generateFirstCaption}
          />
        </TabsContent>
      </Tabs>
    </NoteActionsProvider>
  )
}