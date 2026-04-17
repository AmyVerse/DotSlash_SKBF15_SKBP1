import { Factory, Warehouse, AlertTriangle, Leaf, Zap } from 'lucide-react';
import { Handle, Position } from 'reactflow';

export const PlantNode = ({ data, selected }: any) => {
  const edgeEmissions = data.accumulatedEmissions || 0;
  
  return (
    <div className={`px-4 py-3 shadow-2xl rounded-xl bg-slate-900 border-2 transition-all duration-300 w-56 ${selected ? 'border-blue-400 ring-4 ring-blue-500/20' : 'border-blue-500/50 hover:border-blue-400'}`}>
      <div className="flex items-center gap-2 border-b border-slate-700/50 pb-2 mb-2">
        <div className="bg-blue-500/20 p-1.5 rounded-md">
          <Factory size={18} className="text-blue-400" />
        </div>
        <div>
          <span className="font-black text-sm uppercase tracking-wider text-white block leading-tight">{data.label}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">{data.location}</span>
        </div>
      </div>
      
      <div className="mt-3 bg-slate-800/80 p-2 rounded border border-slate-700 flex justify-between items-center group relative overflow-hidden">
        <div className="relative z-10">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Total Payload CO2e</div>
          <div className="font-mono text-lg font-bold text-slate-200">
            {edgeEmissions.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-xs text-slate-500">kg</span>
          </div>
        </div>
        <Zap size={24} className="text-blue-500/20 absolute right-2 bottom-1 z-0 group-hover:scale-110 transition-transform" />
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500 -ml-1 border-2 border-slate-900" />
    </div>
  );
};

export const SupplierNode = ({ data, selected }: any) => {
  const isHotspot = data.isHotspot;
  const isRecycled = data.recycled;
  
  return (
    <div className={`px-4 py-3 shadow-xl rounded-xl bg-slate-900 border-2 transition-all duration-300 w-52 
      ${isHotspot ? 'border-red-500 ring-4 ring-red-500/20' : (selected ? 'border-blue-400 ring-4 ring-blue-500/20' : 'border-slate-700')}
    `}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${isHotspot ? 'bg-red-500/20' : 'bg-slate-800'}`}>
            <Warehouse size={16} className={isHotspot ? 'text-red-500' : 'text-slate-400'} />
          </div>
          <div>
            <span className="font-bold text-xs text-white block">{data.label}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider">Tier {data.tier_level}</span>
          </div>
        </div>
        {isHotspot && <AlertTriangle size={16} className="text-red-500 animate-pulse" />}
        {!isHotspot && isRecycled && <Leaf size={16} className="text-emerald-500" />}
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="bg-slate-800/50 p-1.5 rounded border border-slate-700 text-center">
           <div className="text-[9px] text-slate-500 uppercase">Cost/Unit</div>
           <div className="text-xs font-mono text-white">${data.base_cost}</div>
        </div>
        <div className={`p-1.5 rounded border text-center ${isHotspot ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
           <div className={`text-[9px] uppercase ${isHotspot ? 'text-red-400/80' : 'text-emerald-400/80'}`}>Score</div>
           <div className={`text-xs font-mono font-bold ${isHotspot ? 'text-red-400' : 'text-emerald-400'}`}>{data.score}</div>
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-slate-600 border-2 border-slate-900" />
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-slate-600 border-2 border-slate-900" />
    </div>
  );
};