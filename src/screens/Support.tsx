import React, { useState } from 'react';
import { HelpCircle, Send, MessageSquare, Terminal, ShieldAlert, CheckCircle, Loader2 } from 'lucide-react';

export default function Support() {
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!msg) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setMsg('');
      setTimeout(() => setSent(false), 3000);
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div>
        <h1 className="font-headline text-5xl font-extrabold text-on-surface">Support</h1>
        <p className="text-on-surface-variant font-bold uppercase tracking-widest text-xs mt-2 italic">Institutional Conflict Resolution Center</p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="brutal-card bg-surface-container-low border-secondary">
             <div className="flex items-center gap-3 mb-6">
                <div className="bg-secondary p-3 border-2 border-black rounded-lg">
                   <MessageSquare className="text-black" />
                </div>
                <div>
                   <h3 className="font-headline text-xl font-bold">Encrypted Dispatch</h3>
                   <p className="text-xs text-on-surface-variant">Your transmission is encrypted with AES-256 and routed directly to a senior proctoring architect.</p>
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex flex-col gap-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Conflict Category</label>
                   <select className="w-full bg-surface-container border-2 border-black p-4 font-bold outline-none brutal-shadow-sm appearance-none cursor-pointer">
                      <option>Sensor Calibration Error</option>
                      <option>False Positive Dispute</option>
                      <option>Hardware Incompatibility</option>
                      <option>Account Integrity Verification</option>
                      <option>Emergency Session Suspension</option>
                   </select>
                </div>

                <div className="flex flex-col gap-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Handshake Log / Description</label>
                   <textarea 
                      value={msg}
                      onChange={(e) => setMsg(e.target.value)}
                      rows={6}
                      className="w-full bg-surface-container border-2 border-black p-4 font-mono text-xs outline-none brutal-shadow-sm"
                      placeholder="Paste logs or describe the anomaly..."
                   />
                </div>

                <button 
                   onClick={handleSend}
                   disabled={sending}
                   className="w-full brutal-btn-primary py-4 flex items-center justify-center gap-2 font-black uppercase tracking-widest"
                >
                   {sending ? <Loader2 className="animate-spin" /> : sent ? <CheckCircle /> : <Send size={20} />}
                   {sending ? 'ROUTING PACKET...' : sent ? 'DISPATCHED' : 'INITIALIZE DISPATCH'}
                </button>
             </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
           <div className="brutal-card border-black bg-black text-white">
              <h3 className="font-headline text-lg mb-4 flex items-center gap-2">
                 <Terminal size={18} className="text-secondary" /> System Health
              </h3>
              <div className="space-y-3 opacity-80">
                 <div className="flex justify-between text-[10px] uppercase font-bold">
                    <span>Direct Link</span>
                    <span className="text-secondary">ACTIVE</span>
                 </div>
                 <div className="flex justify-between text-[10px] uppercase font-bold">
                    <span>Enc. Tunnel</span>
                    <span className="text-secondary">ESTABLISHED</span>
                 </div>
                 <div className="flex justify-between text-[10px] uppercase font-bold">
                    <span>Avg. Response</span>
                    <span className="text-secondary">14 MINUTES</span>
                 </div>
              </div>
           </div>

           <div className="brutal-card bg-surface-container-highest">
              <h4 className="font-bold flex items-center gap-2 mb-2"><ShieldAlert size={16} /> Urgent Help?</h4>
              <p className="text-xs text-on-surface-variant mb-4">If an active exam is currently compromised, use the priority override code in your institutional dashboard.</p>
              <button className="w-full border-2 border-black py-2 text-[10px] font-black uppercase hover:bg-black hover:text-white transition-all">
                 Request Emergency Sync
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
