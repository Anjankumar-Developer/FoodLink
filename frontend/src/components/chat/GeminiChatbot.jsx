import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Mic,
  MicOff,
  Sparkles,
  Bot,
  User,
  MapPin,
  ExternalLink,
  Loader2,
  Trash2,
  Minimize2,
  Maximize2,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import Button from '../common/Button';
import { api } from '../../services/api';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';

const SYSTEM_ROLES = [
  {
    id: 'dispatcher',
    name: 'Logistics Dispatcher',
    instruction:
      'You are the FOODLINK AI Operations Assistant, an expert in real-time food rescue dispatch. Help coordinators match surplus kitchen inventory with verified shelters, analyze biological decay windows, optimize route assignments, and ensure rapid handover under 5 minutes.',
  },
  {
    id: 'safety',
    name: 'HACCP Safety Auditor',
    instruction:
      'You are the Food Safety Compliance Agent for FOODLINK AI. You rigorously audit temperature containment (HACCP rules: hot holding >= 60°C, cold holding <= 4°C), pathogen danger zones (4°C - 60°C for max 2 hours), allergen cross-contact, and liability coverage under the Bill Emerson Good Samaritan Food Donation Act.',
  },
  {
    id: 'intake',
    name: 'Shelter Intake Harmonizer',
    instruction:
      'You are the Shelter Demand Coordinator. You specialize in assessing evening shelter meal requirements, bed occupancy counts, dietary allocations (Halal, Kosher, Vegan, Allergen-Safe), and commercial kitchen storage capacities.',
  },
];

const MODEL_OPTIONS = [
  {
    id: 'gemini-3.5-flash',
    name: 'gemini-3.5-flash',
    label: 'General Tasks (Fast & Reliable)',
    badge: 'Standard',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'gemini-3.1-flash-lite',
    label: 'gemini-3.1-flash-lite (Ultra Fast)',
    badge: 'Fastest',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'gemini-3.1-pro-preview',
    label: 'gemini-3.1-pro-preview (Complex Tasks)',
    badge: 'Deep Reasoning',
  },
];

const SUGGESTED_PROMPTS = [
  'What is the HACCP safe window for cooked chicken at 65°C?',
  'Find verified homeless shelters and food pantries near downtown San Francisco.',
  'How does the Bill Emerson Good Samaritan Act protect donor restaurants?',
  'Calculate perishability window for fresh bread vs refrigerated dairy.',
];

export default function GeminiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedRole, setSelectedRole] = useState(SYSTEM_ROLES[0].id);
  const [selectedModel, setSelectedModel] = useState('gemini-3.5-flash');
  const [useMapsGrounding, setUseMapsGrounding] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Multi-turn conversation history
  const [messages, setMessages] = useState([
    {
      id: 'initial-greeting',
      role: 'model',
      text: "Hello! I am your FOODLINK AI Operations Assistant. I can help coordinate food rescue missions, check HACCP safety windows, triage surplus items, and query live Google Maps locations for shelters and kitchens. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash',
    },
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Audio recording hook with gemini-3.5-transcribe
  const {
    isRecording,
    recordingDuration,
    isTranscribing,
    transcriptionError,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  // Handle Voice Recording completion
  const handleMicClick = async () => {
    if (isRecording) {
      const transcription = await stopRecording();
      if (transcription) {
        setInputMessage((prev) => (prev ? `${prev} ${transcription}` : transcription));
      }
    } else {
      await startRecording();
    }
  };

  const activeRoleConfig = SYSTEM_ROLES.find((r) => r.id === selectedRole) || SYSTEM_ROLES[0];

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Obtain coordinates if Maps Grounding is active
      let location = null;
      if (useMapsGrounding && navigator.geolocation) {
        try {
          location = await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
              () => resolve({ latitude: 37.7749, longitude: -122.4194 }), // SF fallback
              { timeout: 3000 }
            );
          });
        } catch (e) {
          location = { latitude: 37.7749, longitude: -122.4194 };
        }
      }

      // Format messages history for multi-turn Gemini call
      const formattedMessages = newHistory.map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const res = await api.chat({
        messages: formattedMessages,
        model: selectedModel,
        systemInstruction: activeRoleConfig.instruction,
        useMaps: useMapsGrounding,
        location,
      });

      const modelMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: res.text || 'I have analyzed your request based on current logistics state.',
        places: res.places || [],
        groundingChunks: res.groundingChunks || [],
        modelUsed: res.modelUsed || selectedModel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err) {
      console.error('Chat send failed:', err);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `Error connecting to Gemini: ${err.message || 'Please check your connection and API key.'}`,
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'model',
        text: 'Conversation history reset. How can I help with your food rescue logistics?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
      },
    ]);
  };

  return (
    <>
      {/* Floating Trigger Button in Bottom Right */}
      {/* Main Chat Drawer / Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-200 bg-white shadow-2xl border border-slate-200/90 rounded-2xl flex flex-col overflow-hidden ${
            isMinimized
              ? 'bottom-6 right-6 w-80 h-14'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[480px] h-[650px] max-h-[90vh]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold tracking-tight text-white truncate">
                    FOODLINK AI Assistant
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                    Online
                  </span>
                </div>
                {!isMinimized && (
                  <p className="text-[11px] text-slate-400 truncate">
                    Role: {activeRoleConfig.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 text-slate-400">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title={isMinimized ? 'Expand Chat' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Configuration Bar: Model & Role & Maps Grounding Selector */}
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                {/* Role Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Role:</span>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="text-xs font-semibold bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-hidden focus:border-emerald-600"
                  >
                    {SYSTEM_ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Model Selector per requirement */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Model:</span>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="text-xs font-mono font-medium bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-hidden focus:border-emerald-600"
                  >
                    {MODEL_OPTIONS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.badge})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Maps Grounding Toggle per requirement */}
                <div className="w-full flex items-center justify-between pt-1 border-t border-slate-200/50">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={useMapsGrounding}
                      onChange={(e) => setUseMapsGrounding(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Google Maps Grounding (gemini-3.5-flash)</span>
                  </label>

                  <button
                    onClick={handleClearHistory}
                    className="text-[11px] text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                    title="Clear Conversation"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Scrollable Conversation Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400">
                      <span>{msg.role === 'user' ? 'You' : 'FOODLINK AI'}</span>
                      <span>·</span>
                      <span>{msg.timestamp}</span>
                      {msg.modelUsed && (
                        <span className="font-mono text-emerald-700 bg-emerald-50 px-1 rounded">
                          {msg.modelUsed}
                        </span>
                      )}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-emerald-600 text-white rounded-br-xs shadow-xs'
                          : msg.isError
                          ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-xs'
                          : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs shadow-xs'
                      }`}
                    >
                      {msg.text}

                      {/* Google Maps Grounded Place Links (MUST ALWAYS extract and list URLs) */}
                      {msg.places && msg.places.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                          <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Google Maps Verified Places & Links:</span>
                          </p>

                          <div className="space-y-1.5">
                            {msg.places.map((place, idx) => (
                              <div
                                key={idx}
                                className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-700"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-slate-900 truncate">
                                    {place.title}
                                  </span>
                                  {place.uri && (
                                    <a
                                      href={place.uri}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold hover:underline shrink-0"
                                    >
                                      <span>Open Maps</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                                {place.reviewSnippets && place.reviewSnippets.length > 0 && (
                                  <p className="text-[10px] text-slate-500 mt-1 italic leading-tight">
                                    "{place.reviewSnippets[0]}"
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading state indicator */}
                {isLoading && (
                  <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 w-fit text-slate-600">
                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                    <span>Analyzing operational parameters with {selectedModel}...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Quick Prompts */}
              {messages.length <= 2 && (
                <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                  <span className="text-slate-400 shrink-0 font-medium">Try:</span>
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(prompt)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full whitespace-nowrap transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Audio Recording Status Indicator */}
              {isRecording && (
                <div className="px-4 py-2 bg-red-50 border-t border-red-200 flex items-center justify-between text-xs text-red-700">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                    <span className="font-semibold">Recording Audio... ({recordingDuration}s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={cancelRecording}
                      className="text-slate-500 hover:text-slate-800 text-[11px]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleMicClick}
                      className="px-2 py-0.5 bg-red-600 text-white rounded font-medium text-xs hover:bg-red-700"
                    >
                      Transcribe
                    </button>
                  </div>
                </div>
              )}

              {isTranscribing && (
                <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 flex items-center gap-2 text-xs text-blue-800">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Transcribing audio with gemini-3.5-transcribe...</span>
                </div>
              )}

              {transcriptionError && (
                <div className="px-4 py-1.5 bg-amber-50 text-amber-800 text-[11px] border-t border-amber-200">
                  {transcriptionError}
                </div>
              )}

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-slate-200">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  {/* Microphone Button for Audio Transcription */}
                  <button
                    type="button"
                    onClick={handleMicClick}
                    disabled={isTranscribing}
                    className={`p-2 rounded-lg transition-colors shrink-0 ${
                      isRecording
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                    title={isRecording ? 'Stop & Transcribe' : 'Record Audio with gemini-3.5-transcribe'}
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={
                      isRecording ? 'Listening to voice...' : 'Ask about rescues, food safety, or shelters...'
                    }
                    disabled={isLoading || isRecording}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 transition-colors"
                  />

                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isLoading}
                    className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                    title="Send Message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
                  <span>Press Enter to send · Mic for audio dictation</span>
                  <span className="font-mono">FOODLINK Agent v2.5</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
