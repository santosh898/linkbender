import React, { useState, useEffect, useRef } from "react";
import { Loader2, Minimize2 } from "lucide-react";

interface ChatMessage {
  id: number;
  content: string;
  type: "user" | "assistant";
  timestamp: Date;
}

interface ChatInterfaceProps {
  onSendMessage: (message: string) => Promise<any>;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onSendMessage,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      content: input,
      type: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    const response = await onSendMessage(input);

    if (response && response.results) {
      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        content: response.results
          .map(
            (result: any) => `
              <div class="bg-gray-800 p-4 rounded-lg mb-4">
                <h4 class="text-lg font-semibold text-blue-400">URL: <a href="${result.url}" target="_blank" class="underline">${result.url}</a></h4>
                <p class="text-gray-300">Summary: ${result.summary}</p>
                <p class="text-gray-400">Grade: <span class="font-bold">${result.grade}</span></p>
                <p class="text-gray-400">Badge: <span class="font-bold">${result.badge}</span></p>
              </div>
            `
          )
          .join(""),
        type: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } else {
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        content:
          "Sorry, I couldn't retrieve the information. Please try again.",
        type: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setIsTyping(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-gray-900 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">
          Chat with LinkBender
        </h3>
        <button
          onClick={() => setMessages([])} // Clear chat button
          className="text-gray-400 hover:text-white transition-colors"
        >
          <Minimize2 size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-800 rounded-lg p-4 mb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-4 ${
              msg.type === "user" ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`p-3 rounded-lg max-w-[80%] ${
                msg.type === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 text-gray-200"
              }`}
            >
              {msg.type === "assistant" ? (
                <div dangerouslySetInnerHTML={{ __html: msg.content }} />
              ) : (
                msg.content
              )}
            </div>
            <div
              className={`text-xs text-gray-400 mt-1 ${
                msg.type === "user" ? "text-right" : "text-left"
              }`}
            >
              {msg.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 size={16} className="animate-spin" />
            LinkBender is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 bg-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
        />
        <button
          onClick={handleSend}
          className="ml-2 p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
};
