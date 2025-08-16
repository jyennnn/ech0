'use client'

import Navbar from '@/components/layout/Navbar'
import { NoteActionsProvider } from '@/components/layout/NoteActionsProvider'
import { useNoteActionsStore } from '@/stores/noteActionsStore'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { noteActions } = useNoteActionsStore()

  return (
    <NoteActionsProvider noteActions={noteActions || {}}>
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto">
          <Navbar />
          {children}
        </div>
      </div>
    </NoteActionsProvider>
  )
}