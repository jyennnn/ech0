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
    const { id, ids } = body

    if (!id && !ids) {
      return NextResponse.json({ error: 'Note ID or IDs are required' }, { status: 400 })
    }

    // Handle single delete
    if (id) {
      const { data, error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)
        .select()

      if (error) {
        return NextResponse.json({ error: 'Failed to delete note', details: error }, { status: 500 })
      }

      return NextResponse.json({ success: true, data })
    }

    // Handle bulk delete
    if (ids && Array.isArray(ids)) {
      const { data, error } = await supabase
        .from('journal_entries')
        .delete()
        .in('id', ids)
        .select()

      if (error) {
        return NextResponse.json({ error: 'Failed to delete notes', details: error }, { status: 500 })
      }

      return NextResponse.json({ success: true, data, deleted_count: data.length })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}