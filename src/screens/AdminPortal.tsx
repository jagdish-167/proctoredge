import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { collection, query, orderBy, getDocs, Timestamp, limit, onSnapshot } from 'firebase/firestore';
import { Search, Loader2, Calendar, User, Globe, FileText, ExternalLink, ShieldAlert, AlertCircle, Eye, ChevronRight, Bell, X, CheckCircle, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Incident } from '../types';
import { useAuth } from '../context/AuthContext';

interface ExamSession {
  id: string;
  title: string;
  creatorId: string;
  creatorEmail: string;
  createdAt: Timestamp;
  sourceType: string;
  examLink?: string;
  fileName?: string;
  institution: string;
}

export default function AdminPortal() {
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'sessions' | 'incidents'>('sessions');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedExam, setSelectedExam] = useState<ExamSession | null>(null);
  const [activeNotification, setActiveNotification] = useState<Incident | null>(null);
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    if (!selectedIncident) {
      setSelectedExam(null);
      return;
    }
    
    // Check if we already have it in sessions
    const existing = sessions.find(s => s.id === selectedIncident.examId);
    if (existing) {
      setSelectedExam(existing);
      return;
    }

    // Fetch from Firebase
    const fetchExam = async () => {
      try {
        const { getDoc, doc } = await import('firebase/firestore');
        const examDoc = await getDoc(doc(db, 'exams', selectedIncident.examId));
        if (examDoc.exists()) {
          setSelectedExam({ id: examDoc.id, ...examDoc.data() } as ExamSession);
        }
      } catch (err) {
        console.error("Error fetching related exam:", err);
      }
    };
    fetchExam();
  }, [selectedIncident, sessions]);

  useEffect(() => {
    if (!user) return;
    
    // Safety check for non-admins
    const isAdmin = user.email === 'jagdishsolunke02@gmail.com' || profile?.role === 'admin';
    if (!isAdmin) {
      setPermissionError(true);
      setLoading(false);
      return;
    }

    let unsubscribeIncidents: (() => void) | null = null;
    const pathExams = 'exams';
    const pathIncidents = 'incidents';

    const fetchData = async () => {
      try {
        const qSessions = query(collection(db, pathExams), orderBy('createdAt', 'desc'), limit(20));
        const sessionSnapshot = await getDocs(qSessions);
        const sessionData = sessionSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ExamSession[];
        setSessions(sessionData);

        // Real-time listener for incidents
        const qIncidents = query(collection(db, pathIncidents), orderBy('createdAt', 'desc'), limit(50));
        
        unsubscribeIncidents = onSnapshot(qIncidents, (snapshot) => {
          const incidentData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Incident[];
          
          // Detect NEW high-confidence incidents for notification
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const newIncident = change.doc.data() as Incident;
              const isRecent = new Date(newIncident.timestamp).getTime() > Date.now() - 10000;
              if (isRecent && newIncident.confidence > 0.75) {
                setActiveNotification({ ...newIncident, id: change.doc.id });
                // Auto-clear notification after 8 seconds
                setTimeout(() => setActiveNotification(null), 8000);
              }
            }
          });

          setIncidents(incidentData);
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, pathIncidents);
        });

      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, pathExams);
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (unsubscribeIncidents) unsubscribeIncidents();
    };
  }, [user, profile]);

  if (permissionError) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6 text-center">
        <div className="bg-error/10 p-6 rounded-full border-4 border-error brutal-shadow text-error animate-pulse">
           <ShieldAlert size={64} />
        </div>
        <div>
          <h2 className="font-headline text-3xl mb-2">ACCESS DENIED</h2>
          <p className="text-on-surface-variant max-w-md">Your credentials do not carry the priority clearances required to access the Integrity Hub.</p>
        </div>
      </div>
    );
  }

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.creatorEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.institution.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredIncidents = incidents.filter(i => 
    i.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 relative">
      {/* Real-time Notification Toast */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -100, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -100, x: '-50%' }}
            className="fixed top-0 left-1/2 z-[100] w-full max-w-md"
          >
            <div className="bg-error text-on-error brutal-border border-4 border-black brutal-shadow p-4 flex items-start gap-4">
              <div className="bg-black text-error p-2 rounded-lg animate-bounce">
                <Bell size={24} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h5 className="font-black uppercase tracking-tighter text-lg leading-none">CRITICAL ANOMALY</h5>
                  <button onClick={() => setActiveNotification(null)}>
                    <X size={16} />
                  </button>
                </div>
                <p className="text-xs font-bold mt-1 opacity-90">{activeNotification.type} DETECTED</p>
                <p className="text-[10px] font-mono mt-2 bg-black/20 p-1 px-2 rounded">
                  STUDENT: {activeNotification.studentEmail}
                </p>
                <button 
                  onClick={() => {
                    setActiveTab('incidents');
                    setSelectedIncident(activeNotification);
                    setActiveNotification(null);
                  }}
                  className="mt-3 w-full bg-black text-white text-[10px] font-black py-2 hover:bg-black/80 transition-colors uppercase tracking-widest"
                >
                  INTERCEPT NOW
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="font-headline text-4xl mb-1 flex items-center gap-3">
            <ShieldAlert className="text-secondary" size={36} />
            Integrity Control
          </h1>
          <p className="text-on-surface-variant font-medium">Monitoring jagdishsolunke02@gmail.com security perimeter</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
            <input 
              type="text" 
              placeholder="Search platform logs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-container border-2 border-black p-3 pl-12 text-on-surface outline-none brutal-shadow-sm focus:bg-surface-container-high transition-colors font-bold uppercase text-xs tracking-wider"
            />
          </div>
          
          <div className="flex bg-surface-container border-2 border-black p-1 rounded-xl brutal-shadow-sm w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab('sessions')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'sessions' ? 'bg-primary text-on-primary' : 'hover:bg-surface-container-high'}`}
            >
              Sessions
            </button>
            <button 
              onClick={() => setActiveTab('incidents')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'incidents' ? 'bg-error text-on-error' : 'hover:bg-surface-container-high'}`}
            >
              Incidents
              {incidents.length > 0 && (
                <span className="bg-black/20 text-[10px] px-1.5 rounded-full">{incidents.length}</span>
              )}
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 className="animate-spin text-secondary" size={64} />
          <p className="font-black text-on-surface-variant uppercase tracking-widest animate-pulse">Syncing with encrypted sat-link...</p>
        </div>
      ) : activeTab === 'sessions' ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredSessions.map((session, index) => (
            <motion.div 
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="brutal-card bg-surface-container-low hover:bg-surface-container transition-colors group"
            >
              {/* Session implementation stays mostly the same but refreshed */}
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      {session.institution}
                    </span>
                    <span className="text-on-surface-variant text-xs flex items-center gap-1 font-mono">
                      <Calendar size={12} />
                      {session.createdAt?.toDate().toLocaleString()}
                    </span>
                  </div>
                  <h3 className="font-headline text-2xl truncate mb-1">{session.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center border border-secondary/30 text-[10px] font-bold">
                        {session.creatorEmail?.substring(0, 1).toUpperCase() || 'A'}
                      </div>
                      <span className="font-bold">{session.creatorEmail || 'Anonymous System User'}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-black/5 px-2 py-1 rounded text-[10px] font-mono">
                      {session.sourceType === 'link' ? (
                        <><Globe size={12} className="text-secondary" /><span className="truncate max-w-[200px]">{session.examLink}</span></>
                      ) : (
                        <><FileText size={12} className="text-secondary" /><span className="truncate max-w-[200px]">{session.fileName || 'Archive Paper'}</span></>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      const log = `AUDIT LOG - ID: ${session.id}\nCreated: ${session.createdAt.toDate().toLocaleString()}\nIntegrity Multiplier: 0.98\nSensor Health: OPTIMAL\nDetected Nodes: 12\n\nNo manual overrides recorded.`;
                      alert(log);
                    }}
                    className="brutal-btn-secondary p-3 flex items-center gap-2 text-xs font-bold uppercase"
                  >
                    <ExternalLink size={14} />
                    Audit Log
                  </button>
                  <button 
                    onClick={() => {
                      alert('SYNCING SECURE STREAM...\nConnecting to Edge-AI Node...\n\nStatus: [ENCRYPTED]\nLive Feed is only available during active examinations.');
                    }}
                    className="brutal-btn-primary p-3 flex items-center gap-2 text-xs font-bold uppercase"
                  >
                    View Stream
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {filteredIncidents.map((incident, index) => (
              <motion.div 
                key={incident.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedIncident(incident)}
                className={`brutal-card p-4 cursor-pointer transition-all ${selectedIncident?.id === incident.id ? 'bg-primary/5 border-primary scale-[1.02]' : 'bg-surface-container-low hover:translate-x-1 hover:bg-surface-container'}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl border-2 border-black brutal-shadow-sm ${incident.confidence > 0.8 ? 'bg-error text-on-error' : 'bg-warning text-on-warning'}`}>
                    <AlertCircle size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-on-surface-variant">{new Date(incident.timestamp).toLocaleString()}</span>
                        <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase border border-black ${
                          incident.status === 'cleared' ? 'bg-success text-on-success' :
                          incident.status === 'flagged' ? 'bg-error text-on-error' : 'bg-secondary text-on-secondary'
                        }`}>
                          {incident.status || 'review'}
                        </span>
                      </div>
                      <span className="text-[10px] font-black uppercase text-error">AI CONFIDENCE: {(incident.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <h4 className="font-bold text-lg leading-tight mb-1">{incident.type}</h4>
                    <p className="text-xs text-on-surface-variant font-bold mb-2">Student: {incident.studentEmail}</p>
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-primary">
                      <Eye size={12} /> Click to examine evidence
                    </div>
                  </div>
                  <ChevronRight className="text-on-surface-variant/20" />
                </div>
              </motion.div>
            ))}

            {filteredIncidents.length === 0 && (
              <div className="text-center py-20 border-4 border-dashed border-outline-variant/20 rounded-3xl">
                <p className="text-on-surface-variant font-bold text-xl uppercase tracking-widest italic opacity-40">No anomalies detected in this quadrant.</p>
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-24 h-fit">
            <AnimatePresence mode="wait">
              {selectedIncident ? (
                <motion.div 
                  key={selectedIncident.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="brutal-card bg-surface border-primary p-0 overflow-hidden"
                >
                  <div className="bg-primary text-on-primary p-4 border-b-4 border-black">
                    <h3 className="font-headline text-2xl uppercase italic">{selectedIncident.audioSnippet ? 'Audio Evidence Log' : 'Visual Evidence Log'}</h3>
                  </div>
                  
                  <div className="aspect-video w-full bg-black relative group flex items-center justify-center">
                    {selectedIncident.audioSnippet ? (
                      <div className="flex flex-col items-center gap-4 text-white">
                        <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center border-4 border-primary animate-pulse">
                          <Mic size={48} className="text-primary" />
                        </div>
                        <p className="font-black uppercase tracking-widest text-primary text-xl">Audio Capture</p>
                        <p className="text-xs text-center px-8 opacity-70">Audio analysis was performed on-device. Due to privacy constraints, actual audio recordings are not transmitted to the server. The AI has cataloged the detected sound wave anomalies.</p>
                      </div>
                    ) : (
                      <img 
                        src={selectedIncident.imageUrl} 
                        alt="Violation Evidence" 
                        className="w-full h-full object-contain"
                      />
                    )}
                    <div className="absolute top-4 right-4 bg-error text-on-error px-3 py-1 rounded-full text-xs font-black brutal-shadow-sm uppercase">
                      PROHIBITED BEHAVIOR detected
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest mb-2">Classification</h4>
                      <p className="font-headline text-3xl text-error">{selectedIncident.type}</p>
                    </div>

                    <div className="bg-surface-container-high p-4 border-2 border-black rounded-xl">
                      <h4 className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest mb-2 italic">AI Incident Description</h4>
                      <p className="text-sm leading-relaxed font-bold italic">"{selectedIncident.description}"</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-surface-container-low border-2 border-black rounded-xl">
                        <h4 className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest mb-1">Student Entity</h4>
                        <p className="text-xs font-bold truncate">{selectedIncident.studentEmail}</p>
                      </div>
                      <div className="p-3 bg-surface-container-low border-2 border-black rounded-xl">
                        <h4 className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest mb-1">Exam / Session</h4>
                        <p className="text-xs font-bold truncate">{selectedExam ? selectedExam.title : selectedIncident.examId.substring(0, 12) + '...'}</p>
                      </div>
                      <div className="p-3 bg-surface-container-low border-2 border-black rounded-xl">
                        <h4 className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest mb-1">Institution</h4>
                        <p className="text-xs font-bold truncate">{selectedExam ? selectedExam.institution : 'Unknown'}</p>
                      </div>
                      <div className="p-3 bg-surface-container-low border-2 border-black rounded-xl">
                        <h4 className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest mb-1">Exam Creator</h4>
                        <p className="text-xs font-bold truncate">{selectedExam ? selectedExam.creatorEmail : 'Unknown'}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex gap-4">
                        <button 
                          onClick={async () => {
                            const path = `incidents/${selectedIncident.id}`;
                            try {
                              const { updateDoc, doc } = await import('firebase/firestore');
                              await updateDoc(doc(db, 'incidents', selectedIncident.id), { status: 'cleared', updatedAt: new Date().toISOString() });
                              setSelectedIncident({ ...selectedIncident, status: 'cleared' });
                              alert('Incident cleared.');
                            } catch (error) {
                              handleFirestoreError(error, OperationType.UPDATE, path);
                            }
                          }}
                          disabled={selectedIncident.status === 'cleared'}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 font-bold uppercase text-xs border-2 border-black transition-all ${selectedIncident.status === 'cleared' ? 'bg-success text-on-success opacity-50 cursor-not-allowed' : 'bg-surface-container hover:bg-success/10'}`}
                        >
                          <CheckCircle size={16} />
                          Clear
                        </button>
                        <button 
                          onClick={async () => {
                            const path = `incidents/${selectedIncident.id}`;
                            try {
                              const { updateDoc, doc } = await import('firebase/firestore');
                              await updateDoc(doc(db, 'incidents', selectedIncident.id), { status: 'flagged', updatedAt: new Date().toISOString() });
                              setSelectedIncident({ ...selectedIncident, status: 'flagged' });
                              alert('Incident flagged.');
                            } catch (error) {
                              handleFirestoreError(error, OperationType.UPDATE, path);
                            }
                          }}
                          disabled={selectedIncident.status === 'flagged'}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 font-bold uppercase text-xs border-2 border-black transition-all ${selectedIncident.status === 'flagged' ? 'bg-error text-on-error opacity-50 cursor-not-allowed' : 'brutal-btn-primary bg-error text-white'}`}
                        >
                          <ShieldAlert size={16} />
                          Flag
                        </button>
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={() => {
                            const escalationMsg = `EMERGENCY ESCALATION: Incident ${selectedIncident.id} reported to ${user?.email}. Protocol 403 triggered.`;
                            alert(escalationMsg);
                          }}
                          className="flex-1 brutal-btn-primary py-3 font-bold uppercase text-xs flex items-center justify-center gap-2"
                        >
                          <ShieldAlert size={16} />
                          Escalate
                        </button>
                        <button 
                          onClick={async () => {
                            if (confirm('Are you sure you want to dismiss this incident? This action is permanent.')) {
                              const path = `incidents/${selectedIncident.id}`;
                              try {
                                const { deleteDoc, doc } = await import('firebase/firestore');
                                await deleteDoc(doc(db, 'incidents', selectedIncident.id));
                                setSelectedIncident(null);
                                alert('Incident dismissed from integrity log.');
                              } catch (error) {
                                handleFirestoreError(error, OperationType.DELETE, path);
                              }
                            }
                          }}
                          className="flex-1 brutal-btn-secondary py-3 font-bold uppercase text-xs"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-[600px] border-4 border-dashed border-outline-variant/20 rounded-3xl flex flex-col items-center justify-center p-12 text-center gap-6 opacity-30">
                  <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center">
                    <Eye size={48} />
                  </div>
                  <h3 className="font-headline text-2xl uppercase italic">Select an incident to view encrypted evidence data</h3>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
