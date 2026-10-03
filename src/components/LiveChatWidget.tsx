import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, ShieldCheck } from 'lucide-react';

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: string; sender: 'user' | 'agent'; text: string; time: string }>>([
    {
      id: '1',
      sender: 'agent',
      text: 'Hello! Welcome to Safe Global Support 💬. How can we assist you with your account, trading, or deposits today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const smartsuppKey = localStorage.getItem('smartsupp_key');
    if (smartsuppKey && !(window as any).smartsupp) {
      (window as any)._smartsupp = (window as any)._smartsupp || {};
      (window as any)._smartsupp.key = smartsuppKey;
      (function(d: Document) {
        var s: any, c: any, o: any = (window as any).smartsupp = function() { o._.push(arguments); };
        s = d.getElementsByTagName('script')[0];
        c = d.createElement('script');
        c.type = 'text/javascript';
        c.async = true;
        c.src = 'https://www.smartsuppchat.com/loader.js?';
        if (s && s.parentNode) {
          s.parentNode.insertBefore(c, s);
        }
      })(document);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user' as const,
      text: inputVal.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    const query = inputVal.trim();
    setInputVal('');
    setIsTyping(true);

    // Simulate intelligent support agent response
    setTimeout(() => {
      let replyText = "Thank you for your message. Our security and support team is reviewing your inquiry. For immediate assistance with deposits, withdrawals, or KYC, please check your dashboard.";
      
      const qLower = query.toLowerCase();
      if (qLower.includes('deposit') || qLower.includes('fund')) {
        replyText = "To fund your account or deposit crypto/fiat, please visit the Deposit or Crypto Wallet section in your dashboard. Deposits are credited instantly upon network confirmation.";
      } else if (qLower.includes('kyc') || qLower.includes('verify') || qLower.includes('verification')) {
        replyText = "You can submit your KYC documents under the KYC Verification tab in your dashboard. Our compliance team typically reviews submissions within 24 hours.";
      } else if (qLower.includes('trade') || qLower.includes('balance') || qLower.includes('crypto')) {
        replyText = "Your trading balance is synchronized in real-time with your crypto trading wallet. You can view open positions and execute trades from the Trading Dashboard.";
      } else if (qLower.includes('hello') || qLower.includes('hi')) {
        replyText = "Hello! How may Safe Global Bank assist you today?";
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="relative group flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full shadow-2xl transition-all transform hover:scale-105 focus:outline-none"
          title="Open Live Chat"
        >
          <MessageSquare size={24} />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </button>
      ) : (
        <div className="w-[90vw] sm:w-[380px] h-[520px] bg-[#0f1117] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold">
                  <Bot size={20} />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0f1117] rounded-full"></div>
              </div>
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                  Safe Global Support <ShieldCheck size={14} className="text-blue-400" />
                </h4>
                <p className="text-[11px] text-emerald-400 font-medium">Online • Average reply time: instant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#0a0b0e]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-blue-600/30 text-blue-400 border border-blue-500/20'}`}>
                  {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={`space-y-1 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                  <div className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-[#181a22] text-gray-200 border border-white/5 rounded-tl-none'}`}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-gray-500 px-1">{msg.time}</span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2.5 items-center text-gray-400 text-xs italic">
                <div className="w-7 h-7 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <Bot size={14} />
                </div>
                <div className="p-3 bg-[#181a22] rounded-2xl rounded-tl-none border border-white/5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSend} className="p-3 bg-[#121319] border-t border-white/10 flex items-center gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 p-3 bg-[#181a22] border border-white/10 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition shadow-lg shadow-blue-600/20"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
