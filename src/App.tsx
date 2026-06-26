/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Issue, IssueCategory, IssueStatus, Comment, Quest, UserStats, PredictiveInsightsData } from './types';
import VibeMap from './components/VibeMap';
import CitizenPortal from './components/CitizenPortal';
import OpsDesk from './components/OpsDesk';
import PredictiveInsights from './components/PredictiveInsights';
import AgenticCommandCenter from './components/AgenticCommandCenter';
import { 
  Compass, Wrench, Sparkles, Award, User, Clock, CheckCircle, 
  MapPin, Activity, HelpCircle, ShieldAlert, BarChart, Bell, Bot, Cpu,
  RotateCcw, Power
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MOCK_USER_EMAIL = "nethisaicharan12345@gmail.com";

const INITIAL_USER_STATS: UserStats = {
  name: "Citizen Charan",
  email: MOCK_USER_EMAIL,
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
  karma: 45,
  level: 1,
  reportsSubmitted: 0,
  verificationsDone: 0,
  badges: [
    { id: 'b1', name: 'Civic Start', description: 'Joined Hyderabad safety grid', icon: 'Award', color: 'bg-indigo-100 text-indigo-700' }
  ]
};

const INITIAL_QUESTS: Quest[] = [
  { id: 'q1', title: 'Pavement Inspector', description: 'Upvote or verify 3 pavement reports', targetCount: 3, currentCount: 0, type: 'verify', karmaReward: 25, completed: false },
  { id: 'q2', title: 'First Responder', description: 'File your first localized community hazard report', targetCount: 1, currentCount: 0, type: 'report', karmaReward: 40, completed: false },
  { id: 'q3', title: 'Tactical Dispatcher', description: 'Coordinate dispatch to resolve 1 community issue', targetCount: 1, currentCount: 0, type: 'upvote', karmaReward: 50, completed: false }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'citizen' | 'ops' | 'insights' | 'agents'>('citizen');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  
  // Gamification state
  const [userStats, setUserStats] = useState<UserStats>(INITIAL_USER_STATS);
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [showResetToast, setShowResetToast] = useState(false);

  // Map state
  const [isPinningMode, setIsPinningMode] = useState(false);
  const [pinCoordinates, setPinCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [simulationMonths, setSimulationMonths] = useState(0);

  // API Loading states
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [insights, setInsights] = useState<PredictiveInsightsData | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Fetch all issues from server
  const fetchIssues = async () => {
    try {
      const res = await fetch('/api/issues');
      const data = await res.json();
      if (data.success) {
        setIssues(data.issues);
      }
    } catch (err) {
      console.error("Failed to fetch issues", err);
    } finally {
      setLoadingIssues(false);
    }
  };

  // Fetch predictive insights from server with dynamic parameters
  const fetchInsights = async (months: number) => {
    setLoadingInsights(true);
    try {
      const unresolved = issues.filter(i => i.status !== 'resolved');
      const resolved = issues.filter(i => i.status === 'resolved');

      const payload = {
        issues: issues.map(i => ({
          id: i.id,
          category: i.category,
          severity: i.severity,
          status: i.status,
          lat: i.lat,
          lng: i.lng
        })),
        currentInfrastructureHealthIndex: insights?.infrastructureIndex || Math.max(15, 95 - (unresolved.length * 8)),
        unresolvedIssueCount: unresolved.length,
        resolvedIssueCount: resolved.length,
        currentHighRiskZones: insights?.highRiskZones || [],
        selectedForecastDuration: months
      };

      const res = await fetch('/api/insights', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setInsights(data.insights);
      }
    } catch (err) {
      console.error("Failed to fetch insights", err);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  // Fetch insights automatically when issues or simulation timeline changes
  useEffect(() => {
    if (issues.length > 0) {
      fetchInsights(simulationMonths);
    }
  }, [issues, simulationMonths]);

  // Map Click Handler (pinning mode)
  const handleMapClick = (lat: number, lng: number) => {
    setPinCoordinates({ lat, lng });
    setIsPinningMode(false); // turn off pinning mode once plotted
  };

  // Upvoting action handler
  const handleUpvote = async (id: string) => {
    try {
      const res = await fetch(`/api/issues/${id}/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: MOCK_USER_EMAIL })
      });
      const data = await res.json();
      if (data.success) {
        // Optimistically update issues
        setIssues(prev => prev.map(issue => {
          if (issue.id === id) {
            return { ...issue, upvotes: data.upvotes, upvotedBy: data.upvotedBy };
          }
          return issue;
        }));
        
        // Progress quest if upvoting
        updateQuestProgress('upvote', 1);
        awardKarma(5);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Verification action handler
  const handleVerify = async (id: string) => {
    try {
      const res = await fetch(`/api/issues/${id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: MOCK_USER_EMAIL })
      });
      const data = await res.json();
      if (data.success) {
        setIssues(prev => prev.map(issue => {
          if (issue.id === id) {
            return { 
              ...issue, 
              verifiedCount: data.verifiedCount, 
              verifiedBy: data.verifiedBy, 
              status: data.status, 
              timeline: data.timeline 
            };
          }
          return issue;
        }));

        updateQuestProgress('verify', 1);
        awardKarma(15); // Good citizen verification reward
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Comment submit handler
  const handleAddComment = async (id: string, content: string) => {
    try {
      const isStaff = activeTab === 'ops';
      const authorName = isStaff ? "Operations Desk Staff" : userStats.name;
      
      const res = await fetch(`/api/issues/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: authorName,
          content,
          isStaff,
          avatar: userStats.avatar
        })
      });
      const data = await res.json();
      if (data.success) {
        setIssues(prev => prev.map(issue => {
          if (issue.id === id) {
            return { ...issue, comments: [...issue.comments, data.comment] };
          }
          return issue;
        }));
        awardKarma(2);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filing a new issue
  const handleReportIssue = async (reportData: {
    title: string;
    description: string;
    category: IssueCategory;
    lat: number;
    lng: number;
    image: string;
  }) => {
    try {
      const res = await fetch('/api/issues', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reportData,
          reporterName: userStats.name,
          reporterAvatar: userStats.avatar
        })
      });
      const data = await res.json();
      if (data.success) {
        setIssues(prev => [data.issue, ...prev]);
        setSelectedIssueId(data.issue.id); // Automatically focus on newly created issue!
        setPinCoordinates(null);
        
        // Progress quests and award Karma
        updateQuestProgress('report', 1);
        awardKarma(30);

        // Check if we need to award 'Pioneer' badge
        if (userStats.reportsSubmitted === 0) {
          addBadge({
            id: 'b2',
            name: 'Pothole Patrol',
            description: 'Submitted first community issue',
            icon: 'Compass',
            color: 'bg-amber-100 text-amber-700'
          });
        }
        
        // Update user stats
        setUserStats(prev => ({
          ...prev,
          reportsSubmitted: prev.reportsSubmitted + 1
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // State update logistics (Ops Desk Mode)
  const handleUpdateStatus = async (id: string, status: IssueStatus, note: string, assignedCrew?: string) => {
    try {
      const res = await fetch(`/api/issues/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note, assignedCrew })
      });
      const data = await res.json();
      if (data.success) {
        setIssues(prev => prev.map(issue => {
          if (issue.id === id) {
            return data.issue;
          }
          return issue;
        }));

        // If dispatching or resolving, progress appropriate quests and badges
        if (status === 'resolved') {
          updateQuestProgress('upvote', 1); // Tactical Dispatcher quest uses upvote triggers for convenience
          awardKarma(50); // Huge points for finishing public works repair

          addBadge({
            id: 'b3',
            name: 'Civic Engineer',
            description: 'Resolved a critical local safety hazard',
            icon: 'Wrench',
            color: 'bg-emerald-100 text-emerald-700'
          });
        } else {
          awardKarma(10);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Gamification helpers
  const awardKarma = (pts: number) => {
    setUserStats(prev => {
      const newKarma = prev.karma + pts;
      const nextLevel = Math.floor(newKarma / 100) + 1;
      return {
        ...prev,
        karma: newKarma,
        level: nextLevel
      };
    });
  };

  const updateQuestProgress = (type: 'report' | 'verify' | 'upvote', amount: number) => {
    setQuests(prev => prev.map(q => {
      if (q.type === type && !q.completed) {
        const nextCount = q.currentCount + amount;
        const completed = nextCount >= q.targetCount;
        if (completed && !q.completed) {
          awardKarma(q.karmaReward);
        }
        return {
          ...q,
          currentCount: Math.min(q.targetCount, nextCount),
          completed
        };
      }
      return q;
    }));
  };

  const addBadge = (newBadge: { id: string; name: string; description: string; icon: string; color: string }) => {
    setUserStats(prev => {
      if (prev.badges.some(b => b.id === newBadge.id)) return prev;
      return {
        ...prev,
        badges: [...prev.badges, { ...newBadge, unlockedAt: new Date().toISOString() }]
      };
    });
  };

  const handleResetDemo = async () => {
    try {
      // 1. Reset all client states back to pristine default setup
      setUserStats(INITIAL_USER_STATS);
      setQuests(INITIAL_QUESTS);
      setSelectedIssueId(null);
      setPinCoordinates(null);
      setActiveTab('citizen');
      setIsPinningMode(false);
      setShowHeatmap(false);
      setSimulationMonths(0);
      
      // 2. Call server reset database
      const res = await fetch('/api/reset-db', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        // Re-fetch issues and predictive insights
        await fetchIssues();
        await fetchInsights(0);
        
        // Trigger a beautiful visual confirmation toast
        setShowResetToast(true);
        setTimeout(() => setShowResetToast(false), 4000);
      }
    } catch (err) {
      console.error("Failed to reset demonstration data", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100 selection:bg-indigo-500/30 selection:text-white antialiased">
      
      {/* 1. Global Navigation Topbar */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg h-16 flex items-center justify-between px-6">
        
        {/* Brand logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-900/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5 leading-none">
              <span>Civic AI</span>
            </h1>
            <p className="text-[10px] text-slate-400 mt-1">Hyderabad Municipal Safety Grid</p>
          </div>
        </div>

        {/* User stats widget */}
        <div className="flex items-center gap-4">
          
          {/* Engine Start Stop Reset Button */}
          <button
            onClick={handleResetDemo}
            className="relative flex items-center justify-center gap-2 px-3 py-1.5 bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 active:scale-95 border-2 border-red-500 hover:border-red-400 text-white font-mono font-black uppercase text-[9px] tracking-wider rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] hover:brightness-110 active:brightness-95 transition-all cursor-pointer select-none group/ignition"
            title="ENGINE START STOP - Reset All Demo Systems"
          >
            <span className="absolute inset-0 bg-red-400 opacity-10 rounded-xl group-hover/ignition:opacity-20 animate-pulse" />
            <Power className="w-3 h-3 text-white animate-pulse" />
            <div className="flex flex-col items-start leading-none">
              <span className="font-extrabold text-[8px]">ENGINE</span>
              <span className="text-[6px] text-red-200 font-bold tracking-normal">START / STOP</span>
            </div>
          </button>

          {/* Karma / Badges pill */}
          <div className="hidden sm:flex items-center gap-3 bg-slate-950 border border-slate-850 p-1.5 rounded-full px-3.5 shadow-inner">
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Level</span>
              <span className="font-extrabold font-mono text-slate-300 text-xs">{userStats.level}</span>
            </div>
            <div className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
            <div className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-extrabold font-mono text-indigo-400 text-xs">{userStats.karma} Karma</span>
            </div>
          </div>

          {/* User profile */}
          <div className="flex items-center gap-2">
            <img 
              src={userStats.avatar} 
              referrerPolicy="no-referrer" 
              alt="" 
              className="w-8 h-8 rounded-full border border-slate-800 shadow-sm object-cover" 
            />
            <div className="hidden md:block text-left leading-none space-y-0.5">
              <p className="text-xs font-bold text-slate-200">{userStats.name}</p>
              <p className="text-[9px] font-mono text-slate-500">Citizen Reporter</p>
            </div>
          </div>

        </div>
      </header>

      {/* 2. Main Double-Column Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch overflow-hidden">
        
        {/* LEFT COLUMN: Map View (Always visible on large displays, 5 Cols) */}
        <section className="md:col-span-5 lg:col-span-4 flex flex-col space-y-4">
          <div className="bg-slate-900 p-4 border border-slate-800 rounded-2xl shadow-xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">Spatial Geographic View</h3>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">LIVE TELEMETRY</span>
              </div>
            </div>

            <VibeMap
              issues={issues}
              selectedIssueId={selectedIssueId}
              onSelectIssue={(id) => setSelectedIssueId(id)}
              isPinningMode={isPinningMode}
              pinCoordinates={pinCoordinates}
              onMapClick={handleMapClick}
              predictiveHotspots={insights?.riskMapHeatpoints}
              showHeatmap={showHeatmap}
            />

            {/* Quick Helper Tip */}
            <div className="text-[10px] text-slate-400 leading-normal flex items-start gap-1.5 font-sans">
              <HelpCircle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
              <span>
                Select map pins to inspect technical details, or click <strong>File New Complaint</strong> and press <strong>Plot Location</strong> to place a new coordinate pin.
              </span>
            </div>
          </div>

          {/* Hyderabad Navigation Legend Card */}
          <div className="bg-slate-900 p-4 border border-slate-800 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Compass className="w-4 h-4 text-indigo-400 animate-pulse" />
              <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider">Hyderabad Navigation Legend</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
              <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-850 py-2 px-2.5 rounded-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-md shadow-amber-500/50 flex-shrink-0"></span>
                <span className="text-slate-300">Pothole</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-850 py-2 px-2.5 rounded-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-md shadow-cyan-500/50 flex-shrink-0"></span>
                <span className="text-slate-300">Water Leak</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-850 py-2 px-2.5 rounded-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-md shadow-yellow-400/50 flex-shrink-0"></span>
                <span className="text-slate-300">Light Out</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-850 py-2 px-2.5 rounded-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-md shadow-orange-500/50 flex-shrink-0"></span>
                <span className="text-slate-300">Waste Spill</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-850 py-2 px-2.5 rounded-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-md shadow-purple-500/50 flex-shrink-0"></span>
                <span className="text-slate-300">Structure</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-850 py-2 px-2.5 rounded-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500 flex-shrink-0"></span>
                <span className="text-slate-300">Other Hazards</span>
              </div>
            </div>
          </div>

          {/* Unlocked Badges shelf */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide">Unlocked Civic Badges</span>
            <div className="flex gap-2 overflow-x-auto pb-1.5">
              {userStats.badges.map(b => (
                <div key={b.id} className={`p-1.5 rounded-xl border flex items-center gap-1.5 flex-shrink-0 text-[10px] font-semibold bg-slate-950 border-slate-800 ${b.color.includes('text-indigo') ? 'text-indigo-400' : 'text-slate-300'}`}>
                  <Award className="w-3.5 h-3.5" />
                  <span>{b.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Tab Navigation and Sub-Modules (8 Cols) */}
        <section className="md:col-span-7 lg:col-span-8 flex flex-col space-y-4">
          
          {/* Main Module Tabs Panel */}
          <div className="bg-slate-900/60 p-1.5 rounded-2xl flex border border-slate-800">
            <button
              onClick={() => {
                setActiveTab('citizen');
                setSelectedIssueId(null);
                setShowHeatmap(false);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'citizen' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800/30'
              }`}
            >
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Citizen Portal</span>
            </button>
            
            <button
              onClick={() => {
                setActiveTab('ops');
                setSelectedIssueId(null);
                setShowHeatmap(false);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'ops' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800/30'
              }`}
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Operations Desk</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('insights');
                setSelectedIssueId(null);
                setShowHeatmap(true); // turn on heatmap by default in insights mode!
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'insights' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800/30'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>AI Predictive Insights</span>
            </button>

            <button
              id="tab-agents"
              onClick={() => {
                setActiveTab('agents');
                setSelectedIssueId(null);
                setShowHeatmap(false);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'agents' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800/30'
              }`}
            >
              <Bot className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>AI Agents Hub</span>
            </button>
          </div>

          {/* Dynamic Panel rendering */}
          <div className="flex-1">
            {loadingIssues ? (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs text-slate-400 font-medium">Booting Hyderabad safety grid...</span>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {activeTab === 'citizen' && (
                  <motion.div
                    key="citizen-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="h-full"
                  >
                    <CitizenPortal
                      issues={issues}
                      selectedIssueId={selectedIssueId}
                      onSelectIssue={(id) => setSelectedIssueId(id)}
                      userStats={userStats}
                      quests={quests}
                      onUpvote={handleUpvote}
                      onVerify={handleVerify}
                      onAddComment={handleAddComment}
                      onReportIssue={handleReportIssue}
                      isPinningMode={isPinningMode}
                      setIsPinningMode={setIsPinningMode}
                      pinCoordinates={pinCoordinates}
                    />
                  </motion.div>
                )}

                {activeTab === 'ops' && (
                  <motion.div
                    key="ops-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="h-full"
                  >
                    <OpsDesk
                      issues={issues}
                      selectedIssueId={selectedIssueId}
                      onSelectIssue={(id) => setSelectedIssueId(id)}
                      onUpdateStatus={handleUpdateStatus}
                    />
                  </motion.div>
                )}

                {activeTab === 'insights' && (
                  <motion.div
                    key="insights-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="h-full"
                  >
                    <PredictiveInsights
                      issues={issues}
                      insights={insights}
                      loading={loadingInsights}
                      onRefreshInsights={() => fetchInsights(simulationMonths)}
                      showHeatmap={showHeatmap}
                      setShowHeatmap={setShowHeatmap}
                      simulationMonths={simulationMonths}
                      setSimulationMonths={setSimulationMonths}
                    />
                  </motion.div>
                )}

                {activeTab === 'agents' && (
                  <motion.div
                    key="agents-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="h-full"
                  >
                    <AgenticCommandCenter
                      issues={issues}
                      onRefreshIssues={fetchIssues}
                      selectedIssueId={selectedIssueId}
                      onSelectIssue={(id) => setSelectedIssueId(id)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

        </section>

      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-800 bg-slate-900 text-center text-[10px] font-mono text-slate-500">
        VIBE2SHIP PLATFORM • BUILT WITH GOOGLE AI STUDIO & GEMINI 3.5 FLASH • © 2026 HYDERABAD MUNICIPALITY
      </footer>

      {/* Toast Alert Notification */}
      <AnimatePresence>
        {showResetToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-indigo-500/30 text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-900/50 flex items-center justify-center flex-shrink-0">
              <RotateCcw className="w-4 h-4 animate-spin text-indigo-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Demo Data Reset Successful</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                All points, level, quests, badges, and municipal issues have been restored to original presentation defaults.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
