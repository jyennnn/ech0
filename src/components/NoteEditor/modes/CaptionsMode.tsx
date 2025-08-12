import React from 'react'
import { Edit3, Instagram, Facebook, Linkedin, Youtube, Twitter } from 'lucide-react'
import { PlatformCaption } from '../components/PlatformCaption'
import { BUTTON_CLASSES, PLATFORM_CONFIGS } from '../constants'
import { ContentStates, GenerationStates } from '../types'

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
            className={`flex items-center gap-2 text-sm px-6 py-3 ${BUTTON_CLASSES.primary}`}
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

          <PlatformCaption 
            platform="instagram" 
            caption={contentStates.captions.instagram || "No caption generated yet"} 
            config={PLATFORM_CONFIGS.instagram} 
          />
          <PlatformCaption 
            platform="linkedin" 
            caption={contentStates.captions.linkedin} 
            config={PLATFORM_CONFIGS.linkedin} 
          />
          <PlatformCaption 
            platform="x" 
            caption={contentStates.captions.x} 
            config={PLATFORM_CONFIGS.x} 
          />
          <PlatformCaption 
            platform="tiktok" 
            caption={contentStates.captions.tiktok} 
            config={PLATFORM_CONFIGS.tiktok} 
          />
        </div>
      )}
    </div>
  )
}