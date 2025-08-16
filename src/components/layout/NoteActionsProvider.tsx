'use client'

import React, { createContext, useContext, ReactNode } from 'react'

interface NoteActions {
  onSave?: (title: string, content: string) => Promise<void>
  onDelete?: () => Promise<void>
  saveStatus?: 'saved' | 'saving' | 'unsaved' | 'error'
  title?: string
  content?: string
}

const NoteActionsContext = createContext<NoteActions | null>(null)

export function NoteActionsProvider({ 
  children, 
  noteActions 
}: { 
  children: ReactNode
  noteActions: NoteActions 
}) {
  return (
    <NoteActionsContext.Provider value={noteActions}>
      {children}
    </NoteActionsContext.Provider>
  )
}

export function useNoteActions() {
  return useContext(NoteActionsContext)
}