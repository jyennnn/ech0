export interface JournalEntry {
  id: string
  created_at: string
  type: string
  title: string | null
  content: string
  tags: string[] | null
}

export interface NoteEditorProps {
  existingNote?: JournalEntry
}

export interface Captions {
  instagram: string
  linkedin: string
  x: string
  tiktok: string
}

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'
export type Mode = 'notes' | 'script' | 'captions'

export interface GenerationStates {
  script: boolean
  visualNotes: boolean
  captions: boolean
}

export interface ContentStates {
  script: string
  videoType: string
  captions: Captions
}