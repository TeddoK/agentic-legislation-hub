import { Home, FileText, User, Settings, MessageSquare, BarChart } from "lucide-react"
import Link from "next/link"

export default function Sidebar() {
  return (
    <div className="w-64 bg-zinc-900 text-white flex flex-col h-full">
      <div className="p-4 flex items-center space-x-2">
        <div className="h-6 w-6 rounded-full bg-red-600"></div>
        <h1 className="text-xl font-bold">ComplianceAI</h1>
      </div>

      <div className="mt-6">
        <h2 className="px-4 py-2 text-xs font-semibold text-zinc-400 uppercase">Main</h2>
        <nav className="space-y-1 px-2">
          <Link href="/" className="flex items-center space-x-2 px-4 py-2 text-sm bg-zinc-800 rounded-md">
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/compliance"
            className="flex items-center space-x-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-md"
          >
            <FileText className="h-5 w-5" />
            <span>Compliance</span>
          </Link>
          <Link
            href="/assistant"
            className="flex items-center space-x-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-md"
          >
            <MessageSquare className="h-5 w-5" />
            <span>AI Assistant</span>
          </Link>
          <Link
            href="/reports"
            className="flex items-center space-x-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-md"
          >
            <BarChart className="h-5 w-5" />
            <span>Reports</span>
          </Link>
        </nav>
      </div>

      <div className="mt-6">
        <h2 className="px-4 py-2 text-xs font-semibold text-zinc-400 uppercase">Settings</h2>
        <nav className="space-y-1 px-2">
          <Link
            href="/profile"
            className="flex items-center space-x-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-md"
          >
            <User className="h-5 w-5" />
            <span>Profile</span>
          </Link>
          <Link
            href="/settings"
            className="flex items-center space-x-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-md"
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </nav>
      </div>
    </div>
  )
}
