/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Issue, IssueCategory, IssueStatus } from '../types';
import { MapPin, Info, Compass, HelpCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VibeMapProps {
  issues: Issue[];
  selectedIssueId: string | null;
  onSelectIssue: (id: string) => void;
  isPinningMode: boolean;
  pinCoordinates: { lat: number; lng: number } | null;
  onMapClick: (lat: number, lng: number) => void;
  predictiveHotspots?: Array<{ lat: number; lng: number; intensity: number; label: string }> | null;
  showHeatmap: boolean;
}

export default function VibeMap({
  issues,
  selectedIssueId,
  onSelectIssue,
  isPinningMode,
  pinCoordinates,
  onMapClick,
  predictiveHotspots,
  showHeatmap,
}: VibeMapProps) {
  const [hoveredIssue, setHoveredIssue] = useState<Issue | null>(null);
  const [hoveredHotspot, setHoveredHotspot] = useState<{ label: string; intensity: number } | null>(null);

  // Map Category to Colors
  const categoryColors: Record<IssueCategory, { bg: string; border: string; text: string; ring: string }> = {
    pothole: { bg: 'bg-amber-500', border: 'border-amber-600/50', text: 'text-amber-400', ring: 'ring-amber-500/20' },
    water_leak: { bg: 'bg-cyan-500', border: 'border-cyan-600/50', text: 'text-cyan-400', ring: 'ring-cyan-500/20' },
    streetlight: { bg: 'bg-yellow-400', border: 'border-yellow-500/50', text: 'text-yellow-300', ring: 'ring-yellow-400/20' },
    waste: { bg: 'bg-orange-500', border: 'border-orange-600/50', text: 'text-orange-400', ring: 'ring-orange-500/20' },
    infrastructure: { bg: 'bg-purple-500', border: 'border-purple-600/50', text: 'text-purple-400', ring: 'ring-purple-500/20' },
    other: { bg: 'bg-slate-500', border: 'border-slate-600/50', text: 'text-slate-400', ring: 'ring-slate-500/20' },
  };

  const getStreetName = (lat: number, lng: number): string => {
    if (lat < 35 && lng < 50) return "Gachibowli Stadium Road";
    if (lat < 35 && lng >= 50) return "Necklace Road (Hussain Sagar)";
    if (lat >= 35 && lat < 65 && lng < 50) return "Outer Ring Road (ORR) Expressway";
    if (lat >= 35 && lat < 65 && lng >= 50) return "Madhapur Inorbit Road";
    return "Jubilee Hills Road No. 36";
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert px coordinates to percentages (0-100)
    const lngPercent = Math.round((x / rect.width) * 1000) / 10;
    const latPercent = Math.round((y / rect.height) * 1000) / 10;
    
    if (isPinningMode) {
      onMapClick(latPercent, lngPercent);
    }
  };

  return (
    <div className="relative w-full aspect-square md:aspect-[4/4.2] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl group/map">
        <svg
          id="vibeville-vector-map"
          className={`w-full h-full select-none ${isPinningMode ? 'cursor-crosshair' : 'cursor-default'}`}
          onClick={handleSvgClick}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1" />
            </pattern>
            <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="60%" stopColor="#0c4a6e" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>

          {/* Grid Background */}
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Park Zone (Soft Green on dark) */}
          <rect x="10%" y="10%" width="35%" height="25%" rx="12" fill="#022c22" opacity="0.45" stroke="#059669" strokeWidth="1" strokeDasharray="4,4" />
          <text x="27.5%" y="22%" textAnchor="middle" className="font-sans text-[10px] font-bold text-emerald-400 tracking-wider uppercase opacity-50">KBR National Park</text>

          {/* Industrial Zone (Grey grid) */}
          <rect x="10%" y="70%" width="30%" height="20%" rx="12" fill="#0f172a" opacity="0.6" stroke="#334155" strokeWidth="1" />
          <text x="25%" y="82%" textAnchor="middle" className="font-sans text-[10px] font-bold text-slate-400 tracking-wider uppercase opacity-50">Hitech City IT Hub</text>

          {/* Waterfront Marina (Soft Blue Wave) */}
          <path
            d="M 65 0 C 75 30, 80 50, 75 75 C 72 90, 82 95, 90 100 L 100 100 L 100 0 Z"
            fill="url(#riverGradient)"
            opacity="0.6"
            transform="scale(10, 10)" // scalable to 1000x1000 grid context
            className="scale-[10]"
          />
          <text x="86%" y="45%" textAnchor="middle" transform="rotate(70, 860, 450)" className="font-sans text-[10px] font-bold text-cyan-400 tracking-wider uppercase opacity-50">Hussain Sagar Lake</text>

          {/* Main Road Arteries (Expressways with Neon center lines) */}
          {/* Horizontal Expressway */}
          <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#1e293b" strokeWidth="20" strokeLinecap="square" />
          <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#4f46e5" strokeWidth="4" opacity="0.7" />
          <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#ffffff" strokeWidth="1" strokeDasharray="4,4" />
          
          {/* Vertical Arterial Road */}
          <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="#1e293b" strokeWidth="16" />
          <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="#0284c7" strokeWidth="3" opacity="0.7" />
          <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="#ffffff" strokeWidth="1" strokeDasharray="4,4" />

          {/* Grid Street Lines (Secondary roads) */}
          <line x1="25%" y1="0%" x2="25%" y2="100%" stroke="#0f172a" strokeWidth="6" opacity="0.8" />
          <line x1="75%" y1="0%" x2="75%" y2="100%" stroke="#0f172a" strokeWidth="6" opacity="0.8" />
          <line x1="0%" y1="25%" x2="100%" y2="25%" stroke="#0f172a" strokeWidth="6" opacity="0.8" />
          <line x1="0%" y1="75%" x2="100%" y2="75%" stroke="#0f172a" strokeWidth="6" opacity="0.8" />

          {/* Road Labels */}
          <text x="40%" y="46%" fill="#475569" className="font-mono text-[8px] font-bold uppercase tracking-wider">Outer Ring Road (ORR)</text>
          <text x="52.5%" y="90%" fill="#475569" className="font-mono text-[8px] font-bold uppercase tracking-wider" transform="rotate(90, 525, 900)">Inorbit Mall Road</text>
        </svg>

        {/* AI Heatmap Activation Banner */}
      {showHeatmap && (
        <div className="absolute top-4 right-4 py-1.5 px-3 bg-purple-600/95 text-white backdrop-blur-sm rounded-full shadow-md text-[10px] font-sans font-medium flex items-center gap-1.5 z-10 border border-purple-400/50">
          <Sparkles className="w-3 h-3 text-purple-200 animate-pulse" />
          <span>AI PREDICTIVE DECAY HEATMAP ON</span>
        </div>
      )}

      {/* 3. AI Heatmap Rendering (Overlay) */}
      {showHeatmap && predictiveHotspots && (
        <div className="absolute inset-0 pointer-events-none">
          {predictiveHotspots.map((spot, idx) => (
            <div
              key={`hotspot-${idx}`}
              className="absolute pointer-events-auto"
              style={{ top: `${spot.lat}%`, left: `${spot.lng}%` }}
              onMouseEnter={() => setHoveredHotspot({ label: spot.label, intensity: spot.intensity })}
              onMouseLeave={() => setHoveredHotspot(null)}
            >
              {/* Outer pulsing alert ring */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600 animate-ripple"
                style={{
                  width: `${120 * spot.intensity}px`,
                  height: `${120 * spot.intensity}px`,
                  animationDuration: `${3 - (spot.intensity * 1.5)}s`
                }}
              />
              {/* Core pulsing indicator */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/30 border border-red-500 flex items-center justify-center"
                style={{
                  width: `${36 * spot.intensity}px`,
                  height: `${36 * spot.intensity}px`
                }}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-600 animate-bounce" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Map Pining Placement Indicator */}
      <AnimatePresence>
        {isPinningMode && pinCoordinates && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
            style={{ top: `${pinCoordinates.lat}%`, left: `${pinCoordinates.lng}%` }}
          >
            <div className="w-10 h-10 -translate-y-3 flex items-center justify-center relative">
              <span className="absolute w-6 h-6 bg-red-500 animate-ping rounded-full opacity-60" />
              <MapPin className="w-8 h-8 text-red-600 drop-shadow-md relative z-10" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Issue Location Pins */}
      <div className="absolute inset-0 pointer-events-none">
        {issues.map((issue) => {
          const isSelected = selectedIssueId === issue.id;
          const config = categoryColors[issue.category] || categoryColors.other;
          
          return (
            <div
              key={issue.id}
              className={`absolute pointer-events-auto transition-transform duration-300 ${isSelected ? 'z-30' : 'z-20 hover:z-40'}`}
              style={{ top: `${issue.lat}%`, left: `${issue.lng}%` }}
            >
              <button
                id={`pin-btn-${issue.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectIssue(issue.id);
                }}
                onMouseEnter={() => setHoveredIssue(issue)}
                onMouseLeave={() => setHoveredIssue(null)}
                className="focus:outline-none -translate-x-1/2 -translate-y-1/2 group/pin relative p-1"
              >
                {/* Active ripple for resolved versus active issues */}
                {issue.status !== 'resolved' && (
                  <span className={`absolute inset-0 rounded-full animate-ping opacity-40 ${
                    issue.severity === 'critical' ? 'bg-red-400' : 'bg-slate-400'
                  }`} />
                )}

                {/* Pin Container */}
                <div className={`p-1.5 rounded-full border-2 shadow-md transform transition-all duration-300 ${
                  isSelected 
                    ? 'scale-125 bg-rose-600 border-white ring-4 ring-rose-500/40 text-white' 
                    : `bg-slate-900 ${config.text} border-slate-700 hover:scale-110 hover:border-slate-500`
                }`}>
                  <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : ''}`} />
                </div>

                {/* Tiny Badge Indicator for Severity */}
                {issue.severity === 'critical' && !isSelected && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border border-slate-950 rounded-full" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* 6. Hovercard details drawer (Hover on Pin) */}
      <AnimatePresence>
        {hoveredIssue && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute z-50 pointer-events-none"
            style={{ 
              top: `${hoveredIssue.lat}%`, 
              left: `${hoveredIssue.lng}%`,
              transform: hoveredIssue.lat < 30 
                ? 'translate(-50%, 15px)' // Show below if close to the top
                : 'translate(-50%, calc(-100% - 12px))' // Show above otherwise (offset slightly higher than pin)
            }}
          >
            <div 
              className="p-2.5 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl text-[11px] text-slate-200 w-52 pointer-events-auto transition-transform duration-200"
              style={{
                transform: hoveredIssue.lng < 25 
                  ? 'translateX(30%)' 
                  : hoveredIssue.lng > 75 
                    ? 'translateX(-30%)' 
                    : 'none'
              }}
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-extrabold text-white truncate block flex-1">
                    {hoveredIssue.title}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase font-mono border flex-shrink-0 ${
                    hoveredIssue.severity === 'critical' 
                      ? 'bg-red-950 border-red-800 text-red-400' 
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}>
                    {hoveredIssue.severity}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 text-[9px] text-slate-400 font-mono">
                  <div className="truncate text-slate-300">📍 {getStreetName(hoveredIssue.lat, hoveredIssue.lng)}</div>
                  <div className="uppercase text-indigo-400 font-semibold">{hoveredIssue.category.replace('_', ' ')}</div>
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-800/60 pt-1.5 mt-1">
                  <span className="font-bold font-mono text-emerald-400 uppercase">
                    {hoveredIssue.status.replace('_', ' ')}
                  </span>
                  <span className="text-slate-500 font-mono">👍 {hoveredIssue.upvotes}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hotspot Hover Description Banner */}
      <AnimatePresence>
        {hoveredHotspot && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-16 right-4 p-2.5 bg-red-950/95 text-red-100 border border-red-700 rounded-xl shadow-lg text-[10px] max-w-xs z-40"
          >
            <div className="flex items-center gap-1 font-semibold text-red-300 uppercase tracking-wide mb-1 font-mono">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>AI Decay Hotspot Insight</span>
            </div>
            <p className="font-sans leading-relaxed">{hoveredHotspot.label}</p>
            <div className="flex items-center justify-between mt-2 pt-1 border-t border-red-800 text-[9px] font-mono text-red-400">
              <span>Risk Intensity:</span>
              <span>{(hoveredHotspot.intensity * 100).toFixed(0)}% Stress</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. Pinning prompt instructions overlay */}
      {isPinningMode && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center pointer-events-none">
          <div className="p-4 bg-slate-900 rounded-2xl shadow-2xl max-w-xs space-y-2 pointer-events-auto border border-slate-800 text-slate-200">
            <div className="w-10 h-10 bg-rose-950/50 border border-rose-800 rounded-full flex items-center justify-center mx-auto text-rose-400">
              <MapPin className="w-5 h-5 animate-bounce" />
            </div>
            <h4 className="font-extrabold text-white text-sm">Select Incident Location</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Click anywhere on the Hyderabad vector map above to place an active incident marker.
            </p>
            {pinCoordinates && (
              <div className="p-1.5 bg-slate-950 rounded-lg text-[10px] font-mono text-slate-300 border border-slate-850">
                Lat: {pinCoordinates.lat.toFixed(1)}% | Lng: {pinCoordinates.lng.toFixed(1)}%
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
