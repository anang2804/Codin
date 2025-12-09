"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Send,
  Bot,
  User,
  Loader2,
  X,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface UserProfile {
  id: string;
  full_name: string;
}

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    {
      icon: "📚",
      title: "Bagaimana progres belajar saya kemarin?",
      question: "Bagaimana progres belajar saya kemarin?",
    },
  ];

  useEffect(() => {
    const fetchUserProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("id", user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
          // Set initial greeting message with user's name
          setMessages([
            {
              id: "1",
              content: `Hai di sana ${profile.full_name} 👋\n\nSaya di sini membantu Anda meningkatkan pemahaman dan keterampilan belajar bersama Codin.`,
              sender: "bot",
              timestamp: new Date(),
            },
          ]);
        }
      }
    };

    fetchUserProfile();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSuggestionClick = (question: string) => {
    setShowSuggestions(false);
    setInputMessage(question);
    // Auto submit the question
    const event = new Event("submit", { cancelable: true, bubbles: true });
    handleSendMessage(event as any, question);
  };

  const handleSendMessage = async (
    e: React.FormEvent,
    predefinedQuestion?: string
  ) => {
    e.preventDefault();

    const questionText = predefinedQuestion || inputMessage;
    if (!questionText.trim() || isLoading || !userProfile) return;

    setShowSuggestions(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: questionText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(
        "https://n8n-2c13xchuqnsv.sumopod.my/webhook-test/07371c62-ffc1-44a9-9043-cad5e1459df3",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pdf_link:
              "https://docs.google.com/document/d/1fzJ1GAdicU7bmCJxn-Ugh2ETkYgtH38sTRKLLqDLMjU/edit?usp=sharing",
            user_question: questionText,
            user_id: userProfile.id,
            user_name: userProfile.full_name || "User",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response from chatbot");
      }

      const responseText = await response.text();
      let botResponseText =
        "Maaf, saya tidak dapat memproses pertanyaan Anda saat ini.";

      try {
        const data = JSON.parse(responseText);

        if (Array.isArray(data) && data.length > 0) {
          const firstItem = data[0];
          if (firstItem.content?.parts?.[0]?.text) {
            botResponseText = firstItem.content.parts[0].text;
          }
        } else if (data.response) {
          botResponseText = data.response;
        } else if (data.answer) {
          botResponseText = data.answer;
        } else if (data.message) {
          botResponseText = data.message;
        } else if (data.content?.parts?.[0]?.text) {
          botResponseText = data.content.parts[0].text;
        } else if (typeof data === "string") {
          botResponseText = data;
        }
      } catch (parseError) {
        if (responseText && responseText.trim().length > 0) {
          botResponseText = responseText;
        }
      }

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponseText,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("Error calling chatbot API:", error);
      toast.error("Gagal mendapatkan response dari chatbot");

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "Maaf, terjadi kesalahan saat menghubungi server. Silakan coba lagi nanti.",
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-blue-500 to-green-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-110"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <div className="relative">
            <Sparkles className="h-6 w-6 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-h-[calc(100vh-140px)] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-green-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <Bot className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-semibold text-sm">Asisten AI</h3>
                <span className="bg-green-400 text-green-900 text-xs font-semibold px-2 py-0.5 rounded">
                  Beta
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-teal-50 to-white p-4">
            <div className="space-y-4">
              {/* Suggestion Cards - Show first */}
              {showSuggestions && messages.length <= 1 && (
                <div className="grid grid-cols-1 gap-3">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion.question)}
                      className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{suggestion.icon}</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-2">
                            {suggestion.title}
                          </p>
                          <span className="text-xs text-teal-600 font-medium">
                            Lihat
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.sender === "bot" && (
                    <Avatar className="h-7 w-7 bg-gradient-to-br from-blue-500 to-green-500 flex-shrink-0">
                      <AvatarFallback className="bg-transparent text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="flex flex-col max-w-[75%]">
                    <div
                      className={`${
                        message.sender === "user"
                          ? "bg-blue-500 text-white rounded-2xl rounded-tr-sm px-3 py-2"
                          : "bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3 py-2"
                      }`}
                    >
                      {message.sender === "user" ? (
                        <p className="text-sm leading-relaxed">
                          {message.content}
                        </p>
                      ) : (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => (
                                <p className="text-sm text-gray-900 leading-relaxed mb-2 last:mb-0">
                                  {children}
                                </p>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold">
                                  {children}
                                </strong>
                              ),
                              code: ({ children, className }) => {
                                const isInline = !className;
                                return isInline ? (
                                  <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">
                                    {children}
                                  </code>
                                ) : (
                                  <code className="block bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto my-2">
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-xs text-gray-400 mt-1 ${
                        message.sender === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {message.sender === "user" && (
                    <Avatar className="h-7 w-7 bg-gray-700 flex-shrink-0">
                      <AvatarFallback className="bg-gray-700 text-white">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2">
                  <Avatar className="h-7 w-7 bg-gradient-to-br from-blue-500 to-green-500">
                    <AvatarFallback className="bg-transparent text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-3">
            <form
              onSubmit={handleSendMessage}
              className="flex gap-2 items-center"
            >
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ketik pesan..."
                disabled={isLoading}
                className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-full px-4 text-sm"
              />
              <Button
                type="submit"
                disabled={isLoading || !inputMessage.trim() || !userProfile}
                size="icon"
                className="bg-gradient-to-br from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white rounded-full h-9 w-9 flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
