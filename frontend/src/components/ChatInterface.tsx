import React, { useState, useRef, useEffect } from 'react';
import { Send, Minimize2, Maximize2, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatInterfaceProps {
  onSendMessage: (message: string) => Promise<void>;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onSendMessage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      type: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);

    try {
      await onSendMessage(message);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'I received your message and am processing it...',
        type: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
      >
        <Maximize2 size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-gray-800 rounded-lg shadow-xl flex flex-col">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold">Chat with LinkBender</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <Minimize2 size={20} />
        </button>
      </div>

      <div className="flex-1 p-4 h-96 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-4 ${
              msg.type === 'user' ? 'ml-auto' : 'mr-auto'
            }`}
          >
            <div
              className={`p-3 rounded-lg max-w-[80%] ${
                msg.type === 'user'
                  ? 'bg-blue-500 text-white ml-auto'
                  : 'bg-gray-700 text-gray-200'
              }`}
            >
              {msg.content}
            </div>
            <div
              className={`text-xs text-gray-400 mt-1 ${
                msg.type === 'user' ? 'text-right' : 'text-left'
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

      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || isTyping}
            className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};