'use client'

import React from 'react'
import { Menu, Search, MoreHorizontal } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface NavbarProps {
  onMenuClick?: () => void
  onSearchClick?: () => void
}

export default function Navbar({ onMenuClick, onSearchClick }: NavbarProps) {
  const supabase = createClient()

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="flex justify-between items-center px-4 py-3">
      <button 
        onClick={onMenuClick}
        className="p-2 hover:bg-gray-100 rounded-md"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>
      <div className="flex items-center gap-3">
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