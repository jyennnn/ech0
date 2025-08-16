import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface JournalEntry {
  id: string
  created_at: string
  type: string
  title: string | null
  content: string
  tags: string[] | null
}

interface NoteCardProps {
  note: JournalEntry
  onClick: (noteId: string) => void
}

export default function NoteCard({ note, onClick }: NoteCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:bg-gray-50/50 transition-colors border-0 border-b border-gray-150 shadow-none bg-transparent py-4 rounded-none"
      onClick={() => onClick(note.id)}
    >
      <CardContent className="px-0 py-0">
        <div className="space-y-1">
          <CardTitle className="text-gray-900 text-md font-normal leading-tight">
            {note.title || 'Untitled Note'}
          </CardTitle>
          <div className="flex items-start gap-2">
            <span className="text-xs text-gray-400 font-medium flex-shrink-0">
              {new Date(note.created_at).toLocaleDateString('en-US', { 
                month: '2-digit', 
                day: '2-digit'
              })}
            </span>
            <div className="text-sm text-gray-500 leading-relaxed">
              {note.content.substring(0, 80)}
              {note.content.length > 80 ? '...' : ''}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}