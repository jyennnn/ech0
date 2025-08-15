import { supabase } from '@/utils/supabase/client'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, content, title } = body

    if (!id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
    }

    // Update the note in the database
    const { error } = await supabase
      .from('journal_entries')
      .update({
        content: content || '',
        title: title || ''
      })
      .eq('id', id)

    if (error) {
      console.error('Failed to save note:', error)
      return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Note save API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}