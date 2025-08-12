import React from 'react'

interface TabButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

export const TabButton: React.FC<TabButtonProps> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm transition-colors rounded-full ${
      active ? 'text-gray-900 bg-gray-200' : 'text-gray-500'
    }`}
  >
    {children}
  </button>
)