import React from 'react';
import { Sparkles, Lightbulb, TrendingUp, TrendingDown, AlertCircle, Zap } from 'lucide-react';

export interface ImpactSummary {
  bullets: string[];
  delta: number;
  before: number;
  after: number;
}

interface AIInsightPanelProps {
  aiResponse: string;
  impactSummary: ImpactSummary | null;
  recommendations: string[];
}

export const AIInsightPanel: React.FC<AIInsightPanelProps> = ({
  aiResponse,
  impactSummary,
  recommendations,
}) => {
  if (!aiResponse && !impactSummary && recommendations.length === 0) return null;

  const isPositiveDelta = impactSummary && impactSummary.delta > 0;

  return (
    <div className="absolute top-20 right-4 w-72 bg-slate-900/95 border border-slate-700/50 backdrop-blur-md rounded-xl shadow-2xl z-10 text-white font-sans overflow-hidden">

      {/* AI Response Header */}
      {aiResponse && (
        <div className="p-3 bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-b border-slate-700/50 flex gap-2 items-start">
          <Sparkles size={13} className="text-purple-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-slate-200 leading-relaxed">{aiResponse}</p>
        </div>
      )}

      {/* Impact Summary */}
      {impactSummary && (
        <div className="p-3 border-b border-slate-800">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Zap size={12} className="text-yellow-400" />
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">Impact Summary</span>
          </div>

          {/* Cost Delta Bar */}
          <div className={`flex items-center justify-between p-2 rounded-lg mb-2.5 border ${isPositiveDelta
            ? 'bg-red-500/10 border-red-500/20'
            : 'bg-emerald-500/10 border-emerald-500/20'
            }`}>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase font-bold">Policy Liability Δ</span>
              <span className={`text-base font-mono font-bold ${isPositiveDelta ? 'text-red-400' : 'text-emerald-400'}`}>
                {impactSummary.delta >= 0 ? '+' : ''}₹{impactSummary.delta.toLocaleString()}
              </span>
            </div>
            {isPositiveDelta
              ? <TrendingUp size={20} className="text-red-400/50" />
              : <TrendingDown size={20} className="text-emerald-400/50" />
            }
          </div>

          {/* Before/After */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1 bg-slate-800/60 rounded p-2 text-center">
              <div className="text-[9px] text-slate-500 uppercase font-bold">Before</div>
              <div className="text-[11px] font-mono text-slate-400">₹{impactSummary.before.toLocaleString()}</div>
            </div>
            <div className="flex items-center text-slate-600 text-xs">→</div>
            <div className="flex-1 bg-slate-800/60 rounded p-2 text-center">
              <div className="text-[9px] text-slate-500 uppercase font-bold">After</div>
              <div className={`text-[11px] font-mono font-bold ${isPositiveDelta ? 'text-red-300' : 'text-emerald-300'}`}>
                ₹{impactSummary.after.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Bullet Points */}
          <div className="space-y-1.5">
            {impactSummary.bullets.map((bullet, i) => (
              <div key={i} className="flex gap-2 items-start text-[10px] text-slate-300 leading-snug">
                <AlertCircle size={10} className="text-blue-400 mt-0.5 shrink-0" />
                {bullet}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Actions */}
      {recommendations.length > 0 && (
        <div className="p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb size={12} className="text-yellow-400" />
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">Suggested Actions</span>
          </div>
          <div className="space-y-1.5">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex gap-2 items-start bg-slate-800/60 border border-slate-700/40 rounded-lg p-2 text-[10px] text-slate-300 leading-snug">
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
