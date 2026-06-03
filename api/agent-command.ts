import type { VercelRequest, VercelResponse } from './_types.js';
import OpenAI from 'openai';
import { requireApiSecret } from './_auth.js';
import { getBrainClient, logSwarmEvent, rememberInBrain, searchBrain } from './_brain.js';

const agentRoles: Record<string, string> = {
  scout: 'Scout gathers fresh market data and suggests what to scrape next.',
  scientist: 'Scientist analyzes trends, content patterns, and marketing predictions.',
  closer: 'Closer turns ideas and leads into sales/outreach copy.',
  hustler: 'Hustler finds growth plays, AI tools, API opportunities, partnerships, and competitive angles.',
  engineer: 'Engineer handles coding architecture, debugging, deployment risks, and system improvements.',
  operator: 'Operator coordinates the swarm and gives clear status/next-step briefings.',
};

function normalizeAgent(agent?: string) {
  const key = (agent || 'operator').toLowerCase().replace(/[^a-z]/g, '');
  return agentRoles[key] ? key : 'operator';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  if (!requireApiSecret(req, ['BRAIN_API_SECRET', 'ELEVENLABS_WEBHOOK_SECRET'])) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = req.body || {};
  const command = String(body.command || body.task || body.query || '').trim();
  const agent = normalizeAgent(String(body.agent || body.target_agent || 'operator'));
  const mode = String(body.mode || 'respond').toLowerCase();

  if (!command) {
    return res.status(400).json({ error: 'Missing command.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
  }

  const supabase = getBrainClient();
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const memories = await searchBrain(command, 8);
    const memoryContext = memories.length
      ? memories.map((m: any) => `[${m.agent_source || m.metadata?.agent || 'brain'}] ${m.content}`).join('\n\n')
      : 'No relevant memories found.';

    let commandId: string | null = null;
    if (supabase) {
      const { data } = await supabase.from('agent_commands').insert([{
        agent_id: agent,
        command_text: command,
        status: mode === 'queue' ? 'pending' : 'processing',
        metadata: {
          source: 'phil_voice',
          mode,
          requested_at: new Date().toISOString(),
        },
      }]).select('id').single();
      commandId = data?.id || null;
    }

    const prompt = `You are Phil, the voice interface for the Resin Academics Hive Mind.

The user wants you to command ${agent.toUpperCase()}.

Agent role:
${agentRoles[agent]}

Hive Mind context:
${memoryContext}

User command:
"${command}"

Respond as Phil in a clear, natural voice. If this is something ${agent.toUpperCase()} should work on, say what you are assigning and the expected next output. Keep it under 120 words. Always spell it "epoxy"; never write "Epoxee".`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 220,
    });

    const result = response.choices[0].message.content || `I assigned that to ${agent}.`;

    if (supabase && commandId) {
      await supabase.from('agent_commands').update({
        status: 'completed',
        result_text: result,
        executed_at: new Date().toISOString(),
      }).eq('id', commandId);
    }

    await logSwarmEvent({
      agentId: agent,
      eventType: 'phil_command',
      message: `Phil assigned ${agent}: ${command}`,
      metadata: { source: 'phil_voice', command_id: commandId, result },
    });

    await rememberInBrain({
      agentSource: `phil-command-${agent}`,
      content: `[PHIL COMMAND TO ${agent.toUpperCase()}]\nCommand: ${command}\nResult: ${result}`,
      metadata: { source: 'phil_voice', agent, command_id: commandId },
    });

    return res.status(200).json({
      success: true,
      agent,
      commandId,
      result,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
