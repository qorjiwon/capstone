'use client';

import React, { useState, useRef, useEffect } from "react";
import { Send, X } from "lucide-react";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import { cn } from "../lib/utils";
import { streamChatResponse, login } from "../api/chatstream";

interface ChatInterfaceProps {
  className?: string;
}

const ChatInterface = ({ className }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Array<{ content: string; isUser: boolean }>>([
    { content: "안녕하세요! 무엇을 도와드릴까요?", isUser: false },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [, setShowSurvey] = useState(false);

  const messagesCountRef = useRef(0);

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

    setMessages(prev => {
      messagesCountRef.current = prev.length;
      return [...prev, { content: inputValue, isUser: true }];
    });

    // 2) AI 응답 자리 표시자 추가
    setMessages(prev => {
      messagesCountRef.current = prev.length;
      return [...prev, { content: '', isUser: false }];
    });

    const placeholderIndex = messagesCountRef.current;
    const question = inputValue;
    setInputValue('');
    setIsTyping(true);

    streamChatResponse(
      question,
      (msg) => {
        try {
          const { answer } = JSON.parse(msg) as { answer: string };
          setMessages(prev =>
            prev.map((m, idx) =>
              idx === placeholderIndex
                ? { ...m, content: m.content + answer }
                : m
            )
          );
        } catch (e) {
          console.warn('파싱 에러:', e);
        }
      },
      (err) => {
        console.error('스트리밍 오류:', err);
        setMessages(prev => [
          ...prev,
          { content: '죄송합니다. 응답을 가져오는 중 오류가 발생했습니다.', isUser: false }
        ]);
        setIsTyping(false);
      },
      () => {
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
    <div className={cn("flex flex-col h-[600px] w-full max-w-md rounded-xl overflow-hidden shadow-lg bg-white", className)}>
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