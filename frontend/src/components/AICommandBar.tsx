import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Sparkles, Send, Loader2 } from 'lucide-react';

export interface AICommandResult {
  tax_updates: { country_code: string; multiplier: number }[];
  ai_response: string;
  recommended_actions: string[];
}

interface AICommandBarProps {
  onCommand: (result: AICommandResult) => void;
}

export const AICommandBar: React.FC<AICommandBarProps> = ({ onCommand }) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiText, setAiText] = useState("");
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey || apiKey === "INSERT_YOUR_GEMINI_API_KEY_HERE") {
        setAiText("ERROR: Please set your VITE_GEMINI_API_KEY in .env.local first!");
        setIsLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          tax_updates: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                country_code: { type: Type.STRING },
                multiplier: { type: Type.NUMBER }
              }
            }
          },
          ai_response: { type: Type.STRING },
          recommended_actions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      };

      const systemInstruction = `You are the AI Co-Pilot for a Supply Chain Visualization Dashboard. 
      The user will give you a natural language command (e.g., "Add a heavy 50% tariff to Chinese imports" or "Tax the US to 2.5x"). 
      Extract the country_code (e.g. EU, CN, US, CL, TW, BR, AU, CA) and the multiplier (from 0.5 to 2.5, where 1.0 is neutral, >1.0 is tax, <1.0 is subsidy).
      You must also recommend 1-2 actions based on their decision. For example, if they tax China heavily, recommend swapping Chinese suppliers for Taiwanese or US suppliers.
      Write a short, friendly response in 'ai_response' confirming what you did.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: responseSchema
        }
      });

      if (response.text) {
        const result: AICommandResult = JSON.parse(response.text);
        setAiText(result.ai_response);
        setRecommendations(result.recommended_actions || []);
        onCommand(result);
        setPrompt(""); // clear input
      }

    } catch (err: any) {
      console.error(err);
      setAiText("Error parsing command. Did you use a supported region? " + err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-slate-900/90 border border-slate-700/50 backdrop-blur-md rounded-2xl shadow-2xl z-50 overflow-hidden">

      {/* Brief AI Confirmation Toast */}
      {aiText && (
        <div className="px-4 py-2.5 border-b border-slate-800 bg-gradient-to-r from-blue-900/20 to-purple-900/20 flex items-center gap-2">
          <Sparkles size={13} className="text-purple-400 shrink-0" />
          <p className="text-[11px] text-slate-300 leading-snug">{aiText}</p>
        </div>
      )}

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="flex relative items-center p-2">
        <div className="absolute left-6">
          <Sparkles size={16} className="text-blue-500" />
        </div>
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Ask Gemini to simulate a policy change (e.g. 'Tax China by 50%')..."
          className="w-full bg-transparent border-none text-slate-200 text-sm pl-12 pr-14 py-3 placeholder:text-slate-600 focus:outline-none focus:ring-0"
        />
        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="absolute right-4 p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-blue-600/20 disabled:hover:text-blue-400 flex items-center justify-center"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
};
