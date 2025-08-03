"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { ImageIcon, Send, X, Camera, Copy, Flag, Edit2, Stethoscope, Upload, WifiOff, Wifi } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { setImage, getImage, hasImage, clearImage, queryRag } from "@/lib/api-service"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  image?: string
  timestamp: Date
}

const PROMPT_SUGGESTIONS = [
  { text: "Analyze this skin condition", icon: "🔍" },
  { text: "What could this be?", icon: "❓" },
  { text: "Recommended treatments", icon: "⚕️" },
  { text: "Prevention tips", icon: "🛡️" },
]

export default function VSIDSApp() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const imageOptionsRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [showImageOptions, setShowImageOptions] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [imageCount, setImageCount] = useState(0)
  const [isAppLoading, setIsAppLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // App initialization and loading
  useEffect(() => {
    // Set initialized immediately to prevent flash
    setIsInitialized(true)

    // Show loading screen for a reasonable time
    const timer = setTimeout(() => {
      setIsAppLoading(false)
    }, 1200) // Reduced to 1.2 seconds

    return () => clearTimeout(timer)
  }, [])

  // Click outside handler for image options
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (imageOptionsRef.current && !imageOptionsRef.current.contains(event.target as Node)) {
        setShowImageOptions(false)
      }
    }

    if (showImageOptions) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showImageOptions])

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast({
        title: "🟢 Connection restored",
        description: "You're back online!",
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast({
        title: "🔴 No internet connection",
        description: "Please check your connection to use V-SIDS",
        variant: "info",
      })
    }

    // Simplified network check - just use navigator.onLine
    const checkNetworkStatus = () => {
      setIsOnline(navigator.onLine)
    }

    // Initial check
    checkNetworkStatus()

    // Listen for browser events
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [toast])

  // Load persisted data on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("v-sids-messages")
    const savedImage = localStorage.getItem("v-sids-image")

    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages)
        setMessages(
          parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        )
      } catch (error) {
        console.error("Failed to load saved messages:", error)
      }
    }

    if (savedImage) {
      setUploadedImage(savedImage)
    }
  }, [])

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      compressAndSaveMessages(messages)
    }
  }, [messages])

  // Save image to localStorage
  useEffect(() => {
    if (uploadedImage) {
      localStorage.setItem("v-sids-image", uploadedImage)
    } else {
      localStorage.removeItem("v-sids-image")
    }
  }, [uploadedImage])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    processImageFile(file)
  }

  const processImageFile = (file: File) => {
    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"]
    if (!validTypes.includes(file.type)) {
      toast({
        title: "⚠️ Invalid file type",
        description: "Please upload a clear image of your skin concern (JPG, PNG, heic, heif or WebP)",
        variant: "info",
      })
      return
    }

    // Validate file size (max 5MB to prevent storage issues)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "⚠️ File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "info",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      const base64 = result.split(",")[1] // Extract base64 without data URL prefix
      
      // Store image in memory and set uploaded image for UI
      setImage(base64)
      setUploadedImage(result)
      setImageCount((prev) => prev + 1)

      // Clear conversation history when new image is uploaded
      setMessages([])
      localStorage.removeItem("v-sids-messages")

      toast({
        title: "Image uploaded successfully",
        description: "You can now ask questions about your skin concern",
      })
    }
    reader.onerror = () => {
      toast({
        title: "❌ Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "default",
      })
    }
    reader.readAsDataURL(file)
  }

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

      if (isMobileDevice) {
        fileInputRef.current.setAttribute("capture", "environment")
      } else {
        toast({
          title: "Camera not available",
          description: "Camera capture is only available on mobile devices. Please select from gallery.",
          variant: "default",
        })
        fileInputRef.current.removeAttribute("capture")
      }
      fileInputRef.current.click()
    }
    setShowImageOptions(false)
  }

  const handleGallerySelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute("capture")
      fileInputRef.current.click()
    }
    setShowImageOptions(false)
  }

  const removeImage = () => {
    setUploadedImage(null)
    clearImage() // Clear from memory store
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    toast({
      title: "Image removed",
      description: "Upload a new image to continue",
    })
  }

  const formatAIResponse = (text: string) => {
    // Split by double newlines to create paragraphs
    const paragraphs = text.split("\n\n")

    return paragraphs.map((paragraph, index) => {
      // Handle bold text
      let formattedText = paragraph.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

      // Handle bullet points
      if (formattedText.includes("- ") || formattedText.includes("• ")) {
        const lines = formattedText.split("\n")
        const listItems = lines.map((line) => {
          if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
            return `<li>${line.replace(/^[\s]*[-•]\s*/, "")}</li>`
          }
          return line
        })
        formattedText = `<ul>${listItems.join("")}</ul>`
      }

      // Handle numbered lists
      if (/^\d+\./.test(formattedText.trim())) {
        const lines = formattedText.split("\n")
        const listItems = lines.map((line) => {
          if (/^\d+\./.test(line.trim())) {
            return `<li>${line.replace(/^\d+\.\s*/, "")}</li>`
          }
          return line
        })
        formattedText = `<ol>${listItems.join("")}</ol>`
      }

      return (
        <div key={index} className="mb-3 last:mb-0">
          <div dangerouslySetInnerHTML={{ __html: formattedText }} />
        </div>
      )
    })
  }

  const handleSubmit = async (text?: string) => {
    const messageText = text || inputText.trim()
    if (!messageText) return

    // ONLY show image requirement error if no image has EVER been uploaded
    if (!hasImage()) {
      toast({
        title: "📷 Image required",
        description: "Please upload an image first for skin analysis",
        variant: "info",
      })
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: messageText,
      image: uploadedImage || undefined,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText("")
    setIsLoading(true)

    try {
      console.log("Sending request to API with:", {
        question: messageText,
        hasImage: hasImage(),
      })

      const data = await queryRag(messageText)
      console.log("API Response data:", data)

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: data.response || "I apologize, but I could not process your request at this time. Please try again.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("Diagnosis error:", error)

      let errorMessage =
        "I apologize, but I encountered an error while processing your request. Please check your internet connection and try again."

      if (error instanceof Error) {
        if (error.message.includes("Please upload an image first")) {
          errorMessage = "Please upload an image first for skin analysis."
        } else if (error.message.includes("timeout") || error.message.includes("408")) {
          errorMessage =
            "The request timed out. Please try again with a smaller image or check your internet connection."
        } else if (error.message.includes("429")) {
          errorMessage = "Too many requests. Please wait a moment before trying again."
        } else if (error.message.includes("503") || error.message.includes("500")) {
          errorMessage = "The analysis service is temporarily unavailable. Please try again in a few minutes."
        } else if (error.message.includes("405")) {
          errorMessage = "There's a configuration issue with the analysis service. Please try again later."
        }
      }

      const errorMessageObj: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: errorMessage,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessageObj])

      toast({
        title: "Analysis failed",
        description: "Unable to process your request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const startNewConversation = () => {
    setMessages([])
    setUploadedImage(null)
    clearImage() // Clear from memory store
    setInputText("")
    setEditingMessageId(null)
    setImageCount(0)
    localStorage.removeItem("v-sids-messages")
    localStorage.removeItem("v-sids-image")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    toast({
      title: "New conversation started",
      description: "Previous chat history has been cleared",
    })
  }

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        setCopiedMessageId(messageId)
        setTimeout(() => setCopiedMessageId(null), 2000)
        toast({
          title: "Copied to clipboard",
          description: "Response has been copied to your clipboard",
        })
      } else {
        const textArea = document.createElement("textarea")
        textArea.value = text
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        try {
          document.execCommand("copy")
          setCopiedMessageId(messageId)
          setTimeout(() => setCopiedMessageId(null), 2000)
          toast({
            title: "Copied to clipboard",
            description: "Response has been copied to your clipboard",
          })
        } catch (err) {
          console.error("Fallback copy failed:", err)
          toast({
            title: "Copy failed",
            description: "Unable to copy to clipboard. Please select and copy manually.",
            variant: "default",
          })
        } finally {
          document.body.removeChild(textArea)
        }
      }
    } catch (err) {
      console.error("Copy failed:", err)
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "default",
      })
    }
  }

  const startEditing = (messageId: string, content: string) => {
    setEditingMessageId(messageId)
    setEditingText(content)
  }

  const saveEdit = async () => {
    if (!editingMessageId || !editingText.trim()) return

    const messageIndex = messages.findIndex((msg) => msg.id === editingMessageId)
    if (messageIndex === -1) return

    const updatedMessages = messages.slice(0, messageIndex)
    setMessages(updatedMessages)

    setEditingMessageId(null)
    setEditingText("")

    await handleSubmit(editingText)
  }

  const cancelEdit = () => {
    setEditingMessageId(null)
    setEditingText("")
  }

  const exportConversation = () => {
    const formatTimestamp = (date: Date) => {
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    }

    const formatMessage = (msg: Message) => {
      const sender = msg.type === "user" ? "USER" : "V-SIDS AI"
      const timestamp = formatTimestamp(msg.timestamp)
      const separator = "=".repeat(60)

      let content = `${separator}\n${sender} - ${timestamp}\n${separator}\n\n`

      if (msg.image && msg.type === "user") {
        content += "[IMAGE ATTACHED: Skin concern photo]\n\n"
      }

      // Clean up the message content
      const cleanContent = msg.content
        .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold markdown
        .replace(/\n\n+/g, "\n\n") // Normalize line breaks
        .trim()

      content += cleanContent + "\n\n"

      return content
    }

    const conversationHeader = `V-SIDS CONVERSATION EXPORT
Generated on: ${formatTimestamp(new Date())}
Total Messages: ${messages.length}

${"=".repeat(80)}
MEDICAL DISCLAIMER
${"=".repeat(80)}

This conversation is for informational purposes only and should not replace 
professional medical advice. Please consult with a qualified dermatologist 
or healthcare provider for proper diagnosis and treatment.

${"=".repeat(80)}
CONVERSATION HISTORY
${"=".repeat(80)}

`

    const conversationText = conversationHeader + messages.map(formatMessage).join("\n")

    const blob = new Blob([conversationText], { type: "text/plain; charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `V-SIDS-Conversation-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Conversation exported",
      description: "Your conversation has been saved with proper formatting",
    })
  }

  const hasConversation = messages.length > 0

  const compressAndSaveMessages = (messages: Message[]) => {
    try {
      const recentMessages = messages.slice(-50)
      const compressedMessages = recentMessages.map((msg) => ({
        ...msg,
        image: msg.type === "user" && recentMessages.indexOf(msg) < recentMessages.length - 10 ? undefined : msg.image,
      }))

      const messageString = JSON.stringify(compressedMessages)

      if (messageString.length > 4 * 1024 * 1024) {
        const veryRecentMessages = compressedMessages.slice(-20)
        localStorage.setItem("v-sids-messages", JSON.stringify(veryRecentMessages))
      } else {
        localStorage.setItem("v-sids-messages", messageString)
      }
    } catch (error) {
      console.error("Failed to save messages:", error)
      try {
        const recentMessages = messages.slice(-10).map((msg) => ({
          ...msg,
          image: undefined,
        }))
        localStorage.setItem("v-sids-messages", JSON.stringify(recentMessages))
      } catch (secondError) {
        console.error("Failed to save even compressed messages:", secondError)
        localStorage.removeItem("v-sids-messages")
      }
    }
  }

  // Show loading screen only if not initialized or still loading
  if (!isInitialized || isAppLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center animate-pulse">
            <Stethoscope className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="text-2xl font-semibold text-foreground">V-SIDS</div>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={startNewConversation}
            className="text-2xl font-semibold hover:opacity-80 transition-opacity flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              <Stethoscope className="h-5 w-5" />
            </div>
            V-SIDS
          </button>
          <div className="flex items-center gap-2">
            {hasConversation && (
              <Button variant="outline" size="sm" onClick={exportConversation}>
                Export
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-32">
        {!hasConversation ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center space-y-6">
            <div className="space-y-4 max-w-2xl">
              <h1 className={`font-medium ${isMobile ? "text-2xl" : "text-3xl md:text-4xl"}`}>
                How can I assist with your skin concern?
              </h1>
              <p className={`text-muted-foreground ${isMobile ? "text-sm" : "text-lg"}`}>
                Upload an image and describe your concern for personalized guidance.
              </p>
            </div>
            
            {/* Image Preview for new conversations */}
            {uploadedImage && (
              <div className="max-w-4xl mx-auto w-full">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border-2 border-primary/20">
                  <Image
                    src={uploadedImage || "/placeholder.svg"}
                    alt="Uploaded image"
                    width={60}
                    height={60}
                    className="rounded-lg object-cover"
                  />
                  <span className="text-sm text-muted-foreground flex-1">
                    {hasImage() ? "Active image for analysis" : "Ready for analysis"}
                  </span>
                  <Button size="sm" variant="ghost" onClick={removeImage} className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto py-8 space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <Card
                  className={`max-w-[80%] p-4 ${
                    message.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {message.image && message.type === "user" && (
                    <div className="mb-3">
                      <Image
                        src={message.image || "/placeholder.svg"}
                        alt="Uploaded skin concern"
                        width={200}
                        height={200}
                        className="rounded-lg object-cover"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    {message.type === "ai" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                        {formatAIResponse(message.content)}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    )}
                    <div className="flex items-center justify-between text-xs opacity-70">
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                      <div className="flex gap-2">
                        {message.type === "user" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditing(message.id, message.content)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        )}
                        {message.type === "ai" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(message.content, message.id)}
                              className={`h-6 w-6 p-0 transition-all duration-200 ${
                                copiedMessageId === message.id ? "bg-green-100 dark:bg-green-900 scale-110" : ""
                              }`}
                            >
                              <Copy
                                className={`h-3 w-3 ${copiedMessageId === message.id ? "text-green-600 dark:text-green-400" : ""}`}
                              />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                toast({
                                  title: "Report submitted",
                                  description: "Thank you for your feedback",
                                })
                              }
                              className="h-6 w-6 p-0"
                            >
                              <Flag className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <Card className="bg-muted p-4 min-w-[200px]">
                  <div className="flex items-center gap-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-sm text-muted-foreground">Analyzing your concern...</span>
                  </div>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />

            {/* Image Preview - Positioned at bottom of chat messages */}
            {uploadedImage && (
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border-2 border-primary/20">
                  <Image
                    src={uploadedImage || "/placeholder.svg"}
                    alt="Uploaded image"
                    width={60}
                    height={60}
                    className="rounded-lg object-cover"
                  />
                  <span className="text-sm text-muted-foreground flex-1">
                    {hasImage() ? "Active image for analysis" : "Ready for analysis"}
                  </span>
                  <Button size="sm" variant="ghost" onClick={removeImage} className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4">
        <div className="container mx-auto max-w-4xl">
          {/* Prompt Suggestions */}
          {hasImage() && !hasConversation && (
            <div className="mb-4 flex flex-wrap gap-2">
              {PROMPT_SUGGESTIONS.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSubmit(suggestion.text)}
                  className="text-xs"
                  disabled={isLoading || !isOnline}
                >
                  <span className="mr-1">{suggestion.icon}</span>
                  {suggestion.text}
                </Button>
              ))}
            </div>
          )}

          {/* Edit Mode */}
          {editingMessageId && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-2">
                <Edit2 className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Editing message</span>
              </div>
              <div className="flex gap-2">
                <Input
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  className="flex-1 bg-background text-foreground"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      saveEdit()
                    } else if (e.key === "Escape") {
                      cancelEdit()
                    }
                  }}
                />
                <Button onClick={saveEdit} size="sm" disabled={!editingText.trim()}>
                  Save
                </Button>
                <Button onClick={cancelEdit} size="sm" variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Main Input */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-full">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

            <div className="relative" ref={imageOptionsRef}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowImageOptions(!showImageOptions)}
                className="h-10 w-10 rounded-full p-0 flex-shrink-0"
                disabled={!isOnline}
              >
                <ImageIcon className="h-5 w-5" />
              </Button>

              {showImageOptions && (
                <div className="absolute bottom-12 left-0 bg-background border rounded-lg shadow-lg p-2 space-y-1 z-10 min-w-[160px]">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCameraCapture}
                    className="w-full justify-start text-sm"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleGallerySelect}
                    className="w-full justify-start text-sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose from Gallery
                  </Button>
                </div>
              )}
            </div>

            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                uploadedImage
                  ? "Describe your skin concern..."
                  : isMobile
                    ? "Describe your skin concern..."
                    : "Ask about skin health or upload an image for analysis..."
              }
              className={`flex-1 border-0 bg-transparent focus-visible:ring-0 text-sm placeholder:text-xs placeholder:text-muted-foreground/60 ${
                isMobile ? "min-w-0" : ""
              }`}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              disabled={isLoading || editingMessageId !== null || !isOnline}
            />

            <Button
              size="sm"
              onClick={() => handleSubmit()}
              disabled={!inputText.trim() || isLoading || editingMessageId !== null || !isOnline}
              className="h-10 w-10 rounded-full p-0 flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center mt-2">
            For informational purposes only. Consult a dermatologist for skin medical advice.
          </p>
        </div>
      </div>
    </div>
  )
}
