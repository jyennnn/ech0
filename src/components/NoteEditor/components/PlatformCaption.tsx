import React from 'react'
import { Instagram, Linkedin, Twitter } from 'lucide-react'

interface PlatformCaptionProps {
  platform: string
  caption: string
  config: {
    name: string
    maxChars: number
    description: string
  }
}

export const PlatformCaption: React.FC<PlatformCaptionProps> = ({ platform, caption, config }) => {
  if (!caption) return null
  
  const IconComponent = {
    instagram: Instagram,
    linkedin: Linkedin,
    x: Twitter,
    tiktok: () => <div className="w-4 h-4 bg-gray-600 rounded-sm" />
  }[platform] || (() => null)
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <IconComponent className="w-4 h-4" />
        <span className="text-sm font-medium text-gray-900">{config.name}</span>
        <span className="text-xs text-gray-500">{config.maxChars} chars max, {config.description}</span>
      </div>
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <div className="text-sm text-gray-900 leading-relaxed">{caption}</div>
      </div>
    </div>
  )
}