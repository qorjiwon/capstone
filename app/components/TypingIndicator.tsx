
import React from "react";
import { Bot } from "lucide-react";

const TypingIndicator = () => {
  return (
    <div className="flex items-end gap-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white">
        <Bot size={16} />
      </div>
      
      <div className="bg-white rounded-xl p-3 shadow-sm rounded-bl-none">
        <div className="flex space-x-1">
          {[1, 2, 3].map((dot) => (
            <div
              key={dot}
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ 
                animationDelay: `${dot * 0.2}s`, 
                animationDuration: "1s" 
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
