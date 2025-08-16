import React from 'react'
import { Edit3, Instagram, Facebook, Linkedin, Youtube, Twitter } from 'lucide-react'
import { ContentStates, GenerationStates } from '../../types/noteEditor'

// Platform-specific configurations for social media caption generation
const PLATFORM_CONFIGS = {
  instagram: { 
    name: 'Instagram', 
    maxChars: 2200, 
    description: 'more relatable' 
  },
  linkedin: { 
    name: 'LinkedIn', 
    maxChars: 3000, 
    description: 'professional' 
  },
  x: { 
    name: 'X (Twitter)', 
    maxChars: 280, 
    description: 'concise' 
  },
  tiktok: { 
    name: 'TikTok', 
    maxChars: 2200, 
    description: 'trendy' 
  }
}

interface CaptionsModeProps {
  title: string
  content: string
  contentStates: ContentStates
  generationStates: GenerationStates
  onGenerateFirstCaption: () => void
}

export const CaptionsMode: React.FC<CaptionsModeProps> = ({
  title,
  content,
  contentStates,
  generationStates,
  onGenerateFirstCaption,
}) => {
  const hasAnyCaptions = contentStates.captions.instagram || contentStates.captions.linkedin || contentStates.captions.x || contentStates.captions.tiktok

  return (
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

      {!hasAnyCaptions ? (
        // Repurpose button (initial state)
        <div className="flex justify-center mb-8">
          <button
            onClick={onGenerateFirstCaption}
            disabled={generationStates.captions || !title.trim() && !content.trim()}
            className="flex items-center gap-2 text-sm px-6 py-3 btn-primary"
          >
            <Edit3 className="w-4 h-4" />
            {generationStates.captions ? 'Repurposing...' : 'Repurpose for socials'}
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
          {contentStates.captions.instagram && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Instagram className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-900">{PLATFORM_CONFIGS.instagram.name}</span>
                <span className="text-xs text-gray-500">{PLATFORM_CONFIGS.instagram.maxChars} chars max, {PLATFORM_CONFIGS.instagram.description}</span>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <div className="text-sm text-gray-900 leading-relaxed">{contentStates.captions.instagram}</div>
              </div>
            </div>
          )}

          {/* LinkedIn Caption */}
          {contentStates.captions.linkedin && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-900">{PLATFORM_CONFIGS.linkedin.name}</span>
                <span className="text-xs text-gray-500">{PLATFORM_CONFIGS.linkedin.maxChars} chars max, {PLATFORM_CONFIGS.linkedin.description}</span>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <div className="text-sm text-gray-900 leading-relaxed">{contentStates.captions.linkedin}</div>
              </div>
            </div>
          )}

          {/* X/Twitter Caption */}
          {contentStates.captions.x && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Twitter className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-900">{PLATFORM_CONFIGS.x.name}</span>
                <span className="text-xs text-gray-500">{PLATFORM_CONFIGS.x.maxChars} chars max, {PLATFORM_CONFIGS.x.description}</span>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <div className="text-sm text-gray-900 leading-relaxed">{contentStates.captions.x}</div>
              </div>
            </div>
          )}

          {/* TikTok Caption */}
          {contentStates.captions.tiktok && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-600 rounded-sm" />
                <span className="text-sm font-medium text-gray-900">{PLATFORM_CONFIGS.tiktok.name}</span>
                <span className="text-xs text-gray-500">{PLATFORM_CONFIGS.tiktok.maxChars} chars max, {PLATFORM_CONFIGS.tiktok.description}</span>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <div className="text-sm text-gray-900 leading-relaxed">{contentStates.captions.tiktok}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}