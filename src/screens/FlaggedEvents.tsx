import React, { useState, useEffect } from 'react';
import { FlaggedEvent, Incident } from '../types';
import { Camera, Mic, Layout, Search, Filter, Play, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { collection, query, orderBy, getDocs, limit, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function FlaggedEvents({ onTriage }: { onTriage: (id: string) => void }) {
  const { user, profile } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'CRITICAL' | 'MODERATE' | 'MINIMAL'>('all');

  useEffect(() => {
    if (!user) return;

    const fetchIncidents = async () => {
      setLoading(true);
      const path = 'incidents';
      try {
        const isAdmin = user.email === 'jagdishsolunke02@gmail.com' || profile?.role === 'admin';
        const q = isAdmin 
          ? query(collection(db, path), orderBy('createdAt', 'desc'), limit(50))
          : query(collection(db, path), where('studentId', '==', user.uid), orderBy('createdAt', 'desc'), limit(50));
        
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Incident[];
        setIncidents(data);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, [user, profile]);

  const filteredIncidents = filter === 'all' 
    ? incidents 
    : incidents.filter(i => (i as any).severity === filter);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-headline text-4xl font-extrabold text-on-surface">Queue Triage</h2>
          <p className="text-on-surface-variant font-body mt-2">AI-assisted priority distribution for manual human review.</p>
        </div>
        <div className="flex gap-4">
           {['all', 'CRITICAL', 'MODERATE', 'MINIMAL'].map((s) => (
             <button
              key={s}
              onClick={() => setFilter(s as any)}
              className={`px-4 py-2 brutal-border font-bold text-xs uppercase tracking-widest transition-all ${
                filter === s 
                  ? 'bg-secondary text-on-secondary brutal-shadow-sm' 
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant'
              }`}
             >
               {s}
             </button>
           ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-secondary" size={48} />
          <p className="font-bold opacity-50">SYNCING INCIDENT DATA...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredIncidents.map((incident) => (
            <div 
              key={incident.id} 
              className="brutal-card border-4 group hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer overflow-hidden p-0"
              style={{ 
                borderColor: (incident as any).severity === 'CRITICAL' ? 'var(--color-error)' : (incident as any).severity === 'MODERATE' ? 'var(--color-secondary)' : 'var(--color-primary)' 
              }}
              onClick={() => onTriage(incident.id)}
            >
              <div className="relative aspect-video">
                <img src={incident.imageUrl} alt={incident.type} className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-500" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className={`px-2 py-1 brutal-border text-[10px] font-black uppercase text-white ${
                    (incident as any).severity === 'CRITICAL' ? 'bg-error' : (incident as any).severity === 'MODERATE' ? 'bg-secondary text-black' : 'bg-primary text-black'
                  }`}>
                    {(incident as any).severity} RISK
                  </span>
                  <span className={`px-2 py-1 brutal-border text-[10px] font-black uppercase border border-black ${
                    incident.status === 'cleared' ? 'bg-success text-on-success' :
                    incident.status === 'flagged' ? 'bg-error text-on-error' : 'bg-secondary text-on-secondary'
                  }`}>
                    {incident.status || 'review'}
                  </span>
                  <span className="bg-black/60 backdrop-blur-md px-2 py-1 border border-white/20 text-[10px] font-data text-white">
                    {new Date(incident.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-xl border-2 border-white rounded-full flex items-center justify-center">
                    <Play size={32} fill="white" className="ml-1" />
                  </div>
                </div>
              </div>

              <div className="p-6 flex justify-between items-end">
                <div className="min-w-0">
                  <p className="text-secondary text-xs font-bold uppercase tracking-widest mb-1 truncate">{incident.type}</p>
                  <h4 className="font-headline text-2xl font-bold truncate">{incident.studentEmail?.split('@')[0]}</h4>
                  <p className="text-sm text-on-surface-variant mt-1 truncate">Exam ID: {incident.examId}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onTriage(incident.id)}
                    className="p-3 bg-surface-container-highest border-2 border-black brutal-shadow-sm text-on-surface hover:bg-primary transition-all flex items-center justify-center"
                  >
                    <Eye size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredIncidents.length === 0 && (
            <div className="col-span-full text-center py-20 border-4 border-dashed border-outline-variant/20 rounded-3xl">
              <p className="text-on-surface-variant font-bold text-xl uppercase tracking-widest italic opacity-40">Zero anomalies reported in this sector.</p>
            </div>
          )}
        </div>
      )}

      <div className="brutal-card bg-primary-container border-black">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-on-primary-container/10 border-2 border-black rounded-lg flex items-center justify-center">
            <Layout size={32} className="text-on-primary-container" />
          </div>
          <div>
            <h4 className="font-headline text-2xl text-on-primary-container">Integrity Intelligence</h4>
            <p className="text-on-primary-container opacity-80 mt-1 max-w-2xl">
              ProctorEdge AI filters environmental noise. The flags above represent behavior that deviates significantly from the established institutional baseline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

