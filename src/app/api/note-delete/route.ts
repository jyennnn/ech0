import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()

  try {
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
    }

    // Delete the note from the database (RLS policy will ensure user can only delete their own notes)
    const { data, error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json({ error: 'Failed to delete note', details: error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}