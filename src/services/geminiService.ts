import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function explainFlag(reason: string, context: string) {
  if (!process.env.GEMINI_API_KEY) return "AI Proctoring analysis incomplete. (No API Key)";
  
  try {
    const prompt = `You are an AI Proctoring triage assistant for a platform called ProctorEdge. 
    A student has been flagged for "${reason}". 
    Context: ${context}.
    Explain why this might have happened in a non-punitive, supportive way as per the 'Inclusive & Explainable AI' guidelines. 
    If it's an environmental factor (light, noise), suggest a fix. 
    Keep it concise (1-2 sentences).`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
    });
    
    return response.text || "Environmental context detected. Human review recommended.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Environmental context detected. Human review recommended.";
  }
}
