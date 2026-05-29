"use client"

import type React from "react"

import { useState } from "react"
import { ChevronRight, ChevronDown, AlertTriangle, CheckCircle, Info, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { ApiResponse } from "@/types/api-types"

interface ImpactAssessmentProps {
  apiResponse: ApiResponse | null
  hasInitialData: boolean
}

export default function ImpactAssessment({ apiResponse, hasInitialData }: ImpactAssessmentProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [showFullAssessment, setShowFullAssessment] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState<any | null>(null)

  const toggleExpand = (id: string) => {
    if (expandedItem === id) {
      setExpandedItem(null)
    } else {
      setExpandedItem(id)
    }
  }

  const viewDetails = (assessment: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedAssessment(assessment)
  }

  // Use banner assessments from API response if available
  const assessments = apiResponse?.banner_assessments || []
  const impactCount = assessments.filter((item) => item.impacted).length || 0

  return (
    <>
      <Card className="col-span-1 border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-2 flex flex-row items-center space-x-2 bg-white">
          <div className="h-5 w-5 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs">
            👤
          </div>
          <CardTitle className="text-lg font-medium">Impact Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          {hasInitialData ? (
            <>
              <div className="mb-4">
                <div className="text-3xl font-bold">{impactCount}</div>
                <div className="text-sm text-gray-500">Regulations affecting your products</div>
              </div>

              {assessments.length > 0 ? (
                <div className="space-y-3">
                  {assessments.slice(0, 5).map((assessment, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                        expandedItem === assessment.file ? "shadow-md" : "shadow-sm"
                      }`}
                    >
                      <div
                        className={`p-3 cursor-pointer ${expandedItem === assessment.file ? "bg-gray-50" : "bg-white"}`}
                        onClick={() => toggleExpand(assessment.file)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                            <div className="font-medium text-sm">{assessment.file.replace(".json", "")}</div>
                          </div>
                          {expandedItem === assessment.file ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 pl-6">
                          {expandedItem !== assessment.file && (
                            <div className="truncate">{assessment.explanation.substring(0, 60)}...</div>
                          )}
                        </div>

                        {expandedItem === assessment.file && (
                          <div className="mt-3 text-sm text-gray-600 bg-white p-3 rounded border">
                            <div className="flex items-start mb-2">
                              <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                              <div>{assessment.explanation}</div>
                            </div>
                            <div className="flex items-center mt-3 pt-2 border-t text-xs text-gray-500">
                              <div className="flex items-center">
                                <span className="font-medium mr-2">Status:</span>
                                {assessment.impacted ? (
                                  <span className="flex items-center text-amber-600">
                                    <AlertTriangle className="h-3 w-3 mr-1" /> Requires attention
                                  </span>
                                ) : (
                                  <span className="flex items-center text-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Compliant
                                  </span>
                                )}
                              </div>
                              <div className="ml-auto">
                                <button
                                  className="text-blue-600 hover:underline"
                                  onClick={(e) => viewDetails(assessment, e)}
                                >
                                  View details
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {assessments.length > 5 && (
                    <div className="text-xs text-gray-500">+{assessments.length - 5} more</div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No impact assessments found</div>
              )}
            </>
          ) : (
            <>
              <div className="mb-4">
                <div className="text-3xl font-bold">-</div>
                <div className="text-sm text-gray-500">Regulations affecting your products</div>
              </div>
              <div className="text-sm text-gray-500">
                Ask the Compliance Assistant about recent legislative changes to see impact assessments
              </div>
            </>
          )}

          <div className="mt-4 pt-3 border-t">
            <button
              onClick={() => setShowFullAssessment(true)}
              disabled={!hasInitialData || assessments.length === 0}
              className="text-sm text-gray-600 flex items-center justify-between w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              View full assessment
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Modal for viewing full assessment */}
      {showFullAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Full Impact Assessment</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowFullAssessment(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {assessments.length > 0 ? (
                <div className="space-y-4">
                  {assessments.map((assessment, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        {assessment.impacted ? (
                          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        )}
                        <h3 className="text-lg font-medium">{assessment.file.replace(".json", "")}</h3>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">{assessment.explanation}</div>
                      <div className="flex justify-between items-center text-sm border-t pt-3">
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Status:</span>
                          {assessment.impacted ? (
                            <span className="text-amber-600">Requires attention</span>
                          ) : (
                            <span className="text-green-600">Compliant</span>
                          )}
                        </div>
                        <Button size="sm" variant="outline">
                          Generate Report
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500">No impact assessments found</div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end">
              <Button onClick={() => setShowFullAssessment(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for viewing assessment details */}
      {selectedAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {selectedAssessment.file.replace(".json", "")} - Detailed Assessment
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setSelectedAssessment(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="mb-4">
                <h3 className="font-medium text-lg mb-2">Impact Analysis</h3>
                <p className="text-gray-700">{selectedAssessment.explanation}</p>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-lg mb-2">Compliance Status</h3>
                <div className="flex items-center p-3 rounded-md bg-gray-50">
                  {selectedAssessment.impacted ? (
                    <>
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                      <span className="text-amber-600 font-medium">Requires Attention</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-green-600 font-medium">Compliant</span>
                    </>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-lg mb-2">Recommended Actions</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {selectedAssessment.impacted && (
                    <>
                      <li>Review cookie consent implementation to ensure explicit consent for each domain</li>
                      <li>Update privacy policy to reflect current data sharing practices</li>
                      <li>Implement clear opt-out mechanisms for all non-essential cookies</li>
                      <li>Document compliance measures taken for audit purposes</li>
                    </>
                  )}
                  {!selectedAssessment.impacted && (
                    <li>No immediate actions required. Continue monitoring for regulatory changes.</li>
                  )}
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-lg mb-2">Applicable Regulations</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 border rounded">GDPR</div>
                  <div className="p-2 border rounded">CCPA</div>
                  <div className="p-2 border rounded">ePrivacy Directive</div>
                  <div className="p-2 border rounded">Digital Services Act</div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-between">
              <Button variant="outline">Export Report</Button>
              <Button onClick={() => setSelectedAssessment(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
