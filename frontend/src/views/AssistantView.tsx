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
  Sparkles,
  ImagePlus,
  X,
} from 'lucide-react';
import { assistantApi } from '../api/client';
import { SafetyDisclaimer } from '../components/SafetyDisclaimer';
import { Badge } from '../components/Badge';
import {
  AssistantHistoryTurn,
  AssistantMessage,
  AssistantStatusResponse,
  AssistantToolMetadata,
} from '../types';

const TOOL_ICONS: Record<string, string> = {
  analyze_symptoms: '🩺',
  analyze_xray: '🩻',
  analyze_medical_report: '📄',
  get_case_history: '📁',
  get_model_explanation: '🧠',
  get_multimodal_evidence: '🔗',
  retrieve_similar_reports: '🔍',
  summarize_case: '📝',
};

const STARTER_PROMPTS = [
  'Analyze cough, fever, and shortness of breath',
  'Explain how symptom model confidence is calculated',
  'How do I analyze a chest X-ray?',
];

const formatTimestamp = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatAssistantContent = (content: string) =>
  content.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });

export const AssistantView: React.FC = () => {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hi! I can analyze symptoms you enter, a medical note you paste, or a chest X-ray you attach. I can also explain MEDINTEL model results and look up saved cases. I’ll show which tools ran and when something could not be analyzed. These results support—not replace—clinical judgment.",
      safety_notes: [
        'AI-Assisted Decision Support: For investigational and clinical reference only.',
        'Always confirm findings with patient laboratory results and physical examination.',
      ],
      timestamp: formatTimestamp(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [symptomsText, setSymptomsText] = useState('');
  const [medicalText, setMedicalText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const [expandedToolMsgId, setExpandedToolMsgId] = useState<string | null>(null);
  const [tools, setTools] = useState<AssistantToolMetadata[]>([]);
  const [guardrails, setGuardrails] = useState<string[]>([]);
  const [toolsError, setToolsError] = useState<string | null>(null);
  const [assistantStatus, setAssistantStatus] = useState<AssistantStatusResponse | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadTools() {
      try {
        const response = await assistantApi.getTools();
        setTools(response.tools);
        setGuardrails(response.safety_guardrails);
      } catch (err) {
        setToolsError(err instanceof Error ? err.message : 'Unable to load assistant tools.');
      }
    }
    async function loadStatus() {
      try {
        setAssistantStatus(await assistantApi.getStatus());
      } catch (err) {
        setStatusError(err instanceof Error ? err.message : 'Unable to check assistant API status.');
      }
    }
    loadTools();
    loadStatus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (prompt = inputText) => {
    const query = prompt.trim();
    const symptoms = symptomsText.split(',').map((symptom) => symptom.trim()).filter(Boolean);
    if ((!query && !symptoms.length && !medicalText.trim() && !imageFile) || loading) return;
    const message = query || 'Please analyze the clinical information I attached.';
    const userContent = [
      message,
      symptoms.length ? `Symptoms: ${symptoms.join(', ')}` : '',
      medicalText.trim() ? 'Medical note attached.' : '',
      imageFile ? `Chest X-ray attached: ${imageFile.name}` : '',
    ].filter(Boolean).join('\n\n');

    const userMessage: AssistantMessage = {
      id: 'user_' + Date.now(),
      role: 'user',
      content: userContent,
      timestamp: formatTimestamp(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    const history: AssistantHistoryTurn[] = messages
      .filter((item) => item.id !== 'welcome' && !item.id.startsWith('err_'))
      .slice(-10)
      .map(({ role, content }) => ({ role, content }));

    try {
      const res = await assistantApi.chat(message, sessionId, undefined, {
        symptoms,
        medicalText: medicalText.trim() || undefined,
        history,
        imageFile: imageFile ?? undefined,
      });
      setSessionId(res.session_id);
      const assistantMsg: AssistantMessage = {
        id: 'asst_' + Date.now(),
        role: 'assistant',
        content: res.reply,
        tool_calls: res.tools_executed.map((tool) => ({
          tool_name: tool.tool_name,
          parameters: tool.arguments,
          result: tool.result_summary,
          success: tool.status.toUpperCase() === 'SUCCESS',
        })),
        safety_notes: [res.safety_note, res.disclaimer].filter(Boolean),
        suggested_actions: res.suggested_actions,
        concordance_status: res.concordance_status,
        response_source: res.response_source,
        timestamp: formatTimestamp(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setInputText('');
      setSymptomsText('');
      setMedicalText('');
      setImageFile(null);
    } catch (err) {
      const errorMsg: AssistantMessage = {
        id: 'err_' + Date.now(),
        role: 'assistant',
        content: `Sorry, an error occurred while processing your clinical inquiry: ${
          err instanceof Error ? err.message : 'Unknown service error'
        }`,
        timestamp: formatTimestamp(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setInputText(query);
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
      <div
        role="status"
        className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
      >
        {statusError
          ? `Could not check language API status: ${statusError}`
          : assistantStatus?.groq_configured
            ? `Groq is enabled (${assistantStatus.model}). MEDINTEL models perform the analyses; Groq explains their results.`
            : assistantStatus
              ? 'Groq is not configured. The assistant uses MEDINTEL’s built-in responses. Add GROQ_API_KEY to the backend .env to enable Groq.'
              : 'Checking assistant setup...'}
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
              {tools.map((tool) => (
                <div key={tool.name} className="flex gap-2 text-sm">
                  <span className="shrink-0 text-base leading-none mt-0.5">{TOOL_ICONS[tool.name] || '⚙️'}</span>
                  <div className="min-w-0">
                    <div className="font-medium text-zinc-800 dark:text-zinc-200 text-xs truncate">{tool.name}</div>
                    <div className="text-zinc-500 dark:text-zinc-400 text-xs leading-tight">{tool.description}</div>
                  </div>
                </div>
              ))}
              {toolsError && (
                <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                  Could not load available tools: {toolsError}
                </p>
              )}
              {!tools.length && !toolsError && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading available tools...</p>
              )}
            </div>
          </div>

          {/* Safety Guardrails */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <h3 className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Guardrails
            </h3>
            <ul className="space-y-2">
              {guardrails.map((rule, idx) => (
                <li key={idx} className="flex gap-2 text-xs text-zinc-600 dark:text-zinc-400 items-start">
                  <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                  <span>{rule}</span>
                </li>
              ))}
              {!guardrails.length && !toolsError && (
                <li className="text-xs text-zinc-500 dark:text-zinc-400">Loading safety guardrails...</li>
              )}
            </ul>
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="lg:col-span-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden shadow-sm">

          {/* Messages Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-600 space-y-3">
                <Bot className="w-10 h-10 text-emerald-500/50" />
                <p className="text-sm">Ask me about patient symptoms, X-rays, or clinical reports</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                const wrapperCls = isUser
                  ? 'flex items-start gap-3 flex-row-reverse'
                  : 'flex items-start gap-3 flex-row';
                const avatarCls = isUser
                  ? 'w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-emerald-600 text-white shadow-2xs'
                  : 'w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700';
                const bubbleCls = isUser
                  ? 'px-4 py-3 rounded-2xl rounded-tr-xs text-sm leading-relaxed bg-emerald-600 text-white font-medium shadow-xs'
                  : 'px-4 py-3 rounded-2xl rounded-tl-xs text-sm leading-relaxed bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-zinc-800 dark:text-zinc-100 shadow-2xs';
                const timeCls = isUser
                  ? 'text-[10px] text-zinc-400 dark:text-zinc-500 px-1 text-right'
                  : 'text-[10px] text-zinc-400 dark:text-zinc-500 px-1 text-left';

                return (
                  <div key={msg.id} className={wrapperCls}>
                    <div className={avatarCls}>
                      {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    <div className="max-w-[80%] space-y-2">
                      <div className={bubbleCls}>
                        <p className="whitespace-pre-wrap">{formatAssistantContent(msg.content)}</p>
                      </div>
                      {msg.role === 'assistant' && msg.response_source && (
                        <div className="px-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                          {msg.response_source === 'groq'
                            ? 'Explanation by Groq · analysis by MEDINTEL'
                            : 'Built-in MEDINTEL response'}
                        </div>
                      )}

                      {/* Tool Traces */}
                      {msg.tool_calls && msg.tool_calls.length > 0 && (
                        <div className="w-full">
                          <button
                            onClick={() => toggleToolExpanded(msg.id)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                          >
                            {expandedToolMsgId === msg.id
                              ? <ChevronDown className="w-3 h-3" />
                              : <ChevronRight className="w-3 h-3" />}
                            <Wrench className="w-3 h-3 text-emerald-500" />
                            {msg.tool_calls.length} tool{msg.tool_calls.length !== 1 ? 's' : ''} executed
                          </button>
                          {expandedToolMsgId === msg.id && (
                            <div className="mt-1.5 space-y-1">
                              {msg.tool_calls.map((tc, idx) => (
                                <div
                                  key={idx}
                                  className="px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs font-mono"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className={`font-medium ${tc.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                      {tc.success ? '✓' : '×'} {tc.tool_name}
                                    </span>
                                    <span className="shrink-0 text-zinc-400 text-[10px]">
                                      {tc.success ? 'Completed' : 'Failed'}
                                    </span>
                                  </div>
                                  <p className="mt-1 break-words text-[10px] text-zinc-500 dark:text-zinc-400">
                                    {tc.result || (tc.success ? 'Success' : 'No error details returned')}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {msg.concordance_status && msg.concordance_status !== 'INFORMATIONAL' && (
                        <div className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          msg.concordance_status === 'CONCORDANT'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : msg.concordance_status === 'DISCORDANT'
                              ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}>
                          {msg.concordance_status}
                        </div>
                      )}

                      {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            <Sparkles className="w-3 h-3" />
                            Suggested follow-ups
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.suggested_actions.map((action) => (
                              <button
                                key={action}
                                onClick={() => handleSend(action)}
                                disabled={loading}
                                className="rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/20 px-2.5 py-1.5 text-left text-xs text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 disabled:opacity-50 transition-colors"
                              >
                                {action}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Safety Notes */}
                      {msg.safety_notes && msg.safety_notes.length > 0 && (
                        <div className="flex gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
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
                <div className="px-4 py-2.5 rounded-2xl rounded-tl-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Synthesizing clinical response...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <p className="mb-2 text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              Do not include identifying or sensitive details. When enabled, Groq receives your question, recent chat context, and MEDINTEL's results; uploaded files are analyzed by this backend and are not sent to Groq.
            </p>
            <details className="mb-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
              <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Add clinical information (optional)
              </summary>
              <div className="space-y-2 border-t border-zinc-200 p-3 dark:border-zinc-700">
                <input
                  type="text"
                  value={symptomsText}
                  onChange={(event) => setSymptomsText(event.target.value)}
                  placeholder="Symptoms separated by commas, e.g. cough, fever"
                  aria-label="Symptoms to analyze"
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <textarea
                  value={medicalText}
                  onChange={(event) => setMedicalText(event.target.value)}
                  placeholder="Paste a medical note or report for text analysis"
                  aria-label="Medical note or report"
                  rows={2}
                  className="w-full resize-y rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:border-emerald-500">
                    <ImagePlus className="h-4 w-4" />
                    Attach chest X-ray
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      aria-label="Attach a chest X-ray image"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setImageFile(file);
                        event.target.value = '';
                      }}
                    />
                  </label>
                  {imageFile && (
                    <span className="inline-flex max-w-full items-center gap-2 rounded-lg bg-zinc-100 px-2 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      <span className="truncate">{imageFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setImageFile(null)}
                        aria-label="Remove attached X-ray"
                        className="shrink-0 rounded p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </details>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                  className="rounded-full border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 text-[10px] text-zinc-600 dark:text-zinc-300 hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 disabled:opacity-50 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
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
                placeholder="Ask a question or tell me what to analyze... (Enter to send)"
                rows={2}
                aria-label="Message the Clinical Assistant"
                className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-all"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || (!inputText.trim() && !symptomsText.trim() && !medicalText.trim() && !imageFile)}
                aria-label="Send message"
                title="Send message"
                className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-all shadow-sm shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center shrink-0"
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
