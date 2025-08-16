'use client'

import React, { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, Search, MoreHorizontal, Bell, ArrowLeft, Trash2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useNoteActions } from './NoteActionsProvider'

interface NavbarProps {
  onMenuClick?: () => void
  onSearchClick?: () => void
}

export default function Navbar({ onMenuClick, onSearchClick }: NavbarProps) {
  const supabase = createClient()
  const pathname = usePathname()
  const router = useRouter()
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const noteActions = useNoteActions()
  
  const isNotePage = pathname?.includes('/note/')

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const handleBackToNotes = async () => {
    if (noteActions?.onSave && noteActions.title !== undefined && noteActions.content !== undefined) {
      await noteActions.onSave(noteActions.title, noteActions.content)
    }
    router.push('/dashboard')
  }

  const handleDelete = async () => {
    if (noteActions?.onDelete) {
      setShowMoreMenu(false)
      await noteActions.onDelete()
    }
  }

  if (isNotePage) {
    // Note-specific navigation
    return (
      <div className="flex justify-between items-center px-4 py-3">
        <button 
          onClick={handleBackToNotes}
          className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
          <span className="text-sm text-gray-600">Notes</span>
        </button>
        <div className="flex items-center gap-3">
          {/* Save Status */}
          {noteActions?.saveStatus === 'error' && (
            <div className="flex items-center gap-1 text-red-600">
              <div className="w-2 h-2 bg-red-600 rounded-full"></div>
              <button 
                onClick={() => noteActions.onSave?.(noteActions.title || '', noteActions.content || '')}
                className="text-xs underline hover:no-underline"
              >
                Retry save
              </button>
            </div>
          )}
          
          <button className="p-2 hover:bg-gray-100 rounded-md">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-md">
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          <div className="relative" data-menu="more">
            <button 
              className="p-2 hover:bg-gray-100 rounded-md"
              onClick={(e) => {
                e.stopPropagation()
                setShowMoreMenu(!showMoreMenu)
              }}
            >
              <MoreHorizontal className="w-5 h-5 text-gray-600" />
            </button>
            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50 overflow-visible">
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-md"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete note
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Default dashboard navigation
  return (
    <div className="flex justify-between items-center px-4 py-3">
      <button 
        onClick={onMenuClick}
        className="p-2 hover:bg-gray-100 rounded-md"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>
      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-gray-100 rounded-md">
          <Bell className="w-5 h-5 text-gray-600" />
        </button>
        <button 
          onClick={onSearchClick}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          <Search className="w-5 h-5 text-gray-600" />
        </button>
        <button 
          onClick={signOut}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          <MoreHorizontal className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  )
}