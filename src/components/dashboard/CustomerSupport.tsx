import React, { useState } from 'react';
import { MessageSquare, FileText, PhoneCall, HelpCircle, Send } from 'lucide-react';

export default function CustomerSupport() {
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! I am the Safe Global AI Assistant. How can I help you today?' }
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    setMessages([...messages, { sender: 'user', text: chatMessage }]);
    setChatMessage('');
    
    // Simulate bot response
    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'bot', text: 'I understand you need help. Our live agents are currently busy, but I have created a ticket for your request. Is there anything else?' }]);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <HelpCircle size={32} className="text-blue-900" />
        <h2 className="text-2xl font-bold">Customer Support</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <PhoneCall size={32} />
            </div>
            <h3 className="font-bold text-lg mb-2">Call Us</h3>
            <p className="text-gray-500 text-sm mb-4">Available 24/7 for urgent issues regarding lost cards or fraud.</p>
            <p className="text-xl font-bold text-blue-900">+1 (800) 555-SAFE</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-gray-500" /> Open Tickets
            </h3>
            <div className="space-y-3">
              <div className="p-3 border border-gray-100 rounded-xl">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-semibold text-sm">International Transfer Delay</p>
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">Pending</span>
                </div>
                <p className="text-xs text-gray-500">Ticket #8821 • Updated 2 hrs ago</p>
              </div>
              <button className="w-full text-sm text-blue-600 font-semibold hover:underline">View all tickets</button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 h-[600px] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50 rounded-t-2xl">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Live Chat</h3>
                <p className="text-xs text-green-600 font-medium">AI Assistant is online</p>
              </div>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-900 rounded-bl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type your message..." 
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button type="submit" className="p-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition flex items-center justify-center">
                  <Send size={20} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
