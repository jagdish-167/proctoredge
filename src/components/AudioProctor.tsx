import React, { useRef, useEffect, useState } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { analyzeAudio, ProctoringResult } from '../services/aiService';
import { db, auth } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface AudioProctorProps {
  examId: string;
  onViolation?: (violation: ProctoringResult) => void;
  onError?: (errorType: 'IN_USE' | 'PERMISSION_DENIED' | 'NOT_FOUND' | 'UNKNOWN', message: string) => void;
}

export default function AudioProctor({ examId, onViolation, onError }: AudioProctorProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [errorType, setErrorType] = useState<'IN_USE' | 'PERMISSION_DENIED' | 'NOT_FOUND' | 'UNKNOWN' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const startAudio = async () => {
    setErrorType(null);
    setErrorMessage(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false
      });
      setStream(mediaStream);
      
      const mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        
        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          await performAIAnalysis(base64Audio);
        };
      };

    } catch (err: any) {
      console.error("Microphone access error:", err);
      let type: 'IN_USE' | 'PERMISSION_DENIED' | 'NOT_FOUND' | 'UNKNOWN' = 'UNKNOWN';
      let message = "Microphone access is required for audio proctoring. Please ensure your microphone is connected and you have granted permission.";

      if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        type = 'IN_USE';
        message = "Microphone in use! Another application is likely using it. Please close it and retry.";
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        type = 'PERMISSION_DENIED';
        message = "Permission denied! You must allow microphone access in your browser settings to continue.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        type = 'NOT_FOUND';
        message = "No microphone detected! An integrated or external microphone must be connected to proceed.";
      }

      setErrorType(type);
      setErrorMessage(message);
      if (onError) onError(type, message);
    }
  };

  useEffect(() => {
    startAudio();

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!stream || !mediaRecorderRef.current || !auth.currentUser) return;

    // Start recording snippets every 25 seconds, record for 5 seconds
    const interval = setInterval(() => {
      if (isAnalyzing || isRecording) return;
      
      setIsRecording(true);
      audioChunksRef.current = [];
      mediaRecorderRef.current?.start();
      
      // Stop recording after 5 seconds to analyze
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 5000);
      
    }, 25000);

    return () => clearInterval(interval);
  }, [stream, isAnalyzing, isRecording]);

  const performAIAnalysis = async (base64Audio: string) => {
    if (!auth.currentUser) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzeAudio(base64Audio);

      if (result.detected) {
        // Record incident in Firestore
        await addDoc(collection(db, 'incidents'), {
          examId,
          studentId: auth.currentUser.uid,
          studentEmail: auth.currentUser.email,
          timestamp: new Date().toISOString(),
          createdAt: serverTimestamp(),
          type: result.type,
          description: result.description,
          confidence: result.confidence,
          severity: result.severity,
          status: 'review',
          audioSnippet: true // Add boolean so UI knows it was an audio incident
        });

        if (onViolation) onViolation(result);
        
        // Notify Admin via backend relay
        if (result.severity !== 'MINIMAL') {
            try {
                await fetch('/api/notify-admin', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    examId,
                    studentEmail: auth.currentUser.email,
                    type: result.type,
                    description: result.description,
                    isAudio: true
                  })
                });
            } catch (err) {}
        }
      }
    } catch (err) {
      console.error("Audio analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (errorMessage) {
    return (
      <div className="bg-error/10 border-2 border-error p-4 rounded-xl flex flex-col items-center gap-2 text-error text-center mt-4">
        <MicOff size={32} />
        <div>
          <p className="font-bold text-sm mb-1">{errorMessage}</p>
          <div className="flex flex-col gap-1 items-center">
            {errorType === 'IN_USE' && (
              <span className="text-[10px] bg-error text-white px-2 py-0.5 font-bold uppercase tracking-widest rounded">Audio Conflict</span>
            )}
            {errorType === 'PERMISSION_DENIED' && (
              <span className="text-[10px] bg-error text-white px-2 py-0.5 font-bold uppercase tracking-widest rounded">Mic Blocked</span>
            )}
            {errorType === 'NOT_FOUND' && (
              <span className="text-[10px] bg-error text-white px-2 py-0.5 font-bold uppercase tracking-widest rounded">No Mic Found</span>
            )}
          </div>
        </div>
        <button 
          onClick={startAudio}
          className="bg-error text-white px-4 py-2 rounded-md font-bold text-xs uppercase tracking-widest mt-2 hover:bg-error/90"
        >
          RETRY MIC
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 flex items-center justify-between bg-surface-container-low border-2 border-black p-3 rounded-xl brutal-shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${isRecording ? 'bg-error animate-pulse' : 'bg-surface-container'} border-2 border-black`}>
          <Mic size={16} className={isRecording ? 'text-white' : 'text-on-surface-variant'} />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-black uppercase tracking-widest">Audio Stream</span>
          <span className="text-[10px] font-bold text-on-surface-variant uppercase">{isRecording ? 'Capturing...' : isAnalyzing ? 'Analyzing Node...' : 'Monitoring Active'}</span>
        </div>
      </div>
      {isAnalyzing && (
        <span className="text-[10px] bg-secondary text-on-secondary px-2 py-1 font-bold uppercase tracking-widest border border-black animate-pulse">
          Processing
        </span>
      )}
    </div>
  );
}
