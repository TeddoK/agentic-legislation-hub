"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import Hero from "@/components/hero"
import LawChanges from "@/components/law-changes"
import AffectedLocations from "@/components/affected-locations"
import ImpactAssessment from "@/components/impact-assessment"
import ComplianceAssistant from "@/components/compliance-assistant"
import ComplianceHeadlines from "@/components/compliance-headlines"
import RegulationConflicts from "./regulation-conflicts"
import type { ApiResponse } from "@/types/api-types"
import { API_BASE_URL } from "@/lib/api"

// Define the regulations data interface
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

export default function Dashboard() {
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null)
  const [hasInitialData, setHasInitialData] = useState(false)
  const [regulationsData, setRegulationsData] = useState<RegulationsData | null>(null)
  const [isRegulationsLoading, setIsRegulationsLoading] = useState(false)
  const [regulationsError, setRegulationsError] = useState<string | null>(null)
  const [lastAnalyzedTime, setLastAnalyzedTime] = useState<Date>(new Date())

  // Handle API response from Compliance Assistant
  const handleApiResponse = (response: ApiResponse) => {
    setApiResponse(response)
    setHasInitialData(true)
  }

  // Function to fetch regulations data
  const fetchRegulations = async () => {
    setIsRegulationsLoading(true)
    try {
      console.log("Fetching regulations data...")
      const response = await fetch(`${API_BASE_URL}/regulations`)
      if (!response.ok) {
        throw new Error("Failed to fetch regulations data")
      }
      const data: RegulationsData = await response.json()
      console.log("Regulations data fetched successfully")
      setRegulationsData(data)
      setRegulationsError(null)
      setLastAnalyzedTime(new Date())
    } catch (err) {
      console.error("Error fetching regulations:", err)
      setRegulationsError("Failed to load regulations data")
    } finally {
      setIsRegulationsLoading(false)
    }
  }

  // Function to run a new analysis
  const runAnalysis = async () => {
    await fetchRegulations()
  }

  // Fetch regulations data on component mount only
  useEffect(() => {
    fetchRegulations()
  }, []) // Empty dependency array ensures this runs only once on mount

  return (
    <div className="flex h-screen bg-zinc-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onRefresh={runAnalysis} isLoading={isRegulationsLoading} lastUpdated={lastAnalyzedTime} />
        <main className="flex-1 overflow-y-auto p-4 scroll-smooth">
          <div id="hero" className="scroll-mt-4">
            <Hero />
          </div>

          <div id="regulations" className="scroll-mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <LawChanges
              apiResponse={apiResponse}
              hasInitialData={hasInitialData}
              regulationsData={regulationsData}
              isLoading={isRegulationsLoading}
              error={regulationsError}
            />
            <AffectedLocations apiResponse={apiResponse} hasInitialData={hasInitialData} />
            <ImpactAssessment apiResponse={apiResponse} hasInitialData={hasInitialData} />
          </div>

          {/* Pass regulations data to RegulationConflicts */}
          <div id="conflicts" className="scroll-mt-4 mb-4">
            <RegulationConflicts
              regulationsData={regulationsData}
              isLoading={isRegulationsLoading}
              error={regulationsError}
              onRunAnalysis={runAnalysis}
              lastAnalyzedTime={lastAnalyzedTime}
            />
          </div>

          <div id="assistant" className="scroll-mt-4">
            <ComplianceAssistant onApiResponse={handleApiResponse} />
          </div>
          <div id="headlines" className="scroll-mt-4">
            <ComplianceHeadlines apiResponse={apiResponse} hasInitialData={hasInitialData} />
          </div>
        </main>
      </div>
    </div>
  )
}
