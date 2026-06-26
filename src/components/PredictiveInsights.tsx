/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PredictiveInsightsData, Issue } from '../types';
import { 
  Sparkles, ShieldAlert, TrendingUp, AlertTriangle, HelpCircle, 
  DollarSign, Activity, FileText, ToggleLeft, ToggleRight, Info, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';

interface PredictiveInsightsProps {
  issues: Issue[];
  insights: PredictiveInsightsData | null;
  loading: boolean;
  onRefreshInsights: () => void;
  showHeatmap: boolean;
  setShowHeatmap: (val: boolean) => void;
  simulationMonths: number;
  setSimulationMonths: (months: number) => void;
}

export default function PredictiveInsights({
  issues,
  insights,
  loading,
  onRefreshInsights,
  showHeatmap,
  setShowHeatmap,
  simulationMonths,
  setSimulationMonths,
}: PredictiveInsightsProps) {
  
  // Local active tab for stats
  const [activeTab, setActiveTab] = useState<'analytics' | 'risk_zones'>('analytics');

  // Chart data 1: Financial Impact (Emergency Repair cost vs Proactive AI-driven early repair cost)
  const financialData = [
    { name: 'Pothole', Reactive: 1200, Proactive: 350 },
    { name: 'Water Main', Reactive: 8500, Proactive: 1200 },
    { name: 'Lighting Out', Reactive: 450, Proactive: 150 },
    { name: 'Trash Dump', Reactive: 900, Proactive: 250 },
    { name: 'Structure', Reactive: 24000, Proactive: 3500 },
  ];

  // Chart data 2: Cumulative savings projection over months
  const savingsProjectionData = [
    { month: 'Now', Savings: 12000 },
    { month: '3 Months', Savings: 35000 },
    { month: '6 Months', Savings: 68000 },
    { month: '12 Months', Savings: 142000 },
  ];

  // Map category distribution counts
  const getCategoryCounts = () => {
    const counts = { pothole: 0, water_leak: 0, streetlight: 0, waste: 0, infrastructure: 0, other: 0 };
    issues.forEach(i => {
      if (counts[i.category] !== undefined) {
        counts[i.category]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace('_', ' ').toUpperCase(), count: value }));
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  // Parse currency strings to numeric values for charts
  const parseCurrency = (val: string | undefined): number => {
    if (!val) return 0;
    const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  // Generate dynamic chart data based on Gemini responses
  const getDynamicSavingsData = () => {
    const currentSavings = parseCurrency(insights?.estimatedCostSaving || "$24500");
    const forecastSavings = parseCurrency(insights?.forecast?.estimatedSavingsIfPreventiveActionTaken || insights?.estimatedCostSaving || "$24500");
    
    if (simulationMonths === 0 || !insights?.forecast) {
      return [
        { month: 'Now', Savings: currentSavings },
        { month: 'Projected', Savings: currentSavings }
      ];
    }
    
    return [
      { month: 'Now', Savings: currentSavings },
      { month: `+${simulationMonths} Mos`, Savings: forecastSavings }
    ];
  };

  // Determine current active health index
  const displayedHealthIndex = (simulationMonths > 0 && insights?.forecast) 
    ? insights.forecast.expectedInfrastructureIndex 
    : (insights?.infrastructureIndex ?? 85);

  return (
    <div className="space-y-6 h-full overflow-y-auto pr-1">
      
      {/* 1. Header with Title and Toggle options */}
      <div className="p-5 bg-slate-900 border border-slate-850 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-2xl">
        <div className="space-y-0.5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span>AI Predictive Urban Insights</span>
          </h2>
          <p className="text-xs text-slate-400">Gemini-driven predictive decay modeling and community impact statistics.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Heatmap Toggle */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              showHeatmap 
                ? 'bg-purple-600 border-purple-700 text-white shadow-md' 
                : 'bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-850'
            }`}
          >
            {showHeatmap ? <ToggleRight className="w-4 h-4 text-purple-400" /> : <ToggleLeft className="w-4 h-4 text-slate-500" />}
            <span>Overlay AI Heatmap</span>
          </button>

          {/* Trigger Refresh */}
          <button
            onClick={onRefreshInsights}
            disabled={loading}
            className="p-1.5 bg-slate-950 text-slate-300 rounded-xl hover:bg-slate-850 border border-slate-850 disabled:opacity-50 transition-all flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Loading state vs Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-12 text-center bg-slate-900 border border-slate-850 rounded-2xl space-y-3 shadow-2xl"
          >
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <h4 className="text-xs font-bold text-white">Generating Predictive Simulations...</h4>
            <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
              Gemini is analyzing active Hyderabad potholes, leak coordinates, and sector reports to simulate future risk scenarios.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="insights-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Top Row: 3 Predictive KPI / Simulation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Simulation Timeline Slider */}
              <div className="p-5 bg-slate-900 border border-slate-850 rounded-2xl space-y-4 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-bold text-white uppercase font-mono">Simulation Forecast</h3>
                      <p className="text-[10px] text-slate-400 font-sans">Adjust timeline to project decay rates.</p>
                    </div>
                    <span className="px-2.5 py-1 bg-indigo-950 border border-indigo-900/50 text-indigo-300 text-[9px] font-mono font-extrabold rounded-lg">
                      {simulationMonths === 0 ? 'PRESENT' : `+${simulationMonths} MONTHS`}
                    </span>
                  </div>

                  <div className="space-y-4 mt-4">
                    <input
                      type="range"
                      min="0"
                      max="12"
                      step="3"
                      value={simulationMonths}
                      onChange={(e) => setSimulationMonths(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-950 border border-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[8px] font-mono font-bold text-slate-500 px-1">
                      <span>Present</span>
                      <span>3 Months</span>
                      <span>6 Months</span>
                      <span>12 Months</span>
                    </div>
                  </div>
                </div>

                {/* Simulated projection outcomes */}
                <div className="mt-4 min-h-[85px] flex items-center">
                  {insights?.forecast ? (
                    <div className="p-3 bg-slate-950 rounded-xl text-[10px] text-slate-300 border border-slate-850 leading-relaxed w-full space-y-2">
                      <div>
                        <span className="font-bold text-indigo-400 uppercase font-mono text-[9px] block mb-1">
                          AI Forecast Summary (+{simulationMonths} Months):
                        </span>
                        <p className="font-sans leading-relaxed text-slate-200">{insights.forecast.forecastSummary}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-850/60 flex justify-between items-center text-[9px] font-mono text-slate-400">
                        <span>Model Confidence:</span>
                        <span className={`font-bold uppercase ${
                          insights.forecast.confidence === 'High' ? 'text-emerald-400' :
                          insights.forecast.confidence === 'Medium' ? 'text-amber-400' : 'text-rose-400'
                        }`}>{insights.forecast.confidence}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-950/40 rounded-xl text-[10px] text-slate-500 border border-slate-850/60 border-dashed leading-relaxed text-center w-full">
                      Drag the slider to preview the 12-month community infrastructure decay projection.
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Health Index Dial Card */}
              {insights && (
                <div className="p-5 bg-slate-900 border border-slate-850 rounded-2xl text-center space-y-4 shadow-2xl text-white flex flex-col justify-between">
                  <div>
                    <h4 className="text-[10px] uppercase font-mono font-bold text-slate-500">Infrastructure Health</h4>
                    <p className="text-xs font-semibold text-slate-300 font-sans">
                      {simulationMonths > 0 ? 'Predicted Aggregate Safety Index' : 'Aggregate Municipal Safety Index'}
                    </p>
                  </div>
                  
                  {/* Gauge Display */}
                  <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="transparent" stroke="#0f172a" strokeWidth="8" />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="42" 
                        fill="transparent" 
                        stroke={displayedHealthIndex >= 80 ? '#10b981' : displayedHealthIndex >= 50 ? '#f59e0b' : '#ef4444'} 
                        strokeWidth="8" 
                        strokeDasharray={2 * Math.PI * 42}
                        strokeDashoffset={(2 * Math.PI * 42) * (1 - displayedHealthIndex / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl font-extrabold font-mono leading-none ${getHealthColor(displayedHealthIndex)}`}>
                        {displayedHealthIndex}%
                      </span>
                      <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-slate-400 mt-1">
                        {displayedHealthIndex >= 80 ? 'EXCELLENT' : displayedHealthIndex >= 50 ? 'WARNING' : 'CRITICAL'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-normal max-w-xs mx-auto font-sans">
                    {simulationMonths > 0 
                      ? 'Simulated health index based on progressive decay scenarios if unaddressed.' 
                      : 'Aggregated across active potholes, grid drainage status, and structure reports.'}
                  </p>
                </div>
              )}

              {/* Card 3: Preventative Cost Savings Card */}
              {insights && (
                <div className="p-5 bg-indigo-950/40 border border-indigo-900/50 text-white rounded-2xl relative overflow-hidden shadow-2xl space-y-4 flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-900/20 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono text-indigo-300 block font-bold">Proactive Savings</span>
                      <p className="text-xs font-semibold text-indigo-200">Cost-benefit optimization</p>
                    </div>
                    <div className="p-2 bg-indigo-950 rounded-xl border border-indigo-900/50">
                      <DollarSign className="w-4 h-4 text-yellow-400" />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[9px] font-mono text-slate-400 uppercase">Preventive Savings</span>
                      <span className="text-3xl font-black font-mono text-yellow-400">
                        {simulationMonths > 0 && insights.forecast 
                          ? insights.forecast.estimatedSavingsIfPreventiveActionTaken 
                          : insights.estimatedCostSaving}
                      </span>
                    </div>
                    
                    {simulationMonths > 0 && insights.forecast && (
                      <div className="flex justify-between items-baseline border-t border-indigo-900/40 pt-1.5 text-[9px]">
                        <span className="font-mono text-slate-400 uppercase">Est. Repair Cost if Deferred:</span>
                        <span className="font-bold font-mono text-red-400">{insights.forecast.estimatedRepairCost}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-indigo-200 leading-normal border-t border-indigo-900/30 pt-3 font-sans">
                    Proactive early clearing and asphalt sealing reduces long-term replacement outlays by nearly 85%.
                  </p>
                </div>
              )}

            </div>

            {/* Bottom Row: Charts & Incident Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Financial Models & Risk Zones (8 Cols) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Data Tabs */}
                <div className="space-y-4">
                  <div className="flex border-b border-slate-850 gap-4">
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className={`pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                        activeTab === 'analytics' ? 'border-indigo-400 text-white' : 'border-transparent text-slate-500 hover:text-slate-400'
                      }`}
                    >
                      Proactive Financial Models
                    </button>
                    <button
                      onClick={() => setActiveTab('risk_zones')}
                      className={`pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                        activeTab === 'risk_zones' ? 'border-indigo-400 text-white' : 'border-transparent text-slate-500 hover:text-slate-400'
                      }`}
                    >
                      High-Risk Threat Zones ({insights?.highRiskZones.length || 0})
                    </button>
                  </div>

                  {/* TAB CONTENT 1: ANALYTICS */}
                  {activeTab === 'analytics' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Financial Chart 1 */}
                      <div className="p-4 bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl space-y-3">
                        <div className="space-y-0.5">
                          <h4 className="text-[10px] uppercase font-mono font-bold text-slate-500">Avg Cost: Proactive vs Reactive</h4>
                          <p className="text-xs font-semibold text-slate-300">Cost comparisons in USD ($) by incident category</p>
                        </div>
                        <div className="h-44 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={financialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
                              <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                              <Bar dataKey="Reactive" fill="#ef4444" name="Emergency Cost" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="Proactive" fill="#10b981" name="AI Early Resolution" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Proactive Savings Projection over time */}
                      <div className="p-4 bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl space-y-3">
                        <div className="space-y-0.5">
                          <h4 className="text-[10px] uppercase font-mono font-bold text-slate-500">Cumulative Savings Forecast</h4>
                          <p className="text-xs font-semibold text-slate-300">Proactive budget dollars saved over {simulationMonths > 0 ? `${simulationMonths} Months` : '12 Months'}</p>
                        </div>
                        <div className="h-44 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={getDynamicSavingsData()} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                              <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
                              <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                              <Area type="monotone" dataKey="Savings" stroke="#4f46e5" fill="rgba(79, 70, 229, 0.15)" strokeWidth={2} name="Dollars Saved ($)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Expected New Incidents Panel */}
                      {simulationMonths > 0 && insights?.forecast && (
                        <div className="p-4 bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl space-y-3 col-span-1 md:col-span-2">
                          <div className="space-y-0.5">
                            <h4 className="text-[10px] uppercase font-mono font-bold text-slate-500">Expected New Incidents (+{simulationMonths} Months)</h4>
                            <p className="text-xs font-semibold text-slate-300 font-sans">Projected occurrences of new reports based on current decay trends</p>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1 text-center">
                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex flex-col justify-between">
                              <span className="text-[10px] text-slate-400 font-sans block">Potholes</span>
                              <span className="text-2xl font-black font-mono text-rose-500 mt-1">{insights.forecast.expectedNewIssues.potholes}</span>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex flex-col justify-between">
                              <span className="text-[10px] text-slate-400 font-sans block">Water Leaks</span>
                              <span className="text-2xl font-black font-mono text-cyan-400 mt-1">{insights.forecast.expectedNewIssues.waterLeaks}</span>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex flex-col justify-between">
                              <span className="text-[10px] text-slate-400 font-sans block">Streetlights</span>
                              <span className="text-2xl font-black font-mono text-amber-400 mt-1">{insights.forecast.expectedNewIssues.streetlights}</span>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex flex-col justify-between">
                              <span className="text-[10px] text-slate-400 font-sans block">Waste Dump</span>
                              <span className="text-2xl font-black font-mono text-purple-400 mt-1">{insights.forecast.expectedNewIssues.waste}</span>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex flex-col justify-between col-span-2 sm:col-span-1">
                              <span className="text-[10px] text-slate-400 font-sans block">General Infra</span>
                              <span className="text-2xl font-black font-mono text-emerald-400 mt-1">{insights.forecast.expectedNewIssues.infrastructure}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Cascading Effects */}
                      {simulationMonths > 0 && insights?.forecast?.cascadeEffects && (
                        <div className="p-4 bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl space-y-3 col-span-1 md:col-span-2">
                          <div className="space-y-0.5">
                            <h4 className="text-[10px] uppercase font-mono font-bold text-slate-500">AI Simulated Cascading Failure Effects</h4>
                            <p className="text-xs font-semibold text-slate-300 font-sans">Compounding public safety risk events resulting from unresolved issues</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {insights.forecast.cascadeEffects.map((effect, idx) => (
                              <div key={`cascade-${idx}`} className="p-3 bg-slate-950/50 border border-slate-850/80 rounded-xl flex flex-col justify-between space-y-1.5">
                                <div className="flex items-center gap-2 text-indigo-400 font-mono text-[9px] font-bold">
                                  <TrendingUp className="w-3.5 h-3.5" />
                                  <span>CASCADING SCENARIO {idx + 1}</span>
                                </div>
                                <p className="text-[10.5px] text-slate-300 leading-normal font-sans">{effect}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommended Preventive Actions */}
                      {simulationMonths > 0 && insights?.forecast?.recommendedPreventiveActions && (
                        <div className="p-4 bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl space-y-3 col-span-1 md:col-span-2">
                          <div className="space-y-0.5">
                            <h4 className="text-[10px] uppercase font-mono font-bold text-indigo-400">Recommended Preventive Engineering Actions</h4>
                            <p className="text-xs font-semibold text-slate-300 font-sans">Proactive interventions designed to avert projected infrastructure decay</p>
                          </div>
                          <ul className="space-y-2 pt-1">
                            {insights.forecast.recommendedPreventiveActions.map((action, idx) => (
                              <li key={`action-${idx}`} className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl flex items-start gap-3">
                                <span className="w-5 h-5 bg-indigo-950 text-indigo-300 rounded-lg flex items-center justify-center font-mono text-xs font-extrabold border border-indigo-900/50 flex-shrink-0">
                                  {idx + 1}
                                </span>
                                <p className="text-[10.5px] text-slate-300 leading-relaxed font-sans">{action}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    </div>
                  )}

                  {/* TAB CONTENT 2: HIGH RISK SECTORS */}
                  {activeTab === 'risk_zones' && insights && (
                    <div className="grid grid-cols-1 gap-3">
                      
                      {/* Critical Zones Display */}
                      {simulationMonths > 0 && insights.forecast?.criticalZones && (
                        <div className="space-y-3 mb-2">
                          <h5 className="text-[10px] font-mono text-indigo-400 uppercase font-bold tracking-wider px-1">Projected Critical Zones (+{simulationMonths} Months)</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {insights.forecast.criticalZones.map((zone, idx) => (
                              <div key={`critical-${idx}`} className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-2xl flex items-start gap-2.5 shadow-md">
                                <ShieldAlert className="w-4.5 h-4.5 text-rose-400 mt-0.5 flex-shrink-0" />
                                <div className="space-y-0.5">
                                  <span className="text-xs font-bold text-white block">Projected Threat Zone {idx + 1}</span>
                                  <p className="text-[10.5px] text-slate-300 leading-relaxed font-sans">{zone}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <h5 className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider px-1 mt-4">Current Vulnerable Neighborhood Sectors</h5>
                      {insights.highRiskZones.map((zone, idx) => (
                        <div key={`zone-${idx}`} className="p-4 bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-4 items-start">
                          <div className={`p-2.5 rounded-xl border flex-shrink-0 flex items-center justify-center font-bold font-mono text-xs ${
                            zone.riskLevel === 'High' ? 'bg-red-950/40 border-red-900/40 text-red-400' : 'bg-amber-950/40 border-amber-900/40 text-amber-400'
                          }`}>
                            {zone.riskLevel.toUpperCase()} RISK
                          </div>
                          <div className="space-y-1 flex-1">
                            <h4 className="text-xs font-bold text-white font-sans">{zone.zone}</h4>
                            <p className="text-[10.5px] text-slate-300 leading-relaxed font-sans">{zone.reason}</p>
                            <div className="p-2 bg-slate-950 rounded-lg text-[10px] text-indigo-200 font-sans border border-slate-850 flex items-start gap-1.5 leading-relaxed">
                              <Info className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                              <span><strong>AI Intervention Tip:</strong> {zone.recommendation}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Category distribution overview (4 Cols) */}
              <div className="lg:col-span-4">
                <div className="p-4 bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl space-y-3 h-full">
                  <div className="space-y-0.5">
                    <h4 className="text-[10px] uppercase font-mono font-bold text-slate-500">Current Incident Spread</h4>
                    <p className="text-xs font-semibold text-slate-300 font-sans">Count of current unresolved complaints</p>
                  </div>
                  <div className="space-y-3.5">
                    {getCategoryCounts().map((row, idx) => (
                      <div key={`bar-${idx}`} className="space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-slate-400 font-bold">
                          <span>{row.name}</span>
                          <span>{row.count} reports</span>
                        </div>
                        <div className="w-full bg-slate-950 border border-slate-850 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full rounded-full" 
                            style={{ width: `${Math.min(100, (row.count / Math.max(1, issues.length)) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Disclaimer Section */}
            <div className="p-4 bg-slate-950/30 border border-slate-850 border-dashed rounded-2xl flex items-start gap-3">
              <Info className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-slate-400 italic leading-normal font-sans">
                These forecasts are AI-generated scenario simulations based on current incident trends and should be used for planning purposes rather than exact predictions.
              </p>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
