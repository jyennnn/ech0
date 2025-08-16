import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SaveStatus } from '../types/common'
import { JournalEntry } from '../types/database'
import { noteService } from '@/services/noteService'

// Save timing constants
const SAVE_DEBOUNCE_MS = 4000        // Wait 4 seconds before auto-saving
const MAX_RETRY_ATTEMPTS = 3         // Retry failed saves up to 3 times

export const useSaveNote = (existingNote?: JournalEntry) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const saveNote = useCallback(async (title: string, content: string, shouldRedirect = true, retryCount = 0) => {
    if (!existingNote || (!content.trim() && !title.trim())) return

    setSaveStatus('saving')
    
    try {
      await noteService.saveNote({
        id: existingNote.id,
        title,
        content
      })

      setHasUnsavedChanges(false)
      setSaveStatus('saved')
      if (shouldRedirect) {
        router.push('/')
      }
    } catch (error) {
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        const delay = Math.pow(2, retryCount) * 1000
        setTimeout(() => saveNote(title, content, shouldRedirect, retryCount + 1), delay)
        return
      }
      setSaveStatus('error')
    }
  }, [existingNote, router])

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