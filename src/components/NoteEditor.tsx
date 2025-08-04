'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Send, Wand2, FileText, Camera, Square, Menu, Bell, Search, MoreHorizontal, ChevronDown, Edit3, Instagram, Facebook, Linkedin, Youtube, Twitter } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface JournalEntry {
  id: string
  created_at: string
  type: string
  title: string | null
  content: string
  tags: string[] | null
}

interface NoteEditorProps {
  user: User
  existingNote?: JournalEntry
}

export default function NoteEditor({ user, existingNote }: NoteEditorProps) {
  const [title, setTitle] = useState(existingNote?.title || '')
  const [content, setContent] = useState(existingNote?.content || '')
  const [backgroundWords, setBackgroundWords] = useState<string[]>([])
  const [backgroundWordHistory, setBackgroundWordHistory] = useState<string[]>([])
  const [hasNewBackgroundWords, setHasNewBackgroundWords] = useState(false)
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false)
  const [showConversation, setShowConversation] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [conversation, setConversation] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [conversationInput, setConversationInput] = useState('')
  const [isConversationLoading, setIsConversationLoading] = useState(false)
  const [currentMode, setCurrentMode] = useState<'notes' | 'script' | 'captions'>('notes')
  const [scriptContent, setScriptContent] = useState('')
  const [isGeneratingScript, setIsGeneratingScript] = useState(false)
  const [isAddingVisualNotes, setIsAddingVisualNotes] = useState(false)
  const [videoType, setVideoType] = useState('30-45s instagram video, emotional and relatable script')
  const [showScriptMenu, setShowScriptMenu] = useState(false)
  const [captions, setCaptions] = useState({
    instagram: '',
    linkedin: '',
    x: '',
    tiktok: ''
  })
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false)
  const scriptTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const typingTimeoutsRef = useRef<NodeJS.Timeout[]>([])
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const backgroundTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastAnalyzedContent = useRef('')
  const lastBackgroundContent = useRef('')
  const backgroundCharThreshold = useRef(0)
  const router = useRouter()

  // Removed localStorage complexity - React state is our local storage!

  // Comprehensive auto-save with 4-second debounce and unsaved changes tracking
  useEffect(() => {
    // Skip if no note
    if (!existingNote) {
      return
    }
    
    // Skip if empty content (don't mark as unsaved for empty notes)
    if (!content.trim() && !title.trim()) {
      setHasUnsavedChanges(false)
      return
    }
    
    // Mark as having unsaved changes
    setHasUnsavedChanges(true)
    console.log('📝 CONTENT CHANGED - Marked as unsaved')
    
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Schedule save after 4 seconds of inactivity
    saveTimeoutRef.current = setTimeout(() => {
      console.log('💾 4-SECOND DEBOUNCE - Saving to database...')
      saveToDatabase()
    }, 4000) // 4 seconds as requested
    
    // Cleanup function
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [content, title, existingNote])

  // Force save function for immediate saves on exit scenarios
  const forceSave = async () => {
    if (!hasUnsavedChanges || !existingNote) return
    
    console.log('🚨 FORCE SAVE - Immediate save triggered')
    
    // Clear any pending timeouts
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    
    // Immediate save
    await saveNote(false)
  }

  // Database save function
  const saveToDatabase = async () => {
    if (!hasUnsavedChanges || !existingNote) return
    await saveNote(false)
  }

  // Comprehensive exit handlers for all scenarios
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        console.log('🚪 BEFOREUNLOAD - Force saving')
        // Use synchronous save approach for beforeunload
        if (existingNote && (content.trim() || title.trim())) {
          // Use sendBeacon for reliable save during page unload
          const noteTitle = title.trim() || content.substring(0, 50) + (content.length > 50 ? '...' : '')
          const payload = JSON.stringify({
            id: existingNote.id,
            content: content,
            title: noteTitle
          })
          
          // Try sendBeacon first (most reliable for unload)
          if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/note-save', payload)
          } else {
            // Fallback: synchronous xhr (deprecated but works for beforeunload)
            const xhr = new XMLHttpRequest()
            xhr.open('POST', '/api/note-save', false) // synchronous
            xhr.setRequestHeader('Content-Type', 'application/json')
            xhr.send(payload)
          }
        }
        // Browser confirmation for unsaved changes
        e.preventDefault()
        e.returnValue = ''
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasUnsavedChanges) {
        console.log('👁️ TAB HIDDEN - Force saving')
        forceSave()
      }
    }

    // Add event listeners (no router.events in App Router)
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      // Cleanup event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [hasUnsavedChanges, existingNote])

  // Handle content changes and trigger background word generation
  const handleContentChange = useCallback((value: string) => {
    setContent(value)
    setIsTyping(true)
    
    // Clear existing timeouts
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    if (backgroundTimeoutRef.current) {
      clearTimeout(backgroundTimeoutRef.current)
    }
    
    // Stop typing indicator after 1 second
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 1000)
    
    // Background word generation with smart cost optimization
    if (value.trim().length > 100) {
      // Check if we've added enough new content to warrant background generation
      const charsSinceLastBackground = value.length - backgroundCharThreshold.current
      
      if (charsSinceLastBackground >= 100) { // Only after 100+ new characters
        backgroundTimeoutRef.current = setTimeout(() => {
          generateBackgroundWords(value)
          backgroundCharThreshold.current = value.length
        }, 10000) // 10 second delay for cost efficiency
      }
    }
  }, [])

  const getRecentContent = (fullText: string, previousText: string) => {
    // If text is short, use all of it
    if (fullText.length <= 200) return fullText
    
    // For longer texts, focus on recent additions
    if (previousText && fullText.includes(previousText)) {
      // Get the new content plus some context
      const newContentStart = previousText.length
      const contextStart = Math.max(0, newContentStart - 100) // 100 chars of context
      return fullText.substring(contextStart)
    }
    
    // Fallback: use last 300 characters
    return fullText.substring(Math.max(0, fullText.length - 300))
  }

  // Calculate content similarity to avoid unnecessary API calls
  const calculateSimilarity = (text1: string, text2: string): number => {
    if (!text1 || !text2) return 0
    
    const words1 = text1.toLowerCase().split(/\s+/)
    const words2 = text2.toLowerCase().split(/\s+/)
    
    const set1 = new Set(words1)
    const set2 = new Set(words2)
    
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    
    return intersection.size / union.size
  }

  // Background word generation with smart cost optimization
  const generateBackgroundWords = async (text: string) => {
    if (!text.trim() || text.length < 100) return // Minimum threshold for background words
    
    // Check content similarity to avoid regenerating for similar content
    const similarity = calculateSimilarity(text, lastBackgroundContent.current)
    if (similarity > 0.8) {
      console.log('Content too similar to previous, skipping background generation')
      return
    }
    
    setIsGeneratingBackground(true)
    
    try {
      const response = await fetch('/api/ai/background-words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: text,
          previousWords: backgroundWordHistory.slice(-12) // Last 12 words for context
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.words && Array.isArray(data.words)) {
          setBackgroundWords(data.words)
          setBackgroundWordHistory(prev => [...prev, ...data.words].slice(-20)) // Keep last 20
          setHasNewBackgroundWords(true)
          lastBackgroundContent.current = text
        }
      }
    } catch (error) {
      console.error('Background word generation failed:', error)
    } finally {
      setIsGeneratingBackground(false)
    }
  }

  const saveNote = async (shouldRedirect = true, retryCount = 0) => {
    // NoteEditor should only be used with existing notes now
    if (!existingNote) {
      console.error('NoteEditor called without existingNote - this should not happen')
      return
    }

    if (!content.trim() && !title.trim()) return

    setIsSaving(true)
    // Don't show "saving" status - keep it silent like Apple Notes
    
    try {
      const noteTitle = title.trim() || content.substring(0, 50) + (content.length > 50 ? '...' : '')
      
      // Update existing note
      const { error } = await supabase
        .from('journal_entries')
        .update({
          content: content,
          title: noteTitle
        })
        .eq('id', existingNote.id)

      if (error) {
        // Retry logic - retry up to 3 times with exponential backoff
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
          setTimeout(() => {
            saveNote(shouldRedirect, retryCount + 1)
          }, delay)
          return
        } else {
          // Only show status on persistent errors
          setSaveStatus('error')
        }
      } else {
        // Success - clear unsaved changes flag!
        console.log('✅ DATABASE SAVE SUCCESS')
        setHasUnsavedChanges(false)
        if (saveStatus === 'error') {
          setSaveStatus('saved')
        }
        setLastSaved(new Date())
        if (shouldRedirect) {
          router.push('/')
        }
      }
    } catch (error) {
      // Retry on network errors
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000
        setTimeout(() => {
          saveNote(shouldRedirect, retryCount + 1)
        }, delay)
        return
      } else {
        // Only show status on persistent errors
        setSaveStatus('error')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Handle notification click to open conversation
  const handleNotificationClick = () => {
    setHasNewBackgroundWords(false)
    setShowConversation(true)
    // Start conversation if empty
    if (conversation.length === 0) {
      startConversation()
    }
  }

  // Start conversation with AI
  const startConversation = async () => {
    if (!content.trim() || content.length < 30) return
    
    setIsConversationLoading(true)
    
    try {
      const response = await fetch('/api/ai/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalContent: content,
          backgroundWords: backgroundWords,
          conversation: []
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.response) {
          setConversation([{
            role: 'assistant',
            content: data.response
          }])
        }
      }
    } catch (error) {
      console.error('Failed to start conversation:', error)
      setConversation([{
        role: 'assistant',
        content: "Hey, I'm really curious about what you've been thinking! There's definitely something here worth exploring. What's the part that you're most excited or uncertain about?"
      }])
    } finally {
      setIsConversationLoading(false)
    }
  }

  // Send message in conversation
  const sendMessage = async () => {
    if (!conversationInput.trim() || isConversationLoading) return
    
    const userMessage = conversationInput.trim()
    setConversationInput('')
    
    // Add user message
    const newConversation = [...conversation, { role: 'user' as const, content: userMessage }]
    setConversation(newConversation)
    setIsConversationLoading(true)
    
    try {
      const response = await fetch('/api/ai/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalContent: content,
          backgroundWords: backgroundWords,
          conversation: newConversation
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.response) {
          setConversation([...newConversation, {
            role: 'assistant',
            content: data.response
          }])
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setConversation([...newConversation, {
        role: 'assistant',
        content: "Hmm, my brain's a bit scrambled right now. Can you say that again? I don't want to miss what you're thinking!"
      }])
    } finally {
      setIsConversationLoading(false)
    }
  }

  // Generate first caption draft
  const generateFirstCaption = async () => {
    const fullContent = (title.trim() ? title + '\n\n' + content : content).trim()
    if (fullContent.length < 30) {
      alert('Please write more content in notes mode before generating captions.')
      return
    }

    setIsGeneratingCaptions(true)
    
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
          setCaptions(data.captions)
        }
      } else {
        alert('Failed to generate captions. Please try again.')
      }
    } catch (error) {
      console.error('Caption generation failed:', error)
      alert('Failed to generate captions. Please try again.')
    } finally {
      setIsGeneratingCaptions(false)
    }
  }

  // Repurpose existing caption to other platforms
  const repurposeCaptions = async () => {
    const existingCaption = captions.instagram || captions.linkedin || captions.x || captions.tiktok
    
    if (!existingCaption) {
      alert('Please write a caption first before repurposing.')
      return
    }
    
    const fullContent = (title.trim() ? title + '\n\n' + content : content).trim()

    setIsGeneratingCaptions(true)
    
    try {
      const response = await fetch('/api/ai/caption-repurpose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          originalContent: fullContent,
          existingCaption,
          currentCaptions: captions
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.captions) {
          setCaptions(prev => ({ ...prev, ...data.captions }))
        }
      } else {
        alert('Failed to repurpose captions. Please try again.')
      }
    } catch (error) {
      console.error('Caption repurposing failed:', error)
      alert('Failed to repurpose captions. Please try again.')
    } finally {
      setIsGeneratingCaptions(false)
    }
  }

  // Generate first script draft
  const generateFirstDraft = async () => {
    const fullContent = (title.trim() ? title + '\n\n' + content : content).trim()
    if (fullContent.length < 30) {
      alert('Please write more content in notes mode before generating a script.')
      return
    }

    setIsGeneratingScript(true)
    
    try {
      const response = await fetch('/api/ai/script-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: fullContent }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.script) {
          setScriptContent(data.script)
        }
      } else {
        alert('Failed to generate script. Please try again.')
      }
    } catch (error) {
      console.error('Script generation failed:', error)
      alert('Failed to generate script. Please try again.')
    } finally {
      setIsGeneratingScript(false)
    }
  }

  // Add visual notes with typing animation
  const addVisualNotes = async () => {
    console.log('Add visual notes clicked!')
    console.log('Current script content:', scriptContent)
    
    if (!scriptContent.trim()) {
      alert('Generate a script first before adding visual notes.')
      return
    }

    console.log('Setting isAddingVisualNotes to true')
    setIsAddingVisualNotes(true)
    
    try {
      console.log('Making API call to /api/ai/visual-notes')
      const response = await fetch('/api/ai/visual-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ script: scriptContent }),
      })

      console.log('API response status:', response.status)
      console.log('API response ok:', response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log('API response data:', data)
        
        if (data.enhancedScript) {
          console.log('Enhanced script received, starting typing animation')
          // Simulate AI typing the visual notes into the script
          typeVisualNotesIntoScript(data.enhancedScript)
        } else {
          console.log('No enhanced script in response')
          setIsAddingVisualNotes(false)
        }
      } else {
        const errorText = await response.text()
        console.error('API error response:', errorText)
        alert('Failed to generate visual notes. Please try again.')
        setIsAddingVisualNotes(false)
      }
    } catch (error) {
      console.error('Visual notes generation failed:', error)
      alert('Failed to generate visual notes. Please try again.')
      setIsAddingVisualNotes(false)
    }
  }

  // Stop adding visual notes
  const stopAddingVisualNotes = () => {
    // Clear all typing timeouts
    typingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
    typingTimeoutsRef.current = []
    
    // Reset state
    setIsAddingVisualNotes(false)
    
    // Enable editing again
    if (scriptTextareaRef.current) {
      scriptTextareaRef.current.readOnly = false
    }
  }

  // Simulate AI typing visual notes into the script
  const typeVisualNotesIntoScript = async (enhancedScript: string) => {
    console.log('Starting typing animation')
    console.log('Enhanced script:', enhancedScript)
    
    const originalScript = scriptContent.trim()
    const finalScript = enhancedScript.trim()
    
    console.log('Original script:', originalScript)
    console.log('Final script:', finalScript)
    
    if (!finalScript) {
      console.log('No enhanced script to type')
      setIsAddingVisualNotes(false)
      return
    }
    
    // Find visual notes by parsing the enhanced script line by line
    const visualNotes: Array<{insertAfterText: string, content: string}> = []
    
    console.log('Parsing enhanced script for visual notes...')
    console.log('Enhanced script lines:', finalScript.split('\n'))
    
    const lines = finalScript.split('\n')
    let textSoFar = ''
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (line.startsWith('[VISUAL:')) {
        // This is a visual note - it should be inserted after the preceding text
        if (textSoFar.trim()) {
          visualNotes.push({
            insertAfterText: textSoFar.trim(),
            content: line
          })
          console.log(`Visual note found: "${line}"`)
          console.log(`Should insert after text: "${textSoFar.trim()}"`)
        }
      } else if (line.length > 0) {
        // This is content text - add it to our running text
        textSoFar += (textSoFar ? '\n' : '') + line
      }
    }
    
    console.log('Visual notes to insert:', visualNotes)
    
    // Start the insertion animation
    let currentContent = originalScript
    let noteIndex = 0
    
    const insertNextVisualNote = () => {
      if (noteIndex >= visualNotes.length) {
        console.log('All visual notes inserted')
        setIsAddingVisualNotes(false)
        if (scriptTextareaRef.current) {
          scriptTextareaRef.current.readOnly = false
        }
        return
      }
      
      const visualNote = visualNotes[noteIndex]
      
      console.log(`Processing visual note ${noteIndex + 1}/${visualNotes.length}:`, visualNote.content)
      console.log('Looking for text:', visualNote.insertAfterText)
      console.log('Current content:', currentContent)
      
      // Find where to insert this visual note in the current content
      const insertAfterText = visualNote.insertAfterText
      let insertionPoint = currentContent.indexOf(insertAfterText)
      
      // If exact match fails, try to find a partial match at sentence boundaries
      if (insertionPoint === -1) {
        console.log('Exact match failed, trying sentence boundary matches...')
        
        // Try to find the text by looking for the last complete sentence
        const sentences = insertAfterText.split(/[.!?]+/).filter(s => s.trim())
        if (sentences.length > 0) {
          const lastSentence = sentences[sentences.length - 1].trim()
          console.log('Looking for last sentence:', lastSentence)
          
          // Look for the sentence followed by punctuation
          const sentencePatterns = [
            lastSentence + '.',
            lastSentence + '!', 
            lastSentence + '?'
          ]
          
          for (const pattern of sentencePatterns) {
            const patternIndex = currentContent.indexOf(pattern)
            if (patternIndex !== -1) {
              insertionPoint = patternIndex + pattern.length
              console.log('Found sentence pattern match:', pattern, 'at position:', insertionPoint)
              break
            }
          }
          
          // If still no match, try just the sentence text but ensure it ends with punctuation
          if (insertionPoint === -1) {
            let searchIndex = 0
            while (searchIndex < currentContent.length) {
              const sentenceIndex = currentContent.indexOf(lastSentence, searchIndex)
              if (sentenceIndex === -1) break
              
              // Check if this sentence is followed by punctuation
              const charAfterSentence = currentContent[sentenceIndex + lastSentence.length]
              if (charAfterSentence && /[.!?]/.test(charAfterSentence)) {
                insertionPoint = sentenceIndex + lastSentence.length + 1 // +1 for the punctuation
                console.log('Found sentence with punctuation at position:', insertionPoint)
                break
              }
              
              searchIndex = sentenceIndex + 1
            }
          }
        }
      }
      
      if (insertionPoint === -1) {
        console.log('Could not find insertion point, skipping this visual note')
        noteIndex++
        insertNextVisualNote()
        return
      }
      
      // Find the end of the text we want to insert after
      const insertPosition = insertAfterText.length > 0 ? insertionPoint + insertAfterText.length : insertionPoint
      
      // Split content at insertion point
      const beforeText = currentContent.substring(0, insertPosition)
      const afterText = currentContent.substring(insertPosition)
      
      // Add a newline and prepare for typing
      currentContent = beforeText + '\n'
      setScriptContent(currentContent)
      
      // Type the visual note character by character
      let charIndex = 0
      const visualNoteText = visualNote.content
      const typingSpeed = 25
      
      const typeChar = () => {
        if (charIndex < visualNoteText.length) {
          const partialVisualNote = visualNoteText.substring(0, charIndex + 1)
          setScriptContent(beforeText + '\n' + partialVisualNote + afterText)
          charIndex++
          
          // Auto-scroll to follow typing but don't prevent manual scrolling
          setTimeout(() => {
            if (scriptTextareaRef.current) {
              const textarea = scriptTextareaRef.current
              const shouldAutoScroll = textarea.scrollTop >= textarea.scrollHeight - textarea.clientHeight - 100
              if (shouldAutoScroll) {
                textarea.scrollTop = textarea.scrollHeight
              }
            }
          }, 10)
          
          const timeout = setTimeout(typeChar, typingSpeed)
          typingTimeoutsRef.current.push(timeout)
        } else {
          // Update current content with the complete visual note
          currentContent = beforeText + '\n' + visualNoteText + afterText
          
          // Move to next visual note after a pause
          noteIndex++
          const timeout = setTimeout(insertNextVisualNote, 500)
          typingTimeoutsRef.current.push(timeout)
        }
      }
      
      // Start typing this visual note
      const timeout = setTimeout(typeChar, 300)
      typingTimeoutsRef.current.push(timeout)
    }
    
    // Start the process
    insertNextVisualNote()
  }

  // Cleanup timeouts  
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      if (backgroundTimeoutRef.current) clearTimeout(backgroundTimeoutRef.current)
    }
  }, [])

  // Close script menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
            await forceSave()
            router.push('/')
          }}
          className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
          <span className="text-sm text-gray-600">Notes</span>
        </button>
        <div className="flex items-center gap-3">
          {/* Minimal Save Status - Apple Notes style */}
          <div className="flex items-center gap-2 text-xs">
            {/* Only show errors - everything else is silent */}
            {saveStatus === 'error' && (
              <div className="flex items-center gap-1 text-red-600">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <button 
                  onClick={() => saveNote(false)}
                  className="text-xs underline hover:no-underline"
                >
                  Retry save
                </button>
              </div>
            )}
          </div>
          
          <button className="p-2 hover:bg-gray-100 rounded-md relative">
            <Bell className="w-5 h-5 text-gray-600" />
            {currentMode === 'notes' && hasNewBackgroundWords && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            )}
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-md">
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-md">
            <MoreHorizontal className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center px-4 py-2 space-x-6">
        <button
          onClick={() => setCurrentMode('notes')}
          className={`px-4 py-2 text-sm transition-colors rounded-full ${
            currentMode === 'notes'
              ? 'text-gray-900 bg-gray-200'
              : 'text-gray-500'
          }`}
        >
          notes
        </button>
        <button
          onClick={() => setCurrentMode('script')}
          className={`px-4 py-2 text-sm transition-colors rounded-full ${
            currentMode === 'script'
              ? 'text-gray-900 bg-gray-200'
              : 'text-gray-500'
          }`}
        >
          script
        </button>
        <button
          onClick={() => setCurrentMode('captions')}
          className={`px-4 py-2 text-sm transition-colors rounded-full ${
            currentMode === 'captions'
              ? 'text-gray-900 bg-gray-200'
              : 'text-gray-500'
          }`}
        >
          captions
        </button>
      </div>

      {/* Content Area - Notes Mode */}
      {currentMode === 'notes' && (
        <div className="px-4 pb-20">
          {/* Title Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder=""
            className="w-full p-0 border-none resize-none focus:outline-none text-2xl font-bold placeholder-gray-400 mb-4 bg-transparent text-gray-900"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
            autoFocus
          />
          
          {/* Content Textarea */}
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder=""
            className="w-full min-h-[70vh] p-0 border-none resize-none focus:outline-none text-base placeholder-gray-400 leading-relaxed text-gray-900"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
          />
        </div>
      )}

      {/* Content Area - Script Mode */}
      {currentMode === 'script' && (
        <div className="px-4 pb-20">
          {/* Video Type Section */}
          <div className="mb-6">
            <div className="text-sm text-gray-900 font-medium mb-2">Video type</div>
            <textarea
              value={videoType}
              onChange={(e) => setVideoType(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 text-sm text-gray-900 bg-white"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
              rows={3}
            />
          </div>

          {!scriptContent && !isAddingVisualNotes ? (
            // Create first draft button
            <div className="flex justify-center mb-8">
              <button
                onClick={generateFirstDraft}
                disabled={isGeneratingScript || !title.trim() && !content.trim()}
                className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                {isGeneratingScript ? 'Creating...' : 'Create first draft'}
              </button>
            </div>
          ) : (
            // Script content with dropdown
            <div className="min-h-[70vh]">
              {/* Script Header with Dropdown */}
              <div className="mb-4 relative">
                <button
                  onClick={() => setShowScriptMenu(!showScriptMenu)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  First draft
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {/* Dropdown Menu */}
                {showScriptMenu && (
                  <div className="absolute top-8 left-0 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-48 z-10">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between">
                      New Draft
                      <span className="text-xs text-gray-400">⌘N</span>
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between">
                      Duplicate
                      <span className="text-xs text-gray-400">⌘D</span>
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between">
                      Rename
                      <span className="text-xs text-gray-400">⌘R</span>
                    </button>
                    <hr className="my-1 border-gray-200" />
                    <button 
                      onClick={() => {
                        addVisualNotes()
                        setShowScriptMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Generate Visual Cues
                    </button>
                  </div>
                )}
              </div>

              {/* Script Content */}
              <div className="text-gray-900 text-base leading-relaxed whitespace-pre-wrap">
                {scriptContent}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content Area - Captions Mode */}
      {currentMode === 'captions' && (
        <div className="px-4 pb-20">
          {/* Your thoughts section */}
          <div className="mb-6">
            <div className="text-lg font-semibold text-gray-900 mb-3">Your thoughts</div>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="text-sm text-gray-600 mb-2">
                {title && (
                  <span className="font-medium">
                    {title} ✨ (1/5)
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-900 leading-relaxed">
                {title && <div className="mb-2">{title}</div>}
                {content}
              </div>
            </div>
          </div>

          {!captions.instagram && !captions.linkedin && !captions.x && !captions.tiktok ? (
            // Repurpose button (initial state)
            <div className="flex justify-center mb-8">
              <button
                onClick={generateFirstCaption}
                disabled={isGeneratingCaptions || !title.trim() && !content.trim()}
                className="flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                {isGeneratingCaptions ? 'Repurposing...' : 'Repurpose for socials'}
              </button>
            </div>
          ) : (
            // Platform icons and captions
            <div className="space-y-6">
              {/* Platform Icons Row */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                  <Instagram className="w-5 h-5 text-white" />
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Facebook className="w-5 h-5 text-gray-600" />
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Linkedin className="w-5 h-5 text-gray-600" />
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="w-5 h-5 bg-gray-600 rounded-sm"></div> {/* TikTok placeholder */}
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Youtube className="w-5 h-5 text-gray-600" />
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Twitter className="w-5 h-5 text-gray-600" />
                </div>
                <button className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-lg">⋯</span>
                </button>
              </div>

              {/* Instagram Caption */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4" />
                  <span className="text-sm font-medium text-gray-900">Instagram</span>
                  <span className="text-xs text-gray-500">2,200 chars max, more relatable</span>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg bg-white">
                  <div className="text-sm text-gray-900 leading-relaxed">
                    {captions.instagram || "No caption generated yet"}
                  </div>
                </div>
              </div>

              {/* LinkedIn Caption */}
              {captions.linkedin && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4" />
                    <span className="text-sm font-medium text-gray-900">LinkedIn</span>
                    <span className="text-xs text-gray-500">3,000 chars max, professional</span>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg bg-white">
                    <div className="text-sm text-gray-900 leading-relaxed">
                      {captions.linkedin}
                    </div>
                  </div>
                </div>
              )}

              {/* X (Twitter) Caption */}
              {captions.x && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Twitter className="w-4 h-4" />
                    <span className="text-sm font-medium text-gray-900">X (Twitter)</span>
                    <span className="text-xs text-gray-500">280 chars max, concise</span>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg bg-white">
                    <div className="text-sm text-gray-900 leading-relaxed">
                      {captions.x}
                    </div>
                  </div>
                </div>
              )}

              {/* TikTok Caption */}
              {captions.tiktok && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-600 rounded-sm"></div>
                    <span className="text-sm font-medium text-gray-900">TikTok</span>
                    <span className="text-xs text-gray-500">2,200 chars max, trendy</span>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg bg-white">
                    <div className="text-sm text-gray-900 leading-relaxed">
                      {captions.tiktok}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Conversation Modal */}
      {showConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-sm border w-full max-w-lg h-96 flex flex-col">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Chat</h3>
              <button 
                onClick={() => setShowConversation(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 p-3 overflow-y-auto">
              {/* Background Words Display */}
              {backgroundWords.length > 0 && (
                <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
                  <div className="text-gray-500 mb-1">Related concepts:</div>
                  <div className="flex flex-wrap gap-1">
                    {backgroundWords.map((word, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-white text-gray-600 rounded text-xs"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Conversation Messages */}
              <div className="space-y-2 mb-3">
                {conversation.length === 0 && !isConversationLoading ? (
                  <div className="text-center text-gray-400 py-6">
                    <p className="text-sm">Ready to chat about your ideas</p>
                  </div>
                ) : (
                  <>
                    {conversation.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <p className="text-xs">{message.content}</p>
                        </div>
                      </div>
                    ))}
                    
                    {isConversationLoading && (
                      <div className="flex justify-start">
                        <div className="max-w-xs px-3 py-2 rounded-lg bg-gray-100 text-gray-800">
                          <div className="flex items-center space-x-1">
                            <div className="animate-pulse">💭</div>
                            <span className="text-xs">thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {/* Conversation Input */}
            <div className="p-3 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={conversationInput}
                  onChange={(e) => setConversationInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-400"
                  disabled={isConversationLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!conversationInput.trim() || isConversationLoading}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}