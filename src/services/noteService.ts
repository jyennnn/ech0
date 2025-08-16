import { createClient } from '@/utils/supabase/client'
import { JournalEntry } from '@/types/database'

export class NoteService {
  private supabase = createClient()

  async fetchAllNotes(): Promise<JournalEntry[]> {
    const { data, error } = await this.supabase
      .from('journal_entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch notes:', error)
      throw new Error('Failed to fetch notes')
    }

    return data || []
  }

  async createNote(userId: string): Promise<JournalEntry> {
    const { data, error } = await this.supabase
      .from('journal_entries')
      .insert({
        user_id: userId,
        type: 'idea',
        title: '',
        content: ''
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create note:', error)
      throw new Error('Failed to create note')
    }

    return data
  }

  async fetchNote(noteId: string): Promise<JournalEntry | null> {
    const { data, error } = await this.supabase
      .from('journal_entries')
      .select('*')
      .eq('id', noteId)
      .single()

    if (error) {
      console.error('Error fetching note:', error)
      throw new Error('Failed to fetch note')
    }

    return data
  }

  async saveNote(noteData: { id: string; title: string; content: string }): Promise<void> {
    const noteTitle = noteData.title.trim() || noteData.content.substring(0, 50) + (noteData.content.length > 50 ? '...' : '')
    
    const response = await fetch('/api/note-save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: noteData.id,
        content: noteData.content,
        title: noteTitle
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to save note')
    }
  }

  async deleteNote(noteId: string, accessToken: string): Promise<void> {
    const response = await fetch('/api/note-delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ id: noteId }),
    })

    if (!response.ok) {
      let msg = 'Failed to delete note.'
      try {
        const err = await response.json()
        msg = err?.error || JSON.stringify(err)
      } catch {
        msg = await response.text()
      }
      console.error('Delete failed:', response.status, msg)
      throw new Error(msg)
    }
  }

  saveNoteWithBeacon(noteData: { id: string; title: string; content: string }): void {
    const noteTitle = noteData.title.trim() || noteData.content.substring(0, 50) + (noteData.content.length > 50 ? '...' : '')
    const payload = JSON.stringify({
      id: noteData.id,
      content: noteData.content,
      title: noteTitle
    })
    
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/note-save', payload)
    } else {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/note-save', false)
      xhr.setRequestHeader('Content-Type', 'application/json')
      xhr.send(payload)
    }
  }
}

export const noteService = new NoteService()