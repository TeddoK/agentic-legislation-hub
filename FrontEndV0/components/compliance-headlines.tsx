"use client"

import { useState, useMemo } from "react"
import { ChevronRight, ExternalLink, BookOpen, Gavel, ShieldAlert, X, HelpCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import type { ApiResponse } from "@/types/api-types"

interface ComplianceHeadlinesProps {
  apiResponse: ApiResponse | null
  hasInitialData: boolean
}

// Smart categorization function
function categorizeHeadline(headline: { title: string; source: string }): {
  category: string
  confidence: number
} {
  const { title, source } = headline
  const lowerTitle = title.toLowerCase()
  const lowerSource = source.toLowerCase()

  // Define keywords and patterns for each category
  const categories = {
    regulation: {
      keywords: [
        "law",
        "regulation",
        "act",
        "directive",
        "bill",
        "legislation",
        "compliance",
        "policy",
        "standard",
        "rule",
        "guideline",
        "framework",
        "requirement",
        "amendment",
        "proposal",
        "draft",
        "update",
        "revision",
        "reform",
        "gdpr",
        "ccpa",
        "cpra",
        "hipaa",
        "privacy act",
        "data protection",
      ],
      sources: ["legislation", "government", "parliament", "congress", "commission", "authority", "regulator"],
      score: 0,
    },
    enforcement: {
      keywords: [
        "fine",
        "penalty",
        "enforcement",
        "court",
        "ruling",
        "decision",
        "settlement",
        "investigation",
        "audit",
        "complaint",
        "violation",
        "non-compliance",
        "sanction",
        "order",
        "injunction",
        "lawsuit",
        "litigation",
        "case",
        "action",
        "proceeding",
        "authority",
        "regulator",
        "commissioner",
        "agency",
        "board",
        "tribunal",
      ],
      sources: ["court", "authority", "commission", "regulator", "enforcement"],
      score: 0,
    },
    "data-breaches": {
      keywords: [
        "breach",
        "leak",
        "hack",
        "vulnerability",
        "exposed",
        "stolen",
        "compromise",
        "incident",
        "attack",
        "security",
        "unauthorized",
        "access",
        "disclosure",
        "ransomware",
        "malware",
        "phishing",
        "data loss",
        "exfiltration",
        "exploitation",
        "cyber",
        "threat",
        "risk",
        "notification",
        "affected",
      ],
      sources: ["security", "cyber", "breach", "incident", "threat"],
      score: 0,
    },
  }

  // Calculate scores for each category
  for (const [category, data] of Object.entries(categories)) {
    // Check for keywords in title
    for (const keyword of data.keywords) {
      if (lowerTitle.includes(keyword)) {
        data.score += 2 // Keywords in title are strong indicators

        // Bonus for exact word matches (not part of other words)
        const regex = new RegExp(`\\b${keyword}\\b`, "i")
        if (regex.test(lowerTitle)) {
          data.score += 1
        }
      }
    }

    // Check for source indicators
    for (const sourceKeyword of data.sources) {
      if (lowerSource.includes(sourceKeyword)) {
        data.score += 1 // Source can provide context
      }
    }

    // Special pattern matching for stronger indicators
    if (category === "regulation") {
      // Check for patterns like "New X Law" or "X Regulation"
      if (
        /new .*(law|regulation|act|directive)/i.test(lowerTitle) ||
        /(law|regulation|act|directive) .*(introduced|proposed|passed|approved)/i.test(lowerTitle)
      ) {
        data.score += 3
      }
    } else if (category === "enforcement") {
      // Check for patterns like "$X fine" or "X% penalty"
      if (
        /(\$|€|£|\d+)\s*(million|billion|thousand)?.*(fine|penalty)/i.test(lowerTitle) ||
        /(authority|regulator|commissioner).*(fines|penalizes|sanctions)/i.test(lowerTitle)
      ) {
        data.score += 3
      }
    } else if (category === "data-breaches") {
      // Check for patterns like "X million records exposed" or "data breach at X"
      if (
        /(\d+)\s*(million|billion|thousand)?.*(records|data|users|accounts).*(exposed|breached|leaked)/i.test(
          lowerTitle,
        ) ||
        /(data breach|security incident|hack).*(at|affects|impacts)/i.test(lowerTitle)
      ) {
        data.score += 3
      }
    }
  }

  // Find the category with the highest score
  let maxScore = 0
  let bestCategory = "regulation" // Default category

  for (const [category, data] of Object.entries(categories)) {
    if (data.score > maxScore) {
      maxScore = data.score
      bestCategory = category
    }
  }

  // Calculate confidence (0-100%)
  const totalScore = Object.values(categories).reduce((sum, data) => sum + data.score, 0)
  const confidence = totalScore > 0 ? (maxScore / totalScore) * 100 : 50

  return {
    category: bestCategory,
    confidence: Math.min(Math.round(confidence), 100),
  }
}

export default function ComplianceHeadlines({ apiResponse, hasInitialData }: ComplianceHeadlinesProps) {
  const [activeTab, setActiveTab] = useState("all")
  const [showCategoryInfo, setShowCategoryInfo] = useState(false)
  const [showConfidence, setShowConfidence] = useState(false)

  // Use sources from API response and apply smart categorization
  const headlines = useMemo(() => {
    if (!apiResponse?.sources) return []

    return apiResponse.sources.map((source, index) => {
      const headlineData = {
        title: source.title,
        source: source.site,
      }

      const { category, confidence } = categorizeHeadline(headlineData)

      return {
        id: index + 1,
        title: source.title,
        source: source.site,
        date: source.date !== "Publication date not specified" ? source.date : "Recent update",
        category,
        confidence,
        url: source.url,
      }
    })
  }, [apiResponse])

  const filteredHeadlines =
    activeTab === "all" ? headlines : headlines.filter((headline) => headline.category === activeTab)

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "regulation":
        return <BookOpen className="h-4 w-4 text-blue-600" />
      case "enforcement":
        return <Gavel className="h-4 w-4 text-amber-600" />
      case "data-breaches":
        return <ShieldAlert className="h-4 w-4 text-red-600" />
      default:
        return <BookOpen className="h-4 w-4 text-gray-600" />
    }
  }

  // Get category label
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "regulation":
        return "Regulation"
      case "enforcement":
        return "Enforcement"
      case "data-breaches":
        return "Data Breach"
      default:
        return "Other"
    }
  }

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600"
    if (confidence >= 60) return "text-amber-600"
    return "text-gray-500"
  }

  return (
    <>
      <Card className="border border-red-200 shadow-sm overflow-hidden">
        <CardHeader className="pb-2 flex flex-row items-center space-x-2 bg-white">
          <div className="h-5 w-5 text-red-600">📰</div>
          <CardTitle className="text-lg font-medium">Privacy & Compliance Headlines</CardTitle>
          <div className="text-sm text-gray-500 ml-2">Latest news and updates from the industry</div>
          <div className="ml-auto flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setShowConfidence(!showConfidence)}
            >
              {showConfidence ? "Hide Confidence" : "Show Confidence"}
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowCategoryInfo(true)}>
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-4 rounded-none">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="regulation"
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none"
              >
                Regulation
              </TabsTrigger>
              <TabsTrigger
                value="enforcement"
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none"
              >
                Enforcement
              </TabsTrigger>
              <TabsTrigger
                value="data-breaches"
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none"
              >
                Data Breaches
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="m-0">
              {hasInitialData && headlines.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {filteredHeadlines.map((headline) => (
                    <div
                      key={headline.id}
                      className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="p-4">
                        <div className="flex items-center mb-2 justify-between">
                          <div className="flex items-center">
                            {getCategoryIcon(headline.category)}
                            <span className="text-xs ml-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                              {getCategoryLabel(headline.category)}
                            </span>
                          </div>
                          {showConfidence && (
                            <span className={`text-xs ${getConfidenceColor(headline.confidence)}`}>
                              {headline.confidence}% match
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium mb-1">{headline.title}</h3>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>{headline.source}</span>
                          <span>{headline.date}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 px-4 py-2 flex justify-between items-center border-t">
                        <a
                          href={headline.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-red-600"
                        >
                          Read more
                        </a>
                        <a
                          href={headline.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !hasInitialData ? (
                <div className="p-8 text-center text-gray-500">
                  Ask the{" "}
                  <button
                    onClick={() => document.getElementById("assistant")?.scrollIntoView({ behavior: "smooth" })}
                    className="text-red-600 hover:underline font-medium"
                  >
                    Compliance Assistant
                  </button>{" "}
                  a question, and the sources behind each answer appear here, auto-categorised.
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">No headlines found</div>
              )}
              {hasInitialData && headlines.length > 0 && (
                <div className="p-3 border-t text-xs text-gray-400">
                  Showing {filteredHeadlines.length} source{filteredHeadlines.length === 1 ? "" : "s"} cited in the latest answer
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal for category information */}
      {showCategoryInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">How Headlines Are Categorized</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowCategoryInfo(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <p className="mb-4">
                Headlines are automatically categorized using an intelligent content analysis system that examines the
                headline text and source:
              </p>

              <div className="space-y-4">
                <div className="p-3 border rounded-md">
                  <div className="flex items-center mb-2">
                    <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="font-medium">Regulation</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    New laws, regulations, and legislative frameworks related to privacy, data protection, and
                    compliance. The system looks for keywords like "law," "regulation," "act," "directive," "bill,"
                    "legislation," and specific regulation names like "GDPR" or "CCPA."
                  </p>
                </div>

                <div className="p-3 border rounded-md">
                  <div className="flex items-center mb-2">
                    <Gavel className="h-5 w-5 text-amber-600 mr-2" />
                    <h3 className="font-medium">Enforcement</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    Regulatory actions, fines, penalties, and enforcement decisions. The system identifies patterns like
                    monetary penalties, court rulings, and enforcement actions by looking for terms like "fine,"
                    "penalty," "enforcement," "court," "ruling," "decision," and "settlement."
                  </p>
                </div>

                <div className="p-3 border rounded-md">
                  <div className="flex items-center mb-2">
                    <ShieldAlert className="h-5 w-5 text-red-600 mr-2" />
                    <h3 className="font-medium">Data Breaches</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    Security incidents, data breaches, and privacy violations. The system detects references to
                    "breach," "leak," "hack," "vulnerability," "exposed," "stolen," and related security terms, as well
                    as patterns like "X million records exposed."
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Note:</strong> The categorization system uses natural language analysis to determine the most
                  likely category for each headline. You can toggle the "Show Confidence" button to see how confident
                  the system is about each categorization.
                </p>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end">
              <Button onClick={() => setShowCategoryInfo(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
