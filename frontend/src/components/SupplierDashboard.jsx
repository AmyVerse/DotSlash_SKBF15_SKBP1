import React, { useState, useMemo } from 'react';
import ScatterPlot from './ScatterPlot';
import mockData from '../mockData.json';
import { ToggleRight, ToggleLeft, AlertTriangle } from 'lucide-react';

const SupplierDashboard = ({ activeTime }) => {
  const [activeSupplierId, setActiveSupplierId] = useState(null);
  const [cbamEnabled, setCbamEnabled] = useState(false);

  // Calculate adjusted data based on CBAM Toggle
  const supplierData = useMemo(() => {
    const timeMultiplier = activeTime === '1W' ? 0.8 : activeTime === '1M' ? 1.0 : activeTime === '1Y' ? 1.4 : 2.0;
    
    return mockData.suppliers.map(sup => {
      let currentSpend = sup.spend * timeMultiplier;
      let currentEmissions = sup.emissions * timeMultiplier;
      let taxPenalty = 0;

      if (cbamEnabled) {
        // Multiply emissions by $50 -> Approx ₹4150 per ton
        taxPenalty = currentEmissions * 4150; 
        currentSpend += taxPenalty;
      }

      return {
        ...sup,
        emissions: currentEmissions,
        adjusted_spend: currentSpend,
        tax_applied: taxPenalty
      };
    });
  }, [cbamEnabled, activeTime]);

  // Color logic for Supplier matrix
  const supplierColorLogic = (item) => {
    // High Emissions, High Cost -> High Risk (Top Right)
    const maxEmissions = 35000;
    if (item.emissions > maxEmissions * 0.6) {
      return { fill: "#EF4444", stroke: "#B91C1C" }; // Liability - Red
    }
    // Low Emissions, Low Spend -> High Efficiency (Bottom Left)
    if (item.emissions < maxEmissions * 0.3) {
      return { fill: "#10B981", stroke: "#059669" }; // Efficient - Emerald
    }
    return { fill: "#3B82F6", stroke: "#2563EB" }; // Default - Blue
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      
      {/* Supplier List Sidebar */}
      <aside className="w-80 bg-[#111827]/50 border-r border-[#1F2937] flex flex-col relative z-10 hidden lg:flex">
        <div className="p-6 border-b border-[#1F2937]">
          <h2 className="text-sm font-bold text-white mb-2">Tier 1 Suppliers</h2>
          <p className="text-xs text-[#9CA3AF]">Select vendor to view specific operational risk telemetry.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
          {supplierData.map(sup => (
            <div 
              key={sup.id}
              onClick={() => setActiveSupplierId(sup.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeSupplierId === sup.id 
                ? 'bg-[#1F2937] border-[#4B5563]' 
                : 'bg-[#111827]/50 border-[#1F2937] hover:border-[#374151]'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-white text-sm">{sup.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase ${
                  sup.criticality_level === 'Critical' ? 'bg-[#EF4444]/20 text-[#EF4444]' :
                  sup.criticality_level === 'High' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' :
                  'bg-[#3B82F6]/20 text-[#3B82F6]'
                }`}>
                  {sup.criticality_level}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-medium">
                <div className="flex flex-col">
                  <span className="text-[#9CA3AF] mb-1">Total Impact</span>
                  <span className="text-[#D1D5DB] font-mono">{sup.emissions.toLocaleString()} tCO₂e</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[#9CA3AF] mb-1">Financial Exposure</span>
                  <span className={`font-mono transition-colors duration-500 ${cbamEnabled && sup.tax_applied > 0 ? 'text-[#EF4444]' : 'text-emerald-400'}`}>
                    {formatCurrency(sup.adjusted_spend)}
                  </span>
                  {cbamEnabled && (
                    <span className="text-[10px] text-[#EF4444]/70 mt-0.5 animate-pulse">
                      (+{formatCurrency(sup.tax_applied)} Tax)
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6 relative">
        
        {/* Shadow P&L Header Controller */}
        <div className={`glass-panel rounded-xl p-5 flex items-center justify-between transition-colors duration-500 ${cbamEnabled ? 'border-[#EF4444]/30 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : ''}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${cbamEnabled ? 'bg-[#EF4444]/20' : 'bg-[#1F2937]'}`}>
              <AlertTriangle className={cbamEnabled ? 'text-[#EF4444]' : 'text-[#6B7280]'} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Shadow P&L Simulation</h2>
              <p className="text-sm text-[#9CA3AF] mt-1">Inject $50/ton (~₹4,150) theoretical carbon tax penalty across value chain.</p>
            </div>
          </div>
          
          <button 
            onClick={() => setCbamEnabled(!cbamEnabled)}
            className="flex items-center gap-3 group"
          >
            <span className={`text-sm font-bold uppercase transition-colors ${cbamEnabled ? 'text-[#EF4444]' : 'text-[#9CA3AF]'}`}>
              {cbamEnabled ? 'Tax Active' : 'Off'}
            </span>
            {cbamEnabled ? (
              <ToggleRight className="w-12 h-12 text-[#EF4444] transition-all" />
            ) : (
              <ToggleLeft className="w-12 h-12 text-[#4B5563] group-hover:text-[#6B7280] transition-all" />
            )}
          </button>
        </div>

        {/* Main Graph Area */}
        <div className="glass-panel rounded-xl p-6 flex-1 min-h-[500px] flex flex-col">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Supplier Risk Index Matrix</h2>
              <p className="text-sm text-[#9CA3AF] mt-1">Watch nodes shift horizontally dynamically due to tax burden exposure.</p>
            </div>
          </div>
          
          <div className="flex-1 w-full bg-[#0B1120]/50 rounded-lg border border-[#1F2937] p-4 overflow-hidden">
            <ScatterPlot 
              data={supplierData}
              xKey="adjusted_spend"
              yKey="emissions"
              xAxisLabel="Financial Spend (₹) + Tax Liabilities"
              yAxisLabel="Scope 3 Emissions (Tons CO₂e)"
              colorLogic={supplierColorLogic}
              onNodeClick={(node) => setActiveSupplierId(node.id === activeSupplierId ? null : node.id)}
              activeNodeId={activeSupplierId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDashboard;
