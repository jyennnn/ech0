import Navbar from '@/components/layout/Navbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto">
        <Navbar />
        {children}
      </div>
    </div>
  )
}