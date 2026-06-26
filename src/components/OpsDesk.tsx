/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Issue, IssueCategory, IssueStatus } from '../types';
import { 
  Wrench, Users, ShieldAlert, CheckCircle, Clock, Truck, 
  MapPin, ClipboardList, Sparkles, Send, Info, ChevronRight, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OpsDeskProps {
  issues: Issue[];
  selectedIssueId: string | null;
  onSelectIssue: (id: string | null) => void;
  onUpdateStatus: (id: string, status: IssueStatus, note: string, assignedCrew?: string) => void;
}

const DISPATCH_CREWS = [
  { id: 'squad-a', name: 'Squad A - Pavement Pros', specialties: ['pothole', 'infrastructure'] },
  { id: 'squad-b', name: 'Squad B - Aqua Guardians', specialties: ['water_leak'] },
  { id: 'squad-c', name: 'Squad C - Sparks & Power', specialties: ['streetlight'] },
  { id: 'squad-d', name: 'Squad D - Sanitation Squad', specialties: ['waste'] }
];

export default function OpsDesk({
  issues,
  selectedIssueId,
  onSelectIssue,
  onUpdateStatus
}: OpsDeskProps) {
  const activeIssue = issues.find(i => i.id === selectedIssueId);

  // Checked steps state for AI action plans (persists during active view selection)
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [dispatcherNote, setDispatcherNote] = useState('');
  const [selectedCrew, setSelectedCrew] = useState('');

  // Clear or load checklist when selecting a new issue
  useEffect(() => {
    if (activeIssue) {
      setCheckedSteps({});
      setDispatcherNote('');
      setSelectedCrew(activeIssue.assignedCrew || '');
    }
  }, [selectedIssueId]);

  const handleStepCheck = (stepIndex: number) => {
    if (!activeIssue) return;
    const key = `${activeIssue.id}-${stepIndex}`;
    setCheckedSteps(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // KPI Calculations
  const totalActive = issues.filter(i => i.status !== 'resolved').length;
  const totalCritical = issues.filter(i => i.severity === 'critical' && i.status !== 'resolved').length;
  const totalScheduled = issues.filter(i => i.status === 'scheduled' || i.status === 'in_progress').length;

  const getStreetName = (lat: number, lng: number): string => {
    if (lat < 35 && lng < 50) return "Gachibowli Stadium Road";
    if (lat < 35 && lng >= 50) return "Necklace Road (Hussain Sagar)";
    if (lat >= 35 && lat < 65 && lng < 50) return "Outer Ring Road (ORR) Expressway";
    if (lat >= 35 && lat < 65 && lng >= 50) return "Madhapur Inorbit Road";
    return "Jubilee Hills Road No. 36";
  };

  const getCategoryTheme = (category: IssueCategory) => {
    const themes: Record<IssueCategory, { bg: string; text: string; label: string }> = {
      pothole: { bg: 'bg-amber-950/40 border border-amber-900/30 text-amber-400', text: 'text-amber-400', label: 'Road Repair' },
      water_leak: { bg: 'bg-blue-950/40 border border-blue-900/30 text-blue-400', text: 'text-blue-400', label: 'Water Utility' },
      streetlight: { bg: 'bg-yellow-950/40 border border-yellow-900/30 text-yellow-400', text: 'text-yellow-400', label: 'Electrical Grid' },
      waste: { bg: 'bg-orange-950/40 border border-orange-900/30 text-orange-400', text: 'text-orange-400', label: 'Sanitation' },
      infrastructure: { bg: 'bg-purple-950/40 border border-purple-900/30 text-purple-400', text: 'text-purple-400', label: 'Structural' },
      other: { bg: 'bg-slate-950 border border-slate-800 text-slate-300', text: 'text-slate-300', label: 'General Works' }
    };
    return themes[category] || themes.other;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-stretch">
      {/* LEFT PANEL: Logistics Backlog & Active Issues (5 Cols) */}
      <div className="lg:col-span-5 flex flex-col space-y-4">
        
        {/* KPI Panel */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl shadow-2xl text-center">
            <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold">Active Backlog</span>
            <span className="text-xl font-extrabold font-mono text-white">{totalActive}</span>
          </div>
          <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl shadow-2xl text-center">
            <span className="text-[10px] font-mono text-red-400 block uppercase font-bold">Critical Danger</span>
            <span className="text-xl font-extrabold font-mono text-red-400">{totalCritical}</span>
          </div>
          <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl shadow-2xl text-center">
            <span className="text-[10px] font-mono text-blue-400 block uppercase font-bold">Dispatched</span>
            <span className="text-xl font-extrabold font-mono text-blue-400">{totalScheduled}</span>
          </div>
        </div>

        {/* Backlog List */}
        <div className="p-4 bg-slate-900 border border-slate-850 rounded-2xl flex-1 flex flex-col min-h-[400px] shadow-2xl">
          <div className="border-b border-slate-800 pb-3 mb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <ClipboardList className="w-4.5 h-4.5 text-indigo-400" />
              <span>Operations Dispatch Desk</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Select a citizen complaint to manage scheduling and track logistics.</p>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[440px] pr-1">
            {issues.filter(i => i.status !== 'resolved').length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                <h4 className="text-xs font-bold text-white">Perfect Resolution Rate!</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">All community issues have been verified and resolved by field crews.</p>
              </div>
            ) : (
              issues
                .filter(i => i.status !== 'resolved')
                .map((issue) => {
                  const isSelected = selectedIssueId === issue.id;
                  
                  return (
                    <div
                      key={issue.id}
                      onClick={() => onSelectIssue(issue.id)}
                      className={`p-3 border rounded-xl cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-950/40 text-white' 
                          : 'border-slate-850 hover:border-slate-800 bg-slate-950 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{issue.title}</h4>
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                            <span>{getStreetName(issue.lat, issue.lng)}</span>
                            <span>•</span>
                            <span className="uppercase text-slate-400 font-bold">{issue.category.replace('_', ' ')}</span>
                          </div>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold ${
                          issue.severity === 'critical' 
                            ? 'bg-red-950 text-red-400 border border-red-900/40' 
                            : 'bg-slate-900 text-slate-300 border border-slate-800'
                        }`}>
                          {issue.severity.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-slate-400 pt-2 mt-2 border-t border-slate-850 font-mono">
                        <span>Risk score: <strong className="text-white">{issue.riskScore}</strong></span>
                        <span className="uppercase text-indigo-400 font-bold">Status: {issue.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Tactical Operations & AI Dispatch Action Plan (7 Cols) */}
      <div className="lg:col-span-7">
        <AnimatePresence mode="wait">
          {activeIssue ? (
            <motion.div
              key="tactical-board"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="p-5 bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl space-y-4 h-full overflow-y-auto text-slate-200"
            >
              {/* Header Info */}
              <div className="border-b border-slate-800 pb-3 flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase ${getCategoryTheme(activeIssue.category).bg}`}>
                    {getCategoryTheme(activeIssue.category).label}
                  </span>
                  <h3 className="font-bold text-white text-sm sm:text-base leading-snug mt-1.5">{activeIssue.title}</h3>
                  <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-indigo-400" />
                    <span>Lat: {activeIssue.lat.toFixed(1)}%, Lng: {activeIssue.lng.toFixed(1)}% | {getStreetName(activeIssue.lat, activeIssue.lng)}</span>
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border ${
                  activeIssue.status === 'in_progress' ? 'bg-blue-950 border-blue-900/40 text-blue-400 animate-pulse' : 'bg-slate-950 border-slate-850 text-slate-300'
                }`}>
                  {activeIssue.status.replace('_', ' ')}
                </span>
              </div>

              {/* Citizen Details Summary */}
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-1">
                <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">Citizen Report Details</span>
                <p className="text-xs text-slate-300 leading-relaxed italic">"{activeIssue.description}"</p>
              </div>

              {/* AI Dispatch Action Plan (Gemini check-list!) */}
              {activeIssue.aiActionPlan && (
                <div className="p-4 bg-purple-950/20 border border-purple-900/40 rounded-xl space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                      <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                      <span>AI Technical Resolution Guide Checklist</span>
                    </div>
                    <span className="text-[9px] font-mono text-purple-400">Interact to log steps completed</span>
                  </div>

                  <div className="space-y-2">
                    {activeIssue.aiActionPlan.map((step, idx) => {
                      const isChecked = !!checkedSteps[`${activeIssue.id}-${idx}`];
                      return (
                        <div 
                          key={`step-${idx}`}
                          onClick={() => handleStepCheck(idx)}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer flex gap-2.5 items-start transition-all ${
                            isChecked 
                              ? 'bg-emerald-950/40 border-emerald-900/40 text-slate-400' 
                              : 'bg-slate-950 border-purple-950/40 text-slate-300 hover:border-purple-800'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                            isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-800 bg-slate-900 text-transparent'
                          }`}>
                            {isChecked && '✓'}
                          </div>
                          <span className="leading-snug text-[11px]">{step}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Crew Assignment and Dispatch Control Form */}
              <div className="space-y-3.5 border-t border-slate-850 pt-4">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wide block">Logistics Dispatch Center</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Specialized Squad Select */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">Assign Repair Squad</label>
                    <select
                      value={selectedCrew}
                      onChange={(e) => setSelectedCrew(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500"
                    >
                      <option value="" className="bg-slate-900 text-slate-300">-- No Crew Assigned --</option>
                      {DISPATCH_CREWS.map(crew => (
                        <option key={crew.id} value={crew.name} className="bg-slate-900 text-slate-200">{crew.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Log input note */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">Add Log Dispatcher Note</label>
                    <input
                      type="text"
                      placeholder="e.g., Road closure permits approved..."
                      value={dispatcherNote}
                      onChange={(e) => setDispatcherNote(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* State Machine Transition Buttons */}
                <div className="grid grid-cols-3 gap-2.5 pt-1.5">
                  {/* Button 1: Schedule */}
                  <button
                    disabled={activeIssue.status === 'scheduled'}
                    onClick={() => {
                      onUpdateStatus(
                        activeIssue.id, 
                        'scheduled', 
                        dispatcherNote || "Public works scheduler assigned active crew.", 
                        selectedCrew
                      );
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      activeIssue.status === 'reported' || activeIssue.status === 'verifying'
                        ? 'bg-indigo-950/50 border-indigo-900/60 text-indigo-300 hover:bg-indigo-950'
                        : 'bg-slate-950/20 border-slate-900/30 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>1. Book Crew</span>
                  </button>

                  {/* Button 2: In Progress */}
                  <button
                    disabled={activeIssue.status === 'in_progress'}
                    onClick={() => {
                      onUpdateStatus(
                        activeIssue.id, 
                        'in_progress', 
                        dispatcherNote || "Crew arrived on scene with materials. Work initiated.", 
                        selectedCrew || activeIssue.assignedCrew
                      );
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      activeIssue.status === 'scheduled'
                        ? 'bg-blue-950/50 border-blue-900/60 text-blue-300 hover:bg-blue-950'
                        : 'bg-slate-950/20 border-slate-900/30 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>2. Dispatch Crew</span>
                  </button>

                  {/* Button 3: Resolve */}
                  <button
                    onClick={() => {
                      onUpdateStatus(
                        activeIssue.id, 
                        'resolved', 
                        dispatcherNote || "Site cleared. Post-repair engineering inspection passed.", 
                        selectedCrew || activeIssue.assignedCrew
                      );
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      activeIssue.status === 'in_progress'
                        ? 'bg-emerald-950/50 border-emerald-900/60 text-emerald-300 hover:bg-emerald-950'
                        : 'bg-slate-950/20 border-slate-900/30 text-slate-600 hover:bg-emerald-950 hover:text-emerald-300 hover:border-emerald-900/60'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>3. Resolve & Close</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full bg-slate-950 border border-slate-850 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <ClipboardList className="w-10 h-10 text-slate-600 mb-2 animate-pulse" />
              <h4 className="font-extrabold text-white text-sm">Logistics Terminal Standby</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Select any incident from the Operations backlog to view technical resolution blueprints, allocate repair squads, and log status updates.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
