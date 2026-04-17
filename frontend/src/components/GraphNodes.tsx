import { Factory, Warehouse, AlertTriangle, Leaf } from 'lucide-react';
import { Handle, Position } from 'reactflow';

export const PlantNode = ({ data, selected }: any) => {
  return (
    <div className={`px-4 py-3 bg-white border border-[#dac2b6] border-opacity-60 shadow-[0_8px_16px_-4px_rgba(85,58,52,0.08)] transition-all duration-300 w-48 cursor-pointer rounded-sm
      ${selected ? 'ring-2 ring-secondary/40 border-secondary' : 'hover:border-secondary/60'}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-[#ebe8e3] p-1.5 rounded-sm shrink-0">
          <Factory size={14} className="text-[#553a34]" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-[#877369] font-bold uppercase tracking-widest leading-none mb-1.5">Assembly Plant</div>
          <div className="font-bold text-[13px] text-[#553a34] truncate leading-tight">{data.label}</div>
        </div>
      </div>
      <div className="text-[10px] text-[#877369] font-bold border-t border-[#dac2b6] border-opacity-30 pt-2.5 flex items-center justify-between">
        <span className="uppercase tracking-widest">{data.location}</span>
        <span className="font-bold text-[#553a34]">{Math.floor(data.accumulatedEmissions || 0).toLocaleString()} tCO2e</span>
      </div>
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-[#553a34] !border-none" />
    </div>
  );
};

export const SupplierNode = ({ data, selected }: any) => {
  const isHotspot = data.isHotspot;
  const isTaxed = data.isTaxed;
  const isSubsidized = data.isSubsidized;
  const isRecycled = data.recycled;

  let highlightClass = '';
  if (selected) highlightClass = 'ring-2 ring-[#974726]/40 border-[#974726]';
  else if (isHotspot) highlightClass = 'border-[#b91c1c] shadow-[0_4px_12px_rgba(185,28,28,0.1)]';
  else if (isTaxed) highlightClass = 'border-[#974726]';
  else if (isSubsidized) highlightClass = 'border-[#15803d]';

  const iconColor = isHotspot
    ? 'text-[#b91c1c]'
    : isTaxed
      ? 'text-[#974726]'
      : isSubsidized
        ? 'text-[#15803d]'
        : 'text-[#877369]';

  const tierBg = data.tier_level === 1
    ? 'bg-[#ffdea0] text-[#261900]'
    : data.tier_level === 2
      ? 'bg-[#ebe8e3] text-[#553a34]'
      : 'bg-white text-[#877369]';

  return (
    <div className={`px-4 py-3 bg-white border border-[#dac2b6] border-opacity-60 shadow-[0_4px_8px_-2px_rgba(85,58,52,0.06)] transition-all duration-300 w-44 cursor-pointer rounded-sm ${highlightClass}
      ${data.isAlternativeNode ? 'border-dashed opacity-70 hover:opacity-100' : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <Warehouse size={16} className={`${iconColor} shrink-0`} />
        <div className="min-w-0 flex-1">
          <div className="font-bold text-[13px] text-[#553a34] truncate leading-tight">{data.label}</div>
          <div className="text-[10px] text-[#877369] font-bold truncate tracking-tight">{data.location}</div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isHotspot && <AlertTriangle size={12} className="text-[#b91c1c]" />}
          {!isHotspot && isRecycled && <Leaf size={12} className="text-[#15803d]" />}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierBg} shadow-sm uppercase`}>T{data.tier_level}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-widest border-t border-[#dac2b6] border-opacity-30 pt-3">
        <div className="flex flex-col">
          <span className="text-[#877369] text-[9px]">Material</span>
          <span className="text-[#553a34] text-[12px] tracking-tighter">{data.materialIndex}x</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[#877369] text-[9px]">Risk</span>
          <span className={`text-[12px] tracking-tighter ${data.score < 50 ? 'text-[#b91c1c]' : 'text-[#15803d]'}`}>{data.score}%</span>
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-[#877369] !border-none" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-[#877369] !border-none" />
    </div>
  );
};
