export interface JournalEntry {
  id: string
  created_at: string
  type: string
  title: string | null
  content: string
  tags: string[] | null
}