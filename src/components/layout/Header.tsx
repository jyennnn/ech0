import React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  onCreateNote: () => void
  title?: string
}

export default function Header({ onCreateNote, title = "Notes" }: HeaderProps) {
  return (
    <div className="flex justify-between items-center px-4 py-2 mb-4">
      <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      <div className="flex gap-2">
        <Button
          onClick={onCreateNote}
          size="icon"
          variant="default"
          className="rounded-full"
          title="Create new note"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}