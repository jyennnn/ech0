import React from 'react'
import { APPLE_FONT_FAMILY, COMMON_INPUT_CLASSES } from '../constants'

interface NotesModeProps {
  title: string
  content: string
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
}

export const NotesMode: React.FC<NotesModeProps> = ({
  title,
  content,
  onTitleChange,
  onContentChange,
}) => {
  return (
    <div className="px-4 pb-20">
      {/* Title Input */}
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder=""
        className={`w-full p-0 border-none text-2xl font-bold mb-4 ${COMMON_INPUT_CLASSES}`}
        style={{ fontFamily: APPLE_FONT_FAMILY }}
        autoFocus
      />
      
      {/* Content Textarea */}
      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder=""
        className={`w-full min-h-[70vh] p-0 border-none resize-none text-base leading-relaxed ${COMMON_INPUT_CLASSES}`}
        style={{ fontFamily: APPLE_FONT_FAMILY }}
      />
    </div>
  )
}