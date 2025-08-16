import { JournalEntry } from './database'

export interface NoteCardProps {
  note: JournalEntry
  onClick: (id: string) => void
}

export interface NotesListProps {
  notes: JournalEntry[]
  onNoteClick: (id: string) => void
}

export type SortOption = 'newest' | 'oldest' | 'title'
export type FilterOption = 'all' | 'recent' | 'favorites'

export interface DashboardFilters {
  sort: SortOption
  filter: FilterOption
  search: string
}