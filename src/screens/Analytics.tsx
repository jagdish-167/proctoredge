import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, ShieldCheck, MapPin, Eye, Mic, Laptop, Loader2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { collection, getCountFromServer, getDocs, orderBy, query, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function Analytics() {
  const { user, profile } = useAuth();
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalIncidents, setTotalIncidents] = useState<number | null>(null);
  const [totalExams, setTotalExams] = useState<number | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchTotals = async () => {
      setLoading(true);
      try {
        const isAdmin = user.email === 'jagdishsolunke02@gmail.com' || profile?.role === 'admin';
        
        // Students can only see their own incidents count
        const incidentQuery = isAdmin 
          ? collection(db, 'incidents') 
          : query(collection(db, 'incidents'), where('studentId', '==', user.uid));
        
        const incidentSnapshot = await getCountFromServer(incidentQuery);
        setTotalIncidents(incidentSnapshot.data().count);

        // All users can count exams (assuming exams are public for now)
        const examSnapshot = await getCountFromServer(collection(db, 'exams'));
        setTotalExams(examSnapshot.data().count);

        // Fetch Exam History (Sessions)
        const sessionsQuery = isAdmin
          ? query(collection(db, 'sessions'), orderBy('createdAt', 'desc'))
          : query(collection(db, 'sessions'), where('studentId', '==', user.uid), orderBy('createdAt', 'desc'));
        
        const querySnapshot = await getDocs(sessionsQuery);
        const fetchedSessions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSessions(fetchedSessions);

        // Only admins can count total users
        if (isAdmin) {
          const userSnapshot = await getCountFromServer(collection(db, 'users'));
          setTotalUsers(userSnapshot.data().count);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTotals();
  }, [user, profile]);

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-container border-4 border-black p-6 brutal-shadow-sm">
        <div>
          <h2 className="font-headline text-3xl font-black italic tracking-tighter">Institutional Integrity Report</h2>
          <p className="text-on-surface-variant font-medium text-[10px] sm:text-xs mt-1 uppercase tracking-[0.2em]">Global Integrity Node: SEC_ALPHA_9</p>
        </div>
        <button 
          onClick={() => {
            alert('PROTOCOL: GENERATING ENCRYPTED PDF...\nAGGREGATING SENSOR METRICS...\n\nInstitutional Integrity Report (Q2 2026) will be delivered to your official record.');
          }}
          className="w-full md:w-auto bg-primary text-on-primary border-3 border-black brutal-shadow px-6 py-3 font-bold hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <TrendingUp size={20} />
          Export Global Stats
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="brutal-card border-primary">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4">Anomaly Distribution</h3>
          <div className="aspect-video bg-background border-2 border-black relative overflow-hidden group">
            <img 
              src="https://images.unsplash.com/photo-1551288049-bbbda546697a?w=800&q=80" 
              className="w-full h-full object-cover grayscale opacity-40" 
              alt="Globe Heatmap"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-secondary text-on-secondary border-2 border-black p-4 brutal-shadow-sm flex flex-col items-center">
                <span className="font-display text-3xl font-black">{totalExams ?? '--'}</span>
                <span className="text-[10px] font-bold uppercase">Active Exam Protocols</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 brutal-card border-secondary">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-secondary uppercase tracking-widest">Integrity Metrics</h3>
            <div className="flex gap-4">
               {['Weekly', 'Monthly', 'Quarterly'].map(t => (
                 <span key={t} className="text-[10px] font-bold uppercase opacity-50 cursor-pointer hover:text-secondary">{t}</span>
               ))}
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="animate-spin text-secondary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               {[
                 { icon: Users, val: totalUsers !== null ? totalUsers.toLocaleString() : '--', label: 'Registered Entities', color: 'text-primary' },
                 { icon: AlertCircle, val: totalIncidents?.toLocaleString() ?? '0', label: profile?.role === 'admin' ? 'Total AI Flags' : 'My Flags', color: 'text-tertiary' },
                 { icon: Laptop, val: totalExams?.toLocaleString() ?? '0', label: 'Secure Sessions', color: 'text-secondary' },
                 { icon: ShieldCheck, val: '0.8%', label: 'Confirmed Breach', color: 'text-error' },
               ].map((stat, i) => (
                 <div key={i} className="flex flex-col gap-1 p-3 bg-surface-container rounded-lg border border-outline-variant/30">
                   <stat.icon size={16} className={stat.color} />
                   <span className="font-display text-2xl mt-1">{stat.val}</span>
                   <span className="text-[10px] uppercase font-bold opacity-60 leading-tight">{stat.label}</span>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>

      <div className="brutal-card p-0 overflow-hidden">
        <div className="p-6 border-b-2 border-black flex justify-between items-center bg-surface-container">
          <h3 className="font-headline text-2xl font-bold italic uppercase tracking-tighter">Exam Session History</h3>
          <button 
            onClick={() => alert('Exporting encrypted integrity history...')}
            className="bg-primary text-on-primary border-2 border-black brutal-shadow-sm px-4 py-2 font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-colors"
          >
            Export Archive
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-highest border-b-2 border-black">
              <tr>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest">Exam Session</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest">Candidate</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest">Duration</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest">Violations</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest">Outcome</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right">Reference</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-on-surface-variant font-bold italic opacity-40">
                    <Loader2 className="animate-spin mx-auto mb-2" />
                    DECRYPTING HISTORY...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-on-surface-variant font-bold italic opacity-40 uppercase tracking-widest">
                    No session logs found in the integrity node.
                  </td>
                </tr>
              ) : (
                sessions.map((session, i) => (
                  <tr key={session.id} className="border-b-2 border-black last:border-0 hover:bg-surface-container transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black brutal-border flex items-center justify-center font-black text-white text-[10px] shrink-0">
                          {session.examTitle?.substring(0, 2).toUpperCase() || 'EX'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{session.examTitle || 'Untitled Session'}</span>
                          <span className="text-[9px] font-mono opacity-50 uppercase">{new Date(session.startTime).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-medium text-on-surface-variant">{session.studentEmail}</span>
                    </td>
                    <td className="p-4 font-data text-xs">{formatDuration(session.durationSeconds)}</td>
                    <td className="p-4">
                      <span className={`font-black text-xs ${session.violations > 0 ? 'text-error' : 'text-success'}`}>
                        {session.violations} ANOMALIES
                      </span>
                    </td>
                    <td className="p-4">
                      {session.score !== null ? (
                        <div className="flex flex-col">
                          <span className="font-display font-bold text-lg leading-none">{session.score}/{session.totalQuestions}</span>
                          <span className="text-[9px] font-black uppercase opacity-60">Verified Score</span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 bg-surface-container-highest border border-black text-[9px] font-black rounded uppercase">Audit Only</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-secondary font-black text-[10px] hover:underline uppercase tracking-widest">View Nodes</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AlertCircle(props: any) { return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>; }

