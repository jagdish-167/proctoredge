import React, { useState } from 'react';
import { ShieldCheck, Settings, Eye, Mic, Smartphone, Scan, ArrowRight, Check, Edit2, Info, Clock, Rocket, ArrowLeft, FileText, Link, Upload, Globe, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

import { PDFDocumentProxy } from 'pdfjs-dist';

// Define Global Constants
const PDF_WORKER_URL = 'https://unpkg.com/pdfjs-dist@5.7.284/build/pdf.worker.min.mjs';

export default function ExamSetup({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    institution: 'Global Institute of Technology',
    duration: 120,
    startTime: '',
    browserLock: true,
    camera: true,
    mic: true,
    secondaryDevice: false,
    gazeSensitivity: 75,
    noiseThreshold: 40,
    objectStrictness: 90,
    sourceType: 'none' as 'file' | 'link' | 'none' | 'ai-quiz',
    examLink: '',
    fileName: '',
    aiContext: '',
    questions: [] as any[]
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQuestions = async (context: string) => {
    if (!context) return;
    setIsGenerating(true);
    try {
      const { GoogleGenAI, Type } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const prompt = `Directly analyze the provided study material and extract exactly 10 high-quality multiple-choice questions.
        
        MATERIAL:
        ${context}
        
        STRICT FORMATTING RULES:
        - Output MUST be a valid JSON array of objects.
        - Each object MUST have: "text" (the question), "options" (array of exactly 4 strings), and "correctAnswerIndex" (number 0-3).
        - Verify all options are plausible but only one is correct.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                options: { 
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                },
                correctAnswerIndex: { type: Type.NUMBER }
              },
              required: ['text', 'options', 'correctAnswerIndex']
            }
          }
        }
      });

      const text = response.text || '[]';
      const rawQuestions = JSON.parse(text);
      const questions = (Array.isArray(rawQuestions) ? rawQuestions : []).map((q: any, i: number) => ({
        id: `q-${i}-${Date.now()}`,
        text: q.text || 'Question text missing',
        options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0
      }));
      
      setFormData(prev => ({...prev, questions: questions, sourceType: 'ai-quiz'}));
      alert(`Semantic processing complete. ${questions.length} interactive nodes synthesized.`);
    } catch (err) {
      console.error('AI Generation Error:', err);
      alert('AI Generation encountered an anomaly. Please try manual extraction.');
    } finally {
      setIsGenerating(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSaveDraft = async () => {
    if (!user) return;
    if (formData.sourceType === 'ai-quiz' && formData.questions.length === 0) {
      return alert('Integrity Protocol: Please generate questions before saving an AI Quiz gateway.');
    }
    setIsLaunching(true);
    const path = 'exams';
    try {
      await addDoc(collection(db, path), {
        ...formData,
        creatorId: user.uid,
        creatorEmail: user.email,
        createdAt: serverTimestamp(),
        status: 'draft'
      });
      alert('Draft integrity protocol saved successfully.');
      onComplete();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setIsLaunching(false);
    }
  };

  const handleLaunch = async () => {
    if (!user) return;
    
    // Validation
    if (!formData.title) return alert('Session ID required: Please provide an exam title.');
    
    if (isExtracting) return alert('Security Protocol: Content analysis in progress. Please wait.');

    if (formData.sourceType === 'none') {
      const confirm = window.confirm('No content source selected. This session will only provide proctoring/monitoring without displaying an exam. Continue?');
      if (!confirm) return;
    }

    if (formData.sourceType === 'ai-quiz' && formData.questions.length === 0) {
      return alert('Integrity Protocol: AI Gateway requires generated semantic nodes. Click "Generate" first.');
    }
    if (formData.sourceType === 'link' && !formData.examLink) {
      return alert('Routing Error: External redirection link missing.');
    }

    setIsLaunching(true);
    const path = 'exams';
    try {
      await addDoc(collection(db, path), {
        ...formData,
        creatorId: user.uid,
        creatorEmail: user.email,
        createdAt: serverTimestamp(),
        status: 'active'
      });
      onComplete();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="mb-4">
        <h1 className="font-headline text-5xl font-extrabold text-on-surface mb-8">Setup New Session</h1>
        <div className="grid grid-cols-4 gap-4 relative">
          <div className="absolute top-2 left-0 w-full h-[3px] bg-surface-container-highest -z-10"></div>
          {[
            { id: 1, label: 'Basic Info' },
            { id: 2, label: 'Security Rules' },
            { id: 3, label: 'AI Sensitivity' },
            { id: 4, label: 'Review' }
          ].map((s) => (
            <div key={s.id} className="relative group">
              <div className={`h-4 w-full brutal-border transition-all duration-300 mb-3 ${
                step >= s.id ? 'bg-secondary brutal-shadow-sm' : 'bg-surface-container-highest border-outline-variant/30'
              }`}></div>
              <div className={`font-bold text-xs uppercase tracking-widest ${step >= s.id ? 'text-secondary' : 'text-on-surface-variant opacity-50'}`}>
                {s.id}. {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8">
           <AnimatePresence mode="wait">
             {step === 1 && (
               <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="brutal-card bg-surface-container-low">
                 <h2 className="font-headline text-2xl mb-8 flex items-center gap-2"><Edit2 size={24} className="text-secondary" /> Fundamentals</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Exam Title</label>
                      <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g. Advanced Cryptography" className="bg-surface-container border-2 border-black p-4 text-on-surface outline-none brutal-shadow-sm" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Institution</label>
                      <input 
                        type="text" 
                        value={formData.institution} 
                        onChange={(e) => setFormData({...formData, institution: e.target.value})} 
                        placeholder="e.g. Stanford University" 
                        className="bg-surface-container border-2 border-black p-4 text-on-surface outline-none brutal-shadow-sm" 
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Duration (Min)</label>
                      <input type="number" value={formData.duration} onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})} className="bg-surface-container border-2 border-black p-4 text-on-surface outline-none brutal-shadow-sm" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Start Time</label>
                        <input type="datetime-local" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} className="bg-surface-container border-2 border-black p-4 text-on-surface outline-none brutal-shadow-sm [color-scheme:dark]" />
                    </div>
                 </div>

                 <div className="mt-8 border-t-2 border-dashed border-outline-variant/30 pt-8">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Exam Content Source</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <button 
                        onClick={() => setFormData({...formData, sourceType: 'file'})}
                        className={`p-6 border-4 flex flex-col items-start gap-4 transition-all text-left group ${
                          formData.sourceType === 'file' 
                            ? 'bg-secondary/10 border-secondary brutal-shadow-sm translate-x-[-4px] translate-y-[-4px]' 
                            : 'bg-surface-container border-black opacity-80 hover:opacity-100 hover:border-outline-variant'
                        }`}
                      >
                        <div className={`p-3 border-2 border-black brutal-shadow-sm ${formData.sourceType === 'file' ? 'bg-secondary text-on-secondary' : 'bg-surface-container-highest'}`}>
                          <FileText size={24} />
                        </div>
                        <div>
                          <h4 className="font-headline text-lg font-bold">Upload PDF/Document</h4>
                          <p className="text-sm text-on-surface-variant mt-1">Directly serve a local document to students within the secure viewer.</p>
                        </div>
                      </button>
                      
                      <button 
                        onClick={() => setFormData({...formData, sourceType: 'link'})}
                        className={`p-6 border-4 flex flex-col items-start gap-4 transition-all text-left group ${
                          formData.sourceType === 'link' 
                            ? 'bg-secondary/10 border-secondary brutal-shadow-sm translate-x-[-4px] translate-y-[-4px]' 
                            : 'bg-surface-container border-black opacity-80 hover:opacity-100 hover:border-outline-variant'
                        }`}
                      >
                        <div className={`p-3 border-2 border-black brutal-shadow-sm ${formData.sourceType === 'link' ? 'bg-secondary text-on-secondary' : 'bg-surface-container-highest'}`}>
                          <Globe size={24} />
                        </div>
                        <div>
                          <h4 className="font-headline text-lg font-bold">External Exam Link</h4>
                          <p className="text-sm text-on-surface-variant mt-1">Redirect students to a third-party platform (Typeform, Google Forms, etc.)</p>
                        </div>
                      </button>

                      <button 
                        onClick={() => setFormData({...formData, sourceType: 'ai-quiz'})}
                        className={`p-6 border-4 flex flex-col items-start gap-4 transition-all text-left group md:col-span-2 ${
                          formData.sourceType === 'ai-quiz' 
                            ? 'bg-secondary/10 border-secondary brutal-shadow-sm translate-x-[-4px] translate-y-[-4px]' 
                            : 'bg-surface-container border-black opacity-80 hover:opacity-100 hover:border-outline-variant'
                        }`}
                      >
                        <div className={`p-3 border-2 border-black brutal-shadow-sm ${formData.sourceType === 'ai-quiz' ? 'bg-secondary text-on-secondary' : 'bg-surface-container-highest'}`}>
                          <Rocket size={24} />
                        </div>
                        <div>
                          <h4 className="font-headline text-lg font-bold">AI Quiz Generator</h4>
                          <p className="text-sm text-on-surface-variant mt-1">Paste study material or textbook excerpts to generate a secure, interactive exam automatically.</p>
                        </div>
                      </button>
                    </div>

                    <div className="mt-8">
                      <AnimatePresence mode="wait">
                        {formData.sourceType === 'file' && (
                          <motion.div 
                            key="file-upload"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`bg-surface-container-lowest border-4 border-dashed p-12 rounded-2xl flex flex-col items-center gap-6 cursor-pointer transition-all ${
                              isDragging 
                                ? 'bg-secondary/10 border-secondary shadow-[0_0_20px_rgba(251,209,45,0.1)]' 
                                : formData.fileName ? 'border-primary bg-primary/5' : 'border-outline-variant/30 hover:border-outline hover:bg-surface-container-high'
                            }`}
                            onClick={() => document.getElementById('exam-file')?.click()}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDragging(false);
                              const file = e.dataTransfer.files?.[0];
                              if (file) {
                                setFormData({...formData, fileName: file.name});
                              }
                            }}
                          >
                            <div className={`w-16 h-16 border-2 border-black brutal-shadow-sm flex items-center justify-center rounded-xl transition-transform ${isDragging ? 'bg-secondary scale-110' : formData.fileName ? 'bg-primary' : 'bg-surface-container-highest'}`}>
                              {formData.fileName ? <Check className="text-black" size={32} /> : <Upload className={`${isDragging ? 'text-black animate-bounce' : 'text-on-surface'}`} size={32} />}
                            </div>
                            
                            <div className="text-center space-y-2">
                              {isExtracting ? (
                                <>
                                  <Loader2 size={32} className="mx-auto animate-spin text-secondary mb-2" />
                                  <p className="font-display text-xl font-bold italic animate-pulse">ANALYZING CONTENT PACKET...</p>
                                  <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-4">Applying OCR and semantic mapping</p>
                                  <div className="w-full max-w-xs mx-auto bg-surface-container border-2 border-black h-4 relative overflow-hidden">
                                    <div 
                                      className="absolute inset-y-0 left-0 bg-secondary transition-all duration-300 ease-out"
                                      style={{ width: `${extractionProgress}%` }}
                                    ></div>
                                    <div className="absolute inset-0 flex flex-col justify-center items-center mix-blend-difference pointer-events-none">
                                      <span className="text-[10px] font-black text-white">{extractionProgress}%</span>
                                    </div>
                                  </div>
                                </>
                              ) : formData.fileName ? (
                                <>
                                  <p className="font-display text-xl font-bold text-primary">{formData.fileName}</p>
                                  <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Document ready for provisioning</p>
                                  
                                  {isExtracting ? (
                                    <div className="flex flex-col items-center gap-1 mt-4">
                                      <Loader2 size={24} className="animate-spin text-secondary" />
                                      <p className="text-[10px] font-bold uppercase tracking-widest animate-pulse">Deep Scanning Document...</p>
                                    </div>
                                  ) : (
                                    <div className="mt-4 w-full">
                                      <label className="text-[9px] font-black uppercase text-secondary mb-1 block">Extracted Semantic Data (Preview/Edit)</label>
                                      <textarea 
                                        className="w-full h-32 bg-surface-container border-2 border-black p-3 text-[10px] font-mono outline-none brutal-shadow-sm"
                                        value={formData.aiContext}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => setFormData(prev => ({ ...prev, aiContext: e.target.value }))}
                                        placeholder="No text extracted. You can paste content here manually..."
                                      />
                                    </div>
                                  )}
                                  
                                   <div className="flex gap-4 mt-6">
                                     <button 
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (!formData.aiContext) {
                                            alert('No semantic context detected. Please paste text into the preview area or try a different document.');
                                            return;
                                          }
                                          await generateQuestions(formData.aiContext);
                                        }}
                                        disabled={isGenerating || isExtracting || !formData.aiContext}
                                        className="brutal-btn-primary py-3 px-6 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                     >
                                        {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Rocket size={18} />}
                                        {isGenerating ? 'TRANSFORMING...' : 'Transform to Quiz'}
                                     </button>
                                     <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setFormData(prev => ({ ...prev, fileName: '', aiContext: '', questions: [], sourceType: 'none' }));
                                        }}
                                        className="brutal-btn-secondary px-6 text-sm"
                                     >
                                        Remove
                                     </button>
                                  </div>

                                  {formData.questions.length > 0 && formData.sourceType === 'ai-quiz' && (
                                     <div className="mt-4 p-4 border-2 border-black bg-success/10 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-success text-on-success border-2 border-black flex items-center justify-center font-black">
                                           {formData.questions.length}
                                        </div>
                                        <p className="font-bold text-xs">Interactive Quiz Active</p>
                                      </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <p className="font-display text-xl font-bold">{isDragging ? 'DROP TO UPLOAD' : 'SELECT CONTENT PACKET'}</p>
                                  <p className="text-sm text-on-surface-variant max-w-xs mx-auto">Click map or drag your PDF/DOCX here (Max 20MB). Encrypted at rest.</p>
                                </>
                              )}
                            </div>

                            <input 
                              id="exam-file" 
                              type="file" 
                              className="hidden" 
                              accept=".pdf,.doc,.docx"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setFormData(prev => ({
                                    ...prev, 
                                    fileName: file.name,
                                    title: prev.title || file.name.split('.')[0].replace(/[-_]/g, ' ')
                                  }));
                                  if (file.type === 'application/pdf') {
                                    setIsExtracting(true);
                                    setExtractionProgress(0);
                                    try {
                                      const pdfjs = await import('pdfjs-dist');
                                      pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
                                      
                                      const arrayBuffer = await file.arrayBuffer();
                                      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
                                      let fullText = '';
                                      
                                      // Limit to first 15 pages for better performance
                                      const pageLimit = Math.min(pdf.numPages, 15);
                                      for (let i = 1; i <= pageLimit; i++) {
                                        const page = await pdf.getPage(i);
                                        const content = await page.getTextContent();
                                        const strings = (content.items as any[]).map(item => item.str);
                                        // Filter out very short strings that might be noise
                                        const cleanedText = strings.filter(s => s.trim().length > 1).join(' ');
                                        fullText += cleanedText + '\n';
                                        setExtractionProgress(Math.round((i / pageLimit) * 100));
                                      }

                                      // Basic sanitization
                                      fullText = fullText.replace(/\s+/g, ' ').trim();

                                      if (!fullText.trim()) {
                                        throw new Error('No text content found in PDF (may be image-based)');
                                      }

                                      setFormData(prev => ({ 
                                        ...prev, 
                                        aiContext: fullText,
                                        sourceType: 'file'
                                      }));

                                      // Auto-generate if it looks like a good quiz source
                                      if (fullText.length > 500) {
                                        const wantQuiz = window.confirm('PDF Analysis Successful. High semantic density detected. Would you like to automatically transform this content into an interactive AI exam set?');
                                        if (wantQuiz) {
                                          setTimeout(() => generateQuestions(fullText), 100);
                                        }
                                      }
                                    } catch (err: any) {
                                      console.error('PDF Extraction Error:', err);
                                      alert(`PDF Extraction Issue: ${err.message || 'Could not read text'}. You may need to paste text manually in AI Quiz mode.`);
                                      setFormData(prev => ({ ...prev, aiContext: '', sourceType: 'none' }));
                                    } finally {
                                      setIsExtracting(false);
                                      setExtractionProgress(0);
                                    }
                                  }
                                }
                              }}
                            />
                          </motion.div>
                        )}

                        {formData.sourceType === 'link' && (
                          <motion.div 
                            key="link-input"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col gap-2"
                          >
                            <div className="relative">
                              <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
                              <input 
                                type="url" 
                                placeholder="https://exam-platform.com/session/abc-123" 
                                value={formData.examLink}
                                onChange={(e) => setFormData({...formData, examLink: e.target.value})}
                                className="w-full bg-surface-container border-2 border-black p-4 pl-12 text-on-surface outline-none brutal-shadow-sm" 
                              />
                            </div>
                            <p className="text-xs text-on-surface-variant italic">Students will be automatically redirected to this URL after pre-exam checks.</p>
                          </motion.div>
                        )}

                        {formData.sourceType === 'ai-quiz' && (
                          <motion.div 
                            key="ai-input"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col gap-6 p-6 brutal-card border-secondary bg-surface-container-lowest"
                          >
                            <div className="flex flex-col gap-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Source Material (Paste PDF/Text Content)</label>
                               <textarea 
                                  value={formData.aiContext}
                                  onChange={(e) => setFormData({...formData, aiContext: e.target.value})}
                                  placeholder="Tip: Open your PDF, select all text (Ctrl+A), and paste it here for maximum semantic extraction..."
                                  className="w-full bg-surface-container border-2 border-black p-4 h-48 font-mono text-xs outline-none"
                               />
                            </div>
                            
                            <button 
                                onClick={() => generateQuestions(formData.aiContext)}
                                disabled={isGenerating || !formData.aiContext}
                                className="brutal-btn-primary py-4 flex items-center justify-center gap-2"
                            >
                               {isGenerating ? <Loader2 className="animate-spin" /> : <Rocket size={20} />}
                               {isGenerating ? 'ANALYZING SEMANTICS...' : 'GENERATE INTERACTIVE EXAM'}
                            </button>

                            {formData.questions.length > 0 && (
                               <div className="mt-4 p-4 border-2 border-black bg-secondary/10 flex items-center gap-3">
                                  <div className="w-10 h-10 bg-secondary border-2 border-black flex items-center justify-center font-black">
                                     {formData.questions.length}
                                  </div>
                                  <div>
                                     <p className="font-bold text-sm">Questions Live</p>
                                     <p className="text-[10px] uppercase opacity-60">Integrity protocols applied to generated set.</p>
                                  </div>
                                </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                 </div>
               </motion.div>
             )}

             {step === 2 && (
               <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
                 <div className="brutal-card border-secondary bg-surface-container flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1">
                      <h3 className="font-headline text-2xl mb-2 flex gap-2"><Settings size={24} className="text-secondary" /> Browser Lock</h3>
                      <p className="text-sm text-on-surface-variant">Prevents unauthorized tab switching or window escapes.</p>
                    </div>
                    <button onClick={() => setFormData({...formData, browserLock: !formData.browserLock})} className={`w-16 h-8 rounded-full brutal-border relative transition-all ${formData.browserLock ? 'bg-secondary' : 'bg-surface-container'}`}>
                      <div className={`absolute top-0.5 w-6 h-6 bg-white brutal-border rounded-full transition-all ${formData.browserLock ? 'right-0.5' : 'left-0.5'}`}></div>
                    </button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { id: 'camera', label: 'Continuous Video', icon: Eye },
                      { id: 'mic', label: 'Audio Monitoring', icon: Mic },
                      { id: 'secondaryDevice', label: 'Dual-Camera Context', icon: Smartphone },
                    ].map((rule) => (
                      <div key={rule.id} onClick={() => setFormData({...formData, [rule.id]: !(formData as any)[rule.id]})} className={`brutal-card p-6 cursor-pointer border-4 transition-all ${(formData as any)[rule.id] ? 'bg-secondary/10 border-secondary' : 'opacity-60 border-black'}`}>
                         <rule.icon size={24} className="mb-4" />
                         <h4 className="font-headline text-lg font-bold">{rule.label}</h4>
                      </div>
                    ))}
                 </div>
               </motion.div>
             )}

             {step === 3 && (
               <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
                 <div className="brutal-card bg-surface-container-low">
                   <h2 className="font-headline text-2xl mb-8 flex gap-2 items-center"><Scan size={24} className="text-secondary" /> Sensitivity Calibration</h2>
                   <div className="space-y-8">
                      {[
                        { 
                          id: 'gazeSensitivity', 
                          label: 'Gaze Sensitivity', 
                          icon: Eye, 
                          desc: 'Detects when the user looks away from the primary active window.' 
                        },
                        { 
                          id: 'noiseThreshold', 
                          label: 'Noise Threshold', 
                          icon: Mic, 
                          desc: 'Sensitivity to ambient audio anomalies and vocal detection.' 
                        },
                        { 
                          id: 'objectStrictness', 
                          label: 'Object Strictness', 
                          icon: Scan, 
                          desc: 'Strictness of prohibited object detection (phones, tablets, books).' 
                        },
                      ].map((s) => (
                        <div key={s.id} className="brutal-card p-6 bg-surface-container border-2 border-black">
                           <div className="flex justify-between items-start mb-4">
                              <div className="flex gap-4">
                                 <div className="p-3 bg-secondary text-on-secondary border-2 border-black brutal-shadow-sm shrink-0">
                                    <s.icon size={20} />
                                 </div>
                                 <div>
                                    <label className="text-sm font-black uppercase tracking-widest text-on-surface block">{s.label}</label>
                                    <p className="text-[10px] font-bold text-on-surface-variant uppercase mt-1 opacity-70">{s.desc}</p>
                                 </div>
                              </div>
                              <span className="font-data text-2xl text-primary font-black">{(formData as any)[s.id]}<span className="text-xs ml-1">%</span></span>
                           </div>
                           <div className="relative h-6 flex items-center">
                              <input 
                                 type="range" 
                                 min="0" 
                                 max="100" 
                                 value={(formData as any)[s.id]} 
                                 onChange={(e) => setFormData({...formData, [s.id]: parseInt(e.target.value)})} 
                                 className="w-full h-2 bg-black rounded-none appearance-none cursor-pointer accent-secondary" 
                              />
                           </div>
                           <div className="flex justify-between mt-2">
                              <span className="text-[10px] font-black uppercase text-on-surface-variant/40">Passive Monitor</span>
                              <span className="text-[10px] font-black uppercase text-secondary">Aggressive Protocol</span>
                           </div>
                        </div>
                      ))}
                   </div>
                 </div>
               </motion.div>
             )}

             {step === 4 && (
               <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-8">
                 <div className="brutal-card bg-surface-container flex flex-col items-center text-center py-12">
                   <div className="w-24 h-24 bg-secondary border-4 border-black rounded-full brutal-shadow flex items-center justify-center animate-bounce mb-6"><Rocket size={48} className="text-on-secondary" /></div>
                   <h2 className="font-headline text-4xl mb-2">Ready to Secure</h2>
                   <p className="text-on-surface-variant max-w-md mx-auto">Your proctored environment is configured and ready for candidates. Review the summary below before launching.</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="brutal-card p-4 border-black flex flex-col gap-1">
                     <span className="text-[10px] font-bold uppercase text-on-surface-variant">Exam Title</span>
                     <span className="font-bold text-lg">{formData.title || 'Untitled Session'}</span>
                   </div>
                   <div className="brutal-card p-4 border-black flex flex-col gap-1">
                     <span className="text-[10px] font-bold uppercase text-on-surface-variant">Content Source</span>
                     <div className="flex items-center gap-2 font-bold text-lg">
                       {formData.sourceType === 'file' ? <FileText size={18} className="text-secondary" /> : 
                        formData.sourceType === 'ai-quiz' ? <Rocket size={18} className="text-secondary" /> :
                        <Globe size={18} className="text-secondary" />}
                       <span className="truncate">
                        {formData.sourceType === 'file' ? (formData.fileName || 'No file uploaded') : 
                         formData.sourceType === 'ai-quiz' ? `${formData.questions.length || 0} Questions Generated` :
                         (formData.examLink || 'No link provided')}
                      </span>
                     </div>
                   </div>
                 </div>

                 <div className="brutal-card p-6 border-black bg-surface-container">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-4">Sensitivity Profile</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'Gaze', val: formData.gazeSensitivity },
                        { label: 'Audio', val: formData.noiseThreshold },
                        { label: 'Obj', val: formData.objectStrictness },
                      ].map((p, i) => (
                        <div key={i} className="flex flex-col items-center p-3 bg-surface-container-low border-2 border-black brutal-shadow-sm">
                          <span className="text-[10px] font-black uppercase opacity-60 mb-1">{p.label}</span>
                          <span className="font-data text-xl font-black text-secondary">{p.val}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                 <button 
                   onClick={handleLaunch} 
                   disabled={isLaunching}
                   className="brutal-btn-primary w-full flex items-center justify-center gap-3 text-xl py-6 disabled:opacity-50"
                 >
                   {isLaunching ? <Loader2 className="animate-spin" /> : <Rocket size={24} />} 
                   {isLaunching ? 'Provisioning...' : 'Launch Session'}
                 </button>
               </motion.div>
             )}
           </AnimatePresence>

           {step < 4 && (
             <div className="flex justify-between items-center mt-12">
                <button onClick={prevStep} className={`brutal-btn-secondary flex items-center gap-2 ${step === 1 ? 'invisible' : ''}`}><ArrowLeft size={20} /> Back</button>
                <div className="flex gap-4">
                  <button 
                    onClick={handleSaveDraft}
                    disabled={isLaunching}
                    className="brutal-btn-secondary"
                  >
                    {isLaunching ? <Loader2 className="animate-spin" size={20} /> : 'Save Draft'}
                  </button>
                  <button onClick={nextStep} className="brutal-btn-primary flex items-center gap-2">Continue <ArrowRight size={20} /></button>
                </div>
             </div>
           )}
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="brutal-card bg-surface-container border-black">
             <div className="flex items-center gap-4 mb-4"><ShieldCheck size={24} className="text-secondary" /><h4 className="font-headline text-xl">Privacy Compliance</h4></div>
             <p className="text-sm text-on-surface-variant">ProctorEdge runs all analysis on-device. Only encrypted metadata ever leaves the local sandbox.</p>
          </div>
          <div className="brutal-card border-outline-variant/30 bg-surface-container-lowest opacity-60">
             <h4 className="text-[10px] font-bold text-on-surface-variant uppercase mb-4 tracking-widest flex items-center gap-2"><Clock size={12} /> Recent Sessions</h4>
             <div className="flex flex-col gap-2">
                {['History 101 Midterm', 'Physics 202 - Lab'].map((item, i) => (
                  <div key={i} className="p-3 bg-surface-container border border-black text-sm font-bold flex justify-between items-center">{item}<ArrowRight size={14} /></div>
                ))}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
