import React from 'react'

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
        className="w-full p-0 border-none text-2xl font-bold mb-4 input-common font-apple"
        autoFocus
      />
      
      {/* Content Textarea */}
      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder=""
        className="w-full min-h-[70vh] p-0 border-none resize-none text-base leading-relaxed input-common font-apple"
      />
    </div>
  )
}