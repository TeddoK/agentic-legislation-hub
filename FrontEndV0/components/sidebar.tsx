"use client"

import { useState } from "react"
import { Home, FileText, AlertTriangle, MessageSquare, Newspaper } from "lucide-react"

const NAV = [
  { id: "hero", label: "Overview", icon: Home },
  { id: "regulations", label: "Regulations", icon: FileText },
  { id: "conflicts", label: "Conflicts", icon: AlertTriangle },
  { id: "assistant", label: "AI Assistant", icon: MessageSquare },
  { id: "headlines", label: "Headlines", icon: Newspaper },
]

export default function Sidebar() {
  const [active, setActive] = useState("hero")

  const goTo = (id: string) => {
    setActive(id)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="w-64 bg-zinc-900 text-white flex flex-col h-full">
      <div className="p-4 flex items-center space-x-2">
        <div className="h-6 w-6 rounded-full bg-red-600" />
        <h1 className="text-xl font-bold">ComplianceAI</h1>
      </div>

      <div className="mt-6 flex-1">
        <h2 className="px-4 py-2 text-xs font-semibold text-zinc-400 uppercase">Navigation</h2>
        <nav className="space-y-1 px-2">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => goTo(id)}
              className={`w-full flex items-center space-x-2 px-4 py-2 text-sm rounded-md transition-colors ${
                active === id ? "bg-red-600 text-white" : "text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-zinc-800 text-xs text-zinc-500 space-y-1">
        <div>Agentic Legislation Hub</div>
        <div>RAG over 500+ documents · Groq LLM</div>
      </div>
    </div>
  )
}
