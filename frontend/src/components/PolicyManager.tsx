import React from 'react';
import { Settings, Globe, AlertCircle } from 'lucide-react';

interface PolicyManagerProps {
  carbonTaxRate: number;
  setCarbonTaxRate: (rate: number) => void;
  countryMultipliers: Record<string, number>;
  updateCountryMultiplier: (country: string, val: number) => void;
}

export const PolicyManager: React.FC<PolicyManagerProps> = ({
  carbonTaxRate,
  setCarbonTaxRate,
  countryMultipliers,
  updateCountryMultiplier
}) => {
  const countries = Object.keys(countryMultipliers);

  return (
    <div className="absolute top-20 right-4 w-80 bg-slate-900/90 border border-slate-700/50 backdrop-blur-md rounded-xl p-4 shadow-2xl z-10 text-white font-sans overflow-hidden hover:overflow-y-auto max-h-[80vh]">
      <div className="flex items-center gap-2 border-b border-slate-700 pb-3 mb-4">
        <Settings size={18} className="text-slate-400" />
        <h2 className="font-bold uppercase tracking-wider text-sm">Global Tax Engine</h2>
      </div>

      <div className="space-y-6">
        {/* Global Carbon Tax Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">Base Carbon Cost</span>
            <span className="font-mono text-emerald-400">₹{carbonTaxRate}/ton</span>
          </div>
          <input 
            type="range" 
            min="100" 
            max="5000" 
            step="100"
            value={carbonTaxRate}
            onChange={(e) => setCarbonTaxRate(Number(e.target.value))}
            className="w-full accent-blue-500 bg-slate-800 rounded-lg appearance-none h-2"
          />
        </div>

        {/* Dynamic Country Sanctions/Taxes Sliders */}
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-3 text-slate-300">
            <Globe size={14} className="text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Regional Trade Tariffs</h3>
          </div>
          
          <div className="space-y-4">
            {countries.map(country => {
              const val = countryMultipliers[country];
              const isTaxed = val > 1.0;
              const isSubsidized = val < 1.0;
              
              return (
                <div key={country} className="space-y-1 group">
                  <div className="flex justify-between items-center">
                    <span className={`text-[11px] uppercase font-bold transition-colors ${
                      isTaxed ? 'text-orange-400' : isSubsidized ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-300'
                    }`}>
                      {country} {isTaxed ? 'Tariff' : isSubsidized ? 'Subsidy' : 'Neutral'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-300">
                      {val.toFixed(1)}x
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="2.5" 
                    step="0.1"
                    value={val}
                    onChange={(e) => updateCountryMultiplier(country, Number(e.target.value))}
                    className={`w-full bg-slate-800 rounded-lg appearance-none h-1.5 ${
                       isTaxed ? 'accent-orange-500' : isSubsidized ? 'accent-emerald-500' : 'accent-slate-400'
                    }`}
                  />
                </div>
              )
            })}
          </div>
        </div>
        
        <div className="text-[10px] text-slate-500 italic mt-2">
          <AlertCircle size={10} className="inline mr-1 -mt-0.5" />
          Settings ~1.0 applies a neutral multiplier to costs originating from that region.
        </div>
      </div>
    </div>
  );
};
