import React from 'react';
import { Sparkles, Lightbulb } from 'lucide-react';

interface SuggestionsPanelProps {
  aiResponse: string;
  recommendations: string[];
}

export const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({ aiResponse, recommendations }) => {
  if (!aiResponse && recommendations.length === 0) return null;

  return (
    <div className="absolute top-20 right-4 w-64 bg-slate-900/90 border border-slate-700/50 backdrop-blur-md rounded-xl shadow-2xl z-10 text-white font-sans overflow-hidden">
      {/* AI Response Summary */}
      {aiResponse && (
        <div className="p-3 border-b border-slate-800 bg-gradient-to-br from-blue-900/30 to-purple-900/30">
          <div className="flex items-start gap-2">
            <Sparkles size={13} className="text-purple-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-slate-200 leading-relaxed">{aiResponse}</p>
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      {recommendations.length > 0 && (
        <div className="p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb size={12} className="text-yellow-400" />
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">Suggested Actions</span>
          </div>
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex gap-2 items-start bg-slate-800/70 border border-slate-700/50 rounded-lg p-2.5 text-[11px] text-slate-300 leading-relaxed">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                {rec}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
