import React from 'react'
import Header from './layout/Header'

interface JournalEntry {
  id: string
  created_at: string
  type: string
  title: string | null
  content: string
  tags: string[] | null
}

interface NotesListProps {
  notes: JournalEntry[]
  onCreateNote: () => void
  onEditNote: (noteId: string) => void
}

export default function NotesList({ notes, onCreateNote, onEditNote }: NotesListProps) {
  return (
    <div>

        <Header onCreateNote={onCreateNote} />

        {/* Simple Notes List */}
        <div className="px-4">
          {notes.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="mb-4">No notes yet.</p>
              <button
                onClick={onCreateNote}
                className="text-blue-500 hover:text-blue-600 text-sm"
              >
                Create your first note
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => onEditNote(note.id)}
                  className="cursor-pointer hover:bg-gray-50 rounded-lg p-4 transition-colors border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-gray-900 font-medium text-base leading-tight">
                      {note.title || 'Untitled Note'}
                    </h3>
                    <span className="text-xs text-gray-400 ml-4 flex-shrink-0">
                      {new Date(note.created_at).toLocaleDateString('en-US', { 
                        month: '2-digit', 
                        day: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 line-clamp-2">
                    {note.content.substring(0, 120)}
                    {note.content.length > 120 ? '...' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </div>
  )
}