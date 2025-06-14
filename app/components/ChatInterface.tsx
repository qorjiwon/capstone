'use client';

import React, { useState, useRef, useEffect } from "react";
import { Send, X } from "lucide-react";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import { cn } from "../lib/utils";
import { streamChatResponse } from "../api/chatstream";
import { login } from "../api/auth";

interface Message {
  content: string;
  isUser: boolean;
  timestamp: string;
}

const ChatInterface = ({ className }: { className?: string }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      content: "안녕하세요! 무엇을 도와드릴까요?",
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [, setIsTyping] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [, setShowSurvey] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 자동 로그인
  useEffect(() => {
    (async () => {
      try {
        await login("testid1", "testpw1");
        setIsLoggedIn(true);
        console.log("로그인 성공!");
      } catch (e) {
        console.error("로그인 실패", e);
        setIsLoggedIn(false);
      }
    })();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = () => {
    if (inputValue.trim() === '' || !isLoggedIn) return;

    const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const userMsg = { content: inputValue, isUser: true, timestamp: now };
    const placeholderMsg = { content: '', isUser: false, timestamp: now };

    const newMessages = [...messages, userMsg, placeholderMsg];

    setMessages(newMessages);
    const placeholderIndex = newMessages.length - 1;

    setInputValue('');
    setIsTyping(true);

    streamChatResponse(
      inputValue,
      (chunk: string) => {
        setMessages(prev =>
          prev.map((m, idx) =>
            idx === placeholderIndex
              ? { ...m, content: m.content + chunk }
              : m
          )
        );
      },
      (err) => {
        console.error('스트리밍 오류:', err);
        setMessages(prev => [
          ...prev,
          { content: '죄송합니다. 응답을 가져오는 중 오류가 발생했습니다.', isUser: false, timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }
        ]);
        setIsTyping(false);
      }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={cn("flex flex-col h-[680px] w-full max-w-md rounded-xl overflow-hidden shadow-lg bg-white", className)}>
      {/* Chat header */}
      <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white flex justify-between items-center">
        <div>
          <h2 className="font-semibold">AI 챗봇</h2>
          <div className="text-xs opacity-80">실시간 대화형 도우미</div>
        </div>
        <button
          onClick={() => setShowSurvey(true)}
          className="w-6 h-6 text-white rounded-full flex items-center justify-center hover:bg-accent hover:text-accent-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-gray-50">

        {messages.map((message, index) => {
          if (!message.isUser && message.content === '') {
            // AI placeholder 메시지이고 content가 아직 비어있으면 typing 인디케이터
            return <TypingIndicator key={index} />;
          }
          // 그 외 (유저 메시지, 혹은 AI 실제 응답 메시지)
          return (
            <ChatMessage
              key={index}
              content={message.content}
              isUser={message.isUser}
              timestamp={message.timestamp}
            />
          );
        })}

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