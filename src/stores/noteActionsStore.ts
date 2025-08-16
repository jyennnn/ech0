import { create } from 'zustand'

interface NoteActions {
  onSave?: (title: string, content: string) => Promise<void>
  onDelete?: () => Promise<void>
  saveStatus?: 'saved' | 'saving' | 'unsaved' | 'error'
  title?: string
  content?: string
}

interface NoteActionsStore {
  noteActions: NoteActions | null
  setNoteActions: (actions: NoteActions | null) => void
  clearNoteActions: () => void
}

export const useNoteActionsStore = create<NoteActionsStore>((set) => ({
  noteActions: null,
  setNoteActions: (actions) => set({ noteActions: actions }),
  clearNoteActions: () => set({ noteActions: null }),
}))