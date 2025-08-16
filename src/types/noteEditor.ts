import { User } from '@supabase/supabase-js'
import { JournalEntry } from './database'

export interface NoteEditorProps {
  user: User
  existingNote?: JournalEntry
}

export interface Captions {
  instagram: string
  linkedin: string
  x: string
  tiktok: string
}

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