import React, { useRef, useEffect, useState } from 'react';
import { Camera, AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';
import { analyzeFrame, ProctoringResult } from '../services/aiService';
import { db, auth } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface CameraProctorProps {
  examId: string;
  onViolation?: (violation: ProctoringResult) => void;
  onError?: (errorType: 'IN_USE' | 'PERMISSION_DENIED' | 'NOT_FOUND' | 'UNKNOWN', message: string) => void;
}

export default function CameraProctor({ examId, onViolation, onError }: CameraProctorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorType, setErrorType] = useState<'IN_USE' | 'PERMISSION_DENIED' | 'NOT_FOUND' | 'UNKNOWN' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<ProctoringResult | null>(null);

  const startCamera = async () => {
    setErrorType(null);
    setErrorMessage(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 },
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      let type: 'IN_USE' | 'PERMISSION_DENIED' | 'NOT_FOUND' | 'UNKNOWN' = 'UNKNOWN';
      let message = "Camera access is required for proctoring. Please ensure your camera is connected and you have granted permission.";

      if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        type = 'IN_USE';
        message = "Camera in use! Another application (Zoom, Teams, etc.) is likely using your camera. Please close it and retry.";
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        type = 'PERMISSION_DENIED';
        message = "Permission denied! You must allow camera access in your browser settings to continue with this proctored session.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        type = 'NOT_FOUND';
        message = "No camera detected! An integrated or external webcam must be connected to proceed.";
      }

      setErrorType(type);
      setErrorMessage(message);
      if (onError) onError(type, message);
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!stream || !auth.currentUser) return;

    // Run analysis every 20 seconds for timely candidate guidance
    const interval = setInterval(async () => {
      if (isAnalyzing) return;
      await performAIAnalysis();
    }, 20000);

    return () => clearInterval(interval);
  }, [stream, isAnalyzing]);

  const performAIAnalysis = async () => {
    if (!videoRef.current || !canvasRef.current || !auth.currentUser) return;

    setIsAnalyzing(true);
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0);
      const base64Image = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
      
      const result = await analyzeFrame(base64Image);
      setLastResult(result);

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
          imageUrl: `data:image/jpeg;base64,${base64Image}` // Save base64 image for admin review
        });

        if (onViolation) onViolation(result);
        
        // Notify Admin via backend relay (Simulates email with photo)
        // Only notify admin for MODERATE or CRITICAL to avoid spam
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
                imageUrl: `data:image/jpeg;base64,${base64Image}`
              })
            });
          } catch (notifierErr) {
            console.error("Failed to signal admin relay:", notifierErr);
          }
        }

        console.log(`PROCTOR EVENT [${result.severity}]: Signal handled for jagdishsolunke02@gmail.com`);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (errorMessage) {
    return (
      <div className="bg-error/10 border-2 border-error p-6 rounded-xl flex flex-col items-center gap-4 text-error text-center">
        <ShieldAlert size={48} />
        <div>
          <p className="font-bold text-lg mb-2">{errorMessage}</p>
          <div className="flex flex-col gap-1 items-center">
            {errorType === 'IN_USE' && (
              <span className="text-[10px] bg-error text-white px-2 py-0.5 font-bold uppercase tracking-widest rounded">Resource Conflict</span>
            )}
            {errorType === 'PERMISSION_DENIED' && (
              <span className="text-[10px] bg-error text-white px-2 py-0.5 font-bold uppercase tracking-widest rounded">Security Block</span>
            )}
            {errorType === 'NOT_FOUND' && (
              <span className="text-[10px] bg-error text-white px-2 py-0.5 font-bold uppercase tracking-widest rounded">Hardware Missing</span>
            )}
            <p className="text-xs opacity-70 mt-2 italic px-2">
              Tip: {errorType === 'IN_USE' ? 'Close all other browser tabs or software using your webcam.' : 
                   errorType === 'PERMISSION_DENIED' ? 'Click the camera icon in your address bar to reset permissions.' :
                   errorType === 'NOT_FOUND' ? 'Reconnect your camera and make sure it is recognized by your OS.' :
                   'Ensure your camera is connected and you have granted permission in the address bar.'}
            </p>
          </div>
        </div>
        <button 
          onClick={startCamera}
          className="brutal-btn-primary bg-error text-on-error w-full py-2 hover:bg-error-container transition-colors"
        >
          RETRY CONNECTION
        </button>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="aspect-video w-full max-w-sm bg-black border-4 border-black brutal-shadow-sm rounded-xl overflow-hidden relative">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover"
        />
        
        {/* Status Indicators */}
        <div className="absolute top-4 left-4 flex gap-2">
          <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/20 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-secondary animate-pulse' : 'bg-primary'}`}></div>
            <span className="text-[10px] text-white font-mono uppercase tracking-tighter">
              {isAnalyzing ? 'AI ANALYZING' : 'LIVE FEED'}
            </span>
          </div>
        </div>

        {/* AI detection overlays */}
        <AnimatePresence>
          {lastResult?.detected && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-error/20 border-4 border-error pointer-events-none flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="bg-error text-on-error p-2 rounded-full mb-2">
                <AlertTriangle size={32} />
              </div>
              <h4 className="text-error font-black uppercase text-xl leading-none">VIOLATION DETECTED</h4>
              <p className="text-white text-xs font-bold mt-2 bg-black/80 p-1 px-2 rounded">{lastResult.type}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <canvas ref={canvasRef} className="hidden" />
      </div>
      
      <p className="text-[10px] text-on-surface-variant mt-2 font-mono uppercase font-bold text-center">
        AI Monitor Active: jagdishsolunke02@gmail.com
      </p>
    </div>
  );
}
