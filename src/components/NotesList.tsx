'use client'

import React, { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { LogOut, Plus, Menu, Search, MoreHorizontal, ChevronDown, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface JournalEntry {
  id: string
  created_at: string
  type: string
  title: string | null
  content: string
  tags: string[] | null
}

interface NotesGroup {
  title: string
  notes: JournalEntry[]
  isExpanded: boolean
}

interface NotesListProps {
  user: User
}

export default function NotesList({ user }: NotesListProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [groupedNotes, setGroupedNotes] = useState<NotesGroup[]>([])
  const router = useRouter()

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setEntries(data)
      groupNotesByContent(data)
    }
  }

  const groupNotesByContent = (notes: JournalEntry[]) => {
    // Group notes by extracting potential series names or keywords
    const groups: { [key: string]: JournalEntry[] } = {}
    
    notes.forEach(note => {
      // Try to extract a series name from the content (look for patterns like "part 1", "series", etc.)
      const content = note.content.toLowerCase()
      let groupName = 'Other Ideas'
      
      // Check for series patterns
      if (content.includes('changmakr') || content.includes('changemaker')) {
        groupName = 'Changmakrs series'
      } else if (content.includes('part ') && (content.includes('series') || content.includes('-'))) {
        // Extract series name from content
        const lines = note.content.split('\n')
        const firstLine = lines[0] || note.content.substring(0, 50)
        if (firstLine.length > 10) {
          groupName = firstLine.substring(0, 30) + (firstLine.length > 30 ? '...' : '')
        }
      } else if (note.title && note.title.includes('series')) {
        groupName = note.title
      }
      
      if (!groups[groupName]) {
        groups[groupName] = []
      }
      groups[groupName].push(note)
    })
    
    // Convert to array and set default expanded state
    const groupedArray: NotesGroup[] = Object.entries(groups).map(([title, notes]) => ({
      title,
      notes,
      isExpanded: title === 'Changmakrs series' // Expand the main series by default
    }))
    
    setGroupedNotes(groupedArray)
  }

  const toggleGroup = (groupIndex: number) => {
    setGroupedNotes(prev => 
      prev.map((group, index) => 
        index === groupIndex 
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    )
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const handleCreateNote = () => {
    router.push('/note/new')
  }

  const handleEditNote = (noteId: string) => {
    router.push(`/note/${noteId}`)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto">
        {/* Top Navigation Bar */}
        <div className="flex justify-between items-center px-4 py-3">
          <button className="p-2 hover:bg-gray-100 rounded-md">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-md">
              <Search className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={signOut}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Ideas Header */}
        <div className="flex justify-between items-center px-4 py-2 mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Ideas</h1>
          <button
            onClick={handleCreateNote}
            className="w-8 h-8 bg-gray-700 hover:bg-gray-800 rounded-full flex items-center justify-center transition-colors"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Grouped Notes List */}
        <div className="px-4">
          {groupedNotes.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="mb-4">No ideas yet.</p>
              <button
                onClick={handleCreateNote}
                className="text-blue-500 hover:text-blue-600 text-sm"
              >
                Create your first idea
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedNotes.map((group, groupIndex) => (
                <div key={group.title} className="space-y-2">
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(groupIndex)}
                    className="w-full flex items-center justify-between py-2 hover:bg-gray-50 rounded-md transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📝</span>
                      <span className="text-gray-900 font-medium">{group.title}</span>
                    </div>
                    {group.isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    )}
                  </button>

                  {/* Group Notes */}
                  {group.isExpanded && (
                    <div className="ml-6 space-y-3">
                      {group.notes.map((note) => (
                        <div
                          key={note.id}
                          onClick={() => handleEditNote(note.id)}
                          className="cursor-pointer hover:bg-gray-50 rounded-lg p-3 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-gray-900 font-medium text-sm leading-tight">
                              {note.content.split('\n')[0].substring(0, 60)}
                              {note.content.split('\n')[0].length > 60 ? '...' : ''}
                            </h3>
                          </div>
                          <div className="text-xs text-gray-400 mb-2">
                            {new Date(note.created_at).toLocaleDateString('en-US', { 
                              month: '2-digit', 
                              day: '2-digit'
                            })} {note.content.length > 50 ? note.content.substring(50, 100) + '...' : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}