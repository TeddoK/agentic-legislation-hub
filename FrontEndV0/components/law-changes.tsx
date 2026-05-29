"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import type { ApiResponse } from "@/types/api-types"

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

interface LawChangesProps {
  apiResponse: ApiResponse | null
  hasInitialData: boolean
  regulationsData: RegulationsData | null
  isLoading: boolean
  error: string | null
}

export default function LawChanges({
  apiResponse,
  hasInitialData,
  regulationsData,
  isLoading,
  error,
}: LawChangesProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("recent")
  const [showAllChanges, setShowAllChanges] = useState(false)

  const toggleExpand = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id)
  }

  // Choose the list based on the active tab
  const regulations = activeTab === "recent" ? regulationsData?.recent || [] : regulationsData?.upcoming || []

  const upcomingCount = regulationsData?.upcoming.length || 0

  // Group by jurisdiction
  const groupedRegulations = regulations.reduce(
    (acc, reg) => {
      if (!acc[reg.jurisdiction]) acc[reg.jurisdiction] = []
      acc[reg.jurisdiction].push(reg)
      return acc
    },
    {} as Record<string, Regulation[]>,
  )

  const jurisdictions = Object.keys(groupedRegulations)

  return (
    <>
      <Card className="col-span-1 border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-2 flex items-center space-x-2 bg-white">
          <div className="h-5 w-5 rounded-full bg-red-600" />
          <CardTitle className="text-lg font-medium">Law Changes</CardTitle>
          {upcomingCount > 0 && (
            <span className="ml-1 text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full">
              {upcomingCount} upcoming
            </span>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-2 rounded-none">
              <TabsTrigger
                value="recent"
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none"
              >
                Recent
              </TabsTrigger>
              <TabsTrigger
                value="upcoming"
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none"
              >
                Upcoming
              </TabsTrigger>
            </TabsList>

            {/* Recent Tab */}
            <TabsContent value="recent" className="p-0 m-0">
              <div className="p-4">
                <div className="text-2xl font-bold">{regulationsData ? regulationsData.recent.length : "-"}</div>
                <div className="text-sm text-gray-500">New regulations in the last 30 days</div>
              </div>
              <div className="border-t">
                {isLoading ? (
                  <div className="p-3 text-center text-gray-500">Loading regulations...</div>
                ) : error ? (
                  <div className="p-3 text-center text-red-500">{error}</div>
                ) : regulationsData && jurisdictions.length > 0 ? (
                  jurisdictions.map((jurisdiction, idx) => (
                    <div key={idx} className="border-b last:border-b-0">
                      <div className="p-3 flex items-start cursor-pointer" onClick={() => toggleExpand(`jur-${idx}`)}>
                        <div className="mt-1 h-3 w-3 rounded-full bg-red-500 mr-2" />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div className="font-medium">{jurisdiction}</div>
                            {expandedItem === `jur-${idx}` ? (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500">Legislative updates</div>
                          <div className="text-xs text-gray-400">
                            {groupedRegulations[jurisdiction].length} recent changes
                          </div>
                          {expandedItem === `jur-${idx}` && (
                            <div className="mt-2 space-y-2">
                              {groupedRegulations[jurisdiction].map((reg, j) => (
                                <div key={j} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                  <p>{reg.title}</p>
                                  <div className="flex justify-between items-center mt-1 text-xs">
                                    <span className="text-gray-500">{reg.date}</span>
                                    <a
                                      href={reg.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      View source
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-gray-500">No recent law changes found</div>
                )}
              </div>
              <div className="p-3 border-t">
                <button
                  onClick={() => setShowAllChanges(true)}
                  disabled={!regulationsData || regulations.length === 0}
                  className="text-sm text-gray-600 flex items-center justify-between w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  View all changes
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </TabsContent>

            {/* Upcoming Tab */}
            <TabsContent value="upcoming" className="p-0 m-0">
              <div className="p-4">
                <div className="text-2xl font-bold">{regulationsData ? regulationsData.upcoming.length : "-"}</div>
                <div className="text-sm text-gray-500">Upcoming regulatory changes</div>
              </div>
              <div className="border-t">
                {isLoading ? (
                  <div className="p-3 text-center text-gray-500">Loading regulations...</div>
                ) : error ? (
                  <div className="p-3 text-center text-red-500">{error}</div>
                ) : regulationsData && regulationsData.upcoming.length > 0 ? (
                  regulationsData.upcoming.map((reg, idx) => (
                    <div key={idx} className="border-b last:border-b-0">
                      <div className="p-3 flex items-start">
                        <div className="mt-1 h-3 w-3 rounded-full bg-amber-500 mr-2" />
                        <div className="flex-1">
                          <div className="font-medium">{reg.title}</div>
                          <div className="text-sm text-gray-500">{reg.jurisdiction}</div>
                          <div className="text-xs text-gray-400">Expected: {reg.date}</div>
                          <div className="mt-1">
                            <a
                              href={reg.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              View details
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-gray-500">No upcoming regulatory changes found</div>
                )}
              </div>
              <div className="p-3 border-t">
                <button
                  onClick={() => setShowAllChanges(true)}
                  disabled={!regulationsData || regulationsData.upcoming.length === 0}
                  className="text-sm text-gray-600 flex items-center justify-between w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  View all upcoming changes
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal for viewing all changes */}
      {showAllChanges && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {activeTab === "recent" ? "All Recent Law Changes" : "All Upcoming Law Changes"}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setShowAllChanges(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {regulations.length > 0 ? (
                <div className="space-y-4">
                  {regulations.map((reg, idx) => (
                    <div key={idx} className="border rounded-lg overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center mb-2">
                          <div
                            className={`h-3 w-3 rounded-full ${
                              activeTab === "recent" ? "bg-red-500" : "bg-amber-500"
                            } mr-2`}
                          />
                          <h3 className="font-medium">{reg.jurisdiction}</h3>
                        </div>
                        <div className="text-sm text-gray-700 mb-2">
                          <p>{reg.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {activeTab === "recent" ? "Published: " : "Expected: "}
                            {reg.date}
                          </p>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 border-t flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {activeTab === "recent" ? "Legislative update" : "Upcoming change"}
                        </span>
                        <a
                          href={reg.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center"
                        >
                          View source <ChevronRight className="h-4 w-4 ml-1" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500">No law changes found</div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end">
              <Button onClick={() => setShowAllChanges(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
