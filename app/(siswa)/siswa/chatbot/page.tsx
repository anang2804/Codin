"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2 } from "lucide-react";
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

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Halo! Saya adalah asisten pembelajaran LogiCode. Ada yang bisa saya bantu?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim() || isLoading || !userProfile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const questionText = inputMessage;
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
    <div className="flex flex-col h-screen bg-white">
      {/* Header - Claude style */}
      <div className="border-b border-gray-200 px-4 md:px-6 py-3 bg-white">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-7 h-7 bg-green-600 rounded-md flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-sm md:text-base font-medium text-gray-900">
              LogiCode Assistant
            </h1>
          </div>
          {userProfile && (
            <div className="text-xs md:text-sm text-gray-500 truncate max-w-[150px] md:max-w-none">
              {userProfile.full_name}
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 md:gap-4 ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.sender === "bot" && (
                  <Avatar className="h-7 w-7 md:h-8 md:w-8 bg-green-600 flex-shrink-0">
                    <AvatarFallback className="bg-green-600 text-white">
                      <Bot className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className="flex flex-col max-w-[85%] md:max-w-[80%]">
                  <div
                    className={`${
                      message.sender === "user"
                        ? "bg-gray-100 rounded-2xl px-3.5 md:px-4 py-2.5"
                        : ""
                    }`}
                  >
                    {message.sender === "user" ? (
                      <p className="text-sm text-gray-900 leading-relaxed">
                        {message.content}
                      </p>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => (
                              <p className="text-sm text-gray-900 leading-relaxed mb-3 last:mb-0">
                                {children}
                              </p>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-gray-900">
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic">{children}</em>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc list-outside ml-4 space-y-1 my-3">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-outside ml-4 space-y-1 my-3">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="text-sm text-gray-900 leading-relaxed">
                                {children}
                              </li>
                            ),
                            h1: ({ children }) => (
                              <h1 className="text-lg font-semibold text-gray-900 mt-4 mb-2">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-base font-semibold text-gray-900 mt-3 mb-2">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-sm font-semibold text-gray-900 mt-2 mb-1">
                                {children}
                              </h3>
                            ),
                            code: ({ children, className }) => {
                              const isInline = !className;
                              return isInline ? (
                                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-gray-900">
                                  {children}
                                </code>
                              ) : (
                                <code className="block bg-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto my-3">
                                  {children}
                                </code>
                              );
                            },
                            a: ({ children, href }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {children}
                              </a>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-2 border-gray-300 pl-3 text-gray-700 my-3">
                                {children}
                              </blockquote>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span
                    className={`text-xs text-gray-400 mt-1 ${
                      message.sender === "user" ? "text-right mr-1" : "ml-1"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {message.sender === "user" && (
                  <Avatar className="h-7 w-7 md:h-8 md:w-8 bg-gray-700 flex-shrink-0">
                    <AvatarFallback className="bg-gray-700 text-white">
                      <User className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 md:gap-4">
                <Avatar className="h-7 w-7 md:h-8 md:w-8 bg-green-600">
                  <AvatarFallback className="bg-green-600 text-white">
                    <Bot className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1 py-2">
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
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="border-t border-gray-200 bg-white px-4 md:px-6 py-3 md:py-4">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSendMessage}
            className="flex gap-2 md:gap-3 items-center"
          >
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Tanya sesuatu..."
              disabled={isLoading}
              className="flex-1 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm"
            />
            <Button
              type="submit"
              disabled={isLoading || !inputMessage.trim() || !userProfile}
              size="icon"
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-9 w-9 md:h-10 md:w-10 flex-shrink-0"
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
    </div>
  );
}
