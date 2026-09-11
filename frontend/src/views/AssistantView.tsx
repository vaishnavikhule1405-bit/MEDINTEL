import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Send,
  Wrench,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { assistantApi } from '../api/client';
import { SafetyDisclaimer } from '../components/SafetyDisclaimer';
import { Badge } from '../components/Badge';
import { AssistantMessage } from '../types';

const TOOLS_LIST = [
  { name: 'analyze_symptoms',         icon: '🩺', desc: 'Vectorizes 174 symptoms & runs XGBoost' },
  { name: 'analyze_xray',             icon: '🩻', desc: 'Custom CNN inference & Grad-CAM' },
  { name: 'analyze_medical_report',   icon: '📄', desc: 'BioBERT NER & negation detection' },
  { name: 'fuse_multimodal_evidence', icon: '🔗', desc: 'Late Evidence Fusion index' },
  { name: 'retrieve_similar_reports', icon: '🔍', desc: 'S-PubMedBERT similarity search' },
  { name: 'get_model_explanation',    icon: '🧠', desc: 'TreeSHAP global/local attributions' },
  { name: 'get_case_history',         icon: '📁', desc: 'Dossier retrieval for consultations' },
  { name: 'summarize_case',           icon: '📝', desc: 'Integrated synthesis & next steps' },
];

const GUARDRAILS = [
  'For investigational reference only',
  'Requires clinician verification',
  'No real patient PHI processed',
  'Hallucinations may occur',
];

export const AssistantView: React.FC = () => {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello, I'm MEDINTEL's Agentic Clinical Copilot. I can orchestrate 8 diagnostic tools across clinical symptom vectors, chest radiographs, medical dictation NLP, and late evidence fusion. How can I assist your clinical decision-making today?",
      safety_notes: [
        'AI-Assisted Decision Support: For investigational and clinical reference only.',
        'Always confirm findings with patient laboratory results and physical examination.',
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState<string>(() => 'sess_' + Math.random().toString(36).substring(2, 9));
  const [expandedToolMsgId, setExpandedToolMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadTools() {
      try {
        await assistantApi.getTools();
      } catch (err) {
        console.error('Failed to load assistant tools metadata:', err);
      }
    }
    loadTools();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const query = inputText.trim();
    if (!query || loading) return;

    const userMessage: AssistantMessage = {
      id: 'user_' + Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const res = await assistantApi.chat(query, sessionId);
      const assistantMsg: AssistantMessage = {
        id: 'asst_' + Date.now(),
        role: 'assistant',
        content: res.reply || res.response || 'Inquiry processed.',
        tool_calls: res.tools_executed || res.tool_calls || [],
        safety_notes: res.safety_notes || ['Clinical Decision Support: Outputs require clinician verification.'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: AssistantMessage = {
        id: 'err_' + Date.now(),
        role: 'assistant',
        content: `Sorry, an error occurred while processing your clinical inquiry: ${err.message || 'Service unreachable'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const toggleToolExpanded = (msgId: string) => {
    setExpandedToolMsgId(expandedToolMsgId === msgId ? null : msgId);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <SafetyDisclaimer />

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Clinical Assistant</h1>
        <Badge variant="beta" label="Beta" />
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ height: '680px' }}>

        {/* Left Sidebar: Tools + Guardrails */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto">
          {/* Available Tools */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <h3 className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-3">
              Available Tools
            </h3>
            <div className="space-y-3">
              {TOOLS_LIST.map((tool) => (
                <div key={tool.name} className="flex gap-2 text-sm">
                  <span className="shrink-0 text-base leading-none mt-0.5">{tool.icon}</span>
                  <div className="min-w-0">
                    <div className="font-medium text-zinc-800 dark:text-zinc-200 text-xs truncate">{tool.name}</div>
                    <div className="text-zinc-500 dark:text-zinc-400 text-xs leading-tight">{tool.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Guardrails */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <h3 className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Guardrails
            </h3>
            <ul className="space-y-2">
              {GUARDRAILS.map((rule, idx) => (
                <li key={idx} className="flex gap-2 text-xs text-zinc-600 dark:text-zinc-400 items-start">
                  <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="lg:col-span-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden">

          {/* Messages Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-600 space-y-3">
                <Bot className="w-10 h-10" />
                <p className="text-sm">Ask me about patient symptoms, X-rays, or clinical reports</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                const wrapperCls = isUser
                  ? 'flex items-start gap-3 flex-row-reverse'
                  : 'flex items-start gap-3 flex-row';
                const avatarCls = isUser
                  ? 'w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-emerald-600 text-white'
                  : 'w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300';
                const bubbleCls = isUser
                  ? 'px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed bg-emerald-50 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100'
                  : 'px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200';
                const timeCls = isUser
                  ? 'text-[10px] text-zinc-400 dark:text-zinc-600 px-1 text-right'
                  : 'text-[10px] text-zinc-400 dark:text-zinc-600 px-1 text-left';

                return (
                  <div key={msg.id} className={wrapperCls}>
                    <div className={avatarCls}>
                      {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    <div className="max-w-[80%] space-y-2">
                      <div className={bubbleCls}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>

                      {/* Tool Traces */}
                      {msg.tool_calls && msg.tool_calls.length > 0 && (
                        <div className="w-full">
                          <button
                            onClick={() => toggleToolExpanded(msg.id)}
                            className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                          >
                            {expandedToolMsgId === msg.id
                              ? <ChevronDown className="w-3 h-3" />
                              : <ChevronRight className="w-3 h-3" />}
                            <Wrench className="w-3 h-3" />
                            {msg.tool_calls.length} tool{msg.tool_calls.length !== 1 ? 's' : ''} executed
                          </button>
                          {expandedToolMsgId === msg.id && (
                            <div className="mt-1.5 space-y-1">
                              {msg.tool_calls.map((tc, idx) => (
                                <div
                                  key={idx}
                                  className="px-3 py-1.5 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-xs font-mono flex items-center justify-between"
                                >
                                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ {tc.tool_name}</span>
                                  <span className="text-zinc-400">{tc.success ? 'Success' : 'Failed'}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Safety Notes */}
                      {msg.safety_notes && msg.safety_notes.length > 0 && (
                        <div className="flex gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-400">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            {msg.safety_notes.map((sn, i) => <div key={i}>{sn}</div>)}
                          </div>
                        </div>
                      )}

                      <div className={timeCls}>{msg.timestamp}</div>
                    </div>
                  </div>
                );
              })
            )}

            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                  <span className="text-sm text-zinc-500">Synthesizing clinical response...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-end gap-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about symptoms, X-ray findings, or clinical reports... (Enter to send)"
                rows={2}
                className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              />
              <button
                onClick={handleSend}
                disabled={loading || !inputText.trim()}
                className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors duration-150 flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantView;
