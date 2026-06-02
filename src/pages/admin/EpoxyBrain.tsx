import React, { useState, useEffect, useRef } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { Mic, MicOff, BrainCircuit, Activity, Database, Radar } from 'lucide-react';
import { Card } from '@/components/ui/card';

// Mock data to visualize the brain growing
const generateMockBrainData = () => {
  const nodes = [{ id: 'core', group: 1, name: 'The Epoxy Brain (Core)', val: 20 }];
  const links = [];
  
  // Marketing Synapses
  for (let i = 1; i <= 15; i++) {
    nodes.push({ id: `mkt_${i}`, group: 2, name: `Marketing Node ${i}`, val: 5 });
    links.push({ source: 'core', target: `mkt_${i}` });
  }
  
  // Lead Gen Synapses
  for (let i = 1; i <= 40; i++) {
    nodes.push({ id: `lead_${i}`, group: 3, name: `Scraped Lead: Concrete Co ${i}`, val: 3 });
    links.push({ source: 'core', target: `lead_${i}` });
    // Random interconnects
    if (Math.random() > 0.7) {
      links.push({ source: `lead_${i}`, target: `mkt_${Math.floor(Math.random() * 15) + 1}` });
    }
  }

  return { nodes, links };
};

export default function EpoxyBrain() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [isListening, setIsListening] = useState(false);
  const [logs, setLogs] = useState([
    "[SYSTEM] Epoxy Brain initializing...",
    "[AGENT] Lead Gen Agent standing by.",
    "[AGENT] Marketing Agent standing by."
  ]);
  const graphRef = useRef<any>();

  useEffect(() => {
    // Simulate the brain growing dynamically
    setGraphData(generateMockBrainData());
    
    const interval = setInterval(() => {
      setGraphData(prev => {
        const newId = `lead_new_${Math.random()}`;
        return {
          nodes: [...prev.nodes, { id: newId, group: 3, name: `New Lead Discovered`, val: 3 }],
          links: [...prev.links, { source: 'core', target: newId }]
        };
      });
      setLogs(prev => [`[LEAD GEN] Found new local concrete contractor... embedding synapse.`, ...prev.slice(0, 4)]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleNodeClick = (node: any) => {
    if (graphRef.current) {
      // Aim at node from outside it
      const distance = 40;
      const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
      graphRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, 
        node, 
        3000
      );
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-[#050505] overflow-hidden flex">
      {/* 3D Force Graph Background */}
      <div className="absolute inset-0 z-0">
        <ForceGraph3D
          ref={graphRef}
          graphData={graphData}
          nodeAutoColorBy="group"
          nodeResolution={16}
          linkWidth={1}
          linkOpacity={0.3}
          backgroundColor="#050505"
          onNodeClick={handleNodeClick}
          nodeRelSize={4}
        />
      </div>

      {/* Futuristic Overlay UI */}
      <div className="relative z-10 w-full h-full flex flex-col pointer-events-none p-6">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl pointer-events-auto">
            <BrainCircuit className="w-8 h-8 text-cyan-400" />
            <div>
              <h1 className="text-xl font-bold text-white tracking-widest uppercase">Epoxy Brain OS</h1>
              <p className="text-xs text-cyan-400 font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                NEURAL NETWORK ACTIVE
              </p>
            </div>
          </div>
        </div>

        {/* The Voice Orb / Controller (Center Bottom) */}
        <div className="mt-auto flex flex-col items-center justify-center pb-12 pointer-events-auto">
          <div className="relative group cursor-pointer" onClick={() => setIsListening(!isListening)}>
            {/* Pulsing rings */}
            {isListening && (
              <>
                <div className="absolute inset-0 bg-cyan-500 rounded-full blur-xl opacity-50 animate-ping"></div>
                <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              </>
            )}
            
            {/* Core Orb */}
            <div className={`relative w-24 h-24 rounded-full border border-white/20 flex items-center justify-center transition-all duration-500 shadow-[0_0_50px_rgba(0,255,255,0.2)] ${isListening ? 'bg-gradient-to-br from-cyan-900 to-black scale-110' : 'bg-black/80 backdrop-blur-xl'}`}>
              {isListening ? <Mic className="w-10 h-10 text-cyan-400" /> : <MicOff className="w-8 h-8 text-gray-500" />}
            </div>
          </div>
          <p className="mt-6 font-mono text-sm tracking-widest text-white/50">
            {isListening ? 'LISTENING FOR COMMANDS...' : 'CLICK TO WAKE BRAIN'}
          </p>
        </div>
      </div>

      {/* Right Side Panel (Logs & Stats) */}
      <div className="absolute right-0 top-0 h-full w-80 bg-black/60 backdrop-blur-xl border-l border-white/5 p-6 pointer-events-auto flex flex-col">
        <h3 className="text-white font-mono text-sm mb-6 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          SWARM ACTIVITY
        </h3>
        
        <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs">
          {logs.map((log, i) => (
            <div key={i} className="text-gray-400 border-l-2 border-cyan-500/30 pl-3 py-1">
              {log}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
           <h3 className="text-white font-mono text-sm mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-400" />
            SYNAPSE COUNT
          </h3>
          <div className="bg-white/5 rounded p-4 font-mono text-center">
            <span className="text-3xl font-bold text-white">{graphData.nodes.length}</span>
            <p className="text-[10px] text-gray-500 mt-1">ACTIVE MEMORIES</p>
          </div>
        </div>
      </div>
    </div>
  );
}
