"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Info, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Regulation {
  title: string
  date: string
  url: string
  jurisdiction: string
}

interface ConflictsData {
  ruleset_idxs: number[]
  explanation: string
}

interface RegulationsData {
  recent: Regulation[]
  upcoming: Regulation[]
  conflicts: ConflictsData
}

interface RegulationConflictsProps {
  regulationsData: RegulationsData | null
  isLoading: boolean
  error: string | null
  onRunAnalysis: () => Promise<void>
  lastAnalyzedTime: Date
}

export default function RegulationConflicts({
  regulationsData,
  isLoading,
  error,
  onRunAnalysis,
  lastAnalyzedTime,
}: RegulationConflictsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Get conflicting regulations based on ruleset_idxs
  const getConflictingRegulations = () => {
    // Add proper null checks
    if (
      !regulationsData ||
      !regulationsData.conflicts ||
      !regulationsData.conflicts.ruleset_idxs ||
      !regulationsData.conflicts.ruleset_idxs.length
    ) {
      return []
    }

    const allRegulations = [...regulationsData.recent, ...regulationsData.upcoming]
    return regulationsData.conflicts.ruleset_idxs.map((idx) => allRegulations[idx])
  }

  const conflictingRegulations = regulationsData ? getConflictingRegulations() : []
  const hasConflicts = conflictingRegulations.length > 0

  // Format the last analyzed time
  const formatLastAnalyzedTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Handle running a new analysis
  const handleRunAnalysis = async () => {
    if (isAnalyzing || isLoading) return

    setIsAnalyzing(true)
    try {
      await onRunAnalysis()
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Safely get explanation text
  const getExplanationText = () => {
    if (!regulationsData || !regulationsData.conflicts || !regulationsData.conflicts.explanation) {
      return "No explanation available"
    }
    return regulationsData.conflicts.explanation
  }

  const explanationText = getExplanationText()

  return (
    <Card className="border border-amber-200 shadow-sm overflow-hidden">
      <CardHeader
        className="pb-2 flex flex-row items-center justify-between cursor-pointer bg-white"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          {hasConflicts ? (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          <CardTitle className="text-lg font-medium">Regulatory Conflicts</CardTitle>
        </div>
        <div className="text-sm text-gray-500 flex items-center">
          {hasConflicts ? "Potential conflicts detected" : "No conflicts detected"}
          {isExpanded ? <ChevronDown className="ml-2 h-5 w-5" /> : <ChevronRight className="ml-2 h-5 w-5" />}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-4">
          {isLoading || isAnalyzing ? (
            <div className="flex flex-col justify-center items-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500 mb-2"></div>
              <div className="text-sm text-gray-500">
                {isAnalyzing ? "Running analysis..." : "Loading regulations..."}
              </div>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : regulationsData ? (
            <div>
              <div className="flex items-start mb-4">
                {hasConflicts ? (
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                )}
                <div className="text-sm">
                  {explanationText.length > 200 && !showDetails
                    ? `${explanationText.substring(0, 200)}...`
                    : explanationText}
                </div>
              </div>

              {explanationText.length > 200 && (
                <div className="mb-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDetails(!showDetails)
                    }}
                  >
                    {showDetails ? "Show Less" : "Read More"}
                  </Button>
                </div>
              )}

              {hasConflicts && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Conflicting Regulations:</h3>
                  <div className="space-y-2">
                    {conflictingRegulations.map((reg, idx) => (
                      <div key={idx} className="border rounded-md p-3 bg-amber-50">
                        <div className="font-medium">{reg.title}</div>
                        <div className="text-sm text-gray-500">{reg.jurisdiction}</div>
                        <div className="text-xs text-gray-400 mb-1">{reg.date}</div>
                        <a
                          href={reg.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View regulation
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-3 border-t flex justify-between items-center">
                <div className="text-xs text-gray-500 flex items-center">
                  <Info className="h-4 w-4 mr-1" />
                  Last analyzed: {formatLastAnalyzedTime(lastAnalyzedTime)}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className={`${hasConflicts ? "text-amber-600 border-amber-300" : "text-green-600 border-green-300"} flex items-center`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRunAnalysis()
                  }}
                  disabled={isAnalyzing || isLoading}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      Run Analysis
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">No conflict data available</div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
