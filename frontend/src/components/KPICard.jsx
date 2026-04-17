import React from 'react';

const KPICard = ({ title, value, subtext, trend, trendLabel, color = "emerald" }) => {
  const isPositive = trend === 'up';
  
  // Custom color classes for different KPI semantics
  const colorMap = {
    emerald: "text-emerald-500",
    amber: "text-amber-500",
    red: "text-red-500",
    blue: "text-blue-500"
  };

  const bgMap = {
    emerald: "bg-emerald-500/10",
    amber: "bg-amber-500/10",
    red: "bg-red-500/10",
    blue: "bg-blue-500/10"
  };

  const selectedColor = colorMap[color] || colorMap.emerald;
  const selectedBg = bgMap[color] || bgMap.emerald;

  return (
    <div className="glass-panel rounded-xl p-5 flex flex-col gap-2 relative overflow-hidden group hover:border-[#374151] transition-colors">
      <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2 rounded-full ${selectedBg}`} />
      
      <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-white tracking-tight">{value}</span>
        {subtext && <span className="text-sm text-slate-500 font-medium">{subtext}</span>}
      </div>
      
      {trend && (
        <div className="flex items-center gap-2 mt-auto pt-2">
          <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-md ${selectedBg} ${selectedColor}`}>
            {isPositive ? '↑' : '↓'} {trendLabel}
          </div>
        </div>
      )}
    </div>
  );
};

export default KPICard;
