/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Issue, IssueCategory, IssueStatus, Comment, Quest, UserStats } from '../types';
import { 
  Plus, Search, ArrowUp, CheckCircle, MessageSquare, Image, Send, 
  MapPin, AlertTriangle, ShieldAlert, Sparkles, User, HelpCircle, 
  Trash2, X, ChevronRight, Award, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CitizenPortalProps {
  issues: Issue[];
  selectedIssueId: string | null;
  onSelectIssue: (id: string | null) => void;
  userStats: UserStats;
  quests: Quest[];
  onUpvote: (id: string) => void;
  onVerify: (id: string) => void;
  onAddComment: (id: string, content: string) => void;
  onReportIssue: (data: {
    title: string;
    description: string;
    category: IssueCategory;
    lat: number;
    lng: number;
    image: string;
  }) => Promise<void>;
  isPinningMode: boolean;
  setIsPinningMode: (val: boolean) => void;
  pinCoordinates: { lat: number; lng: number } | null;
}

const IMAGE_PRESETS = [
  { id: 'pothole', label: 'Pothole Preset', url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=500&auto=format&fit=crop&q=80' },
  { id: 'leak', label: 'Water Leak Preset', url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500&auto=format&fit=crop&q=80' },
  { id: 'light', label: 'Streetlight Preset', url: 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=500&auto=format&fit=crop&q=80' },
  { id: 'trash', label: 'Trash Preset', url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=500&auto=format&fit=crop&q=80' },
  { id: 'bridge', label: 'Structure Preset', url: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=500&auto=format&fit=crop&q=80' }
];

export default function CitizenPortal({
  issues,
  selectedIssueId,
  onSelectIssue,
  userStats,
  quests,
  onUpvote,
  onVerify,
  onAddComment,
  onReportIssue,
  isPinningMode,
  setIsPinningMode,
  pinCoordinates,
}: CitizenPortalProps) {
  // Navigation inside CitizenPortal
  const [isReporting, setIsReporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState<IssueCategory>('pothole');
  const [formImage, setFormImage] = useState(IMAGE_PRESETS[0].url);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Comments state
  const [commentText, setCommentText] = useState('');

  // Selected Issue for display
  const activeIssue = issues.find(i => i.id === selectedIssueId);

  // Filtration logic
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          issue.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategoryFilter === 'all' || issue.category === activeCategoryFilter;
    const matchesStatus = activeStatusFilter === 'all' || issue.status === activeStatusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDesc) return;
    if (!pinCoordinates) {
      alert("Please plot the issue's location on the map first!");
      return;
    }

    setFormSubmitting(true);
    try {
      await onReportIssue({
        title: formTitle,
        description: formDesc,
        category: formCategory,
        lat: pinCoordinates.lat,
        lng: pinCoordinates.lng,
        image: formImage
      });
      // Reset form
      setFormTitle('');
      setFormDesc('');
      setIsReporting(false);
      setIsPinningMode(false);
    } catch (err) {
      console.error(err);
    } finally {
      setFormSubmitting(false);
    }
  };

  const getStreetName = (lat: number, lng: number): string => {
    if (lat < 35 && lng < 50) return "Gachibowli Stadium Road";
    if (lat < 35 && lng >= 50) return "Necklace Road (Hussain Sagar)";
    if (lat >= 35 && lat < 65 && lng < 50) return "Outer Ring Road (ORR) Expressway";
    if (lat >= 35 && lat < 65 && lng >= 50) return "Madhapur Inorbit Road";
    return "Jubilee Hills Road No. 36";
  };

  const statusBadges: Record<IssueStatus, { bg: string; text: string; label: string }> = {
    reported: { bg: 'bg-amber-950 border-amber-900/50', text: 'text-amber-400', label: 'Reported' },
    verifying: { bg: 'bg-indigo-950 border-indigo-900/50', text: 'text-indigo-400', label: 'Verifying' },
    scheduled: { bg: 'bg-purple-950 border-purple-900/50', text: 'text-purple-400', label: 'Scheduled' },
    in_progress: { bg: 'bg-blue-950 border-blue-900/50', text: 'text-blue-400', label: 'In Progress' },
    resolved: { bg: 'bg-emerald-950 border-emerald-900/50', text: 'text-emerald-400', label: 'Resolved' },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-stretch">
      {/* LEFT COLUMN: Issue Feed and Filters (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        
        {/* Top Header Card */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-2xl">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-400 animate-pulse" />
              <span>Hyderabad Citizen Portal</span>
            </h2>
            <p className="text-xs text-slate-400">Report, verify, and resolve issues collaboratively with AI assist.</p>
          </div>
          <button
            onClick={() => {
              setIsReporting(!isReporting);
              onSelectIssue(null);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-sm transition-all flex-shrink-0"
          >
            {isReporting ? (
              <>
                <X className="w-4 h-4" />
                <span>Cancel Report</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>File New Complaint</span>
              </>
            )}
          </button>
        </div>

        {/* Dynamic Reporting Panel vs Feed */}
        <AnimatePresence mode="wait">
          {isReporting ? (
            <motion.form
              key="reporting-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              onSubmit={handleSubmitReport}
              className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-4 text-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span className="font-semibold text-sm text-white">New AI-Analyzed Report</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Step 1 of 2</span>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300 block">Incident Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Blocked sewer drain flooding street"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-950/40 focus:border-indigo-500 outline-none placeholder:text-slate-600"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300 block">Incident Details / Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Please provide details. AI will parse this text to autodetect category, security hazards, and prepare municipal work orders."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-950/40 focus:border-indigo-500 outline-none resize-none placeholder:text-slate-600"
                />
              </div>

              {/* Category selector */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300 block">Initial Category Estimate</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as IssueCategory)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                  >
                    <option className="bg-slate-900" value="pothole">Pothole / Road Damage</option>
                    <option className="bg-slate-900" value="water_leak">Water Leak / Burst Pipe</option>
                    <option className="bg-slate-900" value="streetlight">Dark Area / Streetlight Out</option>
                    <option className="bg-slate-900" value="waste">Illegal Dumping / Trash</option>
                    <option className="bg-slate-900" value="infrastructure">Concrete / Structural Repair</option>
                    <option className="bg-slate-900" value="other">Other Community Hazard</option>
                  </select>
                </div>

                {/* Coordinate mapping */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300 block">Plot Location on Map</label>
                  <button
                    type="button"
                    onClick={() => setIsPinningMode(!isPinningMode)}
                    className={`w-full px-3 py-2 border text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                      isPinningMode 
                        ? 'bg-amber-500 hover:bg-amber-600 border-amber-600 text-white animate-pulse' 
                        : pinCoordinates 
                        ? 'bg-emerald-950/40 border-emerald-850 text-emerald-400' 
                        : 'bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-300'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>
                      {isPinningMode 
                        ? 'Clicking Map...' 
                        : pinCoordinates 
                        ? `Plotted (${pinCoordinates.lat.toFixed(0)}%, ${pinCoordinates.lng.toFixed(0)}%)` 
                        : 'Deploy Map Pin'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Image presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Attach Image Proof</label>
                <div className="flex gap-2 overflow-x-auto pb-1.5">
                  {IMAGE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setFormImage(preset.url)}
                      className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        formImage === preset.url ? 'border-indigo-500 scale-95 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit panel */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1 text-[10px] text-purple-400 font-mono">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>Gemini auto-analysis active</span>
                </div>
                <button
                  type="submit"
                  disabled={formSubmitting || !pinCoordinates}
                  className={`px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 ${
                    (!pinCoordinates || formSubmitting) ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  {formSubmitting ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Gemini Analysing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit AI-Scoped Report (+30 Karma)</span>
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="incident-feed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col space-y-4 flex-1 overflow-y-auto"
            >
              {/* Filter controls */}
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search community incidents by keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-950/45 focus:border-indigo-500 placeholder:text-slate-600"
                  />
                </div>
                
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setActiveCategoryFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      activeCategoryFilter === 'all' 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    All Types
                  </button>
                  {['pothole', 'water_leak', 'streetlight', 'waste', 'infrastructure'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border capitalize transition-all cursor-pointer ${
                        activeCategoryFilter === cat
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      {cat.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Incidents Feed */}
              <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                <AnimatePresence>
                  {filteredIssues.length === 0 ? (
                    <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
                      <HelpCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-300">No community reports found</p>
                      <p className="text-[10px] text-slate-500 mt-1">Try adjusting your category or text search filters.</p>
                    </div>
                  ) : (
                    filteredIssues.map((issue) => {
                      const isSelected = selectedIssueId === issue.id;
                      const badge = statusBadges[issue.status];
                      
                      return (
                        <motion.div
                          key={issue.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          onClick={() => onSelectIssue(issue.id)}
                          className={`p-4 bg-slate-900 border rounded-2xl shadow-md transition-all duration-300 cursor-pointer flex gap-4 ${
                            isSelected 
                              ? 'border-indigo-500 ring-2 ring-indigo-950/40 bg-slate-900/90' 
                              : 'border-slate-850 hover:border-slate-700'
                          }`}
                        >
                          {issue.image && (
                            <img
                              src={issue.image}
                              referrerPolicy="no-referrer"
                              alt=""
                              className="w-16 h-16 rounded-xl object-cover border border-slate-800 flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-extrabold text-white text-xs sm:text-sm truncate">
                                {issue.title}
                              </h3>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${badge.bg} ${badge.text} flex-shrink-0 font-mono`}>
                                {badge.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-2">
                              {issue.description}
                            </p>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 pt-2 border-t border-slate-800 font-mono">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                {getStreetName(issue.lat, issue.lng)}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-slate-300">👍 {issue.upvotes} Upvotes</span>
                                <span className="text-indigo-400">✓ {issue.verifiedCount} Verifications</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT COLUMN: Selected Incident Detail Drawer / Quests (5 Cols) */}
      <div className="lg:col-span-5 flex flex-col space-y-4">
        <AnimatePresence mode="wait">
          {activeIssue ? (
            <motion.div
              key="detail-view"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="p-5 bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl flex flex-col h-full overflow-y-auto space-y-4 text-slate-200"
            >
              {/* Back Button / Title */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <button
                  onClick={() => onSelectIssue(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition-all cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <User className="w-3.5 h-3.5" />
                  <span>By {activeIssue.reporterName}</span>
                </div>
              </div>

              {/* Image & Main Info */}
              {activeIssue.image && (
                <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800">
                  <img src={activeIssue.image} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-950/90 text-slate-200 text-[9px] font-mono rounded-md border border-slate-800">
                    INCIDENT ID: {activeIssue.id}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-extrabold text-white text-sm sm:text-base leading-snug">
                  {activeIssue.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {activeIssue.description}
                </p>
              </div>

              {/* AI Analysis Box (Gemini powered) */}
              {activeIssue.aiAnalysis && (
                <div className="p-4 bg-purple-950/40 border border-purple-900/40 rounded-xl space-y-2 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs font-bold text-purple-300">
                      <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                      <span>AI Engineering Safety Analysis</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded-md font-bold">
                      <ShieldAlert className="w-3 h-3" />
                      <span>RISK SCORE: {activeIssue.riskScore}/100</span>
                    </div>
                  </div>
                  <p className="text-xs text-purple-200 leading-relaxed italic">
                    "{activeIssue.aiAnalysis}"
                  </p>
                </div>
              )}

              {/* Citizen Upvote & Verify Controls */}
              <div className="grid grid-cols-2 gap-3">
                {/* Upvote Button */}
                <button
                  onClick={() => onUpvote(activeIssue.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeIssue.upvotedBy.includes(userStats.email)
                      ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-700 text-white shadow-md'
                      : 'bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-300'
                  }`}
                >
                  <ArrowUp className="w-4 h-4" />
                  <span>Upvote ({activeIssue.upvotes})</span>
                </button>

                {/* Verify Button */}
                <button
                  onClick={() => onVerify(activeIssue.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeIssue.verifiedBy.includes(userStats.email)
                      ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-700 text-white shadow-md'
                      : 'bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-300'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Verify ({activeIssue.verifiedCount}/3)</span>
                </button>
              </div>

              {/* Comments Thread */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <span>Community Discussion ({activeIssue.comments.length})</span>
                </h4>
                
                {/* List Comments */}
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {activeIssue.comments.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic">No comments filed yet. Be the first to add a note!</p>
                  ) : (
                    activeIssue.comments.map((cmt) => (
                      <div key={cmt.id} className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-white flex items-center gap-1">
                            <span className="w-4 h-4 rounded-full bg-slate-800 inline-block text-[8px] text-center leading-4 font-normal">👤</span>
                            {cmt.author}
                          </span>
                          {cmt.isStaff ? (
                            <span className="px-1.5 py-0.5 bg-red-950 text-red-400 border border-red-900 text-[8px] font-mono font-bold rounded">TOWN HALL STAFF</span>
                          ) : (
                            <span className="text-[9px] font-mono text-slate-500">{new Date(cmt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                        </div>
                        <p className="text-[10.5px] text-slate-300 leading-normal">{cmt.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment input form */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask a question or offer localized info..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && commentText) {
                        onAddComment(activeIssue.id, commentText);
                        setCommentText('');
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 text-white rounded-lg text-xs outline-none focus:border-indigo-500 placeholder:text-slate-600"
                  />
                  <button
                    onClick={() => {
                      if (commentText) {
                        onAddComment(activeIssue.id, commentText);
                        setCommentText('');
                      }
                    }}
                    className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="quests-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-5 bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl space-y-5 h-full overflow-y-auto text-slate-200"
            >
              {/* Progress Level Card */}
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-3 transition-all hover:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-mono font-bold text-indigo-400 tracking-wider">Active Civic Rank</span>
                    <h4 className="font-extrabold text-sm text-white">Level {userStats.level} Civic Watchdog</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-mono font-bold text-indigo-400 tracking-wider text-right block">Authority Karma</span>
                    <p className="text-base font-extrabold font-mono text-yellow-400 leading-none mt-0.5">{userStats.karma} PTS</p>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(userStats.karma % 100)}%` }} 
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-slate-500 font-bold">
                    <span>{userStats.karma % 100} / 100 EXP TO LEVEL {userStats.level + 1}</span>
                    <span>RESOLVED: {issues.filter(i => i.status === 'resolved').length}</span>
                  </div>
                </div>
              </div>

              {/* Quests Lists with Identical Layout */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">Ongoing Challenges</span>
                  <span className="text-[9px] font-mono text-slate-500 font-bold">
                    {quests.filter(q => q.completed).length} / {quests.length} Completed
                  </span>
                </div>
                
                <div className="space-y-3">
                  {quests.map((quest) => (
                    <div 
                      key={quest.id} 
                      className={`p-4 border rounded-2xl space-y-3 transition-all ${
                        quest.completed 
                          ? 'bg-emerald-950/10 border-emerald-900/40 shadow-sm' 
                          : 'bg-slate-950 border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <h5 className={`text-xs font-bold leading-snug ${quest.completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                            {quest.title}
                          </h5>
                          <p className="text-[10px] text-slate-400 leading-normal">{quest.description}</p>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border shrink-0 ${
                          quest.completed 
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/40' 
                            : 'bg-slate-900 text-slate-300 border-slate-800'
                        }`}>
                          +{quest.karmaReward} PTS
                        </span>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${quest.completed ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                            style={{ width: `${Math.min(100, (quest.currentCount / quest.targetCount) * 100)}%` }} 
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-mono text-slate-500 font-bold">
                          <span>Progress: {quest.currentCount} / {quest.targetCount}</span>
                          {quest.completed && <span className="text-emerald-500 font-extrabold font-sans flex items-center gap-0.5">✓ UNLOCKED</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
