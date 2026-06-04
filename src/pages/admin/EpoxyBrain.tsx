import React, { useState, useEffect, useRef } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { useConversation, ConversationProvider } from '@elevenlabs/react';
import * as THREE from 'three';
import { Mic, MicOff, BrainCircuit, Activity, Database, Radar, Code2, Lightbulb, Target, Wrench, AlertTriangle } from 'lucide-react';

// Live data will be fetched from the API
const hiveAgents = [
  { id: 'scout', nodeId: 'agent_scout', group: 4, name: 'The Scout (Data Gathering)' },
  { id: 'scientist', nodeId: 'agent_scientist', group: 5, name: 'The Scientist (Content)' },
  { id: 'closer', nodeId: 'agent_closer', group: 6, name: 'The Closer (Sales)' },
  { id: 'hustler', nodeId: 'agent_hustler', group: 7, name: 'The Hustler (Strategy)' },
  { id: 'engineer', nodeId: 'agent_engineer', group: 8, name: 'The Engineer (Code)' },
];

const feedTabs = ['all', 'scout', 'scientist', 'closer', 'hustler', 'engineer', 'operator'] as const;

type FeedItem = {
  id: string;
  agent: string;
  label: string;
  time: string;
  source: string;
  message: string;
  companyMove?: string;
  isError?: boolean;
  local?: boolean;
};

type Briefing = {
  opportunity: string;
  lead: string;
  content: string;
  system: string;
  issue: string;
};

const emptyBriefing: Briefing = {
  opportunity: 'Waiting for Hustler signal',
  lead: 'Waiting for Closer signal',
  content: 'Waiting for Scientist signal',
  system: 'Waiting for Engineer signal',
  issue: 'No active errors',
};

function formatFeedTime(value?: string) {
  if (!value) return 'now';
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function normalizeAgentId(value?: string) {
  const agent = (value || 'system').toLowerCase().replace(/[^a-z]/g, '');
  if (agent.includes('scout')) return 'scout';
  if (agent.includes('scientist')) return 'scientist';
  if (agent.includes('closer')) return 'closer';
  if (agent.includes('hustler')) return 'hustler';
  if (agent.includes('engineer')) return 'engineer';
  if (agent.includes('operator')) return 'operator';
  if (agent.includes('phil')) return 'phil';
  if (agent.includes('brain')) return 'brain';
  if (agent.includes('voice')) return 'voice';
  return agent || 'system';
}

function extractCompanyMove(message: string) {
  const match = message.match(/Company Move:\s*([^|]+)/i);
  return match?.[1]?.trim().replace(/\s+/g, ' ');
}

function getAgentAccent(agent: string) {
  switch (normalizeAgentId(agent)) {
    case 'scout': return 'border-l-emerald-400 text-emerald-300';
    case 'scientist': return 'border-l-amber-400 text-amber-300';
    case 'closer': return 'border-l-red-400 text-red-300';
    case 'hustler': return 'border-l-blue-400 text-blue-300';
    case 'engineer': return 'border-l-cyan-400 text-cyan-300';
    case 'operator': return 'border-l-purple-400 text-purple-300';
    default: return 'border-l-white/30 text-white/70';
  }
}

function shorten(value: string, fallback: string) {
  const clean = (value || fallback).replace(/\s+/g, ' ').trim();
  return clean.length > 150 ? `${clean.slice(0, 147)}...` : clean;
}

function EpoxyBrainContent() {
  const [graphData, setGraphData] = useState<{nodes: any[], links: any[]}>({ nodes: [], links: [] });
  const [feedItems, setFeedItems] = useState<FeedItem[]>([
    {
      id: 'system-init',
      agent: 'system',
      label: 'SYSTEM',
      time: 'now',
      source: 'startup',
      message: 'Hive Mind initializing...',
      local: true,
    },
  ]);
  const [activeFeedAgent, setActiveFeedAgent] = useState<(typeof feedTabs)[number]>('all');
  const [briefing, setBriefing] = useState<Briefing>(emptyBriefing);
  const [synapseCount, setSynapseCount] = useState(0);
  const [visibleSynapseCount, setVisibleSynapseCount] = useState(0);
  const [latestSynapse, setLatestSynapse] = useState('Waiting for memory');
  const [activeAgents, setActiveAgents] = useState(0);
  const graphRef = useRef<any>();

  // ElevenLabs Conversational AI Hook
  const conversation = useConversation({
    onConnect: () => {
      setFeedItems(prev => [{
        id: `voice-connect-${Date.now()}`,
        agent: 'voice',
        label: 'VOICE',
        time: formatFeedTime(),
        source: 'phil',
        message: 'Neural link established. AI listening...',
        local: true,
      }, ...prev]);
    },
    onDisconnect: () => {
      setFeedItems(prev => [{
        id: `voice-disconnect-${Date.now()}`,
        agent: 'voice',
        label: 'VOICE',
        time: formatFeedTime(),
        source: 'phil',
        message: 'Neural link severed.',
        local: true,
      }, ...prev]);
    },
    onMessage: (message: any) => {
      if(message.source === 'user') {
        setFeedItems(prev => [{
          id: `user-${Date.now()}`,
          agent: 'user',
          label: 'USER',
          time: formatFeedTime(),
          source: 'voice',
          message: message.message,
          local: true,
        }, ...prev]);
      } else if (message.source === 'ai') {
        setFeedItems(prev => [{
          id: `brain-${Date.now()}`,
          agent: 'brain',
          label: 'BRAIN',
          time: formatFeedTime(),
          source: 'voice',
          message: message.message,
          local: true,
        }, ...prev]);
      }
    },
    onError: (error: any) => {
      setFeedItems(prev => [{
        id: `voice-error-${Date.now()}`,
        agent: 'voice',
        label: 'VOICE',
        time: formatFeedTime(),
        source: 'error',
        message: typeof error === 'string' ? error : 'Failed to connect.',
        isError: true,
        local: true,
      }, ...prev]);
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
        setFeedItems(prev => [{
          id: `mic-error-${Date.now()}`,
          agent: 'voice',
          label: 'VOICE',
          time: formatFeedTime(),
          source: 'mic',
          message: err.message || 'Connection failed.',
          isError: true,
          local: true,
        }, ...prev]);
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
          ...hiveAgents.map(agent => ({
            id: agent.nodeId,
            group: agent.group,
            name: agent.name,
            val: 12,
          })),
        ];

        const links: any[] = hiveAgents.map(agent => ({ source: agent.nodeId, target: 'core' }));

        if (data.synapses) {
          setVisibleSynapseCount(data.synapses.length);
          setSynapseCount(data.synapseCount ?? data.synapses.length);
          setLatestSynapse(data.synapses[0]?.metadata?.source || data.synapses[0]?.agent_source || 'Brain memory');
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
        setActiveAgents(hiveAgents.length);

        const apiFeed: FeedItem[] = [
          {
            id: 'system-sync',
            agent: 'system',
            label: 'SYSTEM',
            time: formatFeedTime(),
            source: 'sync',
            message: 'Hive Mind synced.',
          },
          {
            id: 'system-agents',
            agent: 'system',
            label: 'SYSTEM',
            time: formatFeedTime(),
            source: 'status',
            message: `${hiveAgents.length} hive agents online.`,
          },
        ];

        if (data.swarmEvents?.length) {
          data.swarmEvents.forEach((event: any, index: number) => {
            const agent = normalizeAgentId(event.agent_id);
            apiFeed.push({
              id: `event-${event.created_at}-${event.agent_id}-${index}`,
              agent,
              label: agent.toUpperCase(),
              time: formatFeedTime(event.created_at),
              source: event.metadata?.channel || event.event_type || event.metadata?.source || 'swarm',
              message: event.message,
              companyMove: extractCompanyMove(event.message),
              isError: String(event.event_type || '').includes('error') || event.message?.toLowerCase?.().includes('failed'),
            });
          });
        }

        if (data.commands?.length) {
          data.commands.forEach((command: any, index: number) => {
            const agent = normalizeAgentId(command.agent_id);
            apiFeed.push({
              id: `command-${command.created_at}-${command.agent_id}-${index}`,
              agent,
              label: `PHIL -> ${agent.toUpperCase()}`,
              time: formatFeedTime(command.created_at),
              source: command.status || 'command',
              message: command.command_text,
              companyMove: command.result_text,
            });
          });
        }

        if (data.drafts) {
          data.drafts.forEach((d: any, index: number) => {
            const agent = normalizeAgentId(d.agent_id);
            apiFeed.push({
              id: `draft-${d.created_at}-${d.agent_id}-${index}`,
              agent,
              label: agent.toUpperCase(),
              time: formatFeedTime(d.created_at),
              source: d.status || 'draft',
              message: `Drafted email to ${d.lead_email}.`,
            });
          });
        }

        const findSignal = (agent: string) => apiFeed.find(item => item.agent === agent && !item.isError && item.message);
        const latestIssue = apiFeed.find(item => item.isError);
        setBriefing({
          opportunity: shorten(findSignal('hustler')?.companyMove || findSignal('hustler')?.message || '', emptyBriefing.opportunity),
          lead: shorten(findSignal('closer')?.companyMove || findSignal('closer')?.message || '', emptyBriefing.lead),
          content: shorten(findSignal('scientist')?.companyMove || findSignal('scientist')?.message || findSignal('scout')?.companyMove || findSignal('scout')?.message || '', emptyBriefing.content),
          system: shorten(findSignal('engineer')?.companyMove || findSignal('engineer')?.message || '', emptyBriefing.system),
          issue: shorten(latestIssue?.message || '', emptyBriefing.issue),
        });

        setFeedItems(prev => {
          const localItems = prev.filter(item => item.local);
          return [...apiFeed, ...localItems].slice(0, 90);
        });

      } catch (err) {
        console.error("Failed to fetch brain stats", err);
      }
    };

    fetchBrainData();
    const interval = setInterval(fetchBrainData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!graphData.nodes.length || !graphRef.current) return;

    const timer = window.setTimeout(() => {
      graphRef.current?.cameraPosition(
        { x: 0, y: 40, z: 170 },
        { x: 0, y: 0, z: 0 },
        900
      );
    }, 350);

    return () => window.clearTimeout(timer);
  }, [graphData.nodes.length]);

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

  const filteredFeedItems = activeFeedAgent === 'all'
    ? feedItems
    : feedItems.filter(item => item.agent === activeFeedAgent);

  const briefingCards = [
    { label: 'OPPORTUNITY', value: briefing.opportunity, icon: Lightbulb, color: 'text-blue-300', border: 'hover:border-blue-400/50' },
    { label: 'LEAD TARGET', value: briefing.lead, icon: Target, color: 'text-red-300', border: 'hover:border-red-400/50' },
    { label: 'CONTENT TEST', value: briefing.content, icon: Activity, color: 'text-amber-300', border: 'hover:border-amber-400/50' },
    { label: 'SYSTEM MOVE', value: briefing.system, icon: Wrench, color: 'text-cyan-300', border: 'hover:border-cyan-400/50' },
    { label: 'WATCH ITEM', value: briefing.issue, icon: AlertTriangle, color: briefing.issue === emptyBriefing.issue ? 'text-emerald-300' : 'text-orange-300', border: 'hover:border-orange-400/50' },
  ];

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-[#050505] overflow-hidden flex">
      {/* 3D Force Graph Background */}
      <div className="absolute left-0 right-0 lg:right-[380px] xl:right-[420px] top-0 bottom-0 z-0">
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
      <div className="relative z-10 w-full h-full pointer-events-none p-6 pr-[400px] xl:pr-[440px]">
        
        {/* Upper-left command stack */}
        <div className="flex flex-col items-start gap-4 w-[430px] max-w-full pointer-events-auto">
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

          {/* Command Dashboard */}
          <div className="w-full bg-black/55 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-4 shadow-[0_0_40px_rgba(0,255,255,0.05)] relative overflow-hidden">
            {/* Ambient background glow in the dashboard */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none"></div>
            
            <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-3 relative z-10">
              <Radar className="w-5 h-5 text-cyan-400 animate-[spin_4s_linear_infinite]" />
              <h2 className="text-white font-mono tracking-widest font-bold">COMMAND DASHBOARD</h2>
              <Code2 className="w-4 h-4 text-cyan-300" />
            </div>
            <div className="grid grid-cols-3 gap-3 relative z-10">
               <div className="bg-white/5 rounded-xl p-3 border border-white/10 hover:border-cyan-500/50 transition-colors">
                 <p className="text-cyan-400/70 text-[10px] font-mono tracking-wider mb-1">SYSTEM STATUS</p>
                 <p className="text-white font-bold font-mono">OPTIMAL</p>
               </div>
               <div className="bg-white/5 rounded-xl p-3 border border-white/10 hover:border-purple-500/50 transition-colors">
                 <p className="text-purple-400/70 text-[10px] font-mono tracking-wider mb-1">LATEST SYNAPSE</p>
                 <p className="text-white font-bold font-mono text-sm truncate">{latestSynapse}</p>
               </div>
               <div className="bg-white/5 rounded-xl p-3 border border-white/10 hover:border-green-500/50 transition-colors">
                 <p className="text-green-400/70 text-[10px] font-mono tracking-wider mb-1">ACTIVE AGENTS</p>
                 <p className="text-white font-bold font-mono">{activeAgents}</p>
               </div>
            </div>

            <div className="relative z-10 mt-4 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="text-white font-mono text-xs tracking-widest font-bold">TODAY'S BRIEFING</h3>
                <span className="text-[10px] text-cyan-300/70 font-mono uppercase tracking-wider">{feedItems[2]?.time || 'now'}</span>
              </div>
              <div className="space-y-2">
                {briefingCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className={`flex items-start gap-2 bg-white/5 rounded-lg p-2 border border-white/10 transition-colors ${item.border}`}>
                      <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${item.color}`} />
                      <div className="min-w-0">
                        <p className="text-[9px] text-white/45 font-mono tracking-wider">{item.label}</p>
                        <p className="text-white/80 text-[11px] leading-snug line-clamp-2">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Voice Orb */}
        <div className="absolute left-10 bottom-10 flex flex-col items-center w-48 pointer-events-auto">
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
      </div>

      {/* Right Side Panel (Logs & Stats) */}
      <div className="absolute right-0 top-0 h-full w-[380px] xl:w-[420px] bg-black/60 backdrop-blur-xl border-l border-white/5 p-6 pointer-events-auto flex flex-col pb-24">
        
        {/* Synapse Count (Moved to top) */}
        <div>
           <h3 className="text-white font-mono text-sm mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-400" />
            SYNAPSE COUNT
          </h3>
          <div className="bg-white/5 rounded p-4 font-mono text-center mb-6 border border-white/10">
            <span className="text-3xl font-bold text-white">{synapseCount}</span>
            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Total Memories</p>
            {visibleSynapseCount > 0 && visibleSynapseCount < synapseCount && (
              <p className="text-[10px] text-cyan-300/60 mt-2 uppercase tracking-wider">
                Showing latest {visibleSynapseCount} nodes
              </p>
            )}
          </div>
        </div>

        {/* Swarm Activity Logs */}
        <h3 className="text-white font-mono text-sm mb-4 flex items-center gap-2 pt-6 border-t border-white/10">
          <Activity className="w-4 h-4 text-cyan-400" />
          SWARM FEED
        </h3>

        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {feedTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveFeedAgent(tab)}
              className={`h-8 rounded-md border px-2 text-[10px] font-mono uppercase tracking-wide transition-colors ${
                activeFeedAgent === tab
                  ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-200'
                  : 'border-white/10 bg-white/5 text-white/45 hover:border-white/20 hover:text-white/70'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-10">
          {filteredFeedItems.map((item) => (
            <div key={item.id} className={`bg-white/[0.045] border border-white/10 border-l-2 rounded-r-lg p-3 ${getAgentAccent(item.agent)}`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-mono tracking-wider uppercase truncate">{item.label}</p>
                  <p className="text-[10px] text-white/35 font-mono">{item.time}</p>
                </div>
                <span className={`shrink-0 rounded border px-2 py-1 text-[9px] font-mono uppercase ${
                  item.isError ? 'border-orange-400/40 text-orange-300 bg-orange-400/10' : 'border-white/10 text-white/45 bg-black/30'
                }`}>
                  {item.source}
                </span>
              </div>
              <p className="text-white/68 text-xs leading-relaxed">{item.message}</p>
              {item.companyMove && (
                <div className="mt-3 border-t border-white/10 pt-2">
                  <p className="text-[9px] text-cyan-300/70 font-mono uppercase tracking-wider mb-1">Company Move</p>
                  <p className="text-white/80 text-xs leading-relaxed">{item.companyMove}</p>
                </div>
              )}
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
