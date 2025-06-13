
import React from "react";
import { cn } from "../lib/utils";
import { Bot } from "lucide-react";

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  timestamp: string; // 선택적 속성으로 타임스탬프 추가
}

const ChatMessage = ({ content, isUser, timestamp }: ChatMessageProps) => {
  console.log(content);
  return (
    <div className={cn(
      "flex items-end gap-2",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white">
          <Bot size={16} />
        </div>
      )}
      {isUser && (
        <div className="text-xs text-gray-400 mt-1 text-right">
          {timestamp}
        </div>
      )}
      <div className={cn(
        "max-w-[72%] rounded-xl p-3 shadow-sm",
        isUser 
          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-none" 
          : "bg-white rounded-bl-none"
      )}>
        <p className="text-sm whitespace-pre-wrap">{content}</p>
      </div>
        {!isUser && (
          <div className="text-xs text-gray-400 text-left">
            {timestamp}
          </div>
        )}
    </div>
  );
};

export default ChatMessage;
