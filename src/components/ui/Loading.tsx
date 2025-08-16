interface LoadingProps {
  message?: string
}

export function Loading({ message = "Loading..." }: LoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl text-foreground">{message}</div>
    </div>
  )
}