import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Square, RotateCcw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { type Module, MODELS } from '@/lib/modules'
import { type ChatMessage, streamChat } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Props {
  module: Module
}

export function ChatInterface({ module }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [model, setModel] = useState(module.defaultModel ?? MODELS[0].id)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setMessages([])
    setInput('')
    setModel(module.defaultModel ?? MODELS[0].id)
  }, [module.id, module.defaultModel])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isStreaming) return

    const userMessage: ChatMessage = { role: 'user', content: text }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsStreaming(true)

    const assistantMessage: ChatMessage = { role: 'assistant', content: '' }
    setMessages([...newMessages, assistantMessage])

    const controller = new AbortController()
    abortRef.current = controller

    try {
      await streamChat(
        newMessages,
        model,
        module.systemPrompt ?? '',
        (chunk) => {
          assistantMessage.content += chunk
          setMessages((prev) => [...prev.slice(0, -1), { ...assistantMessage }])
        },
        controller.signal
      )
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        assistantMessage.content = assistantMessage.content || `抱歉，發生錯誤：${(err as Error).message}`
        setMessages((prev) => [...prev.slice(0, -1), { ...assistantMessage }])
      }
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [input, isStreaming, messages, model, module.systemPrompt])

  const stopStreaming = () => {
    abortRef.current?.abort()
    setIsStreaming(false)
  }

  const clearChat = () => {
    if (isStreaming) stopStreaming()
    setMessages([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const selectedModel = MODELS.find((m) => m.id === model)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{module.icon}</span>
          <div>
            <h2 className="font-semibold text-lg text-foreground">{module.name}</h2>
            <p className="text-sm text-muted-foreground">{module.nameEn}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <Select value={model} onValueChange={setModel} className="w-48">
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </Select>
          </div>
          <Button variant="ghost" size="icon" onClick={clearChat} title="清除對話">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-6">
        {messages.length === 0 ? (
          <div className="relative flex flex-col items-center justify-center h-full text-center py-20">
            {module.id === 'assistant' && (
              <img src="/assets/chat-assistant-bg.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none" />
            )}
            {module.id === 'recipe' && (
              <img src="/assets/chat-recipe-bg.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none" />
            )}
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-5xl mb-4">{module.icon}</span>
              <h3 className="text-xl font-semibold text-foreground mb-2">{module.name}</h3>
              <p className="text-muted-foreground max-w-md mb-6">{module.description}</p>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                {selectedModel?.name} - {selectedModel?.description}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <Avatar className="h-8 w-8 shrink-0 mt-1">
                    <AvatarFallback className="bg-primary/10 text-sm">{module.icon}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap",
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  )}
                >
                  {msg.content}
                  {isStreaming && i === messages.length - 1 && msg.role === 'assistant' && (
                    <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse" />
                  )}
                </div>
                {msg.role === 'user' && (
                  <Avatar className="h-8 w-8 shrink-0 mt-1">
                    <AvatarFallback className="bg-secondary text-xs">You</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4 bg-white">
        <div className="max-w-3xl mx-auto flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`向${module.name}提問...`}
            className="min-h-[44px] max-h-[120px] resize-none rounded-xl"
            rows={1}
          />
          {isStreaming ? (
            <Button variant="destructive" size="icon" onClick={stopStreaming} className="shrink-0 rounded-xl">
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!input.trim()}
              className="shrink-0 rounded-xl"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
