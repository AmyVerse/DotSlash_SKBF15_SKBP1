import React, { useState } from 'react';
import { LayoutDashboard, Truck, Activity, Settings, Bell } from 'lucide-react';
import OperationsDashboard from '../components/OperationsDashboard';
import SupplierDashboard from '../components/SupplierDashboard';

export default function Dashboard() {
  const [activeView, setActiveView] = useState('operations');
  const [activeTime, setActiveTime] = useState('1M'); // Lifted from OperationsDashboard

  return (
    <div className="flex h-screen bg-[#0B1120] text-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <nav className="w-20 bg-[#111827] border-r border-[#1F2937] flex flex-col items-center py-6 gap-8 z-50 shadow-2xl relative">
        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
          <Activity className="text-emerald-400 w-7 h-7" />
        </div>

        <div className="flex flex-col gap-4 mt-4 w-full px-3">
          <button 
            onClick={() => setActiveView('operations')}
            className={`p-3 rounded-lg flex items-center justify-center transition-all ${activeView === 'operations' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:bg-slate-800'}`}
            title="Operations & ROI"
          >
            <LayoutDashboard className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setActiveView('suppliers')}
            className={`p-3 rounded-lg flex items-center justify-center transition-all ${activeView === 'suppliers' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:bg-slate-800'}`}
            title="Supplier Risk & Procurement"
          >
            <Truck className="w-6 h-6" />
          </button>
        </div>

        <div className="mt-auto flex flex-col gap-4">
          <button className="p-3 text-slate-400 hover:text-slate-200 transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-3 text-slate-400 hover:text-slate-200 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {/* Top Header */}
        <header className="h-16 flex items-center px-8 border-b border-[#1F2937]/50 bg-[#0B1120]/80 backdrop-blur-md z-40">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            {activeView === 'operations' ? 'Operations & ROI Console' : 'Supplier Risk Matrix'}
          </h1>
          <div className="ml-auto flex items-center gap-4 text-sm text-slate-400">
            <span>Standard Region: APAC</span>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <span className="text-xs font-bold text-slate-300">CM</span>
            </div>
          </div>
        </header>

        {/* Dynamic View Injection */}
        {activeView === 'operations' ? (
          <OperationsDashboard activeTime={activeTime} setActiveTime={setActiveTime} />
        ) : (
          <SupplierDashboard activeTime={activeTime} />
        )}
      </main>
      
    </div>
  );
}
