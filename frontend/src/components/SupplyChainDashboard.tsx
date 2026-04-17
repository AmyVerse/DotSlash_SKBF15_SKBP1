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

export default function SupplyChainDashboard() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Policy States
  const [carbonTaxRate, setCarbonTaxRate] = useState(1500);
  const [countryMultipliers, setCountryMultipliers] = useState<Record<string, number>>({
    'EU': 1.0, 'CN': 1.5, 'US': 1.0, 'CL': 1.0, 'TW': 1.0, 'BR': 1.0, 'AU': 1.0, 'CA': 1.0
  });

  const updateCountryMultiplier = (country: string, val: number) => {
    setCountryMultipliers(prev => ({
      ...prev,
      [country]: val
    }));
  };

  // Initialize Layout
  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      supplyData.nodes as Node[],
      supplyData.edges as Edge[]
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
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

        <div className="flex gap-6 items-center">
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
        <PolicyManager 
          carbonTaxRate={carbonTaxRate} setCarbonTaxRate={setCarbonTaxRate}
          countryMultipliers={countryMultipliers} updateCountryMultiplier={updateCountryMultiplier}
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
      </div>
    </div>
  );
}