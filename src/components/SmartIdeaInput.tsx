'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Brain, Lightbulb, Bell } from 'lucide-react'

interface SmartIdeaInputProps {
  user: User
  onIdeaSaved: () => void
}


export default function SmartIdeaInput({ user, onIdeaSaved }: SmartIdeaInputProps) {
  const [content, setContent] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [sparks, setSparks] = useState<string[]>([])
  const [sparkHistory, setSparkHistory] = useState<string[]>([])
  const [backgroundWords, setBackgroundWords] = useState<string[]>([])
  const [backgroundWordHistory, setBackgroundWordHistory] = useState<string[]>([])
  const [hasNewBackgroundWords, setHasNewBackgroundWords] = useState(false)
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false)
  const [showConversation, setShowConversation] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const backgroundTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastAnalyzedContent = useRef('')
  const lastBackgroundContent = useRef('')
  const backgroundCharThreshold = useRef(0)

  // Detect typing and trigger analysis after pause
  const handleContentChange = useCallback((value: string) => {
    setContent(value)
    setIsTyping(true)
    
    // Clear existing timeouts
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current)
    }
    if (backgroundTimeoutRef.current) {
      clearTimeout(backgroundTimeoutRef.current)
    }
    
    // Stop typing indicator after 1 second
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 1000)
    
    // Analyze content after 2 seconds of no typing (if content changed)
    if (value.trim().length > 30) {
      const contentChanged = Math.abs(value.length - lastAnalyzedContent.current.length) > 15 || 
                             !lastAnalyzedContent.current || 
                             value.toLowerCase() !== lastAnalyzedContent.current.toLowerCase()
      
      if (contentChanged) {
        analysisTimeoutRef.current = setTimeout(() => {
          analyzeContent(value)
          lastAnalyzedContent.current = value
        }, 2000)
      }
    }
    
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

  const analyzeContent = async (text: string) => {
    if (!text.trim() || text.length < 30) return
    
    console.log('=== Client Debug Start ===')
    setIsAnalyzing(true)
    // Clear old sparks immediately to show change is happening
    setSparks([])
    
    try {
      // Use sliding window approach for content analysis
      const recentContent = getRecentContent(text, lastAnalyzedContent.current)
      console.log('1. Content for analysis:', {
        originalLength: text.length,
        recentContentLength: recentContent.length,
        sparkHistoryLength: sparkHistory.length,
        lastSixSparks: sparkHistory.slice(-6)
      })
      
      const requestBody = { 
        content: recentContent,
        questionHistory: sparkHistory.slice(-6) // Last 6 sparks for context
      }
      console.log('2. Request payload:', requestBody)
      
      console.log('3. Making fetch request...')
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('4. Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('5. Response not ok:', errorText)
        throw new Error(`Failed to analyze content: ${response.status} ${response.statusText}`)
      }

      console.log('6. Parsing response JSON...')
      const data = await response.json()
      console.log('7. Response data:', data)
      
      if (data.questions && Array.isArray(data.questions)) {
        console.log('8. Valid sparks received:', data.questions)
        // Add to spark history to avoid repetition
        setSparkHistory(prev => [...prev, ...data.questions].slice(-10)) // Keep last 10
        
        // Add a small delay to make the change more noticeable
        setTimeout(() => {
          setSparks(data.questions)
          console.log('9. Sparks set in state')
        }, 500)
      } else {
        console.log('8. Invalid sparks format:', data)
      }
    } catch (error) {
      console.error('=== Client Error ===')
      console.error('Error type:', error?.constructor?.name)
      console.error('Error message:', error instanceof Error ? error.message : String(error))
      console.error('Full error:', error)
      console.error('=== End Client Error ===')
      
      // Fallback spark ideas if API fails
      setSparks([
        "patterns",
        "timing", 
        "perspective"
      ])
    } finally {
      setIsAnalyzing(false)
      console.log('=== Client Debug End ===')
    }
  }



  const saveIdea = async () => {
    if (!content.trim()) return

    setIsSaving(true)
    
    // Combine the original idea with spark ideas
    const fullContent = [
      content,
      sparks.length > 0 ? '\n\n--- Spark Ideas ---' : '',
      ...sparks.map(q => `• ${q}`)
    ].filter(Boolean).join('\n')

    const { error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        type: 'idea',
        content: fullContent,
        title: content.substring(0, 50) + (content.length > 50 ? '...' : '')
      })

    if (!error) {
      setContent('')
      setSparks([])
      setSparkHistory([])
      lastAnalyzedContent.current = ''
      onIdeaSaved()
    }
    setIsSaving(false)
  }

  // Handle notification click to open conversation
  const handleNotificationClick = () => {
    setHasNewBackgroundWords(false)
    setShowConversation(true)
  }

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current)
      if (backgroundTimeoutRef.current) clearTimeout(backgroundTimeoutRef.current)
    }
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-purple-500" />
        <h2 className="text-xl font-semibold">Idea Explorer</h2>
        
        {/* Notification Badge */}
        {hasNewBackgroundWords && (
          <div 
            onClick={handleNotificationClick}
            className="relative cursor-pointer group"
          >
            <Bell className="w-5 h-5 text-orange-500 animate-pulse hover:text-orange-600 transition-colors" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              New insights ready!
            </div>
          </div>
        )}
        
        {isGeneratingBackground && (
          <div className="flex items-center gap-1 text-sm text-orange-500">
            <div className="animate-spin">🔍</div>
            <span>Discovering insights...</span>
          </div>
        )}
        
        {isAnalyzing && (
          <div className="flex items-center gap-1 text-sm text-purple-500">
            <div className="animate-pulse">🧠</div>
            <span>AI is generating spark ideas...</span>
          </div>
        )}
        {isTyping && (
          <div className="text-sm text-gray-500">
            <span className="animate-pulse">✍️ Typing...</span>
          </div>
        )}
      </div>
      
      <textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="Write your thoughts, ideas, or observations here... AI will generate related words and concepts to spark new thinking."
        className="w-full h-32 p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
      
      {/* Spark Ideas */}
      {sparks.length > 0 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-semibold text-purple-700">Spark Ideas</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {sparks.map((spark, index) => (
              <div
                key={index}
                className="px-3 py-2 bg-white rounded-full shadow-sm border border-purple-200 hover:border-purple-300 transition-colors"
              >
                <p className="text-sm text-gray-700 font-medium">{spark}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <button
        onClick={saveIdea}
        disabled={!content.trim() || isSaving}
        className="mt-4 flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-600 hover:to-blue-600 transition-all"
      >
        <Lightbulb className="w-4 h-4" />
        {isSaving ? 'Saving...' : 'Save Idea & Sparks'}
      </button>
      
      {/* Conversation Modal */}
      {showConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-3/4 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Conversation with AI</h3>
              <button 
                onClick={() => setShowConversation(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              {/* Background Words Display */}
              {backgroundWords.length > 0 && (
                <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="text-sm font-semibold text-orange-700 mb-2">Research Ideas</h4>
                  <div className="flex flex-wrap gap-2">
                    {backgroundWords.map((word, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-center text-gray-500 mt-8">
                <p>Conversation interface coming soon!</p>
                <p className="text-sm mt-2">This will let you chat with AI about your thoughts for better clarity and perspective.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}