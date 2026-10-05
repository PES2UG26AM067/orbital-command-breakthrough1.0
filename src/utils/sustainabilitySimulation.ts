/**
 * Space Sustainability & Future Orbital Congestion Simulation Engine
 * Grounded in ESA Space Debris Office (2024), NASA ODPO LEGEND models,
 * and Kessler Runaway Astrodynamic formulations.
 */

export type SimulationScenarioId = 'SUSTAINABLE' | 'MODERATE' | 'RUNAWAY' | 'CUSTOM';

export interface DebrisEvent {
  id: string;
  name: string;
  type: 'COLLISION' | 'ASAT' | 'EXPLOSION' | 'CASCADE';
  year: number;
  altitudeKm: number;
  inclinationDeg: number;
  fragmentsGenerated: number;
  smallParticlesGenerated: number;
  description: string;
  active: boolean;
}

export interface ScenarioConfig {
  id: SimulationScenarioId;
  name: string;
  tagline: string;
  annualLaunchRate: number; // payloads launched per year
  pmdComplianceRate: number; // 0.0 - 1.0 (Post Mission Disposal, e.g. 0.95 = 95%)
  adrRemovalsPerYear: number; // Active Debris Removal of high-risk derelicts
  passivationRate: number; // 0.0 - 1.0 (zero-residual upper stages)
  solarCycleEffect: boolean;
  description: string;
}

export interface YearlySimulationPoint {
  year: number;
  activeSatellites: number;
  trackedDebris: number;
  totalTrackedObjects: number;
  smallLethalFragments: number; // 1cm - 10cm estimated
  collisionProbabilityIndex: number; // Relative hazard multiplier (1.0 = 2026 baseline)
  sustainabilityRating: number; // 0 - 100 (Space Sustainability Rating)
  meanTimeBetweenCollisionsMonths: number;
  altitudeDensities: {
    leoLow_400_500: number; // ISS / early ops band
    leoMega_500_650: number; // Mega-constellation shell (Starlink/Kuiper)
    leoSso_750_850: number; // Congested Sun-synchronous band (Envisat/Zenit)
    leoHigh_1000_1400: number; // Upper LEO band
  };
  eventsTriggeredThisYear: string[];
}

export const PRESET_EVENTS: DebrisEvent[] = [
  {
    id: 'envisat-collision',
    name: 'ENVISAT Derelict Conjunction',
    type: 'COLLISION',
    year: 2031,
    altitudeKm: 785,
    inclinationDeg: 98.5,
    fragmentsGenerated: 3800,
    smallParticlesGenerated: 85000,
    description: 'Catastrophic collision between 8.2-tonne derelict ENVISAT and an untracked rocket stage at 785 km, triggering a dense polar fragmentation cloud.',
    active: true,
  },
  {
    id: 'kinetic-asat-strike',
    name: 'Kinetic ASAT Missile Intercept',
    type: 'ASAT',
    year: 2035,
    altitudeKm: 530,
    inclinationDeg: 82.0,
    fragmentsGenerated: 1950,
    smallParticlesGenerated: 42000,
    description: 'Hypothetical kinetic weapon strike on a defunct surveillance payload, contaminating low Earth orbit and threatening crewed corridors.',
    active: false,
  },
  {
    id: 'upper-stage-rupture',
    name: 'SL-16 Zenit-2 Explosive Rupture',
    type: 'EXPLOSION',
    year: 2038,
    altitudeKm: 840,
    inclinationDeg: 71.0,
    fragmentsGenerated: 1400,
    smallParticlesGenerated: 29000,
    description: 'Residual hypergolic propellant passivation failure in an un-vented 9-tonne upper stage, spewing supersonic shrapnel into high LEO.',
    active: true,
  },
  {
    id: 'kessler-cascade-secondary',
    name: 'Secondary Cascade Ignition',
    type: 'CASCADE',
    year: 2046,
    altitudeKm: 770,
    inclinationDeg: 97.8,
    fragmentsGenerated: 4600,
    smallParticlesGenerated: 120000,
    description: 'Secondary cascade reaction where debris from earlier fragmentation impacts an active constellation node, initiating self-sustaining collisional chain.',
    active: false,
  },
];

export const SCENARIO_CONFIGS: Record<SimulationScenarioId, ScenarioConfig> = {
  SUSTAINABLE: {
    id: 'SUSTAINABLE',
    name: 'Responsible Stewardship',
    tagline: 'Strict 5-Yr Deorbit & Active Debris Removal',
    annualLaunchRate: 1400,
    pmdComplianceRate: 0.96,
    adrRemovalsPerYear: 12,
    passivationRate: 0.98,
    solarCycleEffect: true,
    description: 'Enforces FCC 5-year post-mission deorbit rules, zero-debris upper-stage passivation, and targeted removal of 12 top-hazard derelicts annually.',
  },
  MODERATE: {
    id: 'MODERATE',
    name: 'Current Trajectory (Boom)',
    tagline: 'Accelerating Constellations & 80% PMD',
    annualLaunchRate: 3600,
    pmdComplianceRate: 0.80,
    adrRemovalsPerYear: 0,
    passivationRate: 0.85,
    solarCycleEffect: true,
    description: 'Mega-constellations expand rapidly while compliance with deorbit guidelines remains moderate. No active removal of legacy orbital hulks.',
  },
  RUNAWAY: {
    id: 'RUNAWAY',
    name: 'Runaway Congestion (Kessler)',
    tagline: 'Unregulated Growth & Cascade Multiplication',
    annualLaunchRate: 5400,
    pmdComplianceRate: 0.55,
    adrRemovalsPerYear: 0,
    passivationRate: 0.60,
    solarCycleEffect: true,
    description: 'Rapid commercial expansion without international coordination. Abandoned upper stages and dead satellites trigger self-sustaining cascading fragmentations.',
  },
  CUSTOM: {
    id: 'CUSTOM',
    name: 'Custom Parameter Studio',
    tagline: 'Tailored Launch, Deorbit & Remediation Levers',
    annualLaunchRate: 2800,
    pmdComplianceRate: 0.85,
    adrRemovalsPerYear: 5,
    passivationRate: 0.90,
    solarCycleEffect: true,
    description: 'Interactive custom sandbox to test hypothetical policy interventions, regulatory quotas, and technological remediation scenarios.',
  },
};

// 2026 Scientific Baseline (ESA Space Debris Office 2024 / Space-Track)
const BASELINE_2026 = {
  year: 2026,
  activeSatellites: 11800,
  trackedDebris: 29500, // rocket bodies + major fragments > 10cm
  totalTrackedObjects: 41300,
  smallLethalFragments: 1050000, // 1cm - 10cm estimated
  collisionProbabilityIndex: 1.0,
  sustainabilityRating: 78,
  meanTimeBetweenCollisionsMonths: 64, // ~5.3 years
  altitudeDensities: {
    leoLow_400_500: 42,
    leoMega_500_650: 74,
    leoSso_750_850: 95, // Peak empirical density
    leoHigh_1000_1400: 58,
  },
};

/**
 * Computes projected timeline data points from 2026 to 2060
 */
export function runSustainabilitySimulation(
  scenario: ScenarioConfig,
  events: DebrisEvent[]
): YearlySimulationPoint[] {
  const points: YearlySimulationPoint[] = [];
  const startYear = 2026;
  const endYear = 2060;

  let currentActive = BASELINE_2026.activeSatellites;
  let currentDebris = BASELINE_2026.trackedDebris;
  let currentSmall = BASELINE_2026.smallLethalFragments;

  // Active events mapped by year
  const activeEvents = events.filter((e) => e.active);

  for (let year = startYear; year <= endYear; year++) {
    const elapsedYears = year - startYear;

    if (year === startYear) {
      points.push({
        year: startYear,
        activeSatellites: Math.round(currentActive),
        trackedDebris: Math.round(currentDebris),
        totalTrackedObjects: Math.round(currentActive + currentDebris),
        smallLethalFragments: Math.round(currentSmall),
        collisionProbabilityIndex: 1.0,
        sustainabilityRating: BASELINE_2026.sustainabilityRating,
        meanTimeBetweenCollisionsMonths: BASELINE_2026.meanTimeBetweenCollisionsMonths,
        altitudeDensities: { ...BASELINE_2026.altitudeDensities },
        eventsTriggeredThisYear: [],
      });
      continue;
    }

    // 1. Natural Solar Cycle Variation (Atmospheric Drag)
    // 11-year cycle with solar max expanding thermosphere & purging objects below 550km
    const solarPhase = Math.sin(((year - 2024) / 11) * 2 * Math.PI);
    const naturalDecayRate = scenario.solarCycleEffect ? 0.015 + 0.01 * Math.max(0, solarPhase) : 0.018;

    // 2. Satellites launched this year
    const launchesThisYear = scenario.annualLaunchRate;
    // Satellites reaching end of life (~5-7 year operational life)
    const retirementRate = 0.16; // ~16% retire per year
    const retiringSats = currentActive * retirementRate;

    // Post-Mission Disposal (PMD) success: deorbited cleanly
    const successfullyDeorbited = retiringSats * scenario.pmdComplianceRate;
    // Failed deorbits become derelict debris
    const newlyCreatedDerelicts = retiringSats * (1 - scenario.pmdComplianceRate);

    // Active Debris Removal (ADR) remediation
    const adrCleaned = Math.min(currentDebris, scenario.adrRemovalsPerYear);

    // Rocket body debris from launches (mitigated by passivation rate)
    const rocketBodiesCreated = (launchesThisYear * 0.04) * (1 - scenario.passivationRate);

    // Natural decay of low-altitude debris
    const naturallyDecayedDebris = currentDebris * naturalDecayRate * (scenario.pmdComplianceRate > 0.9 ? 1.2 : 0.9);

    // Random micro-collisions producing fragments (Kessler feedback loop)
    // Density squared astrodynamic factor
    const totalCurrentObjects = currentActive + currentDebris;
    const densityFactor = Math.pow(totalCurrentObjects / 40000, 1.85);
    const spontaneousFragments = Math.round(densityFactor * 85);
    const spontaneousSmall = Math.round(densityFactor * 4200);

    // 3. Check for specific injected events in this year
    const triggeredEvents = activeEvents.filter((e) => e.year === year);
    let eventFragments = 0;
    let eventSmall = 0;
    const triggeredNames: string[] = [];

    triggeredEvents.forEach((ev) => {
      eventFragments += ev.fragmentsGenerated;
      eventSmall += ev.smallParticlesGenerated;
      triggeredNames.push(ev.name);
    });

    // Update population
    currentActive = Math.max(1000, currentActive + launchesThisYear - retiringSats);
    currentDebris = Math.max(
      5000,
      currentDebris + newlyCreatedDerelicts + rocketBodiesCreated + spontaneousFragments + eventFragments - naturallyDecayedDebris - adrCleaned
    );
    currentSmall = Math.max(
      200000,
      currentSmall + spontaneousSmall + eventSmall - (currentSmall * naturalDecayRate * 0.7)
    );

    const totalTracked = currentActive + currentDebris;

    // Relative collision hazard index (quadratic growth in cross-sections)
    const hazardIndex = Number((Math.pow(totalTracked / BASELINE_2026.totalTrackedObjects, 2.1)).toFixed(2));

    // Space Sustainability Rating (0-100)
    // Decreases with uncontrolled debris and low PMD; increases with ADR and high PMD
    let ssr = Math.round(
      100 -
        (hazardIndex - 1.0) * 22 -
        (1 - scenario.pmdComplianceRate) * 45 +
        (scenario.adrRemovalsPerYear > 5 ? 12 : 0) -
        (activeEvents.filter((e) => e.year <= year).length * 7)
    );
    ssr = Math.max(8, Math.min(98, ssr));

    // Mean time between catastrophic collisions (months)
    const mtbc = Math.max(1.2, Number((BASELINE_2026.meanTimeBetweenCollisionsMonths / Math.max(0.2, hazardIndex)).toFixed(1)));

    // Altitude profile breakdown
    const ssoMultiplier = Math.min(3.8, 1.0 + (elapsedYears * 0.04) * (scenario.id === 'RUNAWAY' ? 2.2 : scenario.id === 'MODERATE' ? 1.4 : 0.4));
    const megaMultiplier = Math.min(4.5, 1.0 + (elapsedYears * 0.065) * (scenario.id === 'RUNAWAY' ? 2.5 : scenario.id === 'MODERATE' ? 1.7 : 0.6));

    points.push({
      year,
      activeSatellites: Math.round(currentActive),
      trackedDebris: Math.round(currentDebris),
      totalTrackedObjects: Math.round(totalTracked),
      smallLethalFragments: Math.round(currentSmall),
      collisionProbabilityIndex: hazardIndex,
      sustainabilityRating: ssr,
      meanTimeBetweenCollisionsMonths: mtbc,
      altitudeDensities: {
        leoLow_400_500: Math.round(Math.min(100, BASELINE_2026.altitudeDensities.leoLow_400_500 * (1 + elapsedYears * 0.015))),
        leoMega_500_650: Math.round(Math.min(100, BASELINE_2026.altitudeDensities.leoMega_500_650 * megaMultiplier)),
        leoSso_750_850: Math.round(Math.min(100, BASELINE_2026.altitudeDensities.leoSso_750_850 * ssoMultiplier)),
        leoHigh_1000_1400: Math.round(Math.min(100, BASELINE_2026.altitudeDensities.leoHigh_1000_1400 * (1 + elapsedYears * 0.025))),
      },
      eventsTriggeredThisYear: triggeredNames,
    });
  }

  return points;
}
