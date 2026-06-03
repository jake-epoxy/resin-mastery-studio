import React, { useState, useEffect, useRef } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { useConversation, ConversationProvider } from '@elevenlabs/react';
import * as THREE from 'three';
import { Mic, MicOff, BrainCircuit, Activity, Database, Radar, Code2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

// Live data will be fetched from the API

function EpoxyBrainContent() {
  const [graphData, setGraphData] = useState<{nodes: any[], links: any[]}>({ nodes: [], links: [] });
  const [logs, setLogs] = useState([
    "[SYSTEM] Hive Mind initializing...",
  ]);
  const [synapseCount, setSynapseCount] = useState(0);
  const graphRef = useRef<any>();

  // ElevenLabs Conversational AI Hook
  const conversation = useConversation({
    onConnect: () => {
      setLogs(prev => ["[VOICE] Neural link established. AI listening...", ...prev]);
    },
    onDisconnect: () => {
      setLogs(prev => ["[VOICE] Neural link severed.", ...prev]);
    },
    onMessage: (message: any) => {
      if(message.source === 'user') {
        setLogs(prev => [`[USER]: ${message.message}`, ...prev]);
      } else if (message.source === 'ai') {
        setLogs(prev => [`[BRAIN]: ${message.message}`, ...prev]);
      }
    },
    onError: (error: any) => {
      setLogs(prev => [`[VOICE ERROR] ${typeof error === 'string' ? error : 'Failed to connect.'}`, ...prev]);
    }
  });

  const isListening = conversation.status === 'connected';

  const toggleConversation = async () => {
    if (isListening) {
      await conversation.endSession();
    } else {
      try {
        const greetings = [
          "What's good bro!",
          "Yo, Phil here. What are we building today?",
          "Systems online. Hit me.",
          "Neural link established. What's the play, boss?",
          "Hive mind connected. Let's get to work."
        ];
        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

        // The ElevenLabs SDK automatically requests microphone permissions
        await conversation.startSession({
          agentId: 'agent_5801kt3fnmp8fr7stsgcpgyr98t0',
          dynamicVariables: {
            greeting: randomGreeting
          }
        });
      } catch (err: any) {
        setLogs(prev => [`[MIC ERROR] ${err.message || 'Connection failed.'}`, ...prev]);
      }
    }
  };

  useEffect(() => {
    const fetchBrainData = async () => {
      try {
        const res = await fetch('/api/brain-stats');
        const data = await res.json();
        
        const nodes = [
          { id: 'core', group: 1, name: 'The Hive Mind (Core)', val: 30 },
          { id: 'agent_scout', group: 4, name: 'The Scout (Data Gathering)', val: 12 },
          { id: 'agent_scientist', group: 5, name: 'The Scientist (Content)', val: 12 },
          { id: 'agent_closer', group: 6, name: 'The Closer (Sales)', val: 12 },
          { id: 'agent_hustler', group: 7, name: 'The Hustler (Strategy)', val: 12 },
          { id: 'agent_engineer', group: 8, name: 'The Engineer (Code)', val: 12 }
        ];

        const links: any[] = [
          { source: 'agent_scout', target: 'core' },
          { source: 'agent_scientist', target: 'core' },
          { source: 'agent_closer', target: 'core' },
          { source: 'agent_hustler', target: 'core' },
          { source: 'agent_engineer', target: 'core' }
        ];

        if (data.synapses) {
          setSynapseCount(data.synapses.length);
          data.synapses.forEach((syn: any) => {
             const synId = `syn_${syn.id}`;
             nodes.push({ id: synId, group: 3, name: `Memory: ${syn.metadata?.source || 'Unknown'}`, val: 3 });
             links.push({ source: 'agent_scout', target: synId }); // Scout feeds the memories
             links.push({ source: synId, target: 'core' }); // Memories feed the core
             
             // Randomly connect some synapses to agents to show them using it
             if (Math.random() > 0.7) links.push({ source: synId, target: 'agent_scientist' });
             if (Math.random() > 0.7) links.push({ source: synId, target: 'agent_closer' });
             if (syn.agent_source?.includes('engineer')) links.push({ source: synId, target: 'agent_engineer' });
          });
        }

        setGraphData({ nodes, links });

        const newLogs = ["[SYSTEM] Hive Mind Synced."];
        if (data.drafts) {
          data.drafts.forEach((d: any) => {
            newLogs.push(`[${d.agent_id || 'AGENT'}] Drafted email to ${d.lead_email} (${d.status})`);
          });
        }
        setLogs(newLogs);

      } catch (err) {
        console.error("Failed to fetch brain stats", err);
      }
    };

    fetchBrainData();
    const interval = setInterval(fetchBrainData, 10000);
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

  const getNeonColor = (group: number) => {
    switch(group) {
      case 1: return '#00ffff'; // Cyan (Core)
      case 2: return '#3a86ff'; // Deep Blue (Marketing)
      case 3: return '#9d4edd'; // Purple (Synapses)
      case 4: return '#10b981'; // Green (Scout)
      case 5: return '#f59e0b'; // Orange (Scientist)
      case 6: return '#ef4444'; // Red (Closer)
      case 7: return '#3b82f6'; // Blue (Hustler)
      case 8: return '#22d3ee'; // Cyan (Engineer)
      default: return '#ffffff';
    }
  };

  const renderGlowingOrb = (node: any) => {
    const color = getNeonColor(node.group);
    const size = node.val || 4;
    
    // Core sphere (transparent neon)
    const geometry = new THREE.SphereGeometry(size);
    const material = new THREE.MeshBasicMaterial({ 
      color, 
      transparent: true, 
      opacity: 0.45 // "see thru" like before
    });
    const sphere = new THREE.Mesh(geometry, material);

    // Pleasing soft glow (Sprite with additive blending)
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture, 
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0.95 // strong but soft glow
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      const haloSize = size * 4.5; // Make the soft glow spread further
      sprite.scale.set(haloSize, haloSize, 1);
      sphere.add(sprite);
    }
    return sphere;
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-[#050505] overflow-hidden flex">
      {/* 3D Force Graph Background */}
      <div className="absolute inset-0 z-0">
        <ForceGraph3D
          ref={graphRef}
          graphData={graphData}
          nodeThreeObject={renderGlowingOrb}
          linkWidth={1.5}
          linkColor={(link: any) => {
            const targetNode = graphData.nodes.find(n => n.id === link.target?.id || n.id === link.target);
            const color = targetNode ? getNeonColor(targetNode.group) : '#00ffff';
            return color + '70'; // Softened the connections
          }}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleSpeed={0.01}
          backgroundColor="#020202"
          onNodeClick={handleNodeClick}
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

        {/* Bottom HUD Area */}
        <div className="mt-auto flex w-full justify-between items-end pb-8 px-4 pointer-events-auto pr-[340px]">
          
          {/* Left: Voice Orb */}
          <div className="flex flex-col items-center w-64">
            <div className="relative group cursor-pointer" onClick={toggleConversation}>
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
            <p className="mt-6 font-mono text-sm tracking-widest text-white/50 text-center">
              {isListening ? 'LISTENING...' : 'WAKE BRAIN'}
            </p>
          </div>

          {/* Center: Update Dashboard */}
          <div className="flex-1 max-w-2xl bg-black/60 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 shadow-[0_0_40px_rgba(0,255,255,0.05)] relative overflow-hidden">
            {/* Ambient background glow in the dashboard */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none"></div>
            
            <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-4 relative z-10">
              <Radar className="w-5 h-5 text-cyan-400 animate-[spin_4s_linear_infinite]" />
              <h2 className="text-white font-mono tracking-widest font-bold">COMMAND DASHBOARD</h2>
              <Code2 className="w-4 h-4 text-cyan-300" />
            </div>
            <div className="grid grid-cols-3 gap-4 relative z-10">
               <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-cyan-500/50 transition-colors">
                 <p className="text-cyan-400/70 text-[10px] font-mono tracking-wider mb-1">SYSTEM STATUS</p>
                 <p className="text-white font-bold font-mono">OPTIMAL</p>
               </div>
               <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-purple-500/50 transition-colors">
                 <p className="text-purple-400/70 text-[10px] font-mono tracking-wider mb-1">LATEST SYNAPSE</p>
                 <p className="text-white font-bold font-mono text-sm truncate">Local Contractor</p>
               </div>
               <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-green-500/50 transition-colors">
                 <p className="text-green-400/70 text-[10px] font-mono tracking-wider mb-1">AI CONFIDENCE</p>
                 <p className="text-white font-bold font-mono">98.4%</p>
               </div>
            </div>
          </div>

          {/* Right spacer to keep it centered (matches orb width) */}
          <div className="w-16"></div>
        </div>
      </div>

      {/* Right Side Panel (Logs & Stats) */}
      <div className="absolute right-0 top-0 h-full w-80 bg-black/60 backdrop-blur-xl border-l border-white/5 p-6 pointer-events-auto flex flex-col pb-24">
        
        {/* Synapse Count (Moved to top) */}
        <div>
           <h3 className="text-white font-mono text-sm mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-400" />
            SYNAPSE COUNT
          </h3>
          <div className="bg-white/5 rounded p-4 font-mono text-center mb-6 border border-white/10">
            <span className="text-3xl font-bold text-white">{synapseCount}</span>
            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Active Memories</p>
          </div>
        </div>

        {/* Swarm Activity Logs */}
        <h3 className="text-white font-mono text-sm mb-4 flex items-center gap-2 pt-6 border-t border-white/10">
          <Activity className="w-4 h-4 text-cyan-400" />
          SWARM ACTIVITY
        </h3>
        
        <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs pr-2 pb-10">
          {logs.map((log, i) => (
            <div key={i} className="text-gray-400 border-l-2 border-cyan-500/30 pl-3 py-1 bg-white/5 rounded-r">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function EpoxyBrain() {
  return (
    <ConversationProvider>
      <EpoxyBrainContent />
    </ConversationProvider>
  );
}
