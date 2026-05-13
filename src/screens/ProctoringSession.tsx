import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, LogOut, Clock, FileText, AlertCircle, Maximize2, Info, Rocket, Check, X, Lock } from 'lucide-react';
import CameraProctor from '../components/ProctoringCamera';
import AudioProctor from '../components/AudioProctor';
import { Screen, Question } from '../types';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

interface ProctoringSessionProps {
  exam: {
    id: string;
    title: string;
    sourceType: 'file' | 'link' | 'none' | 'ai-quiz';
    examLink?: string;
    fileName?: string;
    aiContext?: string;
    questions?: Question[];
    institution: string;
    duration: number;
  };
  onFinish: () => void;
}

export default function ProctoringSession({ exam, onFinish }: ProctoringSessionProps) {
  const { user } = useAuth();
  const [startTime] = useState(new Date().toISOString());
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [violations, setViolations] = useState<number>(0);
  const [guidance, setGuidance] = useState<string | null>(null);

  const [isFinished, setIsFinished] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);

  // Auto-finish when time expires
  useEffect(() => {
    if (timeLeft <= 0 && !isFinished) {
      confirmEndExam();
    }
  }, [timeLeft, isFinished]);

  useEffect(() => {
    let interval: any;
    if (!isFinished && !showConfirmEnd) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
        setTimeLeft(t => Math.max(0, t - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isFinished, showConfirmEnd]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (guidance) {
      const timer = setTimeout(() => setGuidance(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [guidance]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  const confirmEndExam = async () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    }

    // Persist session to Firestore
    if (user) {
      try {
        const { score, total } = calculateScore();
        await addDoc(collection(db, 'sessions'), {
          examId: exam.id,
          examTitle: exam.title,
          studentId: user.uid,
          studentEmail: user.email,
          startTime: startTime,
          endTime: new Date().toISOString(),
          durationSeconds: seconds,
          violations: violations,
          score: (exam.sourceType === 'ai-quiz' || (exam.questions && exam.questions.length > 0)) ? score : null,
          totalQuestions: (exam.sourceType === 'ai-quiz' || (exam.questions && exam.questions.length > 0)) ? total : null,
          institution: exam.institution || 'ProctorEdge Academy',
          createdAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Error saving session:", error);
      }
    }

    setIsFinished(true);
    setShowConfirmEnd(false);
  };

  const calculateScore = () => {
    if (!exam.questions) return { score: 0, total: 0 };
    let correct = 0;
    exam.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswerIndex) {
        correct++;
      }
    });
    return { score: correct, total: exam.questions.length };
  };

  const { score, total } = calculateScore();

  if (isFinished) {
    return (
      <div className="fixed inset-0 bg-background z-[100] flex items-center justify-center p-8 overflow-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-3xl w-full brutal-card bg-surface p-12 text-center my-8"
        >
          <div className="w-24 h-24 bg-primary text-on-primary rounded-2xl mx-auto flex items-center justify-center mb-8 brutal-shadow border-4 border-black animate-bounce">
             {showResults ? <FileText size={48} /> : <ShieldCheck size={48} />}
          </div>
          <h2 className="font-headline text-5xl mb-4 font-black italic">
            {showResults ? 'EXAM RESULTS' : 'SESSION SECURE'}
          </h2>
          <p className="text-on-surface-variant font-medium mb-8 leading-relaxed">
            {showResults 
              ? 'Institutional audit complete. Please find the detailed integrity and score report below.'
              : `Your examination integrity packet has been encrypted and transmitted to the institutional board. 
                 All environmental metadata has been archived under session ${exam.id.substring(0, 12)}.`}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="p-4 bg-surface-container border-2 border-black rounded-xl">
               <p className="text-[10px] font-black uppercase text-on-surface-variant">Anomalies Detected</p>
               <p className={`text-2xl font-black ${violations > 0 ? 'text-error' : 'text-success'}`}>{violations}</p>
            </div>
            <div className="p-4 bg-surface-container border-2 border-black rounded-xl">
               <p className="text-[10px] font-black uppercase text-on-surface-variant">Session Duration</p>
               <p className="text-2xl font-black">{formatTime(seconds)}</p>
            </div>
            {(exam.sourceType === 'ai-quiz' || (exam.questions && exam.questions.length > 0)) && (
              <div className="p-4 bg-secondary/10 border-2 border-black rounded-xl border-secondary">
                 <p className="text-[10px] font-black uppercase text-on-surface-variant">Final Score</p>
                 <p className="text-2xl font-black">{score} / {total}</p>
              </div>
            )}
          </div>

          {showResults && exam.questions && (
            <div className="mb-10 space-y-6 text-left">
              <h3 className="font-headline text-2xl font-black uppercase border-b-4 border-black pb-2 inline-block mb-4">Detailed Breakdown</h3>
              {exam.questions.map((q, idx) => {
                const isCorrect = userAnswers[q.id] === q.correctAnswerIndex;
                return (
                  <div key={q.id} className={`p-6 border-2 border-black rounded-xl ${isCorrect ? 'bg-success/5' : 'bg-error/5'}`}>
                    <p className="font-bold mb-4"><strong>{idx + 1}. {q.text}</strong></p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt: string, i: number) => {
                        const isSelected = userAnswers[q.id] === i;
                        const isAnswer = q.correctAnswerIndex === i;
                        return (
                          <div 
                            key={i} 
                            className={`p-3 border-2 text-sm rounded-lg flex items-center justify-between ${
                              isAnswer ? 'bg-success text-on-success border-black font-black' :
                              isSelected && !isAnswer ? 'bg-error text-on-error border-black line-through opacity-80' :
                              'bg-surface-container border-outline-variant/30 opacity-60'
                            }`}
                          >
                            <span>{opt}</span>
                            {isAnswer && <Check size={14} />}
                            {isSelected && !isAnswer && <X size={14} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="flex flex-col gap-3">
            {(exam.sourceType === 'ai-quiz' || (exam.questions && exam.questions.length > 0)) && !showResults && (
              <button 
                onClick={() => setShowResults(true)}
                className="w-full bg-secondary text-black brutal-shadow border-2 border-black py-4 font-black uppercase tracking-[0.2em] text-lg hover:translate-x-1 hover:translate-y-1 transition-all"
              >
                Reveal Verified Answers
              </button>
            )}
            <button 
              onClick={onFinish}
              className="w-full border-2 border-black py-4 font-black uppercase tracking-[0.2em] text-lg hover:bg-black hover:text-white transition-all"
            >
              Return to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-surface z-50 flex flex-col">
      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmEnd && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full brutal-card bg-surface p-8 text-center"
            >
              <div className="w-16 h-16 bg-error text-on-error rounded-full mx-auto flex items-center justify-center mb-6 brutal-shadow border-4 border-black">
                <AlertCircle size={32} />
              </div>
              <h3 className="font-headline text-3xl mb-2 font-black">EXIT EXAMINATION?</h3>
              <p className="text-sm text-on-surface-variant font-medium mb-8">
                Your session will be closed and all environmental metadata will be finalized. This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowConfirmEnd(false)}
                  className="flex-1 brutal-btn-secondary py-3 font-bold uppercase text-xs"
                >
                  Stay in Exam
                </button>
                <button 
                  onClick={confirmEndExam}
                  className="flex-1 brutal-btn-primary bg-error text-white py-3 font-bold uppercase text-xs"
                >
                  Finish Session
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Session Header */}
      <header className="bg-surface border-b-4 border-black p-4 flex justify-between items-center shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-4">
          <div className="bg-primary text-on-primary p-2 brutal-border">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="font-headline text-xl leading-none">{exam.title}</h2>
            <p className="text-xs text-on-surface-variant font-mono uppercase font-bold">Secure Session ID: {exam.id.substring(0, 8)}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-2 px-3 py-1 border-2 border-black rounded-lg transition-colors ${timeLeft < 300 ? 'bg-error/20 border-error animate-pulse' : 'bg-secondary/10'}`}>
            <Clock size={16} className={timeLeft < 300 ? 'text-error' : 'text-secondary'} />
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase opacity-60 leading-none">Time Remaining</span>
              <span className={`font-data font-black ${timeLeft < 300 ? 'text-error' : ''}`}>{formatTime(timeLeft)}</span>
            </div>
          </div>
          
          <button 
            onClick={toggleFullScreen}
            className="p-2 hover:bg-surface-container transition-colors border-2 border-transparent hover:border-black rounded-lg"
          >
            <Maximize2 size={20} />
          </button>

          <button 
            onClick={() => setShowConfirmEnd(true)}
            className="brutal-btn-error px-4 py-2 flex items-center gap-2 text-sm"
          >
            <LogOut size={16} />
            END EXAM
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Exam Panel */}
        <div className="flex-1 bg-white relative overflow-auto p-8">
          {/* Subtle Candidate Guidance Overlay */}
          <AnimatePresence>
            {guidance && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute top-8 left-1/2 -translate-x-1/2 z-40 w-auto"
              >
                <div className="bg-black/90 text-white backdrop-blur-md px-6 py-3 rounded-full border border-white/20 brutal-shadow flex items-center gap-3">
                  <div className="bg-primary p-1 rounded-full">
                    <Info size={14} className="text-on-primary" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">{guidance}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          { (exam.questions && exam.questions.length > 0) ? (
            <div className="max-w-3xl mx-auto space-y-12 pb-24">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-secondary/10 border-4 border-secondary mx-auto flex items-center justify-center rounded-2xl brutal-shadow-sm rotate-3 group-hover:-rotate-3 transition-transform">
                  <Rocket size={40} className="text-secondary animate-pulse" />
                </div>
                <h1 className="text-5xl font-black italic uppercase tracking-tighter">{exam.title}</h1>
                <div className="flex flex-col gap-2">
                  <p className="text-on-surface-variant max-w-lg mx-auto font-medium bg-surface-container px-4 py-2 border-2 border-black rounded-lg">
                    {exam.sourceType === 'ai-quiz' ? 'AI-INTEGRITY GATEWAY ACTIVE' : 'SEMANTIC EXTRACTION PROTOCOL'} • {exam.questions.length} NODES DETECTED
                  </p>
                  {exam.aiContext && (
                    <button 
                      onClick={() => setGuidance("Source material available in session logs.")}
                      className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/40 hover:text-secondary transition-colors"
                    >
                      Reference ID: {exam.fileName || 'SEMANTIC_BUFFER'}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-12">
                {exam.questions.map((q: Question, idx: number) => (
                  <div key={q.id} className="brutal-card bg-surface-container-low p-8 border-l-[12px] border-l-secondary relative">
                    <div className="absolute -top-3 -left-3 bg-black text-white w-10 h-10 border-2 border-white flex items-center justify-center font-black rounded-lg brutal-shadow-sm">
                      {idx + 1}
                    </div>
                    <h3 className="font-headline text-2xl mb-8 pl-4">
                      <strong>{q.text}</strong>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {q.options.map((opt: string, i: number) => (
                        <label key={i} className="flex items-start gap-4 p-5 border-2 border-black rounded-xl hover:bg-secondary/5 cursor-pointer transition-all has-[:checked]:bg-secondary/20 has-[:checked]:border-secondary has-[:checked]:translate-x-1 has-[:checked]:translate-y-1">
                          <div className="pt-1">
                            <input 
                              type="radio" 
                              name={q.id} 
                              checked={userAnswers[q.id] === i}
                              onChange={() => setUserAnswers(prev => ({ ...prev, [q.id]: i }))}
                              className="w-6 h-6 accent-secondary" 
                            />
                          </div>
                          <div className="flex-1">
                             <div className="flex items-center gap-2">
                                <span className={`font-black text-secondary flex-shrink-0 ${userAnswers[q.id] === i ? 'animate-pulse' : ''}`}>•</span>
                                <span className="font-bold text-lg leading-tight">{opt}</span>
                             </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : exam.sourceType === 'link' ? (
            <iframe 
              src={exam.examLink} 
              className="w-full h-full border-2 border-outline-variant rounded-xl shadow-inner"
              title="Exam Content"
            />
          ) : (exam.aiContext || exam.fileName || exam.sourceType === 'ai-quiz') ? (
            <div className="max-w-4xl mx-auto space-y-12 pb-24 h-full flex flex-col">
              <div className="text-center space-y-4 mb-8">
                <div className="w-20 h-20 bg-primary/10 border-4 border-primary mx-auto flex items-center justify-center rounded-2xl brutal-shadow-sm">
                  <FileText size={40} className="text-primary" />
                </div>
                <h1 className="text-4xl font-black italic uppercase tracking-tighter">{exam.title}</h1>
                <p className="text-on-surface-variant font-medium bg-surface-container px-4 py-1 border-2 border-black rounded-md inline-block uppercase text-xs font-bold tracking-widest">
                  Secure Content Viewer
                </p>
              </div>
              <div className="brutal-card bg-white text-black p-10 font-body leading-relaxed shadow-inner overflow-auto h-[70vh] border-4 border-black">
                {exam.aiContext ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b-2 border-black pb-4 mb-6">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">Verified Semantic Stream</p>
                    </div>
                    <pre className="whitespace-pre-wrap font-body text-lg border-l-8 border-primary/20 pl-8">
                      {exam.aiContext}
                    </pre>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-12 gap-6">
                     <div className="relative">
                        <Lock size={80} className="text-error/20" />
                        <motion.div 
                          animate={{ scale: [1, 1.1, 1] }} 
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <AlertCircle size={32} className="text-error" />
                        </motion.div>
                     </div>
                     <div className="space-y-2">
                        <p className="font-display text-3xl font-black uppercase italic tracking-tighter">Semantic Protocol Failed</p>
                        <p className="text-sm font-medium text-on-surface-variant max-w-md">
                          The document <strong>{exam.fileName || 'Untitled'}</strong> could not be decrypted into interactive nodes. 
                          This usually indicates a non-text PDF (image-based) or a restricted security wrapper.
                        </p>
                     </div>
                     <div className="p-4 bg-error/5 border-2 border-error rounded-xl max-w-sm">
                        <p className="text-xs font-bold text-error uppercase">Institutional Guidance</p>
                        <p className="text-[10px] mt-1">Please use the manual entry mode in Setup or contact your administrator for a text-based semantic packet.</p>
                     </div>
                  </div>
                )}
              </div>
              <div className="text-center">
                 <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant bg-surface-container inline-block px-4 py-2 border-2 border-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">End of semantic stream. Integrity monitoring active.</p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-12 pb-24 h-full flex flex-col justify-center">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-surface-container-highest border-4 border-black border-dashed flex items-center justify-center mx-auto rounded-full brutal-shadow-sm mb-4">
                   <Lock size={48} className="text-on-surface-variant/30" />
                </div>
                <h1 className="text-4xl font-black italic uppercase tracking-tighter">{exam.title}</h1>
                <div className="brutal-card bg-secondary/10 border-secondary p-8 max-w-lg mx-auto">
                   <p className="font-display text-xl font-bold mb-4 uppercase">Semantic Protocol Initialized</p>
                   <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                     This session has been provisioned as a secure integrity gateway. No interactive semantic nodes (questions) were detected in this packet. 
                     Please proceed with the external proctoring guidelines or return to the dashboard.
                   </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Proctoring Sidebar */}
        <div className="w-80 bg-surface-container border-l-4 border-black p-6 flex flex-col gap-6">
          <section>
            <h3 className="text-xs font-black uppercase text-on-surface-variant tracking-widest mb-4">Live Monitoring</h3>
            <CameraProctor 
              examId={exam.id} 
              onError={(type, message) => {
                setGuidance(`CAMERA ALERT: ${message}`);
              }}
              onViolation={(v) => {
                // Only increment formal violation count for serious anomalies
                if (v.severity !== 'MINIMAL') {
                  setViolations(prev => prev + 1);
                }
                
                // Map internal types to user-friendly subtle guidance
                const guidanceMap: Record<string, string> = {
                  'EYE_GAZE': 'Please keep your eyes focused on the screen',
                  'MULTIPLE_PEOPLE': 'System detected another person. Ensure you are alone.',
                  'PHONE_USAGE': 'Unauthorized device usage detected.',
                  'TALKING': 'Please remain silent during the examination.',
                  'OBJECT_USAGE': 'Unauthorized materials detected.',
                  'POSITIONING': 'Please stay centered in the camera frame.'
                };
                
                const message = guidanceMap[v.type] || 'Guidance: Please adhere to examination integrity protocols.';
                setGuidance(message);
              }}
            />
            <AudioProctor 
              examId={exam.id}
              onError={(type, message) => {
                // Show brief alert to user, optionally store it or just update guidance 
              }}
              onViolation={(v) => {
                if (v.severity !== 'MINIMAL') {
                  setViolations(prev => prev + 1);
                }
                const guidanceMap: Record<string, string> = {
                  'TALKING': 'Please remain silent during the examination.',
                  'BACKGROUND_VOICE': 'Background voice detected. Ensure you are alone.',
                  'NOISE': 'Unusual background noise detected.',
                };
                const message = guidanceMap[v.type] || 'Audio Guidance: Maintain a quiet environment.';
                setGuidance(message);
              }}
            />
          </section>

          <section className="flex-1 overflow-auto">
            <h3 className="text-xs font-black uppercase text-on-surface-variant tracking-widest mb-4">Integrity Status</h3>
            <div className="space-y-3">
              <div className={`p-3 border-2 border-black rounded-xl flex items-center justify-between ${violations > 0 ? 'bg-error/10' : 'bg-success/10'}`}>
                <span className="text-sm font-bold">Risk Level</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${violations > 5 ? 'bg-error text-on-error' : violations > 0 ? 'bg-warning text-on-warning' : 'bg-success text-on-success'}`}>
                  {violations > 5 ? 'CRITICAL' : violations > 0 ? 'WARNING' : 'SECURE'}
                </span>
              </div>

              {violations > 0 && (
                <div className="p-3 bg-error/5 border-2 border-error p-3 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-error font-black text-xs uppercase">
                    <AlertCircle size={14} />
                    Integrity Warnings
                  </div>
                  <p className="text-[10px] text-on-surface-variant leading-tight">
                    {violations} suspicious events detected. These have been timestamped and sent to the institutional auditor.
                  </p>
                </div>
              )}
            </div>
          </section>

          <div className="p-4 bg-black text-white rounded-xl text-[10px] font-mono leading-relaxed opacity-50">
            SYSTEM STATUS: OPERATIONAL<br/>
            CRYPTO-HASH: SHA-256<br/>
            PROCTOR-AI: REV-3.1<br/>
            AUDITOR: jagdishsolunke02@gmail.com
          </div>
        </div>
      </main>
    </div>
  );
}
