import React from 'react'
import { ChevronDown, Edit3, Camera } from 'lucide-react'
import { APPLE_FONT_FAMILY, BUTTON_CLASSES } from '../constants'
import { ContentStates, GenerationStates } from '../types'

interface ScriptModeProps {
  title: string
  content: string
  contentStates: ContentStates
  generationStates: GenerationStates
  showScriptMenu: boolean
  onVideoTypeChange: (value: string) => void
  onGenerateFirstDraft: () => void
  onAddVisualNotes: () => void
  onToggleScriptMenu: () => void
}

export const ScriptMode: React.FC<ScriptModeProps> = ({
  title,
  content,
  contentStates,
  generationStates,
  showScriptMenu,
  onVideoTypeChange,
  onGenerateFirstDraft,
  onAddVisualNotes,
  onToggleScriptMenu,
}) => {
  return (
    <div className="px-4 pb-20">
      <div className="mb-6">
        <div className="text-sm text-gray-900 font-medium mb-2">Video type</div>
        <div className="text-xs text-gray-500 mb-2">
          Examples: "60s TikTok educational", "30s Instagram emotional story", "45s YouTube tutorial", "30s LinkedIn professional tip"
        </div>
        <textarea
          value={contentStates.videoType}
          onChange={(e) => onVideoTypeChange(e.target.value)}
          placeholder="Describe your video: platform, duration, style..."
          className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 text-sm bg-white"
          style={{ fontFamily: APPLE_FONT_FAMILY }}
          rows={3}
        />
      </div>

      {!contentStates.script && !generationStates.visualNotes ? (
        // Create first draft button
        <div className="flex justify-center mb-8">
          <button
            onClick={onGenerateFirstDraft}
            disabled={generationStates.script || !title.trim() && !content.trim()}
            className={`flex items-center gap-2 text-sm ${BUTTON_CLASSES.primary}`}
          >
            <Edit3 className="w-4 h-4" />
            {generationStates.script ? 'Creating...' : 'Create first draft'}
          </button>
        </div>
      ) : (
        // Script content with dropdown
        <div className="min-h-[70vh]">
          {/* Script Header with Dropdown */}
          <div className="mb-4 relative">
            <button
              onClick={onToggleScriptMenu}
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
                    onAddVisualNotes()
                    onToggleScriptMenu()
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
            {contentStates.script}
          </div>
        </div>
      )}
    </div>
  )
}