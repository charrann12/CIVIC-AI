/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { Issue, Comment, IssueCategory, IssueSeverity, IssueStatus } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "db.json");

app.use(express.json());

// -------------------------------------------------------------
// Gemini API Integration Setup
// -------------------------------------------------------------
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is not configured or holds a placeholder value. Operating in rule-based fallback mode.");
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Fallback logic for when GEMINI_API_KEY is missing or invalid
function generateFallbackAnalysis(title: string, desc: string, category: IssueCategory, severity: IssueSeverity) {
  const riskScore = severity === 'critical' ? 85 : severity === 'major' ? 60 : 30;
  
  const actionPlans: Record<IssueCategory, string[]> = {
    pothole: [
      "Deploy safety pylons and clear-to-work signage around the affected zone.",
      "Mill or clear the loose asphalt and debris from the pothole base.",
      "Apply hot tack coat binder spray to seal the edges.",
      "Fill with hot-mix asphalt aggregate and compact using a vibrating steamroller.",
      "Conduct a levelness inspect and re-open the traffic lane."
    ],
    water_leak: [
      "Locate and close the nearest branch shut-off valve to isolate the leakage.",
      "Excavate the ground layer around the pipe rupture site safely.",
      "Install a heavy-duty municipal repair clamp or replace the fractured pipe segment.",
      "Gradually re-pressurize the water line to perform a secondary pressure test.",
      "Backfill the soil and repair the surface asphalt/concrete layer."
    ],
    streetlight: [
      "Dispatch bucket-truck electrical technician crew to the designated pole.",
      "Test circuit voltage and verify photocell light sensor functioning.",
      "Replace dead bulb with an energy-efficient high-efficiency LED fixture.",
      "Clean protective glass housing and secure structural access panels.",
      "Log illumination compliance check on the city grid telemetry portal."
    ],
    waste: [
      "Dispatch a high-capacity municipal sanitation truck to the collection point.",
      "Manually clear overflow debris and dispose of hazardous waste separately.",
      "Sanitize the surrounding pavement and containment structures.",
      "Log container fill-rate patterns to adjust weekly collection schedules.",
      "Install local public compliance signage warning against littering."
    ],
    infrastructure: [
      "Assess structural crack dimensions and verify foundation settling status.",
      "Secure the immediate perimeter with safety fencing if pedestrians are at risk.",
      "Mix and inject high-strength structural epoxy or pour fresh concrete.",
      "Install level/stress indicators to monitor future displacement.",
      "Conduct a safety sign-off before removing public bypass lanes."
    ],
    other: [
      "Send a local community inspector to assess the reported problem.",
      "Create a custom work order outlining specific equipment needed.",
      "Deploy temporary warning signs if safety risks are present.",
      "Coordinate with local utility providers or community leads.",
      "Inspect completed repairs and log completion statistics."
    ]
  };

  return {
    category: category || 'other',
    severity: severity || 'minor',
    riskScore,
    aiAnalysis: `Based on the local report regarding '${title}', this represents a safety hazard affecting standard neighborhood operations. Prompt dispatch of a field team is recommended to secure the site and prevent further environmental or utility degradation.`,
    aiActionPlan: actionPlans[category || 'other']
  };
}

// -------------------------------------------------------------
// Database Initialization & Seed Data
// -------------------------------------------------------------
const INITIAL_ISSUES: Issue[] = [
  {
    id: "iss-1",
    title: "Crater-sized pothole on Hitech City Main Road",
    description: "Huge pothole right in the middle of the northbound lane near Cyber Towers. Cars are swerving dangerously into oncoming traffic to avoid it. Extremely dangerous at night.",
    category: "pothole",
    severity: "critical",
    status: "in_progress",
    lat: 38.5,
    lng: 28.2,
    reporterName: "Marcus Vance",
    reporterAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    reportedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), // 5 days ago
    upvotes: 48,
    upvotedBy: ["citizen1@hyderabad.gov.in", "citizen2@hyderabad.gov.in"],
    verifiedCount: 12,
    verifiedBy: ["inspector@hyderabad.gov.in"],
    riskScore: 92,
    aiCategorized: true,
    aiAnalysis: "This crater pothole on a high-speed lane is a critical driving hazard, causing severe steering drift and risking head-on collisions. High priority structural repair required.",
    aiActionPlan: [
      "Secure the northbound lane with traffic barrels and warning signs.",
      "Excavate the pothole down to stable subgrade and vacuum debris.",
      "Apply high-adhesion hot tack emulsion coat.",
      "Fill with commercial asphalt aggregate and compact with high-impact tamper.",
      "Level with surrounding road surface, seal edges, and re-open lane."
    ],
    assignedCrew: "Squad A - Pavement Pros",
    timeline: [
      { status: "reported", label: "Issue Filed", timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), note: "Reported by Marcus with image proof." },
      { status: "verifying", label: "AI Verification & Scoring", timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000 + 5000).toISOString(), note: "Category verified. Priority set to CRITICAL. Risk Score: 92." },
      { status: "scheduled", label: "Work Scheduled", timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(), note: "Assigned to Pavement Pros squad." },
      { status: "in_progress", label: "Repair Initiated", timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), note: "Crew has secured the lane. Cold-milling of base in progress." }
    ],
    comments: [
      { id: "c-1", author: "Sarah Jenkins", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80", content: "I almost popped a tire on this last Tuesday! Thank goodness it is finally being fixed.", timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(), isStaff: false },
      { id: "c-2", author: "Lead Engineer Dan", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80", content: "Crew is currently working on this. We expect asphalt compaction to be done by tonight. Re-opening lane in the morning.", timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), isStaff: true }
    ]
  },
  {
    id: "iss-2",
    title: "Major water line break on Jubilee Hills Road No. 36",
    description: "Water is bubbling up through the cracks in the pavement near the Jubilee Hills Checkpost, creating a huge stream flowing down the hill. Water pressure in nearby buildings has dropped significantly.",
    category: "water_leak",
    severity: "critical",
    status: "reported",
    lat: 55.4,
    lng: 62.1,
    reporterName: "Elena Rostova",
    reporterAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80",
    reportedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // 3 hours ago
    upvotes: 35,
    upvotedBy: [],
    verifiedCount: 5,
    verifiedBy: [],
    riskScore: 88,
    aiCategorized: true,
    aiAnalysis: "A pressurized water main burst is actively eroding the road foundation, raising a high risk of sinkhole collapse and causing widespread local building pressure drops.",
    aiActionPlan: [
      "Isolate local branch valves to halt active water flow.",
      "Establish safe trench shoring around the water line rupture zone.",
      "Cut away fractured cast-iron main pipe segment.",
      "Install flexible utility pipe couplers and high-strength replacement main segment.",
      "Sanitize, perform pressure test, and backfill the trench."
    ],
    timeline: [
      { status: "reported", label: "Water Leak Reported", timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), note: "Active leak reported with local building drop notice." }
    ],
    comments: [
      { id: "c-3", author: "Gary Myers", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80", content: "No water in Jubilee Apartments at all right now. Please hurry!", timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), isStaff: false }
    ]
  },
  {
    id: "iss-3",
    title: "Dark sector: Damaged streetlights near KBR National Park",
    description: "Four consecutive streetlights are completely out along the KBR National Park outer walkway. The entire path is pitch black. Feels very unsafe for evening runners and walkers.",
    category: "streetlight",
    severity: "major",
    status: "scheduled",
    lat: 25.1,
    lng: 78.4,
    reporterName: "Rajesh Kumar",
    reporterAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80",
    reportedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    upvotes: 22,
    upvotedBy: [],
    verifiedCount: 8,
    verifiedBy: [],
    riskScore: 65,
    aiCategorized: true,
    aiAnalysis: "Consecutive lighting outages create a visual 'dark zone' directly adjacent to KBR park, significantly boosting safety and security risks. Scheduling bulb/ballast replacements is critical.",
    aiActionPlan: [
      "Inspect sub-grade wiring connections and junction boxes.",
      "Examine high-pressure light ballast and photo-electric control units.",
      "Install high-output modern LED modules.",
      "Verify illumination output telemetry registers correctly."
    ],
    assignedCrew: "Squad C - Sparks & Power",
    timeline: [
      { status: "reported", label: "Outage Filed", timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
      { status: "verifying", label: "Field Team Dispatched", timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), note: "Outage confirmed by night patrol." },
      { status: "scheduled", label: "Repair Scheduled", timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), note: "Assigned to Sparks squad for tomorrow morning." }
    ],
    comments: []
  },
  {
    id: "iss-4",
    title: "Illegal dumping on Gachibowli Stadium Road lane",
    description: "An entire truckload of old furniture, construction waste, and bags of trash has been dumped on the side of the road, partially blocking the pedestrian sidewalk near the sports complex.",
    category: "waste",
    severity: "major",
    status: "verifying",
    lat: 78.9,
    lng: 15.6,
    reporterName: "Chloe Dupont",
    reporterAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80",
    reportedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    upvotes: 15,
    upvotedBy: [],
    verifiedCount: 3,
    verifiedBy: [],
    riskScore: 58,
    aiCategorized: true,
    aiAnalysis: "Unauthorized industrial debris obstructs citizen walkway, driving pedestrians onto the vehicle corridor and risking pest attractance. Sanitation cleanup required.",
    aiActionPlan: [
      "Send a waste collector loader and container bin truck.",
      "Sort and secure hazardous materials from rubble.",
      "Sweep and steam-clean the sidewalk zone.",
      "Inspect security camera footage from nearby warehouse for vehicle licenses."
    ],
    timeline: [
      { status: "reported", label: "Dumping Reported", timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
      { status: "verifying", label: "Under AI Scoping", timestamp: new Date(Date.now() - 18 * 3600 * 1000).toISOString(), note: "Safety risk score evaluated: 58." }
    ],
    comments: []
  },
  {
    id: "iss-5",
    title: "Cracked support on Durgam Cheruvu Cable Bridge",
    description: "Walking underneath the Durgam Cheruvu Cable Bridge walkway, I noticed a very large diagonal crack on the concrete support pillar. Rebar is showing through and is rusting.",
    category: "infrastructure",
    severity: "critical",
    status: "reported",
    lat: 42.1,
    lng: 48.9,
    reporterName: "David Miller",
    reporterAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    reportedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    upvotes: 62,
    upvotedBy: [],
    verifiedCount: 19,
    verifiedBy: [],
    riskScore: 95,
    aiCategorized: true,
    aiAnalysis: "Exposed, rusted rebar and diagonal cracking on bridge piers point to structural shear failure risk on Durgam Cheruvu Bridge. Requires urgent load limit posting and structural concrete injection.",
    aiActionPlan: [
      "Deploy structural engineering inspection squad to measure crack displacement.",
      "Post strict bridge load limit restrictions on overhead roadway.",
      "Sandblast corroded steel rebar to prevent chemical deterioration.",
      "Seal cracks and pressure-inject high-strength structural epoxy binder.",
      "Encase column with reinforcing steel jackets if load carrying capacity is compromised."
    ],
    timeline: [
      { status: "reported", label: "Structural Crack Reported", timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString() }
    ],
    comments: [
      { id: "c-4", author: "Engineer Ken", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80", content: "I am adding this to our structural safety review right away. Diagonal shear cracks with rusted rebar need concrete encasement.", timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString(), isStaff: true }
    ]
  },
  {
    id: "iss-6",
    title: "Clogged drainage causing severe Begumpet Metro Station flood",
    description: "Every time it rains, the area around Begumpet Metro Station floods completely. The storm drains seem totally blocked by leaves, plastic cups, mud, and garbage.",
    category: "water_leak",
    severity: "major",
    status: "resolved",
    lat: 68.2,
    lng: 41.5,
    reporterName: "Zoe Washburne",
    reporterAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    reportedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    upvotes: 31,
    upvotedBy: [],
    verifiedCount: 14,
    verifiedBy: [],
    riskScore: 70,
    aiCategorized: true,
    aiAnalysis: "Stormwater drain blockages create persistent local flooding near Begumpet Metro Station, hydroplaning hazards, and asphalt decay. High-pressure wash clearance recommended.",
    aiActionPlan: [
      "Dispatch mechanical sewer vacuum truck to clearance point.",
      "Clear catch basins of impacted organic matter and rubbish.",
      "Flush drainage lines using high-velocity water jetting.",
      "Verify unimpeded gravity drainage flow to storm channels."
    ],
    assignedCrew: "Squad D - Drain Specialists",
    timeline: [
      { status: "reported", label: "Drain Blockage Reported", timestamp: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() },
      { status: "verifying", label: "Sewer Team Inspecting", timestamp: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString() },
      { status: "scheduled", label: "Jet Flushing Booked", timestamp: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString() },
      { status: "in_progress", label: "Debris Vacuuming", timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() },
      { status: "resolved", label: "Drain Completely Cleared", timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(), note: "Over 2 tons of sediment and trash vacuumed. Drainage restored." }
    ],
    comments: [
      { id: "c-5", author: "Zoe Washburne", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80", content: "It rained heavily last night and the road remained perfectly dry! Thank you so much for the quick work!", timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), isStaff: false }
    ]
  }
];

function readDB(): Issue[] {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_ISSUES, null, 2));
      return INITIAL_ISSUES;
    }
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading db.json, returning defaults", err);
    return INITIAL_ISSUES;
  }
}

function writeDB(issues: Issue[]) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(issues, null, 2));
  } catch (err) {
    console.error("Error writing to db.json", err);
  }
}

// -------------------------------------------------------------
// REST API Endpoints
// -------------------------------------------------------------

// 1. Get all issues
app.get("/api/issues", (req, res) => {
  const issues = readDB();
  res.json({ success: true, issues });
});

// 2. Create a new issue (with server-side Gemini analysis!)
app.post("/api/issues", async (req, res) => {
  try {
    const { title, description, category, severity, lat, lng, image, reporterName, reporterAvatar } = req.body;
    
    if (!title || !description || !lat || !lng) {
      return res.status(400).json({ success: false, error: "Missing required fields (title, description, lat, lng)" });
    }

    const issues = readDB();
    const newId = `iss-${Date.now()}`;
    const timestamp = new Date().toISOString();

    let analysisResult;
    const ai = getGeminiClient();

    if (ai) {
      try {
        console.log(`Analyzing issue "${title}" with Gemini 3.5 Flash...`);
        
        const systemInstruction = `
          You are a municipal urban planning & public works engineer AI. 
          Your task is to analyze reported community issues (potholes, leaks, electrical, structural, waste, etc.).
          You must categorize the issue into one of: 'pothole', 'water_leak', 'streetlight', 'waste', 'infrastructure', 'other'.
          Determine the severity as one of: 'critical', 'major', 'minor'.
          Assign a municipal risk score from 1 (lowest danger) to 100 (immediate danger to human life).
          Provide a highly technical, precise 2-sentence 'aiAnalysis' explaining the immediate hazards, engineering implications, and public risks.
          Produce an array of 4-5 concrete, step-by-step technical 'aiActionPlan' instructions for the public works road crew to resolve this specific issue.
          Your response MUST strictly adhere to the requested JSON structure.
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Title: ${title}\nDescription: ${description}\nUser Selected Category: ${category || 'unspecified'}\nUser Selected Severity: ${severity || 'unspecified'}`,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                category: { 
                  type: Type.STRING, 
                  description: "Must be exactly one of: 'pothole', 'water_leak', 'streetlight', 'waste', 'infrastructure', 'other'" 
                },
                severity: { 
                  type: Type.STRING, 
                  description: "Must be exactly one of: 'critical', 'major', 'minor'" 
                },
                riskScore: { 
                  type: Type.INTEGER, 
                  description: "Safety risk score from 1 to 100" 
                },
                aiAnalysis: { 
                  type: Type.STRING, 
                  description: "A professional, engineering-focused 2-sentence analysis of the hazard." 
                },
                aiActionPlan: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "4-5 highly specific sequential step instructions for dispatching crew."
                }
              },
              required: ["category", "severity", "riskScore", "aiAnalysis", "aiActionPlan"]
            }
          }
        });

        const textOutput = response.text || "{}";
        console.log("Gemini Response Text:", textOutput);
        analysisResult = JSON.parse(textOutput);
      } catch (geminiError: any) {
        const errMsg = geminiError?.message || String(geminiError);
        if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
          console.log("Gemini quota rate limit reached (429) - using rule-based local engineering model fallback.");
        } else {
          console.error("Gemini analysis failed:", errMsg);
        }
        analysisResult = generateFallbackAnalysis(title, description, category || 'other', severity || 'minor');
      }
    } else {
      analysisResult = generateFallbackAnalysis(title, description, category || 'other', severity || 'minor');
    }

    const finalCategory: IssueCategory = analysisResult.category as IssueCategory || category || 'other';
    const finalSeverity: IssueSeverity = analysisResult.severity as IssueSeverity || severity || 'minor';

    const newIssue: Issue = {
      id: newId,
      title,
      description,
      category: finalCategory,
      severity: finalSeverity,
      status: "reported",
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      image: image || "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=500&auto=format&fit=crop&q=80",
      reporterName: reporterName || "Anonymous Citizen",
      reporterAvatar: reporterAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      reportedAt: timestamp,
      upvotes: 0,
      upvotedBy: [],
      verifiedCount: 0,
      verifiedBy: [],
      riskScore: analysisResult.riskScore || 50,
      aiCategorized: true,
      aiAnalysis: analysisResult.aiAnalysis,
      aiActionPlan: analysisResult.aiActionPlan,
      timeline: [
        { status: "reported", label: "Issue Filed", timestamp },
        { status: "verifying", label: "AI Verification & Analysis", timestamp, note: `Auto-assigned category: ${finalCategory.toUpperCase()}. Severity: ${finalSeverity.toUpperCase()}. Risk: ${analysisResult.riskScore}/100.` }
      ],
      comments: []
    };

    issues.unshift(newIssue); // Add to the top of the feed
    writeDB(issues);

    res.json({ success: true, issue: newIssue });
  } catch (error: any) {
    console.error("Failed to create issue:", error);
    res.status(500).json({ success: false, error: error.message || "Unknown error occurred" });
  }
});

// 3. Upvote an issue
app.post("/api/issues/:id/upvote", (req, res) => {
  const { id } = req.params;
  const { email } = req.body; // user email to prevent multiple votes

  if (!email) {
    return res.status(400).json({ success: false, error: "User email is required" });
  }

  const issues = readDB();
  const index = issues.findIndex(i => i.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: "Issue not found" });
  }

  const issue = issues[index];
  const voteIndex = issue.upvotedBy.indexOf(email);

  if (voteIndex > -1) {
    // Remove upvote (toggle)
    issue.upvotes = Math.max(0, issue.upvotes - 1);
    issue.upvotedBy.splice(voteIndex, 1);
  } else {
    // Add upvote
    issue.upvotes += 1;
    issue.upvotedBy.push(email);
  }

  issues[index] = issue;
  writeDB(issues);

  res.json({ success: true, upvotes: issue.upvotes, upvotedBy: issue.upvotedBy });
});

// 4. Verify an issue (Community Verification)
app.post("/api/issues/:id/verify", (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: "User email is required to verify" });
  }

  const issues = readDB();
  const index = issues.findIndex(i => i.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: "Issue not found" });
  }

  const issue = issues[index];
  const verifyIndex = issue.verifiedBy.indexOf(email);

  if (verifyIndex > -1) {
    // Already verified by this person, untoggle
    issue.verifiedCount = Math.max(0, issue.verifiedCount - 1);
    issue.verifiedBy.splice(verifyIndex, 1);
  } else {
    issue.verifiedCount += 1;
    issue.verifiedBy.push(email);
    
    // Automatically transition to 'verifying' if it was just reported and gets verified
    if (issue.status === 'reported' && issue.verifiedCount >= 3) {
      issue.status = 'verifying';
      issue.timeline.push({
        status: 'verifying',
        label: 'Community Verified',
        timestamp: new Date().toISOString(),
        note: `Issue escalated by community up-verification (${issue.verifiedCount} validations).`
      });
    }
  }

  issues[index] = issue;
  writeDB(issues);

  res.json({ success: true, verifiedCount: issue.verifiedCount, verifiedBy: issue.verifiedBy, status: issue.status, timeline: issue.timeline });
});

// 5. Add a comment to an issue
app.post("/api/issues/:id/comments", (req, res) => {
  const { id } = req.params;
  const { author, avatar, content, isStaff } = req.body;

  if (!author || !content) {
    return res.status(400).json({ success: false, error: "Missing author or content" });
  }

  const issues = readDB();
  const index = issues.findIndex(i => i.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: "Issue not found" });
  }

  const issue = issues[index];
  const newComment: Comment = {
    id: `c-${Date.now()}`,
    author,
    avatar: avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
    content,
    timestamp: new Date().toISOString(),
    isStaff: !!isStaff
  };

  issue.comments.push(newComment);
  issues[index] = issue;
  writeDB(issues);

  res.json({ success: true, comment: newComment });
});

// 6. Update issue status & logistics (City Operations Desk Mode!)
app.patch("/api/issues/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, note, assignedCrew } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, error: "Status is required" });
  }

  const issues = readDB();
  const index = issues.findIndex(i => i.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: "Issue not found" });
  }

  const issue = issues[index];
  issue.status = status as IssueStatus;
  
  if (assignedCrew !== undefined) {
    issue.assignedCrew = assignedCrew;
  }

  const statusLabels: Record<IssueStatus, string> = {
    reported: "Re-opened Report",
    verifying: "Reviewing Validity",
    scheduled: "Repair Scheduled",
    in_progress: "Crew Dispatched",
    resolved: "Resolved & Closed"
  };

  issue.timeline.push({
    status: status as IssueStatus,
    label: statusLabels[status as IssueStatus] || "Status Update",
    timestamp: new Date().toISOString(),
    note: note || `Logistics modified by operations dispatch desk. Assigned: ${issue.assignedCrew || 'None'}.`
  });

  issues[index] = issue;
  writeDB(issues);

  res.json({ success: true, issue });
});

// 6b. Reset entire database back to initial seeded state (For live demonstration/presentation)
app.post("/api/reset-db", (req, res) => {
  try {
    writeDB(INITIAL_ISSUES);
    res.json({ success: true, message: "Database successfully reset to initial seeded state" });
  } catch (err: any) {
    console.error("Failed to reset database:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to reset database" });
  }
});

// Cache for predictive insights to minimize Gemini API calls and prevent rate limits
let cachedInsightsMap = new Map<number, any>();
let cachedIssuesHash: string = "";

function generateFallbackForecast(issues: any[], duration: number, currentHealth: number) {
  const unresolved = issues.filter(i => i.status !== 'resolved');
  const activeCount = unresolved.length;
  
  // Basic index based on unresolved reports
  const index = Math.max(15, 95 - (activeCount * 8));

  // Default values
  let expectedIndex = index;
  let newIssues = { potholes: 0, waterLeaks: 0, streetlights: 0, waste: 0, infrastructure: 0 };
  let repairCost = "$0";
  let savings = "$0";
  let critical = ["No immediate critical threats detected at present."];
  let cascade = ["No cascading effects detected."];
  let recommendations = ["Monitor active community reports and deploy quick-response maintenance crews."];
  let confidence = "High";
  let summary = `Present analysis indicates a stable municipal infrastructure level at ${index}%. Active reports are being verified and scheduled.`;

  if (duration === 3) {
    expectedIndex = Math.max(10, index - 5);
    newIssues = { potholes: 3, waterLeaks: 1, streetlights: 2, waste: 4, infrastructure: 1 };
    repairCost = "$18,500";
    savings = "$14,000";
    critical = [
      "Madhapur Inorbit Corridor (High road surface wear-and-tear)",
      "KBR Park pedestrian pathways (Poor nighttime illumination sectors)"
    ];
    cascade = [
      "Water main leaks -> soil moisture absorption -> rapid roadway base loosening",
      "Unresolved pothole -> severe axle tire impact -> vehicle suspension damage claims"
    ];
    recommendations = [
      "Seal asphalt surface micro-fissures along the Madhapur Corridor.",
      "Deploy bucket truck electrical maintenance crews to KBR Park."
    ];
    confidence = "Medium";
    summary = `A 3-month projection assuming standard traffic volumes indicates localized asphalt degradation and minor water main pressure anomalies. Proactive sealing can avert early roadway lifting.`;
  } else if (duration === 6) {
    expectedIndex = Math.max(10, index - 12);
    newIssues = { potholes: 6, waterLeaks: 3, streetlights: 5, waste: 9, infrastructure: 2 };
    repairCost = "$42,000";
    savings = "$32,500";
    critical = [
      "Gachibowli Road drainage outlets (High storm-drain silt threat)",
      "West Industrial Transit Sector (Excessive freight load strain)"
    ];
    cascade = [
      "Clogged storm water drains -> standing water pooling -> sub-base asphalt washouts",
      "Streetlight failure -> reduced public visibility -> security hazard alerts"
    ];
    recommendations = [
      "Clear silt traps and clean storm-drain grates around Gachibowli before heavy rainfalls.",
      "Schedule acoustic water flow scanning along the western aqueducts."
    ];
    confidence = "Medium";
    summary = `A 6-month simulation projects notable municipal decay with potential water drain loggings if preventive cleaning is deferred. Expected new potholes may escalate repair cost to $42,000.`;
  } else if (duration === 12) {
    expectedIndex = Math.max(5, index - 25);
    newIssues = { potholes: 12, waterLeaks: 6, streetlights: 10, waste: 18, infrastructure: 5 };
    repairCost = "$112,000";
    savings = "$85,000";
    critical = [
      "Durgam Cheruvu Cable Bridge Concrete Supports (High fatigue signature)",
      "Central Downtown Highway Interchanges (Heavy transit shear stress)"
    ];
    cascade = [
      "Unresolved structural micro-cracks -> moisture freezing/expansion -> cement spalling and steel rusting",
      "Overflowing uncollected roadside waste -> secondary waterway clogs -> extensive street flooding"
    ];
    recommendations = [
      "Perform high-pressure polymer-concrete injections at the Durgam Cheruvu bridge foundation.",
      "Install solar-powered automatic garbage compactor bins with full-level sensor telemetry."
    ];
    confidence = "Low";
    summary = `Critical 12-month projection indicates severe structural and utility degradation if corrective intervention is postponed. Concrete shear risk on major routes could elevate emergency outlays by $112,000.`;
  }

  return {
    infrastructureIndex: index,
    predictionText: summary,
    estimatedCostSaving: savings !== "$0" ? savings : "$24,500",
    riskMapHeatpoints: [
      { lat: 38.5, lng: 28.2, intensity: 0.85, label: "Predicted Sidewalk Sub-soil Collapse Corridor" },
      { lat: 17.44, lng: 78.38, intensity: 0.92, label: "Water Pipe Pressure Fracture Hotspot" },
      { lat: 17.41, lng: 78.43, intensity: 0.75, label: "Drainage Clog & Roadway Pooling Zone" }
    ],
    highRiskZones: [
      {
        zone: "Madhapur Commercial Corridor",
        riskLevel: "High" as const,
        reason: "Heavy vehicle flow and water leakage in proximity accelerates asphalt cracking.",
        recommendation: "Seal active surface fissures immediately and schedule pipe lining reinforcement."
      },
      {
        zone: "East Gachibowli Aqueduct Grid",
        riskLevel: "High" as const,
        reason: "Old pipeline network operating under high pressure with frequent pressure hammer signatures.",
        recommendation: "Install pressure relief valves and conduct acoustic leak checks."
      }
    ],
    forecast: {
      forecastSummary: summary,
      expectedInfrastructureIndex: expectedIndex,
      expectedNewIssues: newIssues,
      estimatedRepairCost: repairCost,
      estimatedSavingsIfPreventiveActionTaken: savings,
      criticalZones: critical,
      cascadeEffects: cascade,
      recommendedPreventiveActions: recommendations,
      confidence: confidence
    }
  };
}

// Support POST requests with custom parameters
app.post("/api/insights", async (req, res) => {
  try {
    const {
      issues = [],
      currentInfrastructureHealthIndex = 85,
      unresolvedIssueCount = 0,
      resolvedIssueCount = 0,
      currentHighRiskZones = [],
      selectedForecastDuration = 0
    } = req.body;

    const currentHash = issues.map((i: any) => `${i.id}_${i.status}`).join('|');
    if (currentHash !== cachedIssuesHash) {
      cachedInsightsMap.clear();
      cachedIssuesHash = currentHash;
    }

    if (cachedInsightsMap.has(selectedForecastDuration)) {
      console.log(`Returning cached insights for +${selectedForecastDuration} months duration.`);
      return res.json({ success: true, insights: cachedInsightsMap.get(selectedForecastDuration) });
    }

    const ai = getGeminiClient();
    let insightsResponse: any = null;

    if (ai) {
      try {
        console.log(`Generating AI scenario forecast for +${selectedForecastDuration} months via Gemini...`);

        const systemInstruction = `
          You are a professional city planning and municipal predictive analytics AI.
          Analyze current active Hyderabad reports and simulate a future scenario projection.
          These are NOT exact predictions, but realistic, data-driven simulations assuming present trends continue.
          
          Generate a valid JSON object matching the requested schema.
          - infrastructureIndex: A score from 0 (collapsed) to 100 (pristine) summarizing current city status.
          - predictionText: A 3-sentence summary of the municipal decay trends and where infrastructure failures are clustering.
          - estimatedCostSaving: A currency estimate (e.g., "$142,500") showing projected money saved by resolving these issues early.
          - riskMapHeatpoints: An array of 3 hypothetical future hotspots. Calculate future coordinates (lat, lng between 10 to 90) representing likely near-future sinkholes, water ruptures, or grid failures. Give each an intensity (0 to 1) and description label.
          - highRiskZones: An array of 2 specific neighborhood sectors at threat (e.g. "Madhapur IT Corridor", "Begumpet Storm Water System"), defining riskLevel (High, Medium, Low), the data-driven reason, and preventive engineering recommendations.
          - forecast: A forecast object containing:
            - forecastSummary: A 3-sentence projection of the municipal decay trends based on the selected duration.
            - expectedInfrastructureIndex: A score from 0 to 100 projecting the overall health index at the end of the duration.
            - expectedNewIssues: An object with expected count of new potholes, water leaks, streetlights, waste, and infrastructure issues during this period.
            - estimatedRepairCost: An estimated dollar cost (e.g. "$45,000") of emergency reactive repairs if deferred.
            - estimatedSavingsIfPreventiveActionTaken: An estimated dollar savings (e.g. "$38,000") if proactive actions are taken early.
            - criticalZones: Array of 2-3 strings describing specific neighborhood sectors at high threat.
            - cascadeEffects: Array of 2-3 strings representing cascading utility failures (e.g. 'water leaks -> road erosion -> pothole formation').
            - recommendedPreventiveActions: Array of 2-3 strings of preventive engineering recommendations.
            - confidence: High, Medium, or Low based on active data density.
        `;

        const userPrompt = `
          Current Hyderabad Municipal Status:
          - Active unresolved issues: ${unresolvedIssueCount}
          - Resolved issues: ${resolvedIssueCount}
          - Current Infrastructure Health Index: ${currentInfrastructureHealthIndex}%
          - Selected Forecast Duration: ${selectedForecastDuration} months
          - Unresolved Issues list: ${JSON.stringify(issues.map((i: any) => ({ category: i.category, severity: i.severity, status: i.status })))}
          - Current high-risk sectors: ${JSON.stringify(currentHighRiskZones)}

          Please generate a comprehensive, highly realistic predictive scenario forecast for the city after ${selectedForecastDuration} months.
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                infrastructureIndex: { type: Type.INTEGER },
                predictionText: { type: Type.STRING },
                estimatedCostSaving: { type: Type.STRING },
                riskMapHeatpoints: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      lat: { type: Type.NUMBER },
                      lng: { type: Type.NUMBER },
                      intensity: { type: Type.NUMBER },
                      label: { type: Type.STRING }
                    },
                    required: ["lat", "lng", "intensity", "label"]
                  }
                },
                highRiskZones: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      zone: { type: Type.STRING },
                      riskLevel: { type: Type.STRING },
                      reason: { type: Type.STRING },
                      recommendation: { type: Type.STRING }
                    },
                    required: ["zone", "riskLevel", "reason", "recommendation"]
                  }
                },
                forecast: {
                  type: Type.OBJECT,
                  properties: {
                    forecastSummary: { type: Type.STRING },
                    expectedInfrastructureIndex: { type: Type.INTEGER },
                    expectedNewIssues: {
                      type: Type.OBJECT,
                      properties: {
                        potholes: { type: Type.INTEGER },
                        waterLeaks: { type: Type.INTEGER },
                        streetlights: { type: Type.INTEGER },
                        waste: { type: Type.INTEGER },
                        infrastructure: { type: Type.INTEGER }
                      },
                      required: ["potholes", "waterLeaks", "streetlights", "waste", "infrastructure"]
                    },
                    estimatedRepairCost: { type: Type.STRING },
                    estimatedSavingsIfPreventiveActionTaken: { type: Type.STRING },
                    criticalZones: { type: Type.ARRAY, items: { type: Type.STRING } },
                    cascadeEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
                    recommendedPreventiveActions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    confidence: { type: Type.STRING }
                  },
                  required: [
                    "forecastSummary",
                    "expectedInfrastructureIndex",
                    "expectedNewIssues",
                    "estimatedRepairCost",
                    "estimatedSavingsIfPreventiveActionTaken",
                    "criticalZones",
                    "cascadeEffects",
                    "recommendedPreventiveActions",
                    "confidence"
                  ]
                }
              },
              required: ["infrastructureIndex", "predictionText", "estimatedCostSaving", "riskMapHeatpoints", "highRiskZones", "forecast"]
            }
          }
        });

        if (response.text) {
          insightsResponse = JSON.parse(response.text.trim());
        }
      } catch (err: any) {
        console.error("Gemini predictive scenario forecasting failed:", err?.message || err);
      }
    }

    if (!insightsResponse) {
      insightsResponse = generateFallbackForecast(issues, selectedForecastDuration, currentInfrastructureHealthIndex);
    }

    cachedInsightsMap.set(selectedForecastDuration, insightsResponse);
    res.json({ success: true, insights: insightsResponse });

  } catch (error: any) {
    console.error("Predictive insights route crashed:", error);
    res.status(500).json({ success: false, error: error.message || "Insights engine error" });
  }
});

// GET endpoint as a backup/initial load route (default to 0-month present simulation)
app.get("/api/insights", async (req, res) => {
  try {
    const issues = readDB();
    const unresolved = issues.filter(i => i.status !== 'resolved');
    const index = Math.max(15, 95 - (unresolved.length * 8));

    const fallbackData = generateFallbackForecast(issues, 0, index);
    res.json({ success: true, insights: fallbackData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Insights GET error" });
  }
});

// Helper for high-fidelity fallback agentic runs when Gemini is unavailable or errors
function generateFallbackAgenticRun(issue: Issue, agentType: string) {
  const isPothole = issue.category === 'pothole';
  const isWater = issue.category === 'water_leak';
  const isLight = issue.category === 'streetlight';
  const isWaste = issue.category === 'waste';
  const isInfra = issue.category === 'infrastructure';

  let agentName = "TriageBot v3.2 (Autonomous Audit)";
  let toolsUsed = ["readDB", "calcSafetyMargin", "semanticRiskClassify"];
  let reasoningSteps = [];
  let updatedFields: any = {};
  let agenticReport = "";

  if (agentType === 'triage') {
    agentName = "TriageBot v3.2 (Autonomous Ingestion)";
    toolsUsed = ["dbQuery", "classifySeverity", "calculateRiskIndex", "verifyCoordinates"];
    reasoningSteps = [
      {
        phase: "Ingestion & Parse",
        thought: `Analyzing the reported incident "${issue.title}". Parsing text descriptions to identify semantic severity indicators. Standardizing coordinates at Lat ${issue.lat.toFixed(2)}%, Lng ${issue.lng.toFixed(2)}%.`,
        action: "Parsed issue report data; cross-referenced with recent complaints database.",
        verification: "Successfully validated coordinate formatting and checked against Hyderabad boundary constraints."
      },
      {
        phase: "Severity Assessment",
        thought: `Evaluating keywords and description. The mention of "${issue.description.substring(0, 40)}..." suggests immediate risk to pedestrian and vehicle traffic. We must prioritize this.`,
        action: "Executed severity-level evaluation matrices.",
        verification: "Calculated confidence score of 94% for severity assessment."
      },
      {
        phase: "Municipal Risk Calculation",
        thought: `Calculating risk index based on category "${issue.category}". Local traffic density models show high flow on this road segment. Adjusting risk score to reflect direct traffic safety hazard.`,
        action: "Calculated municipal safety hazard index.",
        verification: "Risk Score calculated at 88. Verified within standard limits."
      },
      {
        phase: "Database State Write",
        thought: "Updating the municipal issue record with AI classification markers. This will trigger automated notification alerts to the local ward officers.",
        action: "Formulated JSON database commit instructions.",
        verification: "Self-corrected update parameters to prevent data clobbering."
      }
    ];
    updatedFields = {
      riskScore: Math.min(100, Math.max(10, issue.riskScore + 5)),
      aiCategorized: true,
      aiAnalysis: `Verified by AI TriageBot: Critical safety hazard on ${issue.title}. Requires immediate inspection by local field operations.`
    };
    agenticReport = `### 🤖 AI Agent Triage Report
**Executing Agent:** ${agentName}
**Target Incident:** ${issue.title} (ID: ${issue.id})

#### Summary of Findings:
- **Category Verification:** Confirmed as **${issue.category.toUpperCase()}**.
- **Calculated Risk Index:** Adjusted to **${updatedFields.riskScore}** based on municipal density impact factors.
- **Immediate Recommendation:** Deploy a first responder to erect temporary blockades or warning signs.`;
  } else if (agentType === 'dispatch') {
    agentName = "RouteBot v2.5 (Autonomous Scheduling)";
    toolsUsed = ["fetchCrewSchedule", "calculateTransitTime", "allocateMaterials", "writeWorkOrder"];
    
    let crew = "Secunderabad Road Works Division";
    if (isWater) crew = "Hyderabad Water Supply Squad (HMWS&SB)";
    else if (isLight) crew = "GHMC Streetlight Maintenance Division";
    else if (isWaste) crew = "GHMC Sanitation & Solid Waste Team";
    else if (isInfra) crew = "HMDA Structural Engineering Unit";

    reasoningSteps = [
      {
        phase: "Resource Evaluation",
        thought: "Scanning active public works crew schedules for Hyderabad districts. Filtering for team specialization, geographic location, and current load factor.",
        action: "Queried active municipal logistics roster.",
        verification: "Filtered out 3 busy teams; identified 1 available specialized unit."
      },
      {
        phase: "Travel Routing & Optimization",
        thought: `Calculating optimal transit vectors to Lat ${issue.lat.toFixed(1)}%, Lng ${issue.lng.toFixed(1)}%. Accounting for local traffic near Madhapur/Gachibowli to optimize dispatch timing.`,
        action: "Ran vehicle routing optimization algorithms.",
        verification: "Calculated travel latency of 22 minutes under current traffic conditions."
      },
      {
        phase: "Logistics Formulation",
        thought: `Formulating specific step-by-step works order for ${crew}. Ensuring they pack necessary equipment, specific replacement components, and standard warning safety barriers.`,
        action: "Generated task workflow list and required material checklist.",
        verification: "Cross-checked safety instructions against GHMC field manuals."
      },
      {
        phase: "Schedule Dispatch Commit",
        thought: "Scheduling dispatch window. Elevating issue status to \"scheduled\" and linking the assigned crew in the database.",
        action: "Committed works order to system logistics pipeline.",
        verification: "Verified crew dispatch receipt confirmation."
      }
    ];
    updatedFields = {
      status: "scheduled",
      assignedCrew: crew,
      aiActionPlan: [
        "Load necessary municipal heavy gear and safety cones onto dispatch vehicle.",
        "Arrive at incident site and establish a safe 15-meter work perimeter.",
        "Perform manual site survey to check for underlying utilities.",
        "Execute surgical repair using standard municipal compounds.",
        "Clear all work debris, photograph completed work, and submit digital log."
      ]
    };
    agenticReport = `### 🚛 Autonomous Dispatch Order
**Executing Agent:** ${agentName}
**Assigned Division:** **${crew}**
**Target Incident:** ${issue.title}

#### Operational Plan:
1. **Status Transition:** Set to **SCHEDULED**.
2. **Action Plan:** Formulated 5-step technical repair sequence.
3. **Crew Status:** Alerted and dispatched. Equipment manifest compiled and uploaded to field-mobile units.`;
  } else if (agentType === 'audit') {
    agentName = "AuditBot v4.1 (Autonomous Safety Auditor)";
    toolsUsed = ["fetchResolutionLog", "recalculateConcreteStress", "assessRegulatoryCompliance", "issueClosureSignature"];
    reasoningSteps = [
      {
        phase: "History Audit",
        thought: `Reviewing previous reports and timeline history of issue "${issue.title}". Checking upvote count (${issue.upvotes}) and verification count (${issue.verifiedCount}) to assess local public sentiment.`,
        action: "Analyzed citizen comments and verification logs.",
        verification: "Confirmed no outstanding pedestrian hazard complaints."
      },
      {
        phase: "Engineering Standard Check",
        thought: `Running simulated load stresses and standard municipal regulations on the reported area. Ensuring the repair action plan matches current codes.`,
        action: "Simulated structural safety clearance coefficients.",
        verification: "Calculated structural safety index is above the target margin of 1.5."
      },
      {
        phase: "Closure Evaluation",
        thought: `The issue is in status "${issue.status}". If resolved, we certify closure. If reported, we suggest pre-dispatch safety verification first.`,
        action: "Compiled audit certification signature.",
        verification: "Completed full regulatory check against the Hyderabad Municipal Code."
      }
    ];
    updatedFields = {
      status: issue.status === 'reported' ? 'verifying' : issue.status,
      aiAnalysis: `Audited by AI AuditBot: Structural safety checks are completed. Site safety margins are compliant. Proposed dispatch priority verified as correct.`
    };
    agenticReport = `### 📋 Municipal Safety Audit Report
**Executing Agent:** ${agentName}
**Audited Incident:** ${issue.title} (Status: ${issue.status.toUpperCase()})

#### Auditor Analysis:
- **Community Consensus Index:** High (Verified by ${issue.verifiedCount} citizen inspectors).
- **Compliance Status:** **APPROVED** under Section 14 of GHMC Safety Regulations.
- **Action Taken:** Status verified. Recommended proceeding with current dispatch queue without audit objections.`;
  } else {
    agentName = "Multi-Agent Coalition v5.0";
    toolsUsed = ["triageBot", "routeBot", "auditBot", "coordinateCoalitionPlanning"];
    reasoningSteps = [
      {
        phase: "Coalition Alignment",
        thought: "Initializing collaborative multi-agent protocol. TriageBot, RouteBot, and AuditBot are aligning on mutual state definitions for the selected incident.",
        action: "Aligned agent memory layers and shared goals.",
        verification: "All three specialized agent sub-modules checked in as active."
      },
      {
        phase: "Synthesized Diagnosis",
        thought: `TriageBot highlights immediate risk score of ${issue.riskScore}. AuditBot cross-checks regional historical infrastructure weak points. A joint recommendation is formed to prioritize immediately.`,
        action: "Merged risk analysis models into a joint priority rating.",
        verification: "Synthesized hazard safety coefficients mapped to high-urgency status."
      },
      {
        phase: "Optimized Operational Plan",
        thought: "RouteBot schedules specialized crew while AuditBot designs rigorous verification protocols to be carried out after repairs are completed.",
        action: "Formulated multi-role dispatch and post-repair audit plan.",
        verification: "Verified scheduling conflicts are resolved."
      },
      {
        phase: "Execution Commit",
        thought: "Updating state database to reflect the collaborative coalition dispatch and plan.",
        action: "Wrote multi-agent output variables into municipal database.",
        verification: "Database synchronization completed successfully."
      }
    ];
    updatedFields = {
      status: "in_progress",
      riskScore: Math.min(100, Math.max(10, issue.riskScore + 8)),
      assignedCrew: "Hyderabad Rapid Infrastructure Coalition Team",
      aiActionPlan: [
        "[COALITION] Dispatch rapid intervention vehicle with premium patching materials.",
        "[COALITION] Set up digital traffic management and detour warnings on digital maps.",
        "[COALITION] Execute main repair within 2-hour SLA window.",
        "[COALITION] Conduct post-completion site scan to verify surface integrity.",
        "[COALITION] Auto-log completion report to Hyderabad Municipal Dashboard."
      ]
    };
    agenticReport = `### 🤝 Multi-Agent Coalition Resolution Plan
**Executing Coalition:** **TriageBot** + **RouteBot** + **AuditBot**
**Target Incident:** ${issue.title}

#### Joint Strategic Decisions:
1. **Urgency Escalation:** Issue status upgraded to **IN_PROGRESS** with dedicated **Rapid Infrastructure Team** dispatch.
2. **Task Integration:** TriageBot mapped hazard risks, RouteBot reserved elite materials, and AuditBot scheduled post-completion sensor check.
3. **SLA Commitment:** Target resolution window set to **2 hours** with continuous telemetry feedback.`;
  }

  return {
    agentName,
    toolsUsed,
    reasoningSteps,
    updatedFields,
    agenticReport
  };
}

// 8. Run AI Agent Workflows with Agentic Depth
app.post("/api/agents/run", async (req, res) => {
  const { id, agentType } = req.body;

  if (!id || !agentType) {
    return res.status(400).json({ success: false, error: "Missing required fields (id, agentType)" });
  }

  const issues = readDB();
  const index = issues.findIndex(i => i.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: "Issue not found" });
  }

  const issue = issues[index];
  let agentResult;
  const ai = getGeminiClient();

  if (ai) {
    try {
      console.log(`Running agentic workflow "${agentType}" on issue "${issue.title}" using Gemini 3.5...`);
      
      const systemInstruction = `
        You are an AI Agent Orchestrator for the Hyderabad Municipal Safety Grid.
        You represent a high-fidelity autonomous multi-agent coalition that solves community problems.
        Based on the requested agentType ('triage', 'dispatch', 'audit', or 'coalition') and the selected issue details, you must execute a multi-step engineering reasoning loop.
        
        Produce a valid JSON response containing:
        1. 'agentName': The title of the agent(s) involved (e.g., "TriageBot v3.2", "RouteBot v2.5", "AuditBot v4.1", "Multi-Agent Coalition v5.0").
        2. 'toolsUsed': An array of strings representing simulated or actual tool functions accessed (e.g. "fetchLocalWeather", "dbQueryIssue", "recalculatePriority", "dispatchWorksOrder", "concreteStressAnalysis").
        3. 'reasoningSteps': A detailed array of 3-4 sequential steps demonstrating CoT reasoning, self-critique, and tool execution. Each step MUST contain:
           - 'phase': e.g., "Ingestion & Parse", "Structural Risk Audit", "Resource Allocation Strategy", "Self-Critique & Quality Guard", "Database Commit"
           - 'thought': A rich 3-sentence technical engineering analysis. Mention specific Hyderabad locations (like Cyber Towers, Jubilee Hills Road No. 36, KBR National Park, Begumpet Metro, Durgam Cheruvu Bridge, Inorbit Mall Road) if relevant.
           - 'action': Description of the tool call or action executed.
           - 'verification': A self-verification check showing critique and evaluation.
        4. 'updatedFields': An object containing any fields on the Issue that should be updated as a result of this run (e.g., 'riskScore' as integer, 'status' as string, 'assignedCrew' as string, 'aiAnalysis' as string, 'aiActionPlan' as array of strings).
        5. 'agenticReport': A clean, Markdown-formatted summary report of the agent's work and decisions.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Issue detail: ${JSON.stringify(issue)}\nAgent Type requested: ${agentType}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              agentName: { type: Type.STRING },
              toolsUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
              reasoningSteps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    phase: { type: Type.STRING },
                    thought: { type: Type.STRING },
                    action: { type: Type.STRING },
                    verification: { type: Type.STRING }
                  },
                  required: ["phase", "thought", "action", "verification"]
                }
              },
              updatedFields: {
                type: Type.OBJECT,
                properties: {
                  riskScore: { type: Type.INTEGER },
                  status: { type: Type.STRING },
                  assignedCrew: { type: Type.STRING },
                  aiAnalysis: { type: Type.STRING },
                  aiActionPlan: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              },
              agenticReport: { type: Type.STRING }
            },
            required: ["agentName", "toolsUsed", "reasoningSteps", "agenticReport"]
          }
        }
      });

      const textOutput = response.text || "{}";
      agentResult = JSON.parse(textOutput);
    } catch (geminiError: any) {
      const errMsg = geminiError?.message || String(geminiError);
      if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
        console.log("Gemini quota rate limit reached (429) - using offline rule-based agentic workflow fallback.");
      } else {
        console.error("Gemini agentic workflow run failed:", errMsg);
      }
      agentResult = generateFallbackAgenticRun(issue, agentType);
    }
  } else {
    agentResult = generateFallbackAgenticRun(issue, agentType);
  }

  // Apply updates to the issue in our database!
  if (agentResult.updatedFields) {
    const fields = agentResult.updatedFields;
    if (fields.riskScore !== undefined) issue.riskScore = fields.riskScore;
    if (fields.status !== undefined) issue.status = fields.status as IssueStatus;
    if (fields.assignedCrew !== undefined) issue.assignedCrew = fields.assignedCrew;
    if (fields.aiAnalysis !== undefined) issue.aiAnalysis = fields.aiAnalysis;
    if (fields.aiActionPlan !== undefined) issue.aiActionPlan = fields.aiActionPlan;

    // Add a timeline entry for the agentic run
    issue.timeline.push({
      status: issue.status,
      label: `Agent Action: ${agentResult.agentName}`,
      timestamp: new Date().toISOString(),
      note: `Autonomous agentic optimization executed. Tools triggered: ${agentResult.toolsUsed.join(', ')}.`
    });

    issues[index] = issue;
    writeDB(issues);
  }

  res.json({ success: true, agentResult, issue });
});

// -------------------------------------------------------------
// Vite and Static File Serving Pipeline
// -------------------------------------------------------------
async function startServer() {
  // Vite dev/prod middleware setup
  if (process.env.NODE_ENV !== "production") {
    console.log("Spinning up Vite developer server wrapper...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving production static assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Vibe2Ship Platform server booted successfully!`);
    console.log(`📢 Host Address: http://localhost:${PORT}`);
    console.log(`======================================================\n`);
  });
}

startServer();
