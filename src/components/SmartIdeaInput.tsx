'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Brain, Lightbulb, Bell, Send } from 'lucide-react'

interface SmartIdeaInputProps {
  user: User
  onIdeaSaved: () => void
}


export default function SmartIdeaInput({ user, onIdeaSaved }: SmartIdeaInputProps) {
  const [content, setContent] = useState('')
  const [backgroundWords, setBackgroundWords] = useState<string[]>([])
  const [backgroundWordHistory, setBackgroundWordHistory] = useState<string[]>([])
  const [hasNewBackgroundWords, setHasNewBackgroundWords] = useState(false)
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false)
  const [showConversation, setShowConversation] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [conversation, setConversation] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [conversationInput, setConversationInput] = useState('')
  const [isConversationLoading, setIsConversationLoading] = useState(false)
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
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




  const saveIdea = async () => {
    if (!content.trim()) return

    setIsSaving(true)
    
    const fullContent = content

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
      lastAnalyzedContent.current = ''
      onIdeaSaved()
    }
    setIsSaving(false)
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

  // Cleanup timeouts  
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      if (backgroundTimeoutRef.current) clearTimeout(backgroundTimeoutRef.current)
    }
  }, [])

  return (
    <div className="border-b border-gray-100 pb-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        {/* Minimal notification badge */}
        <div className="flex-1"></div>
        {hasNewBackgroundWords && (
          <button 
            onClick={handleNotificationClick}
            className="w-2 h-2 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors"
            title="New insights ready"
          />
        )}
      </div>
      
      <textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full h-24 p-0 border-none resize-none focus:outline-none text-lg placeholder-gray-400"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
      />
      
      
      {content.trim() && (
        <button
          onClick={saveIdea}
          disabled={isSaving}
          className="mt-2 text-blue-500 hover:text-blue-600 text-sm disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
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