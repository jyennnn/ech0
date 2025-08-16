import React, { useState } from 'react'
import { motion } from "motion/react"
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { NoteCardProps } from '@/types/dashboard'
import { Trash2 } from 'lucide-react'

interface SwipeableNoteCardProps extends NoteCardProps {
  onDelete?: (noteId: string) => void
}

export default function NoteCard({ note, onClick, onDelete }: SwipeableNoteCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    setIsDragging(false)
    
    if (info.offset.x < -100) {
      // Swiped left far enough - show delete
      setSwipeOffset(-100)
    } else {
      // Snap back
      setSwipeOffset(0)
    }
  }

  const handleCardClick = () => {
    // Don't navigate if we just finished dragging
    if (isDragging) return
    
    if (swipeOffset < 0) {
      // Close swipe if open
      setSwipeOffset(0)
      return
    }
    onClick(note.id)
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(note.id)
    }
  }

  return (
    <div className="relative overflow-hidden">
      {/* Delete button background */}
      <motion.div 
        className="absolute right-0 top-0 h-full bg-red-500 flex items-center justify-center"
        initial={{ width: 0 }}
        animate={{ width: swipeOffset < 0 ? 100 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <button
          onClick={handleDelete}
          className="text-white p-2"
        >
          <Trash2 size={20} />
        </button>
      </motion.div>
      
      {/* Main card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        animate={{ x: swipeOffset }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white"
      >
        <Card 
          className="cursor-pointer hover:bg-gray-50/50 transition-colors border-0 border-b border-gray-150 shadow-none bg-transparent py-4 rounded-none"
          onClick={handleCardClick}
        >
          <CardContent className="px-0 py-0">
            <div className="space-y-1">
              <CardTitle className="text-gray-900 text-md font-normal leading-tight">
                {note.title || 'Untitled Note'}
              </CardTitle>
              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-400 font-medium flex-shrink-0">
                  {new Date(note.created_at).toLocaleDateString('en-US', { 
                    month: '2-digit', 
                    day: '2-digit'
                  })}
                </span>
                <div className="text-sm text-gray-500 leading-relaxed">
                  {note.content.substring(0, 80)}
                  {note.content.length > 80 ? '...' : ''}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}