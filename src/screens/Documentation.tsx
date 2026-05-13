import React from 'react';
import { BookOpen, Shield, Lock, Eye, Mic, Smartphone, ExternalLink, ChevronRight, FileText, Globe } from 'lucide-react';

export default function Documentation() {
  const sections = [
    {
      title: "Core Integrity Protocols",
      icon: <Shield className="text-secondary" />,
      content: [
        { name: "Biometric Handshake", desc: "Multi-factor facial and identity verification via Edge-AI." },
        { name: "Environment Scanning", desc: "360-degree room verification prior to exam initiation." },
        { name: "Persistence Validation", desc: "Real-time gaze and movement analysis throughout the session." }
      ]
    },
    {
      title: "Sensor Calibration",
      icon: <Eye className="text-primary" />,
      content: [
        { name: "Gaze Sensitivity", desc: "Adjusting for dual-monitor setups and light variance." },
        { name: "Acoustic Filtering", desc: "Separating ambient noise from synthesized voice commands." },
        { name: "Edge Handover", desc: "Managing state between local sensors and cloud audit logs." }
      ]
    },
    {
      title: "Developer Integration",
      icon: <Globe className="text-tertiary" />,
      content: [
        { name: "Secure Hook API", desc: "Injecting proctoring hooks into custom React exam platforms." },
        { name: "Real-time Webhooks", desc: "Received instant JSON packets for high-severity anomalies." },
        { name: "Lockdown Browser SDK", desc: "Customizing browser restrictions for institutional hardware." }
      ]
    }
  ];

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div>
        <h1 className="font-headline text-5xl font-extrabold text-on-surface">Documentation</h1>
        <p className="text-on-surface-variant font-bold uppercase tracking-widest text-xs mt-2 italic">Official Operator Manual • Protocol v4.2.0</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sections.map((section, idx) => (
          <div key={idx} className="brutal-card bg-surface-container-low">
            <h2 className="font-headline text-2xl mb-6 flex items-center gap-3">
              {section.icon} {section.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {section.content.map((item, i) => (
                <div key={i} className="p-4 border-2 border-black bg-surface-container hover:bg-secondary/5 transition-colors group cursor-help">
                  <h4 className="font-bold text-sm mb-1 group-hover:text-secondary">{item.name}</h4>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="brutal-card border-black bg-black text-white">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold">Need a Technical Deep-Dive?</h3>
            <p className="text-xs opacity-60">Get access to our internal Whitepaper and Security Audit reports.</p>
          </div>
          <button className="bg-secondary text-black px-6 py-2 font-black text-xs uppercase tracking-widest hover:translate-x-1 hover:translate-y-1 transition-all">
            Download Whitepaper
          </button>
        </div>
      </div>
    </div>
  );
}
