import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json());

// Initialize GoogleGenAI client if GEMINI_API_KEY is present
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory cache for live telemetry
let cachedLiveData: {
  timestamp: string;
  source: string;
  objects: any[];
} | null = null;
let lastFetchEpoch = 0;

// Helper to determine operator & country from satellite name
function inferMetadata(name: string) {
  const upper = name.toUpperCase();
  if (upper.includes('ISS') || upper.includes('ZARYA')) return { operator: 'NASA / Roscosmos', country: 'Multinational' };
  if (upper.includes('TIANGONG') || upper.includes('TIANHE') || upper.includes('SHENZHOU')) return { operator: 'CNSA', country: 'China' };
  if (upper.includes('STARLINK')) return { operator: 'SpaceX', country: 'USA' };
  if (upper.includes('ONEWEB')) return { operator: 'Eutelsat OneWeb', country: 'UK' };
  if (upper.includes('HST') || upper.includes('HUBBLE')) return { operator: 'NASA / STScI', country: 'USA' };
  if (upper.includes('NOAA') || upper.includes('GOES')) return { operator: 'NOAA / NASA', country: 'USA' };
  if (upper.includes('ENVISAT') || upper.includes('SENTINEL') || upper.includes('METOP')) return { operator: 'ESA', country: 'Europe' };
  if (upper.includes('COSMOS') || upper.includes('SOYUZ') || upper.includes('PROGRESS')) return { operator: 'Roscosmos', country: 'Russia' };
  if (upper.includes('FENGYUN') || upper.includes('YAOGAN')) return { operator: 'CMA / CNSA', country: 'China' };
  if (upper.includes('NAVSTAR') || upper.includes('GPS')) return { operator: 'US Space Force', country: 'USA' };
  if (upper.includes('GALILEO') || upper.includes('GSAT')) return { operator: 'ESA / EUSPA', country: 'Europe' };
  if (upper.includes('IRIDIUM')) return { operator: 'Iridium Communications', country: 'USA' };
  if (upper.includes('LANDSAT')) return { operator: 'USGS / NASA', country: 'USA' };
  if (upper.includes('TERRA') || upper.includes('AQUA') || upper.includes('AURA')) return { operator: 'NASA EOS', country: 'USA' };
  if (upper.includes('AJISAI')) return { operator: 'JAXA', country: 'Japan' };
  return { operator: 'Civil / Scientific Operator', country: 'Global' };
}

// Convert CelesTrak GP Record to OrbitalObject
function parseGPRecord(gp: any) {
  const name = gp.OBJECT_NAME || `NORAD-${gp.NORAD_CAT_ID}`;
  const upperName = name.toUpperCase();

  let type: 'PAYLOAD' | 'DEBRIS' | 'ROCKET_BODY' = 'PAYLOAD';
  if (upperName.includes('DEB') || upperName.includes('DEBRIS') || upperName.includes('FRAG')) {
    type = 'DEBRIS';
  } else if (
    upperName.includes('R/B') ||
    upperName.includes('ROCKET') ||
    upperName.includes('STAGE') ||
    upperName.includes('CENTAUR') ||
    upperName.includes('AGENA') ||
    upperName.includes('FREGAT') ||
    upperName.includes('BREEZE') ||
    upperName.includes('DELTA') ||
    upperName.includes('ATLAS') ||
    upperName.includes('SL-')
  ) {
    type = 'ROCKET_BODY';
  }

  const meanMotion = parseFloat(gp.MEAN_MOTION); // rev/day
  const periodMin = meanMotion > 0 ? 1440 / meanMotion : 95.0;
  const nRadS = (meanMotion * 2 * Math.PI) / 86400;
  const mu = 398600.4418;
  const semiMajorAxis = Math.cbrt(mu / (nRadS * nRadS));
  const altitude = Math.max(120, semiMajorAxis - 6378.137);
  const velocity = Math.sqrt(mu / semiMajorAxis);

  let regime: 'LEO' | 'MEO' | 'GEO' = 'LEO';
  if (altitude >= 35000) regime = 'GEO';
  else if (altitude >= 2000) regime = 'MEO';

  const meta = inferMetadata(name);

  return {
    id: `norad-${gp.NORAD_CAT_ID}`,
    name,
    catalogId: String(gp.NORAD_CAT_ID),
    internationalDesignator: gp.OBJECT_ID || 'N/A',
    type,
    regime,
    operator: meta.operator,
    country: meta.country,
    launchDate: gp.OBJECT_ID ? `19${gp.OBJECT_ID.slice(0, 2)}` : '2000',
    status: type === 'PAYLOAD' ? 'OPERATIONAL' : 'DERELICT',
    altitude: Math.round(altitude * 10) / 10,
    inclination: Math.round(parseFloat(gp.INCLINATION) * 100) / 100,
    eccentricity: parseFloat(gp.ECCENTRICITY) || 0.0001,
    raan: Math.round(parseFloat(gp.RA_OF_ASC_NODE) * 100) / 100,
    argPerigee: Math.round(parseFloat(gp.ARG_OF_PERICENTER) * 100) / 100,
    meanAnomaly: Math.round(parseFloat(gp.MEAN_ANOMALY) * 100) / 100,
    semiMajorAxis: Math.round(semiMajorAxis * 10) / 10,
    orbitalPeriod: Math.round(periodMin * 10) / 10,
    velocity: Math.round(velocity * 100) / 100,
    epoch: gp.EPOCH,
    isLive: true,
  };
}

// Live satellite data endpoint with caching & fast fallback
app.get('/api/live-orbit-data', async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';
  const now = Date.now();

  // Return cached data if fresh (less than 5 minutes old) and not forcing refresh
  if (cachedLiveData && !forceRefresh && now - lastFetchEpoch < 300000) {
    return res.json({
      success: true,
      source: cachedLiveData.source,
      cached: true,
      timestamp: cachedLiveData.timestamp,
      count: cachedLiveData.objects.length,
      objects: cachedLiveData.objects,
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    // Fetch stations and visual groups in parallel
    const [stationsRes, visualRes] = await Promise.all([
      fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json', {
        signal: controller.signal,
        headers: { 'User-Agent': 'OrbitalCommand/1.0 (Civil Space Traffic)' },
      }).catch(() => null),
      fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=json', {
        signal: controller.signal,
        headers: { 'User-Agent': 'OrbitalCommand/1.0 (Civil Space Traffic)' },
      }).catch(() => null),
    ]);

    clearTimeout(timeout);

    const stationsData = stationsRes && stationsRes.ok ? await stationsRes.json() : [];
    const visualData = visualRes && visualRes.ok ? await visualRes.json() : [];

    const rawObjects = [...(Array.isArray(stationsData) ? stationsData : []), ...(Array.isArray(visualData) ? visualData : [])];

    if (rawObjects.length > 0) {
      // Deduplicate by NORAD_CAT_ID
      const seen = new Set<number>();
      const parsed: any[] = [];

      for (const item of rawObjects) {
        if (!item.NORAD_CAT_ID || seen.has(item.NORAD_CAT_ID)) continue;
        seen.add(item.NORAD_CAT_ID);
        try {
          parsed.push(parseGPRecord(item));
        } catch {
          // Ignore invalid records
        }
      }

      cachedLiveData = {
        timestamp: new Date().toISOString(),
        source: 'CELESTRAK_NORAD_LIVE_GP',
        objects: parsed,
      };
      lastFetchEpoch = now;

      return res.json({
        success: true,
        source: 'CELESTRAK_NORAD_LIVE_GP',
        cached: false,
        timestamp: cachedLiveData.timestamp,
        count: parsed.length,
        objects: parsed,
      });
    }
  } catch (err: any) {
    console.warn('Live fetch warning (falling back to telemetry cache):', err.message);
  }

  // Fallback to cached if available, or signal fallback
  if (cachedLiveData) {
    return res.json({
      success: true,
      source: 'CELESTRAK_NORAD_CACHED',
      cached: true,
      timestamp: cachedLiveData.timestamp,
      count: cachedLiveData.objects.length,
      objects: cachedLiveData.objects,
    });
  }

  return res.json({
    success: true,
    source: 'OFFLINE_TELEMETRY_CATALOG',
    cached: false,
    timestamp: new Date().toISOString(),
    count: 0,
    objects: [],
  });
});

// Gemini API route: Generate Mission Brief
app.post('/api/mission-brief', async (req, res) => {
  try {
    const { objectA, objectB, conjunction, simulation } = req.body;

    if (!ai) {
      return res.json({
        source: 'deterministic_engine',
        briefing: generateDeterministicBriefing(objectA, objectB, conjunction, simulation),
      });
    }

    const prompt = `You are the Lead Orbital Dynamics Officer at ORBITAL COMMAND Space Situational Awareness Operations.
Generate a formal, highly technical and precise MISSION BRIEFING for the following orbital objects and conjunction geometry:

PRIMARY OBJECT (OBJECT A):
Name: ${objectA?.name || 'N/A'} (Catalog ID: ${objectA?.catalogId || 'N/A'})
Type: ${objectA?.type || 'N/A'} | Operator: ${objectA?.operator || 'N/A'}
Orbit: Altitude ${objectA?.altitude} km | Inclination ${objectA?.inclination}° | Period ${objectA?.orbitalPeriod} min | Eccentricity ${objectA?.eccentricity}

${objectB ? `SECONDARY OBJECT (OBJECT B):
Name: ${objectB?.name || 'N/A'} (Catalog ID: ${objectB?.catalogId || 'N/A'})
Type: ${objectB?.type || 'N/A'} | Operator: ${objectB?.operator || 'N/A'}
Orbit: Altitude ${objectB?.altitude} km | Inclination ${objectB?.inclination}° | Period ${objectB?.orbitalPeriod} min` : ''}

${conjunction ? `CONJUNCTION TELEMETRY:
Current Separation: ${conjunction.currentSeparation} km
Predicted Minimum Separation (TCA): ${conjunction.minSeparation} km
Time to Closest Approach: ${conjunction.timeToTca} min
Relative Velocity at TCA: ${conjunction.relativeVelocity} km/s
Conjunction Status: ${conjunction.status}
Crossing Geometry: ${conjunction.geometry || 'Coplanar descending node intersection'}` : ''}

${simulation ? `SIMULATION PARAMETERS:
Modified Altitude: ${simulation.modifiedAltitude} km (Delta: ${simulation.deltaAltitude} km)
Delta-V Required: ${simulation.deltaV} m/s
New Orbital Period: ${simulation.newPeriod} min` : ''}

Format your output strictly using this structured operational template:
[CLASSIFICATION: UNCLASSIFIED // CIVIL SPACE TRAFFIC MANAGEMENT]
1. EXECUTIVE SUMMARY (2 concise sentences)
2. ORBITAL REGIME & TRACKING CONFIDENCE
3. GEOMETRIC INTERSECTION ANALYSIS (relative velocity vector, nodal crossing, miss distance)
4. RISK VECTOR & UNCERTAINTY COVARIANCE
5. OPERATIONAL RECOMMENDATION (Maneuver proposal, COLA burn parameters if needed, or Continue Active Tracking)

Tone: Rigorous, dispassionate, authoritative aerospace operations language (like NASA CARA, ESA Space Debris Office, LeoLabs). Avoid marketing fluff, exclamation marks, or conversational chat.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({
      source: 'gemini-3.8-flash',
      briefing: response.text || generateDeterministicBriefing(objectA, objectB, conjunction, simulation),
    });
  } catch (error: any) {
    console.error('Mission brief error:', error);
    const { objectA, objectB, conjunction, simulation } = req.body;
    res.json({
      source: 'deterministic_engine_fallback',
      briefing: generateDeterministicBriefing(objectA, objectB, conjunction, simulation),
    });
  }
});

// Gemini API route: Generate Structured Orbital Crisis Scenario
app.post('/api/generate-crisis', async (req, res) => {
  try {
    const { scenarioType = 'RANDOM' } = req.body;

    if (!ai) {
      return res.json({
        success: true,
        source: 'deterministic_crisis_engine',
        data: null, // Client will construct from its deterministic generator
      });
    }

    const prompt = `You are the Lead Orbital Safety Director at the Combined Space Operations Center (CSpOC).
Generate a structured, hypothetical orbital crisis involving an operational satellite and space debris/derelict stage.
Scenario Type: ${scenarioType}

Return ONLY valid JSON matching this exact structure (no markdown fences, no explanatory text):
{
  "title": "CONJUNCTION EMERGENCY: [Satellite Name] vs [Debris/Rocket Name]",
  "codeName": "OPERATION [CODE NAME]",
  "primaryAsset": {
    "name": "[Real-style satellite name, e.g. SENTINEL-6B CERES or STARLINK-3104]",
    "operator": "[Agency or company, e.g. ESA / EUMETSAT]",
    "altitude": 735.4,
    "inclination": 66.0,
    "missionRole": "[Mission description, e.g. Ocean Radar Altimetry & Storm Surge Early Warning]",
    "targetRegion": "[Geographical impact zone, e.g. East African Seaboard & Western Indian Ocean]",
    "fuelRemainingDeltaV": 14.8,
    "criticalService": "[Critical life/economic service, e.g. UN Cyclone Early Warning for 4.8M residents]",
    "reactionWheelStatus": "[Technical constraint, e.g. Reaction Wheel 2 friction requiring 35m pre-burn slew thermal conditioning]"
  },
  "secondaryHazard": {
    "name": "[Debris name, e.g. SL-16 DERELICT R/B FRAGMENT #38921]",
    "altitude": 735.8,
    "hazardType": "FRAGMENTATION_DEBRIS",
    "radarCrossSectionM2": 0.12,
    "estimatedFragmentsIfCollision": 7400
  },
  "initialTcaMinutes": 840,
  "nominalMissDistanceMeters": 78.4,
  "relativeVelocityKmS": 14.3,
  "collisionProbability": 0.0142,
  "covariance": {
    "alongTrackUncertaintyM": 320,
    "crossTrackUncertaintyM": 180,
    "radialUncertaintyM": 65
  },
  "missionConstraints": [
    "Humanitarian window in T-8h",
    "Fuel budget limited to 14.8 m/s remaining",
    "Reaction wheel requires slow slew conditioning",
    "735km band contains 1200+ active satellites"
  ],
  "perspectives": {
    "missionAnalyst": {
      "name": "Dr. Sarah Vance",
      "stance": "PROTECT SENSOR UPTIME & HUMANITARIAN COVERAGE",
      "recommendation": "Delay burn until T-4h; do not kill cyclone telemetry prematurely",
      "quote": "If we burn now, ocean radar is offline when Cyclone Kalani hits the coast. Wait for next radar pass."
    },
    "satelliteOperator": {
      "name": "Commander Marcus Thorne",
      "stance": "CONSERVE PROPELLANT & SAFEGUARD BUS INTEGRITY",
      "recommendation": "Execute 1.45 m/s prograde burn early at T-6h",
      "quote": "Reaction wheel 2 is dragging. Waiting until T-2h risks attitude loss and catastrophic tumble. Burn early."
    },
    "sustainabilityAnalyst": {
      "name": "Dr. Elena Rostova",
      "stance": "ABSOLUTE ZERO-TOLERANCE COLLISION MITIGATION",
      "recommendation": "Burn immediately. 1.4% Pc risks 7,400 fragments in the 735km orbital commons",
      "quote": "A 1.4% collision risk at 14 km/s will contaminate polar LEO for 65 years. Never gamble with Kessler syndrome."
    },
    "independentReviewer": {
      "name": "Prof. David Chen",
      "stance": "CHALLENGE COVARIANCE ASSUMPTIONS & TASK HIGH-PRECISION SENSORS",
      "recommendation": "Do NOT burn yet. Task Space Fence and Tenerife optical to collapse the ±320m along-track error",
      "quote": "78% of these apparent red alerts collapse into safe 2 km misses once Doppler range-rate is resolved. Task sensors first."
    }
  },
  "earthImpact": {
    "serviceName": "Coastal Cyclone Storm Surge Altimetry",
    "regionName": "Western Indian Ocean & East Africa Seaboard",
    "affectedPopulationEst": "4,800,000 coastal residents",
    "consequenceIfDestroyed": "Catastrophic loss of real-time storm surge ocean surface telemetry. Cyclone landfall warnings degraded by 48%.",
    "consequenceIfManeuvering": "Controlled 45-minute sensor pause while thrusters fire; full coverage resumes before peak surge."
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let text = response.text || '{}';
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(text);
    res.json({
      success: true,
      source: 'gemini-3.8-flash',
      data: parsed,
    });
  } catch (error: any) {
    console.warn('Gemini crisis generation fallback:', error.message);
    res.json({
      success: false,
      source: 'deterministic_crisis_engine',
      data: null,
    });
  }
});

// Gemini API route: Interactive AI Crisis Assistant (HALO & 4 Perspectives)
app.post('/api/crisis-halo-chat', async (req, res) => {
  try {
    const { crisis, role = 'HALO', messages = [], userQuery } = req.body;

    if (!ai) {
      return res.json({
        success: true,
        source: 'deterministic_halo',
        reply: generateDeterministicHaloReply(crisis, role, userQuery),
      });
    }

    const tcaHours = (crisis?.currentClockMinutes / 60).toFixed(1);
    const missM = crisis?.currentMissDistanceMeters || 78;
    const relV = crisis?.relativeVelocityKmS || 14.3;
    const pc = crisis?.collisionProbability || 0.014;
    const primaryName = crisis?.primaryAsset?.name || 'Primary Satellite';
    const secondaryName = crisis?.secondaryHazard?.name || 'Secondary Hazard';
    const remainingFuel = crisis?.primaryAsset?.fuelRemainingDeltaV || 14.8;
    const alongTrackError = crisis?.covariance?.alongTrackUncertaintyM || 320;
    const activeBranch = crisis?.selectedBranch || 'BASELINE';
    const criticalService = crisis?.primaryAsset?.criticalService || 'Earth Observation Service';

    let roleSystemPrompt = '';
    if (role === 'HALO') {
      roleSystemPrompt = `You are HALO (Hypothetical Astrodynamics & Live Operations Assistant), the primary mission-control AI for Cosmic Grid.
You have direct, real-time telemetry access to the active simulated orbital crisis:
- Primary Asset: ${primaryName} (${crisis?.primaryAsset?.altitude} km altitude, ${remainingFuel} m/s delta-v remaining)
- Hazard Object: ${secondaryName} (${crisis?.secondaryHazard?.hazardType}, ${crisis?.secondaryHazard?.estimatedFragmentsIfCollision} fragments if shattered)
- Time to Closest Approach (TCA): ${tcaHours} hours (${crisis?.currentClockMinutes} min remaining)
- Predicted Miss Distance: ${missM} meters (Nominal baseline: ${crisis?.nominalMissDistanceMeters} m)
- Relative Velocity: ${relV} km/s
- Collision Probability (Pc): ${(pc * 100).toFixed(2)}% (Threshold: 0.01%)
- Covariance Ellipsoid: ±${alongTrackError} m along-track uncertainty (Confidence: ${crisis?.covariance?.confidenceLevel})
- Active Decision Branch: ${activeBranch}
- Mission Constraints: ${crisis?.missionConstraints?.join('; ') || 'Standard limits'}
- Earth Critical Service: ${criticalService}

Guidelines:
- Answer technical questions about the crisis using these EXACT simulated figures. Never give generic answers.
- Explain orbital mechanics precisely (Keplerian orbits, Hohmann transfers, along-track vs radial burns, drag decay, Doppler range-rate, covariance ellipsoids).
- Synthesize or contrast the recommendations of the four human specialists (Mission Analyst, Satellite Operator, Sustainability Analyst, Independent Reviewer) when asked.
- Clearly note that all values are MODELLED/SIMULATED parameters.
- Keep tone crisp, mission-control professional, scientific, concise (under 160 words unless asked for detailed math).`;
    } else if (role === 'MISSION_ANALYST') {
      roleSystemPrompt = `You are Dr. Sarah Vance, Lead Mission Analyst.
You fiercely prioritize mission continuity, Earth observation payload uptime, and the humanitarian cyclone early warning mission (${criticalService}).
You oppose premature heavy burns that disable the sensor payload before the storm surge monitoring window. You want to delay until T-4h or negotiate micro-maneuvers.
Current TCA: ${tcaHours}h. Current miss: ${missM}m. Covariance: ±${alongTrackError}m.
Speak in character: assertive, evidence-grounded, protective of the ground population relying on data.`;
    } else if (role === 'SATELLITE_OPERATOR') {
      roleSystemPrompt = `You are Commander Marcus Thorne, Satellite Propulsion & Bus Lead.
You prioritize spacecraft health, propellant conservation (${remainingFuel} m/s left), and attitude control.
Crucial constraint: Reaction Wheel #2 has friction torque and needs 35 minutes of slow thermal slew. A last-minute emergency burn at T-2h could induce an unrecoverable tumble.
You urge an early, clean prograde burn at T-6h rather than waiting.
Current TCA: ${tcaHours}h. Current miss: ${missM}m.
Speak in character: pragmatic, spacecraft-first aerospace engineer, wary of operational delays.`;
    } else if (role === 'SUSTAINABILITY') {
      roleSystemPrompt = `You are Dr. Elena Rostova, Space Sustainability & Debris Mitigation Analyst.
You have absolute zero tolerance for orbital collisions. A collision at 14.3 km/s in the 735km shell will generate 7,400+ fragments and trigger runaway Kessler syndrome cascading across 80+ constellations.
You demand immediate collision avoidance maneuvers regardless of mission downtime.
Current Pc: ${(pc * 100).toFixed(2)}% (standard abort threshold is 0.01%). Miss: ${missM}m.
Speak in character: passionate, farsighted, scientifically rigorous, protector of the orbital commons.`;
    } else if (role === 'INDEPENDENT_REVIEWER') {
      roleSystemPrompt = `You are Prof. David Chen, Astrodynamics & Covariance Auditor.
You focus on evidence quality, sensor accuracy, and rejecting false alarms. The current along-track uncertainty is ±${alongTrackError}m.
You argue that burning precious propellant now is premature when 78% of these apparent high-Pc warnings evaporate once dedicated Space Fence radar passes resolve Doppler range-rate.
You recommend immediately TASKING SENSORS instead of burning fuel blindly.
Speak in character: analytical, skeptical, methodical, demanding statistical rigor.`;
    }

    const conversationText = messages
      .slice(-4)
      .map((m: any) => `${m.senderRole || m.senderName}: ${m.content}`)
      .join('\n');

    const prompt = `${roleSystemPrompt}

CONVERSATION CONTEXT:
${conversationText}

USER QUERY:
${userQuery}

Respond concisely and directly in character:`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({
      success: true,
      source: 'gemini-3.8-flash',
      reply: response.text || generateDeterministicHaloReply(crisis, role, userQuery),
    });
  } catch (error: any) {
    console.warn('Gemini HALO chat fallback:', error.message);
    const { crisis, role, userQuery } = req.body;
    res.json({
      success: true,
      source: 'deterministic_halo_fallback',
      reply: generateDeterministicHaloReply(crisis, role, userQuery),
    });
  }
});

function generateDeterministicHaloReply(crisis: any, role: string, query: string): string {
  const q = (query || '').toLowerCase();
  const tca = crisis?.currentClockMinutes ? `${(crisis.currentClockMinutes / 60).toFixed(1)} hours` : '14.0 hours';
  const miss = crisis?.currentMissDistanceMeters || 78;
  const pc = crisis?.collisionProbability ? `${(crisis.collisionProbability * 100).toFixed(2)}%` : '1.42%';

  if (role === 'MISSION_ANALYST') {
    if (q.includes('wait') || q.includes('maneuver')) {
      return `[Dr. Vance // Mission Ops] We must hold off burning until T-4h. Sentinel's ocean altimeter has a critical cyclone monitoring window starting soon. If we burn right now, reaction wheel thermal slewing disables the payload for 55 minutes, right when flood warnings are needed. Let Tenerife optical track the next pass first.`;
    }
    return `[Dr. Vance // Mission Ops] My priority is ground coverage. A catastrophic collision obviously ends the mission, but an uncoordinated burn that blinds disaster responders for Cyclone Kalani is also unacceptable. We need a targeted micro-burn or coordinated drag phasing.`;
  }

  if (role === 'SATELLITE_OPERATOR') {
    if (q.includes('wait') || q.includes('maneuver')) {
      return `[Cmdr. Thorne // Propulsion] Do NOT wait until the final two hours. Reaction Wheel #2 has friction drag; an emergency high-rate slew at T-90m risks a bus tumble. We have 14.8 m/s remaining; spending 1.45 m/s on a clean prograde burn at T-6h secures a 4.8 km miss distance with zero attitude risk.`;
    }
    return `[Cmdr. Thorne // Propulsion] The spacecraft bus is my responsibility. We have enough delta-v for 2 standard COLA maneuvers. If we execute at perigee, we maximize the Oberth effect and minimize fuel expenditure. Burn early or risk losing attitude control.`;
  }

  if (role === 'SUSTAINABILITY') {
    return `[Dr. Elena Rostova // Debris Mitigation] Current collision probability is ${pc} with miss distance ${miss}m at 14.3 km/s. That kinetic energy exceeds 2.2 GJ. It will produce over 7,400 fragments in the 735 km polar shell, lingering for 65+ years. There is no debate: execute avoidance immediately. The orbital commons cannot absorb another Cosmos-Iridium collision.`;
  }

  if (role === 'INDEPENDENT_REVIEWER') {
    return `[Prof. David Chen // Astrodynamics Audit] The along-track uncertainty is ±320 meters based on only two radar passes. The collision probability ${pc} is inflated by the diffuse covariance volume. Before you burn propellant, task the Kwajalein Space Fence and Zimmerwald laser station. If the miss distance stabilizes outside the 3-sigma ellipsoid, no burn is required.`;
  }

  // Default HALO AI
  if (q.includes('what') && q.includes('happen')) {
    return `HALO Telemetry Status: We are tracking a critical conjunction between ${crisis?.primaryAsset?.name || 'Sentinel-6B'} and ${crisis?.secondaryHazard?.name || 'SL-16 debris'} with TCA in ${tca}. Predicted miss distance is ${miss} meters with relative velocity 14.3 km/s. Collision probability is ${pc}. The primary asset protects 4.8M coastal residents via storm surge telemetry.`;
  }
  if (q.includes('should we maneuver') || q.includes('maneuver')) {
    return `Specialist Divergence: 
• Sustainability Analyst (Dr. Rostova) and Operator (Cmdr. Thorne) urge an immediate prograde burn (+1.45 m/s, yielding 4.85 km miss distance).
• Mission Analyst (Dr. Vance) urges holding until T-4h to protect the cyclone observing pass.
• Reviewer (Prof. Chen) recommends tasking the Space Fence first to shrink the ±320m covariance ellipsoid.
Recommended Judge Decision: Select "REQUEST TRACKING UPDATE" to verify geometry, then commit to "RUN AVOIDANCE MANEUVER".`;
  }
  if (q.includes('missing') || q.includes('information')) {
    return `Data Gaps Identified:
1. Doppler Range-Rate Precision: Only 2 radar tracks logged. Along-track covariance is ±320m.
2. Atmospheric Drag Variations: Space weather index indicates solar flux F10.7 variance ±8 SFU, shifting perigee crossing by ±4 seconds.
3. Secondary Object Attitude: The SL-16 fragment is tumbling at ~12 rpm, modulating radar cross-section between 0.08m² and 0.16m².`;
  }
  if (q.includes('wait')) {
    return `Consequences of Waiting:
If you choose "WAIT FOR MORE DATA", the countdown advances by 2 hours. Covariance will narrow naturally as ground stations acquire telemetry, but you consume the reaction wheel thermal stabilization margin. At T-2h, emergency slewing becomes mandatory with elevated attitude control risk.`;
  }
  if (q.includes('orbital mechanics') || q.includes('mechanics')) {
    return `Astrodynamic Analysis:
The encounter occurs at an ascending node crossing with plane angle Δi = 4.98°. Relative encounter velocity is 14.32 km/s. An along-track prograde burn of Δv = +1.45 m/s at perigee raises the conjunction altitude by +2.8 km via vis-viva equation: v² = GM(2/r - 1/a). This shifts the miss distance from 78m to 4.85 km, dropping Pc to 0.0002%.`;
  }

  return `HALO Standby: TCA is in ${tca}. Miss distance: ${miss}m. Relative velocity: 14.3 km/s. All 4 specialist perspectives (Mission, Propulsion, Sustainability, Audit) are active in the console. You can test decisions, review branching outcomes, or inspect the Earth impact swath.`;
}


// Helper for deterministic briefing
function generateDeterministicBriefing(objectA: any, objectB: any, conjunction: any, simulation: any): string {
  const tca = conjunction?.timeToTca ? `+${conjunction.timeToTca} min` : '+34.2 min';
  const sep = conjunction?.minSeparation ? `${conjunction.minSeparation} km` : '1.42 km';
  const relV = conjunction?.relativeVelocity ? `${conjunction.relativeVelocity} km/s` : '14.12 km/s';

  return `[ORBITAL COMMAND // CONJUNCTION ASSESSMENT REPORT // SSA-OPS]
DOCUMENT ID: OC-CAR-${Date.now().toString().slice(-6)}
DATE / TIME OF TRANSMISSION: ${new Date().toISOString()}

1. EXECUTIVE SUMMARY
Conjunction Assessment Operations has identified a high-interest orbital geometry involving primary tracking asset ${objectA?.name || 'PRIMARY'} (NORAD #${objectA?.catalogId || '25544'}) and secondary object ${objectB ? objectB.name + ' (NORAD #' + objectB.catalogId + ')' : 'UNIDENTIFIED SECONDARY DEBRIS'}. Predicted closest approach occurs in ${tca} with a nominal miss distance of ${sep} at relative velocity ${relV}.

2. ORBITAL REGIME & TRACKING CONFIDENCE
• Primary Object: ${objectA?.name || 'ASSET-A'} | Altitude: ${objectA?.altitude || 420} km | Inclination: ${objectA?.inclination || 51.6}° | Period: ${objectA?.orbitalPeriod || 92.8} min
• Secondary Object: ${objectB?.name || 'ASSET-B'} | Altitude: ${objectB?.altitude || 421} km | Inclination: ${objectB?.inclination || 51.4}° | Period: ${objectB?.orbitalPeriod || 92.9} min
• Tracking Confidence: High. Two-body Keplerian propagation with SGP4 perturbation baseline indicates stable covariance ellipsoid across the current 120-minute simulation window.

3. GEOMETRIC INTERSECTION ANALYSIS
The encounter geometry exhibits near-perpendicular orbit plane intersection at an ascending/descending node crossing. Relative encounter velocity is ${relV}, creating high kinetic energy transfer hazard in the event of close proximity. Current separation is ${conjunction?.currentSeparation || '48.2'} km, closing at approximately ${(parseFloat(relV) || 12).toFixed(1)} km/s relative speed.

4. RISK VECTOR & UNCERTAINTY COVARIANCE
The computed miss distance (${sep}) falls ${parseFloat(sep) <= 5.0 ? 'INSIDE the red threshold limit (5.0 km)' : 'within the yellow monitoring threshold (25.0 km)'}. Combined hard-body radius screening indicates elevated collision probability. Atmospheric drag variations in the upper thermosphere remain the dominant error source.

5. OPERATIONAL RECOMMENDATION
${parseFloat(sep) <= 5.0 ? '• ACTION REQUIRED: Formulate candidate Collision Avoidance Maneuver (COLA). Recommended posigrade burn of Δv ≈ 0.45 m/s at perigee (T-45 min) to raise conjunction altitude by +1.8 km, increasing miss distance to > 12.0 km.\n• Continue high-cadence tracking and radar updates.\n• Coordinate with operating entity.' : '• STATUS: NOMINAL MONITORING. No immediate maneuver is required at this epoch. Re-screen conjunction geometry at TCA - 30 minutes with updated two-line element (TLE) sets.'}`;
}

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`ORBITAL COMMAND operational server running on http://0.0.0.0:${port}`);
  });
}

startServer();
