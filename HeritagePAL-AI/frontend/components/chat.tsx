"use client"

import { useRef, useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SendIcon } from "lucide-react"
import { contentApi } from "@/lib/api-new"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Define message types
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Add a welcome message when the component mounts
  useEffect(() => {
    setMessages([
      {
        id: "welcome-msg",
        role: "assistant",
        content: "Hello! I'm HeritagePal, your virtual educational assistant. How can I help you today?",
        timestamp: new Date(),
      },
    ])
  }, [])

  // Auto scroll to the latest message
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // Create a temporary ID for the message
    const userMessageId = `msg-${Date.now()}`

    // Add user message immediately
    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Send the message to the API
      const response = await contentApi.sendChatMessage(input)

      // Add the assistant's response
      const assistantMessage: Message = {
        id: `response-${Date.now()}`,
        role: "assistant",
        content: response.message,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Failed to send message:", error)
      toast.error("Sorry, I couldn't process your request. Please try again.")
      
      // Add an error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      }
      
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading) {
        handleSendMessage()
      }
    }
  }

  return (
    <Card className="flex flex-col h-[600px] shadow-md border-2 border-green-200">
      <CardHeader className="bg-green-50 rounded-t-lg p-4">
        <CardTitle className="text-green-700 flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src="/ai-avatar.png" alt="AI" />
            <AvatarFallback className="bg-green-100 text-green-700">AI</AvatarFallback>
          </Avatar>
          HeritagePal Assistant
        </CardTitle>
      </CardHeader>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3 rounded-lg p-3",
                message.role === "assistant"
                  ? "bg-green-50 text-gray-800"
                  : "bg-blue-50 ml-8 text-gray-800"
              )}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/ai-avatar.png" alt="AI" />
                  <AvatarFallback className="bg-green-100 text-green-700">AI</AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1 overflow-hidden">
                <div className="prose">
                  <p className="m-0">{message.content}</p>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              {message.role === "user" && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/user-avatar.png" alt="User" />
                  <AvatarFallback className="bg-blue-100 text-blue-700">YOU</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3 rounded-lg p-3 bg-green-50 text-gray-800">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/ai-avatar.png" alt="AI" />
                <AvatarFallback className="bg-green-100 text-green-700">AI</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="typing-indicator">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <CardFooter className="p-4 bg-gray-50 border-t">
        <div className="flex w-full items-center gap-2">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            size="icon"
            disabled={isLoading || !input.trim()}
            onClick={handleSendMessage}
            className="bg-green-600 hover:bg-green-700"
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
} 