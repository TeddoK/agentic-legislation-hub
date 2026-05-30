import { Database, MessageSquare, ShieldCheck } from "lucide-react"

const STATS = [
  { value: "500+", label: "Legal documents indexed" },
  { value: "15", label: "Privacy/legal sources" },
  { value: "RAG", label: "Grounded AI answers" },
]

const FEATURES = [
  {
    icon: Database,
    title: "Tracks the law",
    body: "Continuously ingests privacy & data-protection sources (EDPB, IAPP, UNCTAD, OECD, CPPA…).",
  },
  {
    icon: MessageSquare,
    title: "Answers compliance questions",
    body: "Ask in plain English — answers are grounded in retrieved source documents, with citations.",
  },
  {
    icon: ShieldCheck,
    title: "Assesses impact",
    body: "Flags affected jurisdictions, detects conflicting rules, and audits your cookie banners.",
  },
]

export default function Hero() {
  return (
    <section className="mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-800 text-white">
      <div className="p-6 md:p-8">
        <span className="inline-block text-xs font-medium uppercase tracking-wide bg-red-600/90 px-2 py-1 rounded">
          Agentic Legislation Hub
        </span>
        <h1 className="mt-3 text-2xl md:text-3xl font-bold leading-tight">
          Turn a moving regulatory landscape into clear, actionable compliance.
        </h1>
        <p className="mt-2 text-sm md:text-base text-zinc-300 max-w-2xl">
          A full-stack assistant that scrapes global privacy legislation, indexes it for
          retrieval-augmented generation, and uses an LLM to answer compliance questions and assess
          operational impact.
        </p>

        <div className="mt-5 flex flex-wrap gap-6">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-zinc-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-700/50">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="bg-zinc-900/60 p-4">
            <div className="flex items-center space-x-2 mb-1">
              <Icon className="h-4 w-4 text-red-400" />
              <h3 className="text-sm font-semibold">{title}</h3>
            </div>
            <p className="text-xs text-zinc-400">{body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
