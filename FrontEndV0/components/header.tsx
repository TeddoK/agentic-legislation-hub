"use client"

import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  onRefresh: () => void
  isLoading: boolean
  lastUpdated: Date
}

export default function Header({ onRefresh, isLoading, lastUpdated }: HeaderProps) {
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(lastUpdated)

  return (
    <header className="bg-white border-b border-gray-200 py-3 px-4 flex items-center justify-between">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Regulatory Intelligence Dashboard</h2>
        <p className="text-xs text-gray-500">Privacy &amp; data-protection tracking across jurisdictions</p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5 text-xs text-gray-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span>Live · updated {time}</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center"
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Refreshing…" : "Refresh data"}
        </Button>
      </div>
    </header>
  )
}
