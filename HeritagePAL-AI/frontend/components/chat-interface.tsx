"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { HeritagePalMascot } from "@/components/heritage-pal-mascot"
import { Send } from "lucide-react"
import { chatApi } from "@/lib/api-new"
import { toast } from "sonner"

interface Message {
  id: string
  content: string
  sender: "user" | "assistant"
  timestamp: Date
}

export function ChatInterface({ grade }: { grade?: number }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hi there! I'm HeritagePal, your friendly Social Studies tutor. What would you like to learn about Guyana today?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>("")

  // Initialize session ID and load chat history
  useEffect(() => {
    const storedSessionId = chatApi.getOrCreateSessionId()
    setSessionId(storedSessionId)
    
    // Load chat history if there is a session ID
    const loadChatHistory = async () => {
      try {
        const history = await chatApi.getChatHistory(storedSessionId)
        if (history && history.length > 0) {
          const formattedHistory = history.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            sender: msg.role === 'user' ? 'user' : 'assistant',
            timestamp: new Date(msg.created_at),
          }))
          setMessages(formattedHistory)
        }
      } catch (error) {
        console.error("Failed to load chat history:", error)
      }
    }
    
    // Only load history if we have a session ID that's not newly created
    if (localStorage.getItem('chat_session_id') === storedSessionId) {
      loadChatHistory()
    }
  }, [])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      // Send message to API
      const response = await chatApi.sendMessage(inputValue, sessionId, grade)
      
      if (response && response.message) {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          content: response.message,
          sender: "assistant",
          timestamp: new Date(),
        }
        
        setMessages((prev) => [...prev, assistantMessage])
        
        // Update session ID if it changed
        if (response.sessionId && response.sessionId !== sessionId) {
          setSessionId(response.sessionId)
          localStorage.setItem('chat_session_id', response.sessionId)
        }
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      toast.error("Failed to get a response. Please try again.")
      console.error("Chat API error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card className="bg-white border-2 border-green-200 shadow-md flex flex-col h-[600px]">
      <div className="flex-grow overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender === "user" ? "bg-green-600 text-white" : "bg-yellow-100 text-gray-800"
                }`}
              >
                {message.sender === "assistant" && (
                  <div className="flex items-center mb-2">
                    <div className="mr-2">
                      <HeritagePalMascot size="small" />
                    </div>
                    <span className="font-bold">HeritagePal</span>
                  </div>
                )}
                <p>{message.content}</p>
                <div className={`text-xs mt-1 ${message.sender === "user" ? "text-green-100" : "text-gray-500"}`}>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-yellow-100 text-gray-800">
                <div className="flex items-center mb-2">
                  <div className="mr-2">
                    <HeritagePalMascot size="small" />
                  </div>
                  <span className="font-bold">HeritagePal</span>
                </div>
                <div className="flex space-x-1">
                  <div
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t p-4">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Ask about Guyanese Social Studies..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-grow"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          HeritagePal can answer questions about Guyanese Social Studies topics for grades 1-6.
        </p>
      </div>
    </Card>
  )
}

