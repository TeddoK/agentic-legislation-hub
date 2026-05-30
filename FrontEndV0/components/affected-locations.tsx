"use client"

import { useState } from "react"
import { ChevronRight, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { ApiResponse } from "@/types/api-types"

interface AffectedLocationsProps {
  apiResponse: ApiResponse | null
  hasInitialData: boolean
}

export default function AffectedLocations({ apiResponse, hasInitialData }: AffectedLocationsProps) {
  const [showAllLocations, setShowAllLocations] = useState(false)

  // Use locations from API response if available, otherwise show empty state
  const locations = apiResponse?.locations_impacted || []
  const locationCount = locations.length || 0

  return (
    <>
      <Card className="col-span-1 border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-2 flex flex-row items-center space-x-2 bg-white">
          <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">🌐</div>
          <CardTitle className="text-lg font-medium">Affected Locations</CardTitle>
        </CardHeader>
        <CardContent>
          {hasInitialData ? (
            <>
              <div className="mb-4">
                <div className="text-3xl font-bold">{locationCount}</div>
                <div className="text-sm text-gray-500">Regions with new regulations</div>
              </div>

              {locations.length > 0 ? (
                <div className="space-y-2">
                  {locations.slice(0, 5).map((location, index) => (
                    <div key={index} className="text-sm">
                      {location}
                    </div>
                  ))}
                  {locations.length > 5 && <div className="text-sm text-gray-500">+{locations.length - 5} more</div>}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No affected locations found</div>
              )}
            </>
          ) : (
            <>
              <div className="mb-4">
                <div className="text-3xl font-bold text-gray-300">-</div>
                <div className="text-sm text-gray-500">Regions with new regulations</div>
              </div>
              <div className="rounded-md bg-gray-50 border border-dashed border-gray-200 p-3 text-sm text-gray-500">
                Ask the{" "}
                <button
                  onClick={() => document.getElementById("assistant")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Compliance Assistant
                </button>{" "}
                a question to populate affected jurisdictions.
              </div>
            </>
          )}

          <div className="mt-4 pt-3 border-t">
            <button
              onClick={() => setShowAllLocations(true)}
              disabled={!hasInitialData || locations.length === 0}
              className="text-sm text-gray-600 flex items-center justify-between w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              View all locations
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Modal for viewing all locations */}
      {showAllLocations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">All Affected Locations</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowAllLocations(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {locations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {locations.map((location, index) => (
                    <div key={index} className="p-3 border rounded-md">
                      <div className="font-medium">{location}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500">No affected locations found</div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end">
              <Button onClick={() => setShowAllLocations(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
