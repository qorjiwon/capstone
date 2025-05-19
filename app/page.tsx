"use client";

import React, { useState } from "react";
import ChatInterface from "./components/ChatInterface";

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4 relative">
      {/* Floating Chat Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-blue-500 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center text-2xl hover:bg-blue-600 transition"
      >
        💬
      </button>

      {/* Chat Interface */}
      {isChatOpen && (
        <div className="fixed bottom-25 right-6 w-96 max-w-full shadow-xl rounded-xl bg-white z-50">
          <ChatInterface />
        </div>
      )}
    </div>
  );
}
