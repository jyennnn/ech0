import { supabase } from '@/utils/supabase/client'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {

  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      console.log('No ID provided')
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
    }

    console.log('Attempting to delete note with ID:', id)

    // Delete the note from the database
    const { data, error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)
      .select()

    console.log('Supabase response:', { data, error })

    if (error) {
      console.error('Failed to delete note:', error)
      return NextResponse.json({ error: 'Failed to delete note', details: error }, { status: 500 })
    }

    console.log('Delete successful')
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Note delete API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}