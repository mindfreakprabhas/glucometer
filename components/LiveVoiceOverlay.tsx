
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { X, Mic, MicOff, Volume2 } from 'lucide-react';
import { RoutineLabel } from '../types';

interface LiveVoiceOverlayProps {
  onClose: () => void;
  onAddLog: (value: number, label: RoutineLabel) => void;
  onSnooze: (reminderLabel: string) => void;
}

const LiveVoiceOverlay: React.FC<LiveVoiceOverlayProps> = ({ onClose, onAddLog, onSnooze }) => {
  const [status, setStatus] = useState<'connecting' | 'active' | 'error'>('connecting');
  const [transcript, setTranscript] = useState<{user: string, model: string}>({ user: '', model: '' });
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const audioContextRes = useRef<{input: AudioContext, output: AudioContext} | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const controlFunctions: FunctionDeclaration[] = [
    {
      name: 'record_glucose_reading',
      parameters: {
        type: Type.OBJECT,
        description: 'Record a new blood glucose reading.',
        properties: {
          value: { type: Type.NUMBER, description: 'The glucose value in mg/dL' },
          label: { 
            type: Type.STRING, 
            description: 'The routine label (e.g., Fasting, Post-Lunch, Before Bed)',
            enum: Object.values(RoutineLabel)
          }
        },
        required: ['value', 'label']
      }
    },
    {
      name: 'snooze_reminder',
      parameters: {
        type: Type.OBJECT,
        description: 'Snooze the current or a specific reminder.',
        properties: {
          label: { type: Type.STRING, description: 'The routine label to snooze' }
        },
        required: ['label']
      }
    }
  ];

  useEffect(() => {
    const initLive = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRes.current = { input: inputCtx, output: outputCtx };

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
            systemInstruction: 'You are GlucoTrack Voice, a supportive assistant. Help users log blood glucose or snooze reminders. Be concise and caring.',
            tools: [{ functionDeclarations: controlFunctions }],
            inputAudioTranscription: {},
            outputAudioTranscription: {}
          },
          callbacks: {
            onopen: () => {
              setStatus('active');
              const source = inputCtx.createMediaStreamSource(stream);
              const processor = inputCtx.createScriptProcessor(4096, 1, 1);
              processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcm = new Int16Array(inputData.length);
                for(let i=0; i<inputData.length; i++) pcm[i] = inputData[i] * 32768;
                sessionPromise.then(s => s.sendRealtimeInput({ 
                  media: { data: btoa(String.fromCharCode(...new Uint8Array(pcm.buffer))), mimeType: 'audio/pcm;rate=16000' }
                }));
              };
              source.connect(processor);
              processor.connect(inputCtx.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
              if (msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
                setIsSpeaking(true);
                const data = msg.serverContent.modelTurn.parts[0].inlineData.data;
                const binary = atob(data);
                const bytes = new Uint8Array(binary.length);
                for(let i=0; i<binary.length; i++) bytes[i] = binary.charCodeAt(i);
                
                const dataInt16 = new Int16Array(bytes.buffer);
                const buffer = outputCtx.createBuffer(1, dataInt16.length, 24000);
                const channelData = buffer.getChannelData(0);
                for(let i=0; i<dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

                const source = outputCtx.createBufferSource();
                source.buffer = buffer;
                source.connect(outputCtx.destination);
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
                source.onended = () => {
                  sourcesRef.current.delete(source);
                  if(sourcesRef.current.size === 0) setIsSpeaking(false);
                };
              }

              if (msg.serverContent?.inputTranscription) {
                setTranscript(prev => ({ ...prev, user: (prev.user + ' ' + msg.serverContent!.inputTranscription!.text).trim() }));
              }
              if (msg.serverContent?.outputTranscription) {
                setTranscript(prev => ({ ...prev, model: (prev.model + ' ' + msg.serverContent!.outputTranscription!.text).trim() }));
              }
              if (msg.serverContent?.turnComplete) {
                setTranscript({ user: '', model: '' });
              }

              if (msg.toolCall) {
                for (const fc of msg.toolCall.functionCalls) {
                  let result = "ok";
                  if (fc.name === 'record_glucose_reading') {
                    onAddLog(fc.args.value as number, fc.args.label as RoutineLabel);
                  } else if (fc.name === 'snooze_reminder') {
                    onSnooze(fc.args.label as string);
                  }
                  sessionPromise.then(s => s.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result } }
                  }));
                }
              }

              if (msg.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }
            },
            onerror: () => setStatus('error'),
            onclose: () => onClose()
          }
        });
        sessionRef.current = await sessionPromise;
      } catch (e) {
        console.error(e);
        setStatus('error');
      }
    };

    initLive();
    return () => {
      sessionRef.current?.close();
      audioContextRes.current?.input.close();
      audioContextRes.current?.output.close();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-6">
      <div className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden relative p-8 text-center space-y-8">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors">
          <X className="w-6 h-6 text-slate-400" />
        </button>

        <div className="pt-8">
          <div className="relative inline-block">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${isSpeaking ? 'bg-blue-600 scale-110' : 'bg-slate-100'}`}>
              {isSpeaking ? <Volume2 className="w-10 h-10 text-white animate-pulse" /> : <Mic className="w-10 h-10 text-blue-500" />}
            </div>
            {status === 'active' && (
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-6 h-6 rounded-full border-4 border-white" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800">
            {status === 'connecting' ? 'Connecting...' : status === 'error' ? 'Connection Error' : 'I\'m Listening'}
          </h2>
          <p className="text-slate-500 font-medium">Try saying: "Log my fasting glucose as 95"</p>
        </div>

        <div className="min-h-[100px] flex flex-col justify-center gap-4 bg-slate-50 rounded-3xl p-6 text-left">
          {transcript.user && (
            <p className="text-sm font-semibold text-slate-400 italic">" {transcript.user} "</p>
          )}
          {transcript.model && (
            <p className="text-md font-bold text-blue-600">{transcript.model}</p>
          )}
          {!transcript.user && !transcript.model && status === 'active' && (
            <div className="flex gap-1 justify-center">
              {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 bg-blue-200 rounded-full animate-bounce" style={{animationDelay: `${i*0.2}s`}} />)}
            </div>
          )}
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
        >
          <MicOff className="w-5 h-5" />
          End Session
        </button>
      </div>
    </div>
  );
};

export default LiveVoiceOverlay;
