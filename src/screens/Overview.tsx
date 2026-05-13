import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, AlertCircle, ExternalLink, Play, BookOpen, PlusCircle, History, ShieldCheck } from 'lucide-react';
import { Screen, Session } from '../types';
import { db } from '../services/firebase';
import { collection, query, where, getCountFromServer, getDocs, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Exam } from '../types';

export default function Overview({ setScreen, onStartExam }: { setScreen: (s: Screen) => void, onStartExam: (e: Exam) => void }) {
  const { user, profile } = useAuth();
  const [examCount, setExamCount] = useState<number | null>(null);
  const [incidentCount, setIncidentCount] = useState<number>(0);
  const [integrityScore, setIntegrityScore] = useState<number>(100);
  const [recentExams, setRecentExams] = useState<Exam[]>([]);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const [permissions, setPermissions] = useState({ camera: 'pending', mic: 'pending' });

  const checkPermissions = async (request = false) => {
    try {
      // First attempt: Requesting both (Standard protocol)
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setPermissions({ camera: 'granted', mic: 'granted' });
      stream.getTracks().forEach(t => t.stop());
    } catch (err: any) {
      console.warn("Combined permission check failed, trying video only:", err.name);
      
      try {
        // Second attempt: Video only (Essential for proctoring)
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setPermissions({ camera: 'granted', mic: 'denied' });
        videoStream.getTracks().forEach(t => t.stop());
      } catch (videoErr: any) {
        console.error("Camera permission check failed:", videoErr);
        setPermissions({ camera: 'denied', mic: 'denied' });
        
        if (request) {
          if (videoErr.name === 'NotAllowedError' || videoErr.name === 'PermissionDeniedError') {
            alert("Permissions were denied. Please check your browser's address bar or site settings to enable the camera.");
          } else if (videoErr.name === 'NotFoundError' || videoErr.name === 'DevicesNotFoundError') {
            alert("No camera detected. Please ensure your hardware is connected correctly.");
          } else if (videoErr.name === 'NotReadableError' || videoErr.name === 'TrackStartError') {
            alert("Your camera appears to be in use by another application. Please close other tabs or apps using the camera and try again.");
          } else {
            alert(`Unexpected error: ${videoErr.message}. Please restart your browser.`);
          }
        }
      }
    }
  };

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const adminEmails = ['jagdishsolunke02@gmail.com', 'jagsol2029@gmail.com'];
        const isAdmin = adminEmails.includes(user.email || '') || profile?.role === 'admin';
        
        // Fetch Exam Count
        const qExams = isAdmin 
          ? collection(db, 'exams') 
          : query(collection(db, 'exams'), where('creatorId', '==', user.uid));
        const examSnapshot = await getCountFromServer(qExams);
        setExamCount(examSnapshot.data().count);

        // Fetch Incident Count
        const qIncidents = isAdmin
          ? collection(db, 'incidents')
          : query(collection(db, 'incidents'), where('studentId', '==', user.uid));
        const incidentSnapshot = await getCountFromServer(qIncidents);
        const incidents = incidentSnapshot.data().count;
        setIncidentCount(incidents);

        // Fetch Total Sessions to calculate Integrity Score
        const qTotalSessions = isAdmin
          ? collection(db, 'sessions')
          : query(collection(db, 'sessions'), where('studentId', '==', user.uid));
        const sessionsTotalSnapshot = await getCountFromServer(qTotalSessions);
        const totalSessions = sessionsTotalSnapshot.data().count;
        
        let calculatedScore = 100;
        if (totalSessions > 0) {
           // Basic heuristic: 1 incident per session drops the score significantly.
           // E.g. (incidents / (totalSessions * 3)) * 100% penalty.
           const incidentRatio = Math.min(1, incidents / (totalSessions * 3));
           calculatedScore = Math.max(0, parseFloat((100 - (incidentRatio * 100)).toFixed(1)));
        } else if (incidents > 0) {
           calculatedScore = Math.max(0, 100 - (incidents * 10));
        }
        setIntegrityScore(calculatedScore);

        // Fetch Recent Exams for the stream
        const examsQuery = query(collection(db, 'exams'), orderBy('createdAt', 'desc'), limit(5));
        const examsSnapshot = await getDocs(examsQuery);
        const exams = examsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Exam[];
        setRecentExams(exams);

        // Fetch Recent Sessions
        const sessionsQuery = isAdmin
          ? query(collection(db, 'sessions'), orderBy('createdAt', 'desc'), limit(5))
          : query(collection(db, 'sessions'), where('studentId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
        
        const sessionsSnapshot = await getDocs(sessionsQuery);
        const sessions = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Session[];
        setRecentSessions(sessions);

      } catch (error) {
        console.error("Error fetching overview data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    checkPermissions();
  }, [user, profile]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => checkPermissions(true)}
          className={`brutal-card border-black flex flex-col justify-center items-center gap-2 cursor-pointer transition-all hover:scale-105 ${permissions.camera === 'granted' ? 'bg-success/10' : 'bg-error/10 animate-pulse'}`}
        >
          <div className={`p-3 rounded-full border-2 border-black brutal-shadow-sm ${permissions.camera === 'granted' ? 'bg-success text-on-success' : 'bg-error text-on-error'}`}>
            {permissions.camera === 'granted' ? <ShieldCheck size={24} /> : <AlertCircle size={24} />}
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest leading-none">Global Permissions</p>
            <div className="flex flex-col gap-1 mt-1 mb-1">
              <div className="flex items-center justify-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${permissions.camera === 'granted' ? 'bg-success' : 'bg-error animate-pulse'}`}></div>
                <span className={`font-bold text-[10px] ${permissions.camera === 'granted' ? 'text-success' : 'text-error'}`}>CAMERA: {permissions.camera === 'granted' ? 'ACTIVE' : 'DENIED'}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${permissions.mic === 'granted' ? 'bg-success' : 'bg-error/40'}`}></div>
                <span className={`font-bold text-[10px] ${permissions.mic === 'granted' ? 'text-success' : 'text-on-surface-variant/40'}`}>AUDIO: {permissions.mic === 'granted' ? 'ACTIVE' : 'RESTRICTED'}</span>
              </div>
            </div>
            {permissions.camera === 'denied' && (
              <p className="text-[9px] text-error uppercase font-bold opacity-70">Click to Re-authorize</p>
            )}
          </div>
        </div>
        <div className="md:col-span-2 lg:col-span-2 brutal-card relative overflow-hidden group border-primary">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest">USER AUTHENTICITY</h3>
              <p className="font-display text-6xl text-primary font-black mt-2">{loading ? '...' : `${integrityScore}%`}</p>
            </div>
            <div className="bg-secondary text-on-secondary border-2 border-black px-3 py-1 font-data text-[12px] brutal-shadow-sm uppercase">
              {loading ? 'CALCULATING...' : 'Live Protocol ACTIVE'}
            </div>
          </div>
          
          <div className="h-32 w-full mt-6 flex items-end gap-2">
            {recentSessions.length > 0 ? (
              // Map recent sessions to a score out of 100 for the bar chart
              // Fill with dummy data to maintain min 7 bars for aesthetic if needed
              [...recentSessions, ...Array(Math.max(0, 7 - recentSessions.length)).fill(null)].slice(0, 7).map((session, i) => {
                const h = session ? Math.max(10, 100 - ((session.violations || 0) * 10)) : 100;
                return (
                 <div 
                   key={i} 
                   className="flex-1 brutal-border transition-all duration-700 hover:scale-y-110 relative"
                   style={{ height: `${h}%`, backgroundColor: i % 2 === 0 ? 'var(--color-primary)' : 'var(--color-secondary)' }}
                   title={session ? `Session from ${new Date(session.createdAt || Date.now()).toLocaleDateString()} - Score: ${h}%` : 'No session'}
                 >
                   <div className="absolute inset-0 animate-shimmer opacity-30"></div>
                 </div>
                );
               })
            ) : (
             // Initial placeholder state
             [70, 50, 90, 65, 85, 45, 95].map((h, i) => (
               <div 
                 key={i} 
                 className="flex-1 brutal-border transition-all duration-700 hover:scale-y-110 relative"
                 style={{ height: `${h}%`, backgroundColor: i % 2 === 0 ? 'var(--color-primary)' : 'var(--color-secondary)' }}
               >
                 <div className="absolute inset-0 animate-shimmer opacity-30"></div>
               </div>
             ))
            )}
          </div>
        </div>

        <div className="brutal-card border-tertiary">
          <div className="flex justify-between items-start">
             <h3 className="text-xs font-bold text-tertiary uppercase tracking-widest">Active Exams</h3>
             <BookOpen size={18} className="text-tertiary" />
          </div>
          <div className="mt-4">
            <p className="font-display text-5xl text-on-surface font-black">{examCount !== null ? examCount : '...'}</p>
            <div className="flex items-center gap-2 text-primary mt-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="font-data text-xs uppercase">ENCRYPTED ARCHIVES</span>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setScreen('flagged')}
          className="brutal-card border-error cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-xs font-bold text-error uppercase tracking-widest">Incident Flags</h3>
            <AlertCircle size={18} className="text-error" />
          </div>
          <div className="mt-4">
            <p className="font-display text-5xl text-error font-black group-hover:scale-110 transition-transform origin-left">
              {incidentCount < 10 ? `0${incidentCount}` : incidentCount}
            </p>
            <p className="text-xs text-on-surface-variant mt-1 uppercase font-bold tracking-tighter">AI-Detected Anomalies</p>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setScreen('flagged'); }}
            className="w-full mt-6 bg-error text-on-error brutal-border brutal-shadow-sm font-bold py-2 hover:bg-error-container transition-colors uppercase text-xs"
          >
            REVIEW INCIDENTS
          </button>
        </div>
      </div>

      {/* Main CTA Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div 
          onClick={() => setScreen('setup')}
          className="group cursor-pointer p-8 bg-secondary border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all rounded-xl"
        >
          <div className="w-14 h-14 bg-black text-secondary rounded-lg flex items-center justify-center mb-6 brutal-shadow-sm">
            <PlusCircle size={32} />
          </div>
          <h4 className="font-headline text-3xl text-black mb-2 uppercase">Provision Global Exam</h4>
          <p className="text-on-secondary opacity-70 leading-tight">Launch secure testing environments for candidates across any institution.</p>
        </div>

        <div 
          onClick={() => setScreen('analytics')}
          className="group cursor-pointer p-8 bg-surface-container border-4 border-primary shadow-[8px_8px_0px_0px_var(--color-primary)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all rounded-xl"
        >
          <div className="w-14 h-14 bg-primary text-on-primary rounded-lg flex items-center justify-center mb-6 brutal-shadow-sm">
            <TrendingUp size={32} />
          </div>
          <h4 className="font-headline text-3xl text-white mb-2 uppercase tracking-tight">Integrity Analytics</h4>
          <p className="text-on-surface-variant opacity-70 leading-tight">Review large-scale integrity trends and institutional risk profiles via AI auditing.</p>
        </div>
      </div>

      {/* Recent Activity Mini-Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="brutal-card border-outline-variant bg-surface-container-lowest">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline text-2xl uppercase italic tracking-tighter">Available Examination Gateways</h3>
            <span className="bg-secondary text-on-secondary px-3 py-1 font-data text-xs border border-black brutal-shadow-sm uppercase">OPEN PROTOCOLS</span>
          </div>
          
          <div className="space-y-4">
            {recentExams.map((exam) => (
              <div 
                key={exam.id} 
                className="flex items-center justify-between p-4 bg-background border-2 border-black rounded-lg hover:border-primary transition-colors cursor-pointer group"
                onClick={() => onStartExam(exam)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-surface-container-highest border border-black flex items-center justify-center font-data text-primary font-bold group-hover:bg-primary group-hover:text-on-primary transition-colors">
                    {exam.title.substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-lg">{exam.title}</p>
                    <p className="font-data text-[10px] text-on-surface-variant uppercase tracking-widest">{exam.institution}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                    <span className="font-data text-on-surface-variant text-[10px] uppercase">CREATOR</span>
                    <span className="font-bold text-xs">{exam.creatorEmail?.split('@')[0] || 'ADMIN'}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onStartExam(exam); }}
                    className="bg-primary text-on-primary brutal-border brutal-shadow-sm p-3 hover:translate-x-1 transition-transform"
                    title="Enter Secure Session"
                  >
                    <Play size={18} fill="currentColor" />
                  </button>
                </div>
              </div>
            ))}

            {recentExams.length === 0 && !loading && (
              <div className="text-center py-12 border-2 border-dashed border-outline-variant rounded-xl">
                <p className="text-on-surface-variant font-bold">No active examination protocols found in your region.</p>
              </div>
            )}
          </div>
        </div>

        <div className="brutal-card border-primary bg-surface-container-lowest">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline text-2xl uppercase italic tracking-tighter text-primary">Recent Integrity Sessions</h3>
            <div className="flex items-center gap-2">
              <History size={16} className="text-primary" />
              <span className="bg-primary text-on-primary px-3 py-1 font-data text-xs border border-black brutal-shadow-sm uppercase">History</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {recentSessions.map((session) => (
              <div 
                key={session.id} 
                className="flex items-center justify-between p-4 bg-background border-2 border-black rounded-lg hover:border-secondary transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-surface-container-highest border border-black flex items-center justify-center font-data text-secondary font-bold group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                    {session.violations > 0 ? <AlertCircle size={20} /> : <ShieldCheck size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-lg">{session.examTitle}</p>
                    <p className="font-data text-[10px] text-on-surface-variant uppercase tracking-widest">
                      {new Date(session.endTime).toLocaleDateString()} • {formatDuration(session.durationSeconds)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                    <span className="font-data text-on-surface-variant text-[10px] uppercase">SCORE</span>
                    <span className="font-bold text-xs">
                      {session.score !== null ? `${session.score}/${session.totalQuestions}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-data text-on-surface-variant text-[10px] uppercase">FLAGS</span>
                    <span className={`font-bold text-xs ${session.violations > 0 ? 'text-error' : 'text-success'}`}>
                      {session.violations}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {recentSessions.length === 0 && !loading && (
              <div className="text-center py-12 border-2 border-dashed border-outline-variant rounded-xl">
                <p className="text-on-surface-variant font-bold italic opacity-60">No recent session data archived in this sector.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-4">
        <p className="text-on-surface-variant font-headline text-sm italic opacity-40 uppercase tracking-[0.3em]">Integrity, without intrusion</p>
      </div>
    </div>
  );
}
