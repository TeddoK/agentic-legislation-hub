"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ApiResponse } from "@/types/api-types"
import { API_BASE_URL } from "@/lib/api"

interface ComplianceAssistantProps {
  onApiResponse: (response: ApiResponse) => void
}

export default function ComplianceAssistant({ onApiResponse }: ComplianceAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [question, setQuestion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversation, setConversation] = useState<{ type: "user" | "assistant"; content: string }[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    // Add user message to conversation
    setConversation((prev) => [...prev, { type: "user", content: question }])
    setIsLoading(true)

    try {
      // Send request to FastAPI backend
      const response = await fetch(`${API_BASE_URL}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      })

      if (!response.ok) {
        throw new Error("Network response was not ok")
      }

      const data: ApiResponse = await response.json()

      // Add assistant response to conversation using openai_answer
      setConversation((prev) => [
        ...prev,
        {
          type: "assistant",
          content: data.openai_answer || "I don't have an answer for that question.",
        },
      ])

      // Pass the API response up to the parent component
      onApiResponse(data)
    } catch (error) {
      console.error("Error fetching data:", error)
      setConversation((prev) => [
        ...prev,
        {
          type: "assistant",
          content: "Sorry, I encountered an error while processing your request. Please try again later.",
        },
      ])
    } finally {
      setIsLoading(false)
      setQuestion("")
    }
  }

  return (
    <Card className="mb-4 border border-red-200 shadow-sm overflow-hidden">
      <CardHeader
        className="pb-2 flex flex-row items-center justify-between cursor-pointer bg-white"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <div className="h-5 w-5 text-red-600">💬</div>
          <CardTitle className="text-lg font-medium">Compliance Assistant</CardTitle>
        </div>
        <div className="text-sm text-gray-500 flex items-center">
          Ask questions about regulations and compliance
          {isExpanded ? <ChevronUp className="ml-2 h-5 w-5" /> : <ChevronDown className="ml-2 h-5 w-5" />}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-4">
          <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto mb-4">
            {conversation.length === 0 ? (
              <div className="text-center text-gray-500 h-full flex flex-col justify-center">
                <p>Ask me anything about compliance regulations and requirements.</p>
                <p className="text-sm mt-2">Example: "Can I see recent legislative changes?"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {conversation.map((message, index) => (
                  <div key={index} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-3/4 rounded-lg p-3 ${
                        message.type === "user" ? "bg-blue-600 text-white" : "bg-white border border-gray-200"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-3/4 rounded-lg p-3 bg-white border border-gray-200">
                      <div className="flex space-x-2">
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about compliance issues..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading || !question.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  )
}
