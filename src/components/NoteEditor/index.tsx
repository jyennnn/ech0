'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, MoreHorizontal } from 'lucide-react'
import { NoteEditorProps, Mode, GenerationStates, ContentStates, Captions } from './types'
import { BUTTON_CLASSES } from './constants'
import { TabButton } from './components/TabButton'
import { NotesMode } from './modes/NotesMode'
import { ScriptMode } from './modes/ScriptMode'
import { CaptionsMode } from './modes/CaptionsMode'
import { useSaveNote } from './hooks/useSaveNote'
import { useVisualNotes } from './hooks/useVisualNotes'

export default function NoteEditor({ existingNote }: NoteEditorProps) {
  // Core content state
  const [title, setTitle] = useState(existingNote?.title || '')
  const [content, setContent] = useState(existingNote?.content || '')
  
  // UI state
  const [currentMode, setCurrentMode] = useState<Mode>('notes')
  const [showScriptMenu, setShowScriptMenu] = useState(false)
  
  // Generation states - consolidated
  const [generationStates, setGenerationStates] = useState<GenerationStates>({
    script: false,
    visualNotes: false,
    captions: false
  })
  
  // Content states - consolidated
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

  const router = useRouter()
  const scriptTextareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Custom hooks
  const { saveStatus, hasUnsavedChanges, saveNote, forceSave, scheduleAutoSave } = useSaveNote(existingNote)
  const { addVisualNotes } = useVisualNotes(scriptTextareaRef, setContentStates, setGenerationStates)

  // Auto-save effect
  useEffect(() => {
    scheduleAutoSave(title, content)
  }, [title, content, scheduleAutoSave])

  // Handle page unload and visibility changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges || !existingNote) return
      
      const noteTitle = title.trim() || content.substring(0, 50) + (content.length > 50 ? '...' : '')
      const payload = JSON.stringify({
        id: existingNote.id,
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
  }, [hasUnsavedChanges, existingNote, title, content, forceSave])

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

  // Menu handlers
  useEffect(() => {
    const handleClickOutside = () => {
      if (showScriptMenu) {
        setShowScriptMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showScriptMenu])

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation Bar */}
      <div className="flex justify-between items-center px-4 py-3">
        <button 
          onClick={async () => {
            await forceSave(title, content)
            router.push('/')
          }}
          className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
          <span className="text-sm text-gray-600">Notes</span>
        </button>
        <div className="flex items-center gap-3">
          {/* Save Status */}
          <div className="flex items-center gap-2 text-xs">
            {saveStatus === 'error' && (
              <div className="flex items-center gap-1 text-red-600">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <button 
                  onClick={() => saveNote(title, content, false)}
                  className="text-xs underline hover:no-underline"
                >
                  Retry save
                </button>
              </div>
            )}
          </div>
          
          <button className={BUTTON_CLASSES.secondary}>
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          <button className={BUTTON_CLASSES.secondary}>
            <MoreHorizontal className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center px-4 py-2 space-x-6">
        <TabButton active={currentMode === 'notes'} onClick={() => setCurrentMode('notes')}>
          notes
        </TabButton>
        <TabButton active={currentMode === 'script'} onClick={() => setCurrentMode('script')}>
          script
        </TabButton>
        <TabButton active={currentMode === 'captions'} onClick={() => setCurrentMode('captions')}>
          captions
        </TabButton>
      </div>

      {/* Content Areas */}
      {currentMode === 'notes' && (
        <NotesMode
          title={title}
          content={content}
          onTitleChange={setTitle}
          onContentChange={handleContentChange}
        />
      )}

      {currentMode === 'script' && (
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
      )}

      {currentMode === 'captions' && (
        <CaptionsMode
          title={title}
          content={content}
          contentStates={contentStates}
          generationStates={generationStates}
          onGenerateFirstCaption={generateFirstCaption}
        />
      )}
    </div>
  )
}