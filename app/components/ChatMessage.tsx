
import React from "react";
import { cn } from "../lib/utils";
import { Bot } from "lucide-react";

interface ChatMessageProps {
  content: string;
  isUser: boolean;
}

const ChatMessage = ({ content, isUser }: ChatMessageProps) => {
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
      
      <div className={cn(
        "max-w-[80%] rounded-xl p-3 shadow-sm",
        isUser 
          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-none" 
          : "bg-white rounded-bl-none"
      )}>
        <p className="text-sm whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
