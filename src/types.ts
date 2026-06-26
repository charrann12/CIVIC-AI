/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IssueCategory = 'pothole' | 'water_leak' | 'streetlight' | 'waste' | 'infrastructure' | 'other';

export type IssueSeverity = 'critical' | 'major' | 'minor';

export type IssueStatus = 'reported' | 'verifying' | 'scheduled' | 'in_progress' | 'resolved';

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  isStaff: boolean;
}

export interface TimelineEntry {
  status: IssueStatus;
  label: string;
  timestamp: string;
  note?: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  lat: number; // Map percentage coordinate (0-100)
  lng: number; // Map percentage coordinate (0-100)
  image?: string;
  reporterName: string;
  reporterAvatar: string;
  reportedAt: string;
  upvotes: number;
  upvotedBy: string[]; // List of user emails/names who upvoted
  verifiedCount: number;
  verifiedBy: string[]; // List of user emails/names who verified
  riskScore: number; // 0 - 100
  aiCategorized: boolean;
  aiAnalysis?: string;
  aiActionPlan?: string[];
  assignedCrew?: string;
  timeline: TimelineEntry[];
  comments: Comment[];
}

export interface UserStats {
  name: string;
  email: string;
  avatar: string;
  karma: number;
  level: number;
  reportsSubmitted: number;
  verificationsDone: number;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  unlockedAt?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  type: 'report' | 'verify' | 'upvote';
  karmaReward: number;
  completed: boolean;
}

export interface ForecastData {
  forecastSummary: string;
  expectedInfrastructureIndex: number;
  expectedNewIssues: {
    potholes: number;
    waterLeaks: number;
    streetlights: number;
    waste: number;
    infrastructure: number;
  };
  estimatedRepairCost: string;
  estimatedSavingsIfPreventiveActionTaken: string;
  criticalZones: string[];
  cascadeEffects: string[];
  recommendedPreventiveActions: string[];
  confidence: string;
}

export interface PredictiveInsightsData {
  riskMapHeatpoints: Array<{ lat: number; lng: number; intensity: number; label: string }>;
  infrastructureIndex: number; // 0-100
  predictionText: string;
  highRiskZones: Array<{ zone: string; riskLevel: 'High' | 'Medium' | 'Low'; reason: string; recommendation: string }>;
  estimatedCostSaving: string;
  forecast?: ForecastData;
}
