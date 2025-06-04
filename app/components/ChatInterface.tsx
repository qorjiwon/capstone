'use client';

import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import { cn } from "../lib/utils";
import { connectToChatStream, login } from "../api/chatstream";

interface ChatInterfaceProps {
  className?: string;
}

const ChatInterface = ({ className }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Array<{ content: string; isUser: boolean }>>([
    { content: "안녕하세요! 무엇을 도와드릴까요?", isUser: false },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<EventSource | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    (async () => {
      try {
        await login("testid1", "testpw1");
      } catch (e) {
        console.error("로그인 실패", e);
      }
    })();
  }, []);  

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const stream = connectToChatStream({
      prompt: "AI야 안녕",
      userId: "user123",
      onMessage: (data) => {
        console.log("받은 응답:", data);
      },
      onError: (err) => {
        console.warn("연결 중 오류 발생:", err);
      },
    });

    streamRef.current = stream;

    return () => {
      stream.close();
    };
  }, []);

  const handleSendMessage = () => {
    if (inputValue.trim() === "") return;
  
    const userMessage = { content: inputValue, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
  
    const access = localStorage.getItem("access") ?? "";
  
    const stream = connectToChatStream({
      prompt: userMessage.content,
      userId: access,
      onMessage: (data) => {
        setIsTyping(false);
        setMessages((prev) => [...prev, { content: data, isUser: false }]);
      },
      onError: (error) => {
        console.error("스트리밍 에러:", error);
        setIsTyping(false);
        setMessages((prev) => [...prev, { content: "오류가 발생했습니다.", isUser: false }]);
      },
    });
  
    streamRef.current = stream;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={cn("flex flex-col h-[600px] w-full max-w-md rounded-xl overflow-hidden shadow-lg bg-white", className)}>
      {/* Chat header */}
      <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
        <h2 className="font-semibold">AI 챗봇</h2>
        <div className="text-xs opacity-80">실시간 대화형 도우미</div>
      </div>
      
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message, index) => (
          <ChatMessage 
            key={index} 
            content={message.content} 
            isUser={message.isUser} 
          />
        ))}
        
        {isTyping && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="p-4 bg-white">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            className="flex-1 py-2 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button
            onClick={handleSendMessage}
            disabled={inputValue.trim() === ""}
            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
