import React, { useState } from 'react';
import KPICard from './KPICard';
import ScatterPlot from './ScatterPlot';
import mockData from '../mockData.json';
import { CalendarDays, Filter } from 'lucide-react';

const timeFilters = [
  { id: '1W', label: '1 Week Ago' },
  { id: '1M', label: '1 Month Ago' },
  { id: '1Y', label: '1 Year Ago' },
  { id: '5Y', label: '5 Years Ago' }
];

const OperationsDashboard = ({ activeTime, setActiveTime }) => {
  const [activeActionId, setActiveActionId] = useState(null);
  const [projectType, setProjectType] = useState('future');

  // MACC Equation: High Reduction (Y) & Low Cost (X) = Top Left Quadrant
  const actionColorLogic = (item) => {
    // Determine bounds
    const maxReduction = 25000;
    const maxCost = 22000000;

    const reductionScore = item.expected_emission_reduction / maxReduction;
    const costScore = item.expected_cost_impact / maxCost;

    if (reductionScore > 0.5 && costScore < 0.5) {
      return { fill: "#10B981", stroke: "#059669" }; // ROI Positive - Emerald
    } else if (costScore > 0.6) {
      return { fill: "#F59E0B", stroke: "#D97706" }; // Capital Intensive - Amber
    }
    return { fill: "#3B82F6", stroke: "#2563EB" }; // Default - Blue
  };

  // 1. Time multiplier based on activeTime
  const timeMultiplier = activeTime === '1W' ? 0.8 : activeTime === '1M' ? 1.0 : activeTime === '1Y' ? 1.4 : 2.0;

  // 2. Filter & Scale Data
  const filteredData = mockData.actions.filter(a => projectType === 'future' ? a.status === 'Proposed' : a.status !== 'Proposed');
  const displayData = filteredData.map(a => ({
    ...a,
    expected_cost_impact: a.expected_cost_impact * timeMultiplier,
    expected_emission_reduction: a.expected_emission_reduction * timeMultiplier,
    current_emissions: a.current_emissions * timeMultiplier
  }));


  return (
    <div className="flex h-full w-full overflow-hidden">
      
      {/* Time-Control Sidebar */}
      <aside className="w-64 bg-[#111827]/50 border-r border-[#1F2937] p-6 flex flex-col gap-6 relative z-10 hidden md:flex overflow-y-auto custom-scrollbar">
        <div>
          <h2 className="text-xs font-bold tracking-widest text-[#9CA3AF] uppercase mb-4 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Temporal Filter
          </h2>
          <div className="flex flex-col gap-2">
            {timeFilters.map(tf => (
              <button
                key={tf.id}
                onClick={() => setActiveTime(tf.id)}
                className={`text-sm py-2 px-3 rounded-lg text-left transition-all border ${
                  activeTime === tf.id 
                  ? 'bg-[#10B981]/20 border-[#10B981]/50 text-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                  : 'bg-transparent border-[#374151] text-[#9CA3AF] hover:border-[#4B5563] hover:text-[#D1D5DB]'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#374151] to-transparent my-2" />

        <div>
          <h2 className="text-xs font-bold tracking-widest text-[#9CA3AF] uppercase mb-4 flex items-center gap-2">
            <Filter className="w-4 h-4" /> Insight Log
          </h2>
          <div className="text-xs text-[#9CA3AF] leading-relaxed space-y-3">
            <p>Data shifting based on selected timeframe adjusts investment scaling dynamically.</p>
            <p className="p-3 bg-[#1F2937]/50 rounded-lg border border-[#374151]">
              <span className="text-[#10B981] font-semibold block mb-1">MACC Intelligence</span>
              Focus on top-left quadrant items for highest ROI carbon yield.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6 relative">
        {/* Background glow element */}
        <div className="absolute top-1/4 left-1/2 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2" />

        {/* KPI Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <KPICard 
            title="Total Equivalent Reductions" 
            value="32,450" 
            subtext="Tons CO₂e"
            trend="up" 
            trendLabel="4.2% yield" 
            color="emerald" 
          />
          <KPICard 
            title="Emissions Demographics" 
            value="15 / 22 / 63" 
            subtext="% Split"
            color="blue" 
          />
          <KPICard 
            title="Total Capital Deployed" 
            value="₹45.6M" 
            subtext="INR"
            trend="down" 
            trendLabel="Under Budget" 
            color="amber" 
          />
        </div>

        {/* Main Graph Area */}
        <div className="glass-panel rounded-xl p-6 flex-1 min-h-[500px] flex flex-col relative z-10">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Action vs. Impact Matrix</h2>
              <div className="flex items-center gap-2 mt-3">
                <button 
                  onClick={() => setProjectType('future')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${projectType === 'future' ? 'bg-[#10B981] text-white shadow-lg' : 'bg-[#1F2937] text-[#9CA3AF] hover:bg-[#374151]'}`}
                >
                  Future Projects
                </button>
                <button 
                  onClick={() => setProjectType('current')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${projectType === 'current' ? 'bg-[#3B82F6] text-white shadow-lg' : 'bg-[#1F2937] text-[#9CA3AF] hover:bg-[#374151]'}`}
                >
                  Current Projects
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full bg-[#0B1120]/50 rounded-lg border border-[#1F2937] p-4">
            <ScatterPlot 
              data={displayData}
              xKey="expected_cost_impact"
              yKey={projectType === 'future' ? 'expected_emission_reduction' : 'current_emissions'}
              xAxisLabel="Financial Investment (₹)"
              yAxisLabel={projectType === 'future' ? 'Emission Reductions (Tons CO₂e)' : 'Current Emissions (Tons CO₂e)'}
              colorLogic={actionColorLogic}
              onNodeClick={(node) => setActiveActionId(node.id === activeActionId ? null : node.id)}
              activeNodeId={activeActionId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationsDashboard;
