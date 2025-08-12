import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { SaveStatus, JournalEntry } from '../types'
import { SAVE_DEBOUNCE_MS, MAX_RETRY_ATTEMPTS } from '../constants'

export const useSaveNote = (existingNote?: JournalEntry) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const saveNote = useCallback(async (title: string, content: string, shouldRedirect = true, retryCount = 0) => {
    if (!existingNote || (!content.trim() && !title.trim())) return

    setSaveStatus('saving')
    
    try {
      const noteTitle = title.trim() || content.substring(0, 50) + (content.length > 50 ? '...' : '')
      
      const { error } = await supabase
        .from('journal_entries')
        .update({
          content: content,
          title: noteTitle
        })
        .eq('id', existingNote.id)

      if (error) {
        if (retryCount < MAX_RETRY_ATTEMPTS) {
          const delay = Math.pow(2, retryCount) * 1000
          setTimeout(() => saveNote(title, content, shouldRedirect, retryCount + 1), delay)
          return
        }
        setSaveStatus('error')
      } else {
        setHasUnsavedChanges(false)
        setSaveStatus('saved')
        if (shouldRedirect) {
          router.push('/')
        }
      }
    } catch (error) {
      console.error('Failed to save note:', error)
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        const delay = Math.pow(2, retryCount) * 1000
        setTimeout(() => saveNote(title, content, shouldRedirect, retryCount + 1), delay)
        return
      }
      setSaveStatus('error')
    } finally {
      if (saveStatus === 'saving') {
        setSaveStatus('saved')
      }
    }
  }, [existingNote, router, saveStatus])

  const forceSave = useCallback(async (title: string, content: string) => {
    if (!hasUnsavedChanges || !existingNote) return
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    
    await saveNote(title, content, false)
  }, [hasUnsavedChanges, existingNote, saveNote])

  const scheduleAutoSave = useCallback((title: string, content: string) => {
    if (!existingNote || (!content.trim() && !title.trim())) {
      setHasUnsavedChanges(false)
      return
    }
    
    setHasUnsavedChanges(true)
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveNote(title, content, false)
    }, SAVE_DEBOUNCE_MS)
  }, [existingNote, saveNote])

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    saveStatus,
    hasUnsavedChanges,
    saveNote,
    forceSave,
    scheduleAutoSave
  }
}