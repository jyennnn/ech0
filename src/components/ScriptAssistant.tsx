'use client'

import React, { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { X, Wand2, Copy, Edit3, Check, Clock, PlayCircle } from 'lucide-react'

interface ScriptAssistantProps {
  user: User
  content: string
  onClose: () => void
}

export default function ScriptAssistant({ user, content, onClose }: ScriptAssistantProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'drafts'>('create')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedScript, setGeneratedScript] = useState('')
  const [currentScript, setCurrentScript] = useState('')
  const [scriptStatus, setScriptStatus] = useState<'draft' | 'ready_for_production' | 'done'>('draft')

  const generateInitialScript = async () => {
    if (!content.trim() || content.length < 30) {
      alert('Please write more content in your note before generating a script.')
      return
    }

    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/ai/script-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.script) {
          setGeneratedScript(data.script)
          setCurrentScript(data.script)
        }
      } else {
        alert('Failed to generate script. Please try again.')
      }
    } catch (error) {
      console.error('Script generation failed:', error)
      alert('Failed to generate script. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const duplicateScript = () => {
    // Create a copy of current script for editing
    setCurrentScript(generatedScript)
    setScriptStatus('draft')
  }

  const updateScriptStatus = (newStatus: 'draft' | 'ready_for_production' | 'done') => {
    setScriptStatus(newStatus)
    // TODO: Save to database
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit3 className="w-4 h-4 text-gray-500" />
      case 'ready_for_production':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'done':
        return <Check className="w-4 h-4 text-green-500" />
      default:
        return <Edit3 className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'text-gray-600 bg-gray-100'
      case 'ready_for_production':
        return 'text-blue-600 bg-blue-100'
      case 'done':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wand2 className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900">Script Assistant</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'create'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Create Script
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'drafts'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Drafts
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'create' && (
            <div className="h-full flex">
              {/* Left Panel - Generate */}
              <div className="w-1/2 p-6 border-r border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Generate Script from Your Idea
                </h3>
                
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Your note content:</p>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {content.length > 200 ? content.substring(0, 200) + '...' : content}
                  </p>
                </div>

                {!generatedScript ? (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      AI will create a viral video script based on your idea with:
                    </p>
                    <ul className="text-sm text-gray-500 mb-6 space-y-1 text-left">
                      <li>• Viral hook to stop scrolling</li>
                      <li>• 30-60 second structure</li>
                      <li>• Intimate, personal tone</li>
                      <li>• Clear value for viewers</li>
                      <li>• Emotional pacing cues</li>
                    </ul>
                    <button
                      onClick={generateInitialScript}
                      disabled={isGenerating}
                      className="flex items-center gap-2 bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
                    >
                      <Wand2 className="w-4 h-4" />
                      {isGenerating ? 'Generating Script...' : 'Generate Initial Script'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Generated Script</h4>
                      <button
                        onClick={duplicateScript}
                        className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
                      >
                        <Copy className="w-3 h-3" />
                        Duplicate
                      </button>
                    </div>
                    <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg leading-relaxed whitespace-pre-wrap">
                      {generatedScript}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel - Edit */}
              <div className="w-1/2 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Edit Script</h3>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(scriptStatus)}
                    <select
                      value={scriptStatus}
                      onChange={(e) => updateScriptStatus(e.target.value as 'draft' | 'ready_for_production' | 'done')}
                      className={`text-xs px-2 py-1 rounded-full border-none focus:outline-none ${getStatusColor(scriptStatus)}`}
                    >
                      <option value="draft">Draft</option>
                      <option value="ready_for_production">Ready for Production</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>

                {currentScript ? (
                  <textarea
                    value={currentScript}
                    onChange={(e) => setCurrentScript(e.target.value)}
                    className="w-full h-[400px] p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm leading-relaxed"
                    placeholder="Edit your script here..."
                  />
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                    <div className="text-center">
                      <PlayCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Generate a script to start editing</p>
                    </div>
                  </div>
                )}

                {currentScript && (
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                      Save Draft
                    </button>
                    <button className="flex-1 bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors text-sm">
                      Save & Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'drafts' && (
            <div className="p-6">
              <div className="text-center py-12 text-gray-400">
                <PlayCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No scripts yet.</p>
                <p className="text-sm mt-2">Create your first script to see it here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}