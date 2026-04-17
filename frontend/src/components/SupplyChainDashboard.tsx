import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, { Background, Controls, useNodesState, useEdgesState } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

import supplyData from '../mock_data/supply.json';
import alternativesData from '../mock_data/alternatives.json';
import { PlantNode, SupplierNode } from './GraphNodes';
import { PolicyManager } from './PolicyManager';
import { InspectorPanel } from './InspectorPanel';
import { AICommandBar } from './AICommandBar';
import type { AICommandResult } from './AICommandBar';
import { TimelineView, type Snapshot } from './TimelineView';
import { AIInsightPanel, type ImpactSummary } from './AIInsightPanel';

const nodeTypes = { plant: PlantNode, supplier: SupplierNode };

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

// Helper to auto-layout the graph
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    // Estimating node dimensions based on our custom node UI width
    dagreGraph.setNode(node.id, { width: 220, height: 120 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - 110,
      y: nodeWithPosition.y - 60,
    };
    return node;
  });

  return { nodes, edges };
};

// Pure helper: recalculates total liability for any given state (no React deps)
const computeLiability = (
  edges: any[],
  nodes: any[],
  multipliers: Record<string, number>,
  taxRate: number
): number => {
  let total = 0;
  edges.forEach(edge => {
    const logistics = edge.data?.logistics;
    const sourceNode = nodes.find((n: any) => n.id === edge.source);
    if (logistics && sourceNode) {
      const edgeEmission =
        (logistics.weight_ton * sourceNode.data.materialIndex) +
        (logistics.weight_ton * logistics.distance_km * logistics.emission_factor);
      const country = sourceNode.data.country_code || 'NA';
      const mult = multipliers[country] ?? 1.0;
      total += edgeEmission * taxRate * mult;
    }
  });
  return Math.floor(total);
};

export default function SupplyChainDashboard() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const [carbonTaxRate] = useState(1500);
  const [countryMultipliers, setCountryMultipliers] = useState<Record<string, number>>({
    'EU': 1.0, 'CN': 1.5, 'US': 1.0, 'CL': 1.0, 'TW': 1.0, 'BR': 1.0, 'AU': 1.0, 'CA': 1.0
  });

  // AI suggestions & impact state
  const [aiResponse, setAiResponse] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [impactSummary, setImpactSummary] = useState<ImpactSummary | null>(null);
  const [changeSummary, setChangeSummary] = useState<string | null>(null);

  // Timeline States
  const [timeline, setTimeline] = useState<Snapshot[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const pushToTimeline = (desc: string, currentNodes: Node[], currentEdges: Edge[], currentMults: Record<string, number>) => {
    const snapshot: Snapshot = {
      timestamp: new Date().toLocaleTimeString(),
      description: desc,
      nodes: JSON.parse(JSON.stringify(currentNodes)),
      edges: JSON.parse(JSON.stringify(currentEdges)),
      countryMultipliers: { ...currentMults }
    };

    setTimeline(prev => {
      const activeStack = currentIndex === -1 ? prev : prev.slice(0, currentIndex + 1);
      const nextStack = [...activeStack, snapshot];
      setCurrentIndex(nextStack.length - 1);
      return nextStack;
    });
  };

  const restoreSnapshot = (idx: number) => {
    const snap = timeline[idx];
    if (snap) {
       setNodes(JSON.parse(JSON.stringify(snap.nodes)));
       setEdges(JSON.parse(JSON.stringify(snap.edges)));
       setCountryMultipliers({ ...snap.countryMultipliers });
       setCurrentIndex(idx);
    }
  };

  const handleAICommand = (result: AICommandResult) => {
    const beforeLiability = computeLiability(edges, nodes, countryMultipliers, carbonTaxRate);

    const nextMults = { ...countryMultipliers };
    result.tax_updates?.forEach(update => {
      if (nextMults[update.country_code] !== undefined) {
         nextMults[update.country_code] = update.multiplier;
      }
    });

    const afterLiability = computeLiability(edges, nodes, nextMults, carbonTaxRate);
    const delta = afterLiability - beforeLiability;

    // Find affected supplier nodes
    const changedCountries = result.tax_updates?.map(u => u.country_code) ?? [];
    const affectedNodes = nodes
      .filter(n => changedCountries.includes(n.data?.country_code))
      .map(n => n.data.label);

    const bullets: string[] = [
      ...(result.tax_updates?.map(u => {
        const pct = ((Math.abs(u.multiplier - 1)) * 100).toFixed(0);
        return u.multiplier > 1.0
          ? `${pct}% import tariff applied on ${u.country_code} origin nodes`
          : `${pct}% subsidy applied to ${u.country_code} routes`;
      }) ?? []),
      affectedNodes.length > 0
        ? `${affectedNodes.length} supplier(s) affected: ${affectedNodes.slice(0, 3).join(', ')}${affectedNodes.length > 3 ? ` +${affectedNodes.length - 3} more` : ''}`
        : 'No matching supplier nodes found in active graph.',
      `Policy liability changed by ₹${Math.abs(delta).toLocaleString()} (${delta >= 0 ? '↑ increase' : '↓ decrease'})`,
    ];

    setCountryMultipliers(nextMults);
    setAiResponse(result.ai_response || '');
    setAiRecommendations(result.recommended_actions || []);
    setImpactSummary({ bullets, delta, before: beforeLiability, after: afterLiability });
    setChangeSummary(result.ai_response || null);
    pushToTimeline(result.ai_response || 'AI Policy Execution', nodes, edges, nextMults);
  };

  // Initialize Layout
  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      supplyData.nodes as Node[],
      supplyData.edges as Edge[]
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    
    if (timeline.length === 0) {
       setCurrentIndex(0);
       setTimeline([{
          timestamp: new Date().toLocaleTimeString(),
          description: "Initial Baseline State",
          nodes: JSON.parse(JSON.stringify(layoutedNodes)),
          edges: JSON.parse(JSON.stringify(layoutedEdges)),
          countryMultipliers: { 'EU': 1.0, 'CN': 1.5, 'US': 1.0, 'CL': 1.0, 'TW': 1.0, 'BR': 1.0, 'AU': 1.0, 'CA': 1.0 }
       }]);
    }
  }, []);

  // Compute accumulated emissions (Schema logic: recursively walk edges to Plants)
  // And dynamic hotspot calculation
  const { updatedNodes, totalNetworkEmissions, dynamicShadowPL } = useMemo(() => {
    if (nodes.length === 0) return { updatedNodes: [], totalNetworkEmissions: 0, dynamicShadowPL: 0 };
    
    let totalEms = 0;
    let totalTaxLiability = 0;
    const newNodes = [...nodes].map(n => ({...n}));
    
    const nodeAccumulations: Record<string, number> = {};
    const nodeHotspotChecks: Record<string, boolean> = {};

    edges.forEach(edge => {
      const logistics = edge.data?.logistics;
      const sourceNode = newNodes.find(n => n.id === edge.source);
      if (logistics && sourceNode) {
        const qty = logistics.weight_ton;
        const matIndex = sourceNode.data.materialIndex;
        const transitEms = logistics.weight_ton * logistics.distance_km * logistics.emission_factor;
        
        const edgeEmission = (qty * matIndex) + transitEms;
        totalEms += edgeEmission;

        nodeAccumulations[edge.target] = (nodeAccumulations[edge.target] || 0) + edgeEmission;
        
        if (edgeEmission > 5000) {
           nodeHotspotChecks[edge.source] = true;
        }

        // --- Dynamic Tax & Policy Logic per Edge ---
        let edgeTaxMultiplier = 1.0;
        const sourceCountry = sourceNode.data.country_code || 'NA';

        if (countryMultipliers[sourceCountry]) {
           edgeTaxMultiplier *= countryMultipliers[sourceCountry];
        }

        totalTaxLiability += (edgeEmission * carbonTaxRate) * edgeTaxMultiplier;
      }
    });

    newNodes.forEach(node => {
      if (node.type === 'plant') {
        node.data.accumulatedEmissions = nodeAccumulations[node.id] || 0;
      }
      if (node.type === 'supplier') {
        const isHotspot = nodeHotspotChecks[node.id] || node.data.score < 30;
        node.data.isHotspot = isHotspot;
        
        const countryCode = node.data.country_code || 'NA';
        node.data.isTaxed = countryMultipliers[countryCode] > 1.0;
        node.data.isSubsidized = countryMultipliers[countryCode] < 1.0;
      }
    });

    return { updatedNodes: newNodes, totalNetworkEmissions: totalEms, dynamicShadowPL: Math.floor(totalTaxLiability) };
  }, [nodes, edges, carbonTaxRate, countryMultipliers]);


  // Update the actual node state visually with the computed hotspots
  useEffect(() => {
    if (updatedNodes.length > 0 && JSON.stringify(updatedNodes) !== JSON.stringify(nodes)) {
       setNodes(updatedNodes);
    }
  }, [updatedNodes]);

  // Use the new dynamic property
  const shadowPL = dynamicShadowPL;

  // Find the edge originating from the currently selected node
  const currentEdge = useMemo(() => {
    return edges.find(e => e.source === selectedNode?.id) || null;
  }, [edges, selectedNode]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleSwap = (targetNodeId: string, alternative: any) => {
    let swappedNodes = nodes.map(n => {
      if (n.id === targetNodeId) {
        return {
          ...n,
          id: alternative.id, 
          data: { ...n.data, ...alternative.data }
        };
      }
      return n;
    });

    let swappedEdges = edges.map(e => {
      if (e.source === targetNodeId) {
         return {
           ...e,
           source: alternative.id,
           data: alternative.edgeData,
           style: { stroke: '#10b981', strokeWidth: 2 } 
         };
      }
      return e;
    });

    const layouted = getLayoutedElements(swappedNodes, swappedEdges);
    pushToTimeline(`Swapped supplier for ${alternative.data.label}`, layouted.nodes, layouted.edges, countryMultipliers);
    
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
    setSelectedNode(null); 
  };


  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col font-sans overflow-hidden">
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-md z-20">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-white tracking-tighter italic">
            SYMBIOSIS <span className="text-blue-500 not-italic font-black">AI</span>
          </h1>
          <span className="text-[8px] text-slate-500 font-bold tracking-[0.2em] -mt-1 uppercase">Topology Engine</span>
        </div>

        <div className="flex gap-3 items-center">
          {/* Change Summary Box */}
          {changeSummary && (
            <div className="max-w-xs bg-purple-900/30 border border-purple-500/30 px-3 py-1.5 rounded-lg">
              <p className="text-[9px] text-purple-400/70 uppercase font-black mb-0.5">Last AI Change</p>
              <p className="text-[10px] text-purple-200 leading-snug line-clamp-2">{changeSummary}</p>
            </div>
          )}
          <div className="text-right bg-slate-800/40 px-4 py-1.5 rounded-lg border border-white/5">
            <p className="text-[9px] text-slate-500 uppercase font-black">Total Accumulation</p>
            <p className="text-sm font-mono text-slate-300 font-bold">{totalNetworkEmissions.toLocaleString(undefined, { maximumFractionDigits: 0 })} tons CO2e</p>
          </div>
          <div className="text-right bg-red-500/10 px-4 py-1.5 rounded-lg border border-red-500/20">
            <p className="text-[9px] text-red-500/70 uppercase font-black">Projected Policy Liability</p>
            <p className="text-xl font-mono text-red-400 font-bold">₹{shadowPL.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="flex-grow relative">
        <TimelineView 
           timeline={timeline}
           currentIndex={currentIndex}
           onRestore={restoreSnapshot}
        />
        <AIInsightPanel
          aiResponse={aiResponse}
          impactSummary={impactSummary}
          recommendations={aiRecommendations}
        />
        
        <InspectorPanel 
          selectedNode={selectedNode}
          currentEdge={currentEdge}
          alternatives={selectedNode ? (alternativesData as any)[selectedNode.id] : []}
          onClose={() => setSelectedNode(null)}
          onSwap={handleSwap}
        />

        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          nodeTypes={nodeTypes} 
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          minZoom={0.2}
          maxZoom={1.5}
          className="react-flow-container"
        >
          <Background color="#1e293b" gap={20} size={1} />
          <Controls className="bg-slate-900 border-slate-700 fill-white shadow-2xl" />
        </ReactFlow>

        {/* The NLP AI Co-Pilot Input */}
        <AICommandBar onCommand={handleAICommand} />

      </div>
    </div>
  );
}