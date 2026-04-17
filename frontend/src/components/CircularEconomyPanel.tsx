import React, { useMemo, useState } from 'react';
import { Recycle, ArrowRight, TrendingDown, Truck, Factory, ChevronDown, ChevronUp } from 'lucide-react';
import type { Node, Edge } from 'reactflow';

// Material category mappings — what waste a supplier tier produces and who can consume it
const MATERIAL_FLOWS: Record<string, { produces_waste: string; waste_label: string }> = {
  'S1':  { produces_waste: 'lithium_scrap', waste_label: 'Battery Assembly Scrap (Li-Ion)' },
  'S3':  { produces_waste: 'steel_scrap', waste_label: 'Forging Scrap (Hi-Tensile Steel)' },
  'S5':  { produces_waste: 'electrolyte_waste', waste_label: 'Spent Electrolyte Residue' },
  'S6':  { produces_waste: 'cathode_dust', waste_label: 'NMC Cathode Dust' },
  'S7':  { produces_waste: 'copper_offcut', waste_label: 'Copper Wire Offcuts' },
  'S8':  { produces_waste: 'steel_scrap', waste_label: 'Steel Stamping Offcuts' },
  'S9':  { produces_waste: 'casting_slag', waste_label: 'Casting Slag (Aluminium/Iron)' },
  'S10': { produces_waste: 'lithium_scrap', waste_label: 'Lithium Refinery Tailings' },
  'S12': { produces_waste: 'electrolyte_waste', waste_label: 'Chemical Electrolyte Byproduct' },
};

const WASTE_CONSUMERS: Record<string, { consumer_label: string; savings_pct: number; emission_reduction_kg: number }> = {
  'lithium_scrap':    { consumer_label: 'Gujarat Li-Ion Cells (S5)', savings_pct: 22, emission_reduction_kg: 340 },
  'steel_scrap':      { consumer_label: 'Bharat Forge (S3) / Chennai Stamping (P2)', savings_pct: 18, emission_reduction_kg: 210 },
  'electrolyte_waste': { consumer_label: 'GJ Electrolyte Chem (S12)', savings_pct: 30, emission_reduction_kg: 180 },
  'cathode_dust':     { consumer_label: 'Exide EV Batteries (S1)', savings_pct: 15, emission_reduction_kg: 420 },
  'copper_offcut':    { consumer_label: 'Motherson Wiring (S2)', savings_pct: 25, emission_reduction_kg: 95 },
  'casting_slag':     { consumer_label: 'Bharat Forge (S3)', savings_pct: 12, emission_reduction_kg: 130 },
};

interface CircularEconomyPanelProps {
  nodes: Node[];
  edges: Edge[];
}

interface Opportunity {
  sourceId: string;
  sourceLabel: string;
  wasteType: string;
  wasteLabel: string;
  consumerLabel: string;
  savingsPct: number;
  emissionReductionKg: number;
  transportCostEstimate: number;
  freshProcurementCost: number;
  netSaving: number;
}

export const CircularEconomyPanel: React.FC<CircularEconomyPanelProps> = ({ nodes, edges }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const opportunities = useMemo<Opportunity[]>(() => {
    const results: Opportunity[] = [];
    const supplierNodes = nodes.filter(n => n.type === 'supplier');

    supplierNodes.forEach(node => {
      const flow = MATERIAL_FLOWS[node.id];
      if (!flow) return;

      const consumer = WASTE_CONSUMERS[flow.produces_waste];
      if (!consumer) return;

      // Don't suggest reusing your own waste
      if (consumer.consumer_label.includes(node.id)) return;

      // Find the edge from this node to estimate transport baseline
      const nodeEdge = edges.find(e => e.source === node.id);
      const baseDistance = nodeEdge?.data?.logistics?.distance_km || 500;
      const baseCost = node.data.base_cost || 2000;

      const transportCost = Math.round(baseDistance * 0.08 * 12); // ₹/km * weight estimate
      const freshCost = Math.round(baseCost * (consumer.savings_pct / 100) * 10);
      const netSaving = freshCost - transportCost;

      if (netSaving > 0) {
        results.push({
          sourceId: node.id,
          sourceLabel: node.data.label,
          wasteType: flow.produces_waste,
          wasteLabel: flow.waste_label,
          consumerLabel: consumer.consumer_label,
          savingsPct: consumer.savings_pct,
          emissionReductionKg: consumer.emission_reduction_kg,
          transportCostEstimate: transportCost,
          freshProcurementCost: freshCost,
          netSaving
        });
      }
    });

    // Sort by highest net saving
    return results.sort((a, b) => b.netSaving - a.netSaving);
  }, [nodes, edges]);

  const totalSavings = opportunities.reduce((sum, o) => sum + o.netSaving, 0);
  const totalEmissionReduction = opportunities.reduce((sum, o) => sum + o.emissionReductionKg, 0);

  if (opportunities.length === 0) return null;

  return (
    <div className="absolute bottom-4 right-4 w-80 bg-slate-900/95 border border-slate-700/50 backdrop-blur-md rounded-xl shadow-2xl z-20 text-white font-sans overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border-b border-slate-700/50 hover:from-emerald-900/60 hover:to-teal-900/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Recycle size={14} className="text-emerald-400" />
          <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-widest">Circular Economy</span>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">{opportunities.length}</span>
        </div>
        {isOpen ? <ChevronDown size={12} className="text-slate-500" /> : <ChevronUp size={12} className="text-slate-500" />}
      </button>

      {isOpen && (
        <>
          {/* Summary Strip */}
          <div className="flex gap-2 p-2.5 border-b border-slate-800">
            <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-center">
              <div className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Est. Savings</div>
              <div className="text-sm font-mono font-bold text-emerald-400">₹{totalSavings.toLocaleString()}</div>
            </div>
            <div className="flex-1 bg-teal-500/10 border border-teal-500/20 rounded-lg p-2 text-center">
              <div className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">CO₂ Avoided</div>
              <div className="text-sm font-mono font-bold text-teal-400">{totalEmissionReduction.toLocaleString()} kg</div>
            </div>
          </div>

          {/* Opportunity Cards */}
          <div className="max-h-[250px] overflow-y-auto p-2 space-y-1.5">
            {opportunities.map((opp, idx) => {
              const isExpanded = expandedIdx === idx;
              return (
                <div key={idx} className="bg-slate-800/60 border border-slate-700/40 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                    className="w-full text-left p-2.5 flex items-center gap-2.5 hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <Recycle size={11} className="text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-slate-200 font-semibold truncate">{opp.wasteLabel}</div>
                      <div className="text-[9px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Factory size={8} /> {opp.sourceLabel} <ArrowRight size={8} /> {opp.consumerLabel}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 shrink-0">₹{opp.netSaving.toLocaleString()}</span>
                  </button>

                  {isExpanded && (
                    <div className="p-3 pt-0 border-t border-slate-700/30 bg-slate-800/30">
                      <p className="text-[10px] text-slate-400 italic my-2 leading-relaxed">
                        Reusing {opp.wasteLabel.toLowerCase()} from {opp.sourceLabel} eliminates fresh procurement for {opp.consumerLabel}, saving {opp.savingsPct}% on material costs.
                      </p>

                      <div className="grid grid-cols-3 gap-1.5 mt-2">
                        <div className="bg-slate-900/60 border border-slate-700/30 rounded p-1.5 text-center">
                          <div className="text-[8px] text-slate-500 uppercase font-bold">Transport</div>
                          <div className="text-[10px] font-mono text-orange-400 mt-0.5">
                            <Truck size={8} className="inline mr-0.5" />₹{opp.transportCostEstimate.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-700/30 rounded p-1.5 text-center">
                          <div className="text-[8px] text-slate-500 uppercase font-bold">Fresh Cost</div>
                          <div className="text-[10px] font-mono text-red-400 mt-0.5 line-through">₹{opp.freshProcurementCost.toLocaleString()}</div>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-700/30 rounded p-1.5 text-center">
                          <div className="text-[8px] text-slate-500 uppercase font-bold">CO₂ Saved</div>
                          <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                            <TrendingDown size={8} className="inline mr-0.5" />{opp.emissionReductionKg} kg
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
