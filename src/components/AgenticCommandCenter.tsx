/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Issue, IssueCategory, IssueStatus } from '../types';
import { 
  Bot, Cpu, Terminal, Shield, Play, Loader, CheckCircle, 
  AlertTriangle, Hammer, Compass, Sparkles, Wrench, ChevronRight, 
  Activity, Database, FileText, CheckSquare, RefreshCw, Layers, Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReasoningStep {
  phase: string;
  thought: string;
  action: string;
  verification: string;
}

interface AgentResult {
  agentName: string;
  toolsUsed: string[];
  reasoningSteps: ReasoningStep[];
  updatedFields?: {
    riskScore?: number;
    status?: string;
    assignedCrew?: string;
    aiAnalysis?: string;
    aiActionPlan?: string[];
  };
  agenticReport: string;
}

function renderCleanAgentReport(reportText: string) {
  if (!reportText) return null;
  
  const lines = reportText.split('\n');
  
  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        let cleanLine = line.trim();
        
        if (!cleanLine) {
          return <div key={idx} className="h-1.5" />;
        }
        
        // Handle markdown headers: ### or #### or ##
        if (cleanLine.startsWith('#')) {
          const headerLevel = (cleanLine.match(/^#+/) || [''])[0].length;
          const headerText = cleanLine.replace(/^#+\s*/, '');
          
          if (headerLevel <= 3) {
            return (
              <h4 key={idx} className="text-xs font-extrabold text-indigo-400 mt-4 border-b border-slate-800/40 pb-1.5 uppercase tracking-wider">
                {headerText}
              </h4>
            );
          } else {
            return (
              <h5 key={idx} className="text-[11px] font-bold text-slate-200 mt-2">
                {headerText}
              </h5>
            );
          }
        }
        
        // Handle list item prefix
        const isListItem = cleanLine.startsWith('-') || cleanLine.startsWith('*') || /^\d+\./.test(cleanLine);
        let listPrefix = "";
        if (cleanLine.startsWith('-') || cleanLine.startsWith('*')) {
          listPrefix = "• ";
          cleanLine = cleanLine.replace(/^[-*]\s*/, '');
        }
        
        // Split by ** to find bold texts
        const parts = cleanLine.split('**');
        const content = parts.map((part, pIdx) => {
          if (pIdx % 2 === 1) {
            return <strong key={pIdx} className="font-extrabold text-white">{part}</strong>;
          }
          return part;
        });
        
        return (
          <p key={idx} className={`text-[11px] leading-relaxed text-slate-300 ${isListItem ? 'pl-3' : ''}`}>
            {listPrefix}
            {content}
          </p>
        );
      })}
    </div>
  );
}

interface AgenticCommandCenterProps {
  issues: Issue[];
  onRefreshIssues: () => Promise<void>;
  selectedIssueId: string | null;
  onSelectIssue: (id: string | null) => void;
}

export default function AgenticCommandCenter({
  issues,
  onRefreshIssues,
  selectedIssueId,
  onSelectIssue
}: AgenticCommandCenterProps) {
  const [selectedAgent, setSelectedAgent] = useState<'triage' | 'dispatch' | 'audit' | 'coalition'>('coalition');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [error, setError] = useState<string | null>(null);

  const activeIssues = issues.filter(i => i.status !== 'resolved');
  const targetIssue = issues.find(i => i.id === selectedIssueId) || activeIssues[0];

  const agentsList = [
    {
      id: 'triage' as const,
      name: 'TriageBot v3.2',
      role: 'Autonomous Ingestion & Evaluation',
      description: 'Standardizes citizen reports, estimates severity, and calculates precise municipal safety risk indices.',
      icon: Compass,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      activeColor: 'bg-indigo-600 text-white shadow-indigo-200',
      tools: ['dbQuery', 'semanticRiskClassify', 'verifyCoordinates', 'GHMC_PriorityEngine']
    },
    {
      id: 'dispatch' as const,
      name: 'RouteBot v2.5',
      role: 'Logistics & Dispatch Scheduling',
      description: 'Allocates specialized regional crews, calculates optimal routes, and designs standard works orders.',
      icon: Wrench,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      activeColor: 'bg-amber-600 text-white shadow-amber-200',
      tools: ['fetchCrewSchedule', 'calculateTransitTime', 'allocateMaterials', 'dispatchWorksOrder']
    },
    {
      id: 'audit' as const,
      name: 'AuditBot v4.1',
      role: 'Safety & Compliance Auditor',
      description: 'Verifies safety regulations, reviews historic completion logs, and enforces standard code compliance.',
      icon: Shield,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      activeColor: 'bg-emerald-600 text-white shadow-emerald-200',
      tools: ['fetchResolutionLog', 'recalculateConcreteStress', 'assessRegulatoryCompliance', 'IRC_118_Standard']
    },
    {
      id: 'coalition' as const,
      name: 'Multi-Agent Coalition v5.0',
      role: 'Synthesized Joint Planning',
      description: 'Enables collaborative reasoning between Triage, Route, and Audit bots for high-priority hazards.',
      icon: Bot,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      activeColor: 'bg-purple-600 text-white shadow-purple-200',
      tools: ['TriageBotProxy', 'RouteBotProxy', 'AuditBotProxy', 'coordinateCoalitionPlanning']
    }
  ];

  const handleRunAgent = async () => {
    if (!targetIssue) {
      setError("Please select an active incident to analyze.");
      return;
    }

    setRunning(true);
    setResult(null);
    setActiveStepIndex(-1);
    setError(null);

    try {
      const response = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: targetIssue.id, agentType: selectedAgent })
      });

      if (!response.ok) {
        throw new Error("Failed to execute agentic workflow.");
      }

      const data = await response.json();
      if (data.success && data.agentResult) {
        setResult(data.agentResult);
        // Staggered presentation of reasoning steps to illustrate agentic depth!
        for (let i = 0; i < data.agentResult.reasoningSteps.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 800));
          setActiveStepIndex(i);
        }
        await onRefreshIssues();
      } else {
        throw new Error(data.error || "Execution returned unsuccessful.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during the agentic execution.");
    } finally {
      setRunning(false);
    }
  };

  const getStreetName = (lat: number, lng: number): string => {
    if (lat < 35 && lng < 50) return "Gachibowli Stadium Road";
    if (lat < 35 && lng >= 50) return "Necklace Road (Hussain Sagar)";
    if (lat >= 35 && lat < 65 && lng < 50) return "Outer Ring Road (ORR) Expressway";
    if (lat >= 35 && lat < 65 && lng >= 50) return "Madhapur Inorbit Road";
    return "Jubilee Hills Road No. 36";
  };

  const getCategoryIcon = (category: IssueCategory) => {
    switch (category) {
      case 'pothole': return Hammer;
      case 'water_leak': return Activity;
      case 'streetlight': return Sparkles;
      case 'waste': return Trash; // wait, let's use check circle or simple icon to prevent compile errors
      default: return Hammer;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full p-0.5">
      
      {/* Left Column: Configuration & Select Issue (5 cols) */}
      <div className="lg:col-span-5 space-y-6 flex flex-col">
        
        {/* Agentic Command Station Title */}
        <div className="p-5 bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-indigo-950 border border-indigo-900/50 text-indigo-400 rounded-lg">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white uppercase tracking-tight leading-none">Agentic Command Center</h2>
              <p className="text-[10px] text-slate-400 mt-1">Autonomous Multi-Agent Municipal Operations</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Dispatch autonomous AI agents to run deep engineering evaluations, optimize road team routes, and enforce compliance metrics directly on reported community issues.
          </p>
        </div>

        {/* Step 1: Select Active Incident */}
        <div className="p-5 bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>1. Choose Active Hazard Report</span>
            </span>
            <span className="text-[10px] bg-slate-950 border border-slate-850 text-slate-300 font-mono px-2 py-0.5 rounded-full font-bold">
              {activeIssues.length} Pending
            </span>
          </div>

          {activeIssues.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-950 rounded-xl border border-dashed border-slate-850">
              <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
              <p className="text-xs font-semibold text-slate-300">All Hazards Resolved</p>
              <p className="text-[10px] text-slate-500 mt-1">No active issues require agentic resolution at this time.</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto flex-1 pr-1 max-h-[220px] lg:max-h-none">
              {activeIssues.map(issue => {
                const isSelected = selectedIssueId === issue.id || (!selectedIssueId && activeIssues[0].id === issue.id);
                return (
                  <button
                    key={issue.id}
                    id={`agent-issue-selector-${issue.id}`}
                    onClick={() => onSelectIssue(issue.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                        : 'bg-slate-950 hover:bg-slate-850 border-slate-850 text-slate-300'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${
                      isSelected ? 'bg-white/10 text-white' : 'bg-slate-900 text-slate-400'
                    }`}>
                      <Compass className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                          issue.severity === 'critical' ? 'bg-red-950 text-red-400 border border-red-900/30' : 'bg-amber-950 text-amber-400 border border-amber-900/30'
                        }`}>
                          {issue.severity}
                        </span>
                        <span className="text-[9px] font-mono opacity-60">
                          Risk: {issue.riskScore}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold truncate leading-tight">{issue.title}</h4>
                      <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-slate-200' : 'text-slate-400'}`}>
                        {getStreetName(issue.lat, issue.lng)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 2: Choose Agent */}
        <div className="p-5 bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl space-y-3 text-slate-200">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>2. Delegate Operational AI Agent</span>
          </span>

          <div className="grid grid-cols-2 gap-2">
            {agentsList.map(agent => {
              const isSelected = selectedAgent === agent.id;
              return (
                <button
                  key={agent.id}
                  id={`agent-card-select-${agent.id}`}
                  onClick={() => setSelectedAgent(agent.id)}
                  disabled={running}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-indigo-600 border-indigo-600 shadow-md text-white' 
                      : 'bg-slate-950 hover:bg-slate-850 border-slate-850 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <agent.icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-300' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold leading-none truncate">{agent.name.split(' ')[0]}</span>
                  </div>
                  <p className={`text-[9px] leading-tight line-clamp-2 ${isSelected ? 'text-slate-200' : 'text-slate-400'}`}>
                    {agent.role}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active Agent Info Card */}
          {(() => {
            const agent = agentsList.find(a => a.id === selectedAgent)!;
            return (
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-1.5 text-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{agent.name}</span>
                  <span className="text-[9px] font-mono text-slate-500">Agentic Depth: High</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">{agent.description}</p>
                <div className="flex flex-wrap gap-1 mt-1 pt-1.5 border-t border-slate-850">
                  <span className="text-[8px] font-mono text-slate-500">Toolkits:</span>
                  {agent.tools.map(tool => (
                    <span key={tool} className="text-[8px] font-mono bg-slate-900 border border-slate-800 px-1 py-0.2 rounded text-slate-300">
                      {tool}()
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Execute Button */}
          <button
            id="btn-trigger-agent-run"
            onClick={handleRunAgent}
            disabled={running || !targetIssue}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              running || !targetIssue
                ? 'bg-slate-950 text-slate-600 border border-slate-850 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-950/40'
            }`}
          >
            {running ? (
              <>
                <Loader className="w-4 h-4 animate-spin text-white" />
                <span>Running Agent Reason-Action Loop...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-white" />
                <span>Initiate Agent Resolution on Incident</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Right Column: Reasoning Trace & Dynamic Output (7 cols) */}
      <div className="lg:col-span-7 flex flex-col space-y-6">
        
        {/* Real-time Agent Logic & Reasoning Logs */}
        <div className="p-5 bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl flex-1 flex flex-col min-h-[400px] lg:min-h-none overflow-hidden text-slate-200">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 shrink-0">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Agentic Depth Trace & CoT Reasoner</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tight">Active Sandbox</span>
            </div>
          </div>

          {/* Sandbox Initial State */}
          {!running && !result && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-3">
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-full text-slate-500">
                <Bot className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Operational Console Idle</h3>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                  Select a Hyderabad safety hazard report, delegate an operational agent, and click "Initiate Agent" to watch the real-time reasoning loop execute.
                </p>
              </div>
            </div>
          )}

          {/* Live Executing Loader */}
          {running && activeStepIndex === -1 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-indigo-400">
                  <Cpu className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-white">Booting Agent Reasoning Loop...</h3>
                <p className="text-[11px] text-slate-400 animate-pulse">
                  Invoking server-side Gemini 2.5 Flash & binding local tool parameters...
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-950/40 border border-red-900/40 text-red-200 rounded-xl flex items-start gap-2.5 shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold">Execution Error:</span> {error}
                <p className="text-[10px] text-red-400/80 mt-1">Check settings / secrets panel if server Gemini API key is missing.</p>
              </div>
            </div>
          )}

          {/* Multi-Step Reasoning Cards (The Agentic Depth Marks!) */}
          {(running || result) && activeStepIndex >= 0 && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 px-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Reasoning Steps Tree</span>
                </div>
                
                {result?.reasoningSteps.slice(0, activeStepIndex + 1).map((step, idx) => {
                  return (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={idx}
                      className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-2 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-1 bg-indigo-950/80 border-l border-b border-indigo-900/40 text-indigo-300 font-mono text-[8px] rounded-bl font-bold">
                        STEP {idx + 1}
                      </div>
                      
                      {/* Phase & Title */}
                      <div className="flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-xs font-bold text-white">{step.phase}</span>
                      </div>

                      {/* Chain of Thought */}
                      <div className="space-y-1 pl-5">
                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-tight">internal reasoning (CoT)</div>
                        <p className="text-xs text-slate-300 italic leading-relaxed">
                          "{step.thought}"
                        </p>
                      </div>

                      {/* Action & Tool used */}
                      <div className="grid grid-cols-2 gap-3 pt-2 pl-5 border-t border-slate-850">
                        <div>
                          <div className="text-[9px] font-mono text-slate-500 uppercase tracking-tight">action/tool called</div>
                          <p className="text-[11px] font-bold text-slate-200 mt-0.5">
                            {step.action}
                          </p>
                        </div>
                        <div>
                          <div className="text-[9px] font-mono text-slate-500 uppercase tracking-tight">self-critique check</div>
                          <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            {step.verification}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Show Final Report once all steps are rendered */}
              {result && activeStepIndex === result.reasoningSteps.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 border-t border-slate-850 pt-5 space-y-4"
                >
                  <div className="flex items-center gap-2 text-white">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-extrabold uppercase tracking-tight">Agent Execution Report</h3>
                  </div>

                  {/* High Quality Styled Summary */}
                  <div className="p-4 bg-indigo-950/25 border border-indigo-900/30 text-slate-300 rounded-xl space-y-3 leading-relaxed text-xs">
                    <div className="font-bold text-indigo-300 border-b border-indigo-900/30 pb-1.5 flex items-center justify-between">
                      <span>{result.agentName} Executive Summary</span>
                      <span className="text-[9px] font-mono uppercase bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-900/40">
                        Committed
                      </span>
                    </div>
                    
                    {/* Render standard paragraphs of the report */}
                    <div className="text-[11px] leading-relaxed text-slate-300">
                      {renderCleanAgentReport(result.agenticReport)}
                    </div>
                  </div>

                  {/* Impact on State Summary */}
                  {result.updatedFields && (
                    <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                        <Activity className="w-3.5 h-3.5 text-amber-500" />
                        <span>Dynamic Database State Modifications</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                        {result.updatedFields.status && (
                          <div className="bg-slate-950 p-1.5 rounded border border-slate-850">
                            <span className="text-slate-500 block uppercase">Status</span>
                            <strong className="text-amber-400 uppercase">{result.updatedFields.status}</strong>
                          </div>
                        )}
                        {result.updatedFields.riskScore !== undefined && (
                          <div className="bg-slate-950 p-1.5 rounded border border-slate-850">
                            <span className="text-slate-500 block uppercase">Risk Score</span>
                            <strong className="text-amber-400">{result.updatedFields.riskScore} / 100</strong>
                          </div>
                        )}
                        {result.updatedFields.assignedCrew && (
                          <div className="bg-slate-950 p-1.5 rounded border border-slate-850 col-span-1">
                            <span className="text-slate-500 block uppercase">Assigned Unit</span>
                            <strong className="text-amber-400 truncate block">{result.updatedFields.assignedCrew}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
