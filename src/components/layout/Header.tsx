import React from 'react'
import { Plus } from 'lucide-react'

interface HeaderProps {
  onCreateNote: () => void
  title?: string
}

export default function Header({ onCreateNote, title = "Notes" }: HeaderProps) {
  return (
    <div className="flex justify-between items-center px-4 py-2 mb-4">
      <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      <div className="flex gap-2">
        <button
          onClick={onCreateNote}
          className="w-8 h-8 bg-gray-700 hover:bg-gray-800 rounded-full flex items-center justify-center transition-colors"
          title="Create new note"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  )
}