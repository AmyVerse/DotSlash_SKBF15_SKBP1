import React from 'react';
import { Globe } from 'lucide-react';

interface PolicyManagerProps {
  countryMultipliers: Record<string, number>;
}

export const PolicyManager: React.FC<PolicyManagerProps> = ({ countryMultipliers }) => {
  const activePolicies = Object.entries(countryMultipliers).filter(([_, val]) => val !== 1.0);

  if (activePolicies.length === 0) return null;

  return (
    <div className="absolute top-20 right-4 bg-slate-900/90 border border-slate-700/50 backdrop-blur-md rounded-xl p-3 shadow-2xl z-10 text-white font-sans animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <Globe size={14} className="text-blue-400" />
        <h2 className="font-bold uppercase tracking-wider text-[10px] text-slate-300">Active AI Policies</h2>
      </div>

      <div className="space-y-1.5 flex flex-col items-end">
        {activePolicies.map(([country, val]) => {
          const isTaxed = val > 1.0;
          return (
            <div key={country} className="flex justify-between items-center bg-slate-800/80 px-2 py-1 rounded text-[10px] border border-slate-700/50 font-mono w-40">
              <span className={`font-bold ${isTaxed ? 'text-orange-400' : 'text-emerald-400'}`}>
                {country} {isTaxed ? 'TARIFF' : 'SUBSIDY'}
              </span>
              <span>{val.toFixed(1)}x</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
