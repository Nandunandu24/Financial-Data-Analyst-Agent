import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { chatAboutData, analyzeDataset } from '../services/geminiService';
import { Dataset, ChatMessage, AnalysisResponse } from '../types';

interface AnalystChatProps {
  dataset: Dataset;
  onAnalysisResult: (analysis: AnalysisResponse) => void;
}

export function AnalystChat({ dataset, onAnalysisResult }: AnalystChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dataset && messages.length === 0) {
      setMessages([{
        role: 'system',
        content: `Dataset "${dataset.name}" loaded with ${dataset.data.length} rows. I'm ready to analyze it.`,
        timestamp: new Date().toISOString()
      }]);
      handleAutoAnalysis();
    }
  }, [dataset]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAutoAnalysis = async () => {
    setLoading(true);
    try {
      const result = await analyzeDataset(dataset);
      onAnalysisResult(result);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I've performed an initial scan. I found ${result.insights.length} key insights and prepared ${result.suggestedVisualizations.length} visualization ideas. What would you like to explore?`,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatAboutData(
        [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        dataset
      );

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response || "I'm sorry, I couldn't process that request.",
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel h-[600px] flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-brand-line/5 bg-brand-ink/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4" />
          <span className="text-xs font-mono font-bold uppercase tracking-tight">Agent IQ</span>
        </div>
        {loading && <div className="text-[10px] animate-pulse flex items-center gap-1"><Sparkles className="w-3 h-3" /> Processing...</div>}
      </div>

      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-hide">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role !== 'user' && (
              <div className="w-7 h-7 rounded-full bg-brand-ink flex items-center justify-center text-white shrink-0">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-brand-ink text-white rounded-tr-none' 
                : 'bg-brand-ink/5 border border-brand-line/5 rounded-tl-none'
            }`}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-white border border-brand-line/10 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-brand-line/5">
        <div className="relative">
          <input
            type="text"
            className="w-full bg-white/50 border border-brand-line/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-ink/50 transition-colors pr-10"
            placeholder="Ask about your data..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <button 
            onClick={handleSend}
            className="absolute right-2 top-1.5 p-1 hover:bg-brand-ink rounded-lg hover:text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-brand-muted mt-2 text-center">
          AnalystIQ can reason about trends, outliers, and data structures.
        </p>
      </div>
    </div>
  );
}
