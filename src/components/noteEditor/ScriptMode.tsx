import React, { useState, useRef, useCallback } from 'react'
import { ChevronDown, Edit3, Camera } from 'lucide-react'
import { aiService } from '@/services/aiService'
import { useVisualNotes } from '@/hooks/useVisualNotes'
import { ContentStates, GenerationStates } from '@/types/noteEditor'
import { toast } from 'sonner'

interface ScriptModeProps {
  title: string
  content: string
}

export const ScriptMode: React.FC<ScriptModeProps> = ({
  title,
  content,
}) => {
  // Local state for script functionality
  const [script, setScript] = useState('')
  const [videoType, setVideoType] = useState('30-45s instagram video, emotional and relatable script')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingVisualNotes, setIsGeneratingVisualNotes] = useState(false)
  const [showScriptMenu, setShowScriptMenu] = useState(false)
  
  const scriptTextareaRef = useRef<HTMLTextAreaElement>(null!)
  
  // Visual notes hook - create mock setters for compatibility
  const mockSetContentStates = useCallback((updater: React.SetStateAction<ContentStates>) => {
    if (typeof updater === 'function') {
      const currentState: ContentStates = { script, videoType, captions: { instagram: '', linkedin: '', x: '', tiktok: '' } }
      const newState = updater(currentState)
      if (newState.script !== script) {
        setScript(newState.script)
      }
    } else if (updater.script) {
      setScript(updater.script)
    }
  }, [script, videoType])

  const mockSetGenerationStates = useCallback((updater: React.SetStateAction<GenerationStates>) => {
    if (typeof updater === 'function') {
      const currentState: GenerationStates = { script: false, visualNotes: isGeneratingVisualNotes, captions: false }
      const newState = updater(currentState)
      setIsGeneratingVisualNotes(newState.visualNotes || false)
    } else if (updater.visualNotes !== undefined) {
      setIsGeneratingVisualNotes(updater.visualNotes)
    }
  }, [isGeneratingVisualNotes])

  const { addVisualNotes } = useVisualNotes(scriptTextareaRef, mockSetContentStates, mockSetGenerationStates)

  const generateScript = async () => {
    const fullContent = (title.trim() ? title + '\n\n' + content : content).trim()
    if (fullContent.length < 30) {
      toast.error('Please write more content in notes mode before generating a script.')
      return
    }

    setIsGenerating(true)
    
    try {
      const generatedScript = await aiService.generateScript(fullContent, videoType)
      setScript(generatedScript)
      toast.success('Script generated successfully!')
    } catch (error) {
      console.error('Script generation failed:', error)
      toast.error('Failed to generate script. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddVisualNotes = () => {
    if (!script.trim()) {
      toast.error('Generate a script first before adding visual notes.')
      return
    }
    addVisualNotes(script)
    setShowScriptMenu(false)
  }
  return (
    <div className="px-4 pb-20">
      <div className="mb-6">
        <div className="text-sm text-gray-900 font-medium mb-2">Video type</div>
        <div className="text-xs text-gray-500 mb-2">
          Examples: &quot;60s TikTok educational&quot;, &quot;30s Instagram emotional story&quot;, &quot;45s YouTube tutorial&quot;, &quot;30s LinkedIn professional tip&quot;
        </div>
        <textarea
          value={videoType}
          onChange={(e) => setVideoType(e.target.value)}
          placeholder="Describe your video: platform, duration, style..."
          className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 text-sm bg-white font-apple"
          rows={3}
        />
      </div>

      {!script && !isGeneratingVisualNotes ? (
        // Create first draft button
        <div className="flex justify-center mb-8">
          <button
            onClick={generateScript}
            disabled={isGenerating || (!title.trim() && !content.trim())}
            className="flex items-center gap-2 text-sm btn-primary"
          >
            <Edit3 className="w-4 h-4" />
            {isGenerating ? 'Creating...' : 'Create first draft'}
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
                  onClick={handleAddVisualNotes}
                  className="w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Generate Visual Cues
                </button>
              </div>
            )}
          </div>

          {/* Script Content */}
          <textarea 
            ref={scriptTextareaRef}
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="w-full min-h-[60vh] p-0 border-none resize-none text-gray-900 text-base leading-relaxed whitespace-pre-wrap bg-transparent"
            style={{ outline: 'none' }}
          />
        </div>
      )}
    </div>
  )
}