import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ProctoringResult {
  detected: boolean;
  type: string;
  description: string;
  confidence: number;
  severity: 'MINIMAL' | 'MODERATE' | 'CRITICAL';
}

export async function analyzeFrame(base64Image: string): Promise<ProctoringResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: "image/jpeg",
              },
            },
            {
              text: "You are an automated proctoring AI. Analyze this image of a candidate taking an exam. Identify any signs of cheating or prohibited behavior. This includes: \n1. Another person in the frame.\n2. Using a mobile phone or unauthorised devices.\n3. Looking away from the screen consistently.\n4. Talking or reading aloud.\n5. Using unauthorized books or papers.\n6. Poor positioning (not centered, partially out of frame).\n\nRespond strictly in JSON format with the following schema:\n{\n  \"detected\": boolean,\n  \"type\": \"string (e.g., MULTIPLE_PEOPLE, PHONE_USAGE, EYE_GAZE, TALKING, POSITIONING, OBJECT_USAGE, etc. or NONE)\",\n  \"description\": \"short explanation of what was found\",\n  \"confidence\": number (0.0 to 1.0),\n  \"severity\": \"string (MINIMAL, MODERATE, or CRITICAL)\"\n}\n\nNote: 'POSITIONING' or momentary 'EYE_GAZE' shifts should be MINIMAL. PHONE_USAGE or MULTIPLE_PEOPLE are CRITICAL.",
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detected: { type: Type.BOOLEAN },
            type: { type: Type.STRING },
            description: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            severity: { type: Type.STRING, enum: ["MINIMAL", "MODERATE", "CRITICAL"] }
          },
          required: ["detected", "type", "description", "confidence", "severity"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Proctoring error:", error);
    return {
      detected: false,
      type: "ERROR",
      description: "Failed to analyze frame",
      confidence: 0,
      severity: "MINIMAL"
    };
  }
}

export async function analyzeAudio(base64Audio: string): Promise<ProctoringResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Audio,
                mimeType: "audio/webm",
              },
            },
            {
              text: "You are an automated proctoring AI analyzing an audio snippet from a candidate taking an exam. Identify any signs of cheating or prohibited behavior. This includes: \n1. Candidate talking or reading aloud.\n2. Another person talking in the background.\n3. Excessive suspicious background noise.\n\nRespond strictly in JSON format with the following schema:\n{\n  \"detected\": boolean,\n  \"type\": \"string (e.g., TALKING, BACKGROUND_VOICE, NOISE, NONE)\",\n  \"description\": \"short explanation of what was found\",\n  \"confidence\": number (0.0 to 1.0),\n  \"severity\": \"string (MINIMAL, MODERATE, or CRITICAL)\"\n}\n\nNote: Brief ambient noise (like typing or a fan) is not a violation (detected: false).",
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detected: { type: Type.BOOLEAN },
            type: { type: Type.STRING },
            description: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            severity: { type: Type.STRING, enum: ["MINIMAL", "MODERATE", "CRITICAL"] }
          },
          required: ["detected", "type", "description", "confidence", "severity"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Audio Proctoring error:", error);
    return {
      detected: false,
      type: "ERROR",
      description: "Failed to analyze audio",
      confidence: 0,
      severity: "MINIMAL"
    };
  }
}
