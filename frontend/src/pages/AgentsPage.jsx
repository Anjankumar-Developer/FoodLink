import React, { useState, useEffect } from 'react';
import { Bot, CheckCircle2, RotateCw, Terminal, Activity } from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';

const AGENT_DEFINITIONS = [
  { key: 'FoodAgent', name: 'Food Agent', workflow: 'Food analyzed' },
  { key: 'RecipientAgent', name: 'Recipient Agent', workflow: 'Recipients evaluated' },
  { key: 'RouteAgent', name: 'Route Agent', workflow: 'Routes calculated' },
  { key: 'CoordinatorAgent', name: 'Coordinator Agent', workflow: 'Match coordinated' },
];

export default function AgentsPage() {
  const { addToast } = useToast();
  const [agents, setAgents] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAgentLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getAgentLogs({ limit: 100 });
      const logs = [...(response.data || [])].sort(
        (first, second) => new Date(second.created_at || 0) - new Date(first.created_at || 0)
      );
      setAgents(AGENT_DEFINITIONS.map((definition) => {
        const agentLogs = logs.filter((log) => log.agent_name === definition.key);
        const latest = agentLogs[0];
        return {
          id: definition.key,
          name: definition.name,
          role: definition.workflow,
          status: latest?.status || 'Awaiting activity',
          currentAction: latest?.action || definition.workflow,
          completedActions: [latest?.output_summary || 'No execution recorded yet'],
          reasoningPreview: latest?.input_summary || 'No reasoning details returned.',
          lastUpdated: latest?.created_at || 'No activity',
          executionTime: latest?.execution_time_ms,
          result: latest?.output_summary || 'No result recorded yet',
          tasksCompletedToday: agentLogs.length,
        };
      }));
    } catch (requestError) {
      setError('Backend unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAgentLogs(); }, []);

  const handleRunNegotiationCycle = async () => {
    setIsSimulating(true);
    addToast({
      title: 'Consensus Cycle Initiated',
      message: 'Master Coordinator Agent syncing Food, Shelter, and Route telemetry...',
      type: 'info',
    });

    try {
      await api.triggerConsensusCycle();
      await loadAgentLogs();
      setIsSimulating(false);
      addToast({
        title: 'Multi-Agent Consensus Reached',
        message: 'All constraints verified. Dispatches cleared for execution.',
        type: 'success',
      });
    } catch (requestError) {
      setIsSimulating(false);
      addToast({ title: 'Backend unavailable', message: requestError.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Autonomous Multi-Agent Monitor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time state, negotiation reasoning, and chain-of-custody verification logs for autonomous agents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleRunNegotiationCycle}
            disabled={isSimulating}
            variant="primary"
            size="sm"
            icon={RotateCw}
          >
            {isSimulating ? 'Negotiating...' : 'Trigger Consensus Cycle'}
          </Button>
        </div>
      </div>

      {error && <Card bodyClassName="p-4"><div className="flex items-center justify-between text-sm text-red-700"><span>{error}</span><Button onClick={loadAgentLogs} variant="secondary" size="sm">Retry</Button></div></Card>}
      {loading && <Card bodyClassName="p-8 text-center text-sm text-slate-500">Loading agent activity...</Card>}

      {/* Agents Operational Grid */}
      {!loading && !error && agents.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 space-y-5"
          >
            {/* Header: Agent Identity & Status */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    {agent.name}
                  </h3>
                  <p className="text-xs text-slate-500">{agent.role}</p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{agent.status}</span>
              </span>
            </div>

            {/* Current Action In Progress */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  <span>Current Task Execution</span>
                </span>
                <span className="font-mono text-slate-400">{agent.lastUpdated}</span>
              </div>
              <p className="text-xs font-medium text-slate-800 leading-relaxed">
                {agent.currentAction}
              </p>
              <p className="text-[11px] text-slate-500">Execution time: {agent.executionTime ?? 'n/a'} ms</p>
            </div>

            {/* Reasoning Preview Box */}
            <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200/70 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                <Terminal className="w-3.5 h-3.5 text-emerald-700" />
                <span>Explainable Agent Reasoning Preview</span>
              </div>
              <p className="text-xs text-emerald-950 font-mono leading-relaxed bg-white/70 p-2.5 rounded border border-emerald-100">
                "{agent.reasoningPreview}"
              </p>
              <p className="text-xs text-emerald-900"><strong>Result:</strong> {agent.result}</p>
            </div>

            {/* Completed Actions List */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Recent Autonomous Executions
              </h4>
              <ul className="space-y-1.5">
                {agent.completedActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Agent Telemetry Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
              <span>Tasks Today: <strong className="text-slate-800">{agent.tasksCompletedToday}</strong></span>
              <span>Confidence: <strong className="text-emerald-700">{agent.confidenceScore}%</strong></span>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
