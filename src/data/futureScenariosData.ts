import { OrbitalObject, ObjectType, OrbitRegime } from '../types/orbital';
import { CATALOG_OBJECTS } from './orbitalCatalog';

export type SustainabilityScenarioId = 'SUSTAINABLE_ZERO_DEBRIS' | 'BUSINESS_AS_USUAL' | 'FRAGMENTATION_CASCADE';

export interface ScenarioMetadata {
  id: SustainabilityScenarioId;
  name: string;
  tagline: string;
  description: string;
  pmdRatePercent: number; // Post-mission disposal compliance
  annualLaunches: number;
  adrRemovalsPerYear: number;
  colorHex: string;
  badgeStyle: string;
}

export interface AltitudeBandDensity {
  band400: number; // 350-450 km (ISS / Crewed Flight)
  band550: number; // 500-600 km (Mega-Constellations)
  band800: number; // 750-850 km (Sun-Synchronous LEO)
  band1000: number; // 900-1100 km (High LEO / Derelict Stages)
}

export interface YearProjection {
  year: number;
  totalTrackedObjects: number; // >10 cm
  untrackedFragmentsEstimate: number; // 1-10 cm
  activeSatellites: number;
  derelictRocketStages: number;
  totalMassTonnes: number;
  dailyConjunctionWarnings: number;
  kesslerCriticalRiskIndex: number; // 0 to 100%
  densityByBand: AltitudeBandDensity;
  milestones: string[];
}

export interface BreakupEventDefinition {
  id: string;
  title: string;
  year: number;
  altitudeKm: number;
  inclinationDeg: number;
  primaryObject: string;
  secondaryObject: string;
  fragmentsGenerated: number;
  impactSummary: string;
}

export const SCENARIO_DEFINITIONS: Record<SustainabilityScenarioId, ScenarioMetadata> = {
  SUSTAINABLE_ZERO_DEBRIS: {
    id: 'SUSTAINABLE_ZERO_DEBRIS',
    name: 'Sustainable Space Governance',
    tagline: 'Zero Debris 2030 Charter & Active Remediation',
    description:
      'Global adherence to the 5-year post-mission disposal rule (95% compliance), zero-release upper stage passivation, and international Active Debris Removal (ADR) removing 5 massive derelicts per year.',
    pmdRatePercent: 95,
    annualLaunches: 2200,
    adrRemovalsPerYear: 5,
    colorHex: '#10b981', // Emerald
    badgeStyle: 'bg-emerald-950 text-emerald-300 border-emerald-800',
  },
  BUSINESS_AS_USUAL: {
    id: 'BUSINESS_AS_USUAL',
    name: 'Business-As-Usual (High Escalation)',
    tagline: 'Unregulated Mega-Constellations & Low Compliance',
    description:
      'Commercial launch boom without binding international remediation. 60% post-mission disposal rate, zero active debris removal, and persistent dead satellite accumulation in crowded shells.',
    pmdRatePercent: 60,
    annualLaunches: 4500,
    adrRemovalsPerYear: 0,
    colorHex: '#f59e0b', // Amber
    badgeStyle: 'bg-amber-950 text-amber-300 border-amber-800',
  },
  FRAGMENTATION_CASCADE: {
    id: 'FRAGMENTATION_CASCADE',
    name: 'Hypothetical Cascade (Kessler Runaway)',
    tagline: 'Major High-Altitude Breakups & Runaway Collisions',
    description:
      'Worst-case trajectory triggered by multiple catastrophic kinetic impacts in the 780 km sun-synchronous corridor, generating dense shrapnel shells that trigger self-propagating secondary fragmentations.',
    pmdRatePercent: 35,
    annualLaunches: 5500,
    adrRemovalsPerYear: 0,
    colorHex: '#f43f5e', // Rose
    badgeStyle: 'bg-rose-950 text-rose-300 border-rose-800',
  },
};

export const HYPOTHETICAL_BREAKUP_EVENTS: BreakupEventDefinition[] = [
  {
    id: 'envisat-collision',
    title: 'ENVISAT vs Zenit-2 Collision at 768 km',
    year: 2028,
    altitudeKm: 768,
    inclinationDeg: 98.5,
    primaryObject: 'ENVISAT (#27386, 8.2 tonnes)',
    secondaryObject: 'SL-16 Zenit-2 R/B (#22220, 8.3 tonnes)',
    fragmentsGenerated: 16500,
    impactSummary:
      'Catastrophic hypervelocity impact at 14.1 km/s. Over 16,500 trackable fragments disperse into a permanent equatorial-to-polar shrapnel ring, cutting across Earth observation orbits.',
  },
  {
    id: 'mega-constellation-cascade',
    title: '550 km Mega-Constellation Collision Chain',
    year: 2033,
    altitudeKm: 550,
    inclinationDeg: 53.0,
    primaryObject: 'Commercial Starlink Cluster Asset',
    secondaryObject: 'Defunct Cosmos Satellite Fragment',
    fragmentsGenerated: 11200,
    impactSummary:
      'Battery thermal runaway during close approach leads to fragmentation in the highest-density commercial satellite corridor, forcing thousands of emergency avoidance maneuvers.',
  },
  {
    id: 'upper-stage-detonation',
    title: 'SL-8 Kosmos-3M Hypergolic Tank Explosion',
    year: 2036,
    altitudeKm: 975,
    inclinationDeg: 82.9,
    primaryObject: 'SL-8 Kosmos-3M Upper Stage (#13119)',
    secondaryObject: 'Internal Hypergolic Overpressure',
    fragmentsGenerated: 5800,
    impactSummary:
      'Corrosive unvented unsymmetrical dimethylhydrazine (UDMH) propellant tank breaches after 54 years in orbit, generating long-lived high-altitude ballistic debris.',
  },
];

// Grounded projections based on NASA LEGEND, ESA DELTA/MASTER, and IADC compliance studies
export const PROJECTION_DATABASE: Record<SustainabilityScenarioId, YearProjection[]> = {
  SUSTAINABLE_ZERO_DEBRIS: [
    {
      year: 2026,
      totalTrackedObjects: 40500,
      untrackedFragmentsEstimate: 1000000,
      activeSatellites: 11300,
      derelictRocketStages: 2150,
      totalMassTonnes: 11500,
      dailyConjunctionWarnings: 17,
      kesslerCriticalRiskIndex: 12,
      densityByBand: { band400: 24, band550: 68, band800: 92, band1000: 42 },
      milestones: ['Present Day Baseline: ESA Space Environment Report 2024 corroboration.'],
    },
    {
      year: 2030,
      totalTrackedObjects: 44200,
      untrackedFragmentsEstimate: 1050000,
      activeSatellites: 18500,
      derelictRocketStages: 2100,
      totalMassTonnes: 12800,
      dailyConjunctionWarnings: 28,
      kesslerCriticalRiskIndex: 15,
      densityByBand: { band400: 22, band550: 82, band800: 86, band1000: 39 },
      milestones: [
        'ESA Zero Debris Charter 2030 in full effect: 95% 5-year deorbit compliance.',
        'First 5 commercial Active Debris Removal (ADR) missions successfully de-orbit Zenit stages.',
      ],
    },
    {
      year: 2035,
      totalTrackedObjects: 48900,
      untrackedFragmentsEstimate: 1100000,
      activeSatellites: 27000,
      derelictRocketStages: 1980,
      totalMassTonnes: 14200,
      dailyConjunctionWarnings: 44,
      kesslerCriticalRiskIndex: 17,
      densityByBand: { band400: 20, band550: 90, band800: 76, band1000: 34 },
      milestones: [
        '25 massive derelicts cleared from Sun-Synchronous Orbit.',
        'Autonomous onboard collision avoidance becomes standard for all commercial satellites.',
      ],
    },
    {
      year: 2040,
      totalTrackedObjects: 52400,
      untrackedFragmentsEstimate: 1120000,
      activeSatellites: 36000,
      derelictRocketStages: 1820,
      totalMassTonnes: 15600,
      dailyConjunctionWarnings: 58,
      kesslerCriticalRiskIndex: 19,
      densityByBand: { band400: 19, band550: 94, band800: 68, band1000: 30 },
      milestones: [
        'Sun-synchronous 800 km debris density decreases by 26% compared to 2026 peak.',
        'Orbital environment reaches sustainable equilibrium with natural atmospheric decay.',
      ],
    },
    {
      year: 2050,
      totalTrackedObjects: 56800,
      untrackedFragmentsEstimate: 1150000,
      activeSatellites: 48000,
      derelictRocketStages: 1550,
      totalMassTonnes: 17800,
      dailyConjunctionWarnings: 75,
      kesslerCriticalRiskIndex: 21,
      densityByBand: { band400: 18, band550: 98, band800: 55, band1000: 25 },
      milestones: [
        'Over 100 historical rocket bodies removed via robotic and electrodynamic tether tugs.',
        'Zero accidental breakups recorded over the decade.',
      ],
    },
  ],

  BUSINESS_AS_USUAL: [
    {
      year: 2026,
      totalTrackedObjects: 40500,
      untrackedFragmentsEstimate: 1000000,
      activeSatellites: 11300,
      derelictRocketStages: 2150,
      totalMassTonnes: 11500,
      dailyConjunctionWarnings: 17,
      kesslerCriticalRiskIndex: 12,
      densityByBand: { band400: 24, band550: 68, band800: 92, band1000: 42 },
      milestones: ['Present Day Baseline: ESA Space Environment Report 2024 corroboration.'],
    },
    {
      year: 2030,
      totalTrackedObjects: 58000,
      untrackedFragmentsEstimate: 1450000,
      activeSatellites: 24000,
      derelictRocketStages: 2450,
      totalMassTonnes: 15200,
      dailyConjunctionWarnings: 64,
      kesslerCriticalRiskIndex: 28,
      densityByBand: { band400: 28, band550: 115, band800: 102, band1000: 52 },
      milestones: [
        'Post-mission disposal compliance remains at 60%; dead constellation satellites linger for 25+ years.',
        'Annual launches reach 3,800/yr.',
      ],
    },
    {
      year: 2035,
      totalTrackedObjects: 82000,
      untrackedFragmentsEstimate: 2100000,
      activeSatellites: 41000,
      derelictRocketStages: 2850,
      totalMassTonnes: 19800,
      dailyConjunctionWarnings: 145,
      kesslerCriticalRiskIndex: 44,
      densityByBand: { band400: 36, band550: 165, band800: 125, band1000: 68 },
      milestones: [
        'First accidental satellite-on-satellite collision occurs in 550 km constellation shell.',
        'Satellite operators spend 18% of propellant budget purely on avoidance maneuvers.',
      ],
    },
    {
      year: 2040,
      totalTrackedObjects: 114000,
      untrackedFragmentsEstimate: 3100000,
      activeSatellites: 62000,
      derelictRocketStages: 3300,
      totalMassTonnes: 26000,
      dailyConjunctionWarnings: 310,
      kesslerCriticalRiskIndex: 68,
      densityByBand: { band400: 48, band550: 220, band800: 160, band1000: 92 },
      milestones: [
        'Critical Kessler inflection point approached: secondary collisions begin exceeding atmospheric drag.',
        'Insurance premiums for LEO satellites increase fourfold.',
      ],
    },
    {
      year: 2050,
      totalTrackedObjects: 185000,
      untrackedFragmentsEstimate: 5400000,
      activeSatellites: 95000,
      derelictRocketStages: 4100,
      totalMassTonnes: 38000,
      dailyConjunctionWarnings: 740,
      kesslerCriticalRiskIndex: 84,
      densityByBand: { band400: 72, band550: 310, band800: 240, band1000: 145 },
      milestones: [
        'Multiple cascading breakups per year in LEO.',
        'Crewed spaceflight to 400-500 km orbits requires armored Whipple bumpers and continuous shielding.',
      ],
    },
  ],

  FRAGMENTATION_CASCADE: [
    {
      year: 2026,
      totalTrackedObjects: 40500,
      untrackedFragmentsEstimate: 1000000,
      activeSatellites: 11300,
      derelictRocketStages: 2150,
      totalMassTonnes: 11500,
      dailyConjunctionWarnings: 17,
      kesslerCriticalRiskIndex: 12,
      densityByBand: { band400: 24, band550: 68, band800: 92, band1000: 42 },
      milestones: ['Present Day Baseline: ESA Space Environment Report 2024 corroboration.'],
    },
    {
      year: 2030,
      totalTrackedObjects: 72000,
      untrackedFragmentsEstimate: 2200000,
      activeSatellites: 25000,
      derelictRocketStages: 2450,
      totalMassTonnes: 15400,
      dailyConjunctionWarnings: 115,
      kesslerCriticalRiskIndex: 48,
      densityByBand: { band400: 34, band550: 130, band800: 210, band1000: 75 },
      milestones: [
        '2028: Catastrophic ENVISAT vs Zenit-2 collision generates 16,500 fragments >10 cm.',
        'Sun-synchronous 780 km corridor becomes highest hazard zone in space history.',
      ],
    },
    {
      year: 2035,
      totalTrackedObjects: 118000,
      untrackedFragmentsEstimate: 3800000,
      activeSatellites: 38000,
      derelictRocketStages: 2800,
      totalMassTonnes: 19200,
      dailyConjunctionWarnings: 280,
      kesslerCriticalRiskIndex: 72,
      densityByBand: { band400: 52, band550: 210, band800: 295, band1000: 110 },
      milestones: [
        'Secondary collisions trigger runaway cascade across adjacent orbital inclinations.',
        'Three operational Earth observation satellites destroyed by untracked 3 cm debris.',
      ],
    },
    {
      year: 2040,
      totalTrackedObjects: 168000,
      untrackedFragmentsEstimate: 5900000,
      activeSatellites: 50000,
      derelictRocketStages: 3200,
      totalMassTonnes: 24500,
      dailyConjunctionWarnings: 580,
      kesslerCriticalRiskIndex: 89,
      densityByBand: { band400: 75, band550: 290, band800: 380, band1000: 165 },
      milestones: [
        'Full Kessler Syndrome in 700-900 km band: collisions generate debris faster than natural decay.',
        'Access to Sun-Synchronous Orbit declared unsafe for commercial missions.',
      ],
    },
    {
      year: 2050,
      totalTrackedObjects: 275000,
      untrackedFragmentsEstimate: 11500000,
      activeSatellites: 60000,
      derelictRocketStages: 3700,
      totalMassTonnes: 32000,
      dailyConjunctionWarnings: 1450,
      kesslerCriticalRiskIndex: 96,
      densityByBand: { band400: 110, band550: 420, band800: 520, band1000: 240 },
      milestones: [
        'Persistent debris belts encircle Earth between 500 and 1000 km.',
        'Space exploration severely constrained by high-velocity debris transit risks.',
      ],
    },
  ],
};

/**
 * Generates an array of OrbitalObject items representing the simulated future
 * population for rendering in 3D radar and the before-and-after comparison.
 */
export function generateProjectedPopulation(
  year: number,
  scenarioId: SustainabilityScenarioId,
  eventTriggered?: string | null
): OrbitalObject[] {
  // Start with core real catalog objects
  const base = [...CATALOG_OBJECTS];

  const projections = PROJECTION_DATABASE[scenarioId];
  const targetYearProj = projections.find((p) => p.year === year) || projections[0];
  const baselineProj = PROJECTION_DATABASE['SUSTAINABLE_ZERO_DEBRIS'][0]; // 2026

  // Ratio multiplier of new simulated objects to create
  const growthMultiplier = targetYearProj.totalTrackedObjects / baselineProj.totalTrackedObjects;
  const numSynthetic = Math.min(280, Math.floor(base.length * (growthMultiplier - 1)));

  const syntheticObjects: OrbitalObject[] = [];

  // Seed pseudo-random generator
  let seed = year * 1000 + scenarioId.length * 100;
  const pseudoRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = 0; i < numSynthetic; i++) {
    const isDebris =
      scenarioId === 'FRAGMENTATION_CASCADE'
        ? pseudoRandom() > 0.35
        : scenarioId === 'BUSINESS_AS_USUAL'
        ? pseudoRandom() > 0.55
        : pseudoRandom() > 0.75;

    // Distribute according to projected band density
    const bandRoll = pseudoRandom();
    let altitude: number;
    let inclination: number;

    if (bandRoll < 0.25) {
      // 400 km Crewed / low LEO
      altitude = 380 + pseudoRandom() * 60;
      inclination = 51.6 + (pseudoRandom() - 0.5) * 6;
    } else if (bandRoll < 0.65) {
      // 550 km Mega-Constellation Shell
      altitude = 520 + pseudoRandom() * 60;
      inclination = 53.0 + (pseudoRandom() - 0.5) * 8;
    } else if (bandRoll < 0.9) {
      // 780 km Sun-Synchronous Corridor
      altitude = 760 + pseudoRandom() * 90;
      inclination = 97.5 + (pseudoRandom() - 0.5) * 4;
    } else {
      // 950-1050 km High LEO
      altitude = 940 + pseudoRandom() * 120;
      inclination = 82.5 + (pseudoRandom() - 0.5) * 6;
    }

    const type: ObjectType = isDebris
      ? pseudoRandom() > 0.3 ? 'DEBRIS' : 'ROCKET_BODY'
      : 'PAYLOAD';

    const noradId = `${70000 + i + (year - 2026) * 1000}`;
    const name =
      type === 'DEBRIS'
        ? `FRAG-${year}-${String(i).padStart(3, '0')}`
        : type === 'ROCKET_BODY'
        ? `STAGE-${year}-${String(i).padStart(2, '0')}`
        : `SAT-PROJ-${year}-${String(i).padStart(3, '0')}`;

    const orbitalPeriod = 1.658669e-4 * Math.pow(6378.137 + altitude, 1.5);

    syntheticObjects.push({
      id: `proj-${year}-${scenarioId}-${i}`,
      name,
      catalogId: noradId,
      internationalDesignator: `${year}-SYN-${i}`,
      type,
      regime: altitude < 2000 ? 'LEO' : 'MEO',
      operator: type === 'PAYLOAD' ? 'Simulated Constellation' : 'Orbital Remnant',
      country: 'Synthetic Forecast',
      launchDate: `${year}`,
      status: type === 'PAYLOAD' ? 'OPERATIONAL' : 'DERELICT',
      altitude: Math.round(altitude * 10) / 10,
      inclination: Math.round(inclination * 10) / 10,
      eccentricity: 0.001 + pseudoRandom() * 0.008,
      raan: Math.round(pseudoRandom() * 360 * 10) / 10,
      argPerigee: Math.round(pseudoRandom() * 360 * 10) / 10,
      meanAnomaly: Math.round(pseudoRandom() * 360 * 10) / 10,
      semiMajorAxis: Math.round((6378.137 + altitude) * 10) / 10,
      orbitalPeriod: Math.round(orbitalPeriod * 10) / 10,
      velocity: Math.round(Math.sqrt(398600.4418 / (6378.137 + altitude)) * 100) / 100,
    });
  }

  // If a specific hypothetical breakup event is triggered, inject a dense fragmentation cloud
  if (eventTriggered) {
    const eventDef = HYPOTHETICAL_BREAKUP_EVENTS.find((e) => e.id === eventTriggered);
    if (eventDef) {
      for (let j = 0; j < 45; j++) {
        const alt = eventDef.altitudeKm + (pseudoRandom() - 0.5) * 45;
        const inc = eventDef.inclinationDeg + (pseudoRandom() - 0.5) * 3;
        const period = 1.658669e-4 * Math.pow(6378.137 + alt, 1.5);
        syntheticObjects.push({
          id: `breakup-frag-${j}`,
          name: `💥 ${eventDef.primaryObject.split(' ')[0]} DEB #${90000 + j}`,
          catalogId: `${90000 + j}`,
          internationalDesignator: `${eventDef.year}-FRG-${j}`,
          type: 'DEBRIS',
          regime: 'LEO',
          operator: 'Collision Fragmentation',
          country: 'Breakup Cloud',
          launchDate: `${eventDef.year}`,
          status: 'DERELICT',
          altitude: Math.round(alt * 10) / 10,
          inclination: Math.round(inc * 10) / 10,
          eccentricity: 0.002 + pseudoRandom() * 0.02,
          raan: (j * (360 / 45)) % 360,
          argPerigee: pseudoRandom() * 360,
          meanAnomaly: pseudoRandom() * 360,
          semiMajorAxis: Math.round((6378.137 + alt) * 10) / 10,
          orbitalPeriod: Math.round(period * 10) / 10,
          velocity: Math.round(Math.sqrt(398600.4418 / (6378.137 + alt)) * 100) / 100,
        });
      }
    }
  }

  return [...base, ...syntheticObjects];
}
