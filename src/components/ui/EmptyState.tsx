interface EmptyStateProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 text-gray-400">
      <p className="mb-4">{title}</p>
      {description && <p className="mb-4 text-sm">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="text-blue-500 hover:text-blue-600 text-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}