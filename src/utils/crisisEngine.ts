import { CrisisScenario, BranchOutcome, TrackingObservation, UserCrisisDecisionType } from '../types/crisis';
import { OrbitalObject } from '../types/orbital';

/**
 * High-fidelity deterministic Crisis Scenarios
 * Grounded in authentic orbital mechanics and international space traffic management practices.
 */
export function createDefaultCrisisScenario(isJudgeDemo = false): CrisisScenario {
  const initialTcaMin = isJudgeDemo ? 840 : 1080; // 14h or 18h to TCA

  const primaryAsset: CrisisScenario['primaryAsset'] = {
    id: 'sentinel-6b-sim',
    name: 'SENTINEL-6B CERES (SIMULATED)',
    catalogId: '46984',
    internationalDesignator: '2020-086A',
    type: 'PAYLOAD',
    regime: 'LEO',
    operator: 'ESA / EUMETSAT / NASA Earth Science',
    country: 'Europe / USA',
    launchDate: '2020-11-21',
    status: 'OPERATIONAL',
    altitude: 735.4,
    inclination: 66.04,
    eccentricity: 0.0007,
    raan: 142.8,
    argPerigee: 78.4,
    meanAnomaly: 28.1,
    semiMajorAxis: 7113.5,
    orbitalPeriod: 99.4,
    velocity: 7.48,
    massKg: 1192,
    radarCrossSectionM2: 4.8,
    missionRole: 'Global Coastal Ocean Topography & Extreme Storm Surge Early Warning',
    coverageType: 'EARTH_OBSERVATION',
    coverageFootprintKm: 2800,
    targetRegion: 'Western Indian Ocean & East Africa Coastal Basin',
    fuelRemainingDeltaV: 14.8, // m/s total remaining
    maneuverSlewTimeMin: 40,
    reactionWheelStatus: 'Wheel 2 elevated friction (requires 35m pre-burn thermal conditioning)',
    criticalService: 'UN Disaster Relief & Cyclone Surge Telemetry (protects 4.8M coastal residents)',
    slaPenaltyPerHr: '$140,000 / hr maritime routing warranty',
  };

  const secondaryHazard: CrisisScenario['secondaryHazard'] = {
    id: 'sl16-frag-sim',
    name: 'SL-16 R/B DERELICT FRAGMENT #38921 (SIMULATED)',
    catalogId: '38921',
    internationalDesignator: '1992-093BD',
    type: 'DEBRIS',
    regime: 'LEO',
    operator: 'Derelict Rocket Body (Roscosmos legacy)',
    country: 'Russia (Historical)',
    launchDate: '1992-12-25',
    status: 'DERELICT',
    altitude: 735.8,
    inclination: 71.02,
    eccentricity: 0.0021,
    raan: 141.9,
    argPerigee: 120.3,
    meanAnomaly: 28.3,
    semiMajorAxis: 7113.9,
    orbitalPeriod: 99.5,
    velocity: 7.48,
    massKg: 85,
    radarCrossSectionM2: 0.12,
    hazardType: 'FRAGMENTATION_DEBRIS',
    trackingSource: 'US Space Fence (Kwajalein) & LeoLabs Kiwi Radar',
    estimatedFragmentsIfCollision: 7400,
    debrisCloudLongevityYears: 65,
  };

  const baselineBranch: BranchOutcome = {
    branchKey: 'BASELINE',
    title: 'Baseline Trajectory (No Avoidance Burn)',
    description: 'Maintain inertial trajectory without delta-v expenditure. Relies on natural covariance drift.',
    missDistanceKm: 0.078, // 78 meters!
    deltaVRequiredMs: 0.0,
    remainingFuelDeltaV: 14.8,
    operationalLifeLostMonths: 0,
    newOrbit: {
      altitudeKm: 735.4,
      periodMin: 99.4,
      inclinationDeg: 66.04,
    },
    relativeVelocityKmS: 14.32,
    collisionProbability: 0.0142, // 1.42% (extreme hazard, standard threshold is 10^-4)
    uncertaintyRadiusM: 320,
    missionImpactSummary: 'Zero fuel cost, but catastrophic 1-in-70 collision hazard. 7,400+ orbital fragments generated.',
    sustainabilityImpactSummary: 'Severe Kessler syndrome cascade risk in the densely congested 700-800 km polar shell.',
    kesslerFragmentationRiskPct: 98.5,
    earthCoverageStatus: 'PERMANENT_LOSS',
    earthCoverageSummary: 'Catastrophic collision would completely blind coastal storm surge radars for East Africa & maritime shipping lanes.',
  };

  const avoidanceBranch: BranchOutcome = {
    branchKey: 'AVOIDANCE_BURN',
    title: 'Autonomous Autonomous Prograde Clearance Burn',
    description: 'Execute +1.45 m/s along-track delta-v burn at perigee, raising conjunction apogee by +2.8 km.',
    missDistanceKm: 4.85, // 4.85 km clearance!
    deltaVRequiredMs: 1.45,
    remainingFuelDeltaV: 13.35,
    operationalLifeLostMonths: 4.2,
    newOrbit: {
      altitudeKm: 737.1,
      periodMin: 99.46,
      inclinationDeg: 66.04,
    },
    relativeVelocityKmS: 14.31,
    collisionProbability: 0.000002, // 2 in a million (safe)
    uncertaintyRadiusM: 95,
    missionImpactSummary: 'Consumes 9.8% of remaining lifetime propellant (approx 4.2 months operational life lost). Requires 45m instrument slewing outage.',
    sustainabilityImpactSummary: 'Full protection of the 735 km orbital shell. Prevents long-term debris cloud generation.',
    kesslerFragmentationRiskPct: 0.01,
    earthCoverageStatus: 'TEMPORARY_OUTAGE',
    earthCoverageSummary: 'Payload enters safe standby mode for 55 minutes during slewing and burn; 100% telemetry restored upon orbit confirmation.',
  };

  const coordinatedBranch: BranchOutcome = {
    branchKey: 'COORDINATED',
    title: 'Coordinated Cross-Operator Orbital Phasing',
    description: 'Bilateral coordination with ESA Space Debris Office and partner radar networks for micro-differential drag & optimized out-of-plane trim.',
    missDistanceKm: 3.25,
    deltaVRequiredMs: 0.52,
    remainingFuelDeltaV: 14.28,
    operationalLifeLostMonths: 1.4,
    newOrbit: {
      altitudeKm: 736.0,
      periodMin: 99.42,
      inclinationDeg: 66.05,
    },
    relativeVelocityKmS: 14.32,
    collisionProbability: 0.000008,
    uncertaintyRadiusM: 110,
    missionImpactSummary: 'Consumes only 3.5% of fuel budget (1.4 months life lost). Zero sensor downtime by utilizing scheduled inter-orbit drift gap.',
    sustainabilityImpactSummary: 'Gold standard international civil space traffic coordination. Maintains sustainable orbital slots.',
    kesslerFragmentationRiskPct: 0.02,
    earthCoverageStatus: 'NOMINAL',
    earthCoverageSummary: 'Near-zero coverage disruption. Secondary constellation backup satellite meshes telemetry automatically.',
  };

  const initialObservations: TrackingObservation[] = [
    {
      id: 'obs-01',
      timeBeforeTcaMin: initialTcaMin,
      sensorName: 'US Space Fence (Kwajalein Atoll)',
      sensorType: 'RADAR',
      facilityLocation: 'Kwajalein, Marshall Islands (9.39° N, 167.47° E)',
      rawMissDistanceM: 78.4,
      radialSeparationM: 14.2,
      inTrackSeparationM: 68.0,
      crossTrackSeparationM: 34.5,
      collisionProbability: 0.0142,
      covarianceScalePct: 0,
      alertLevel: 'CRITICAL',
      notes: 'Initial S-band multibeam track detected ascending node conjunction. High energy encounter.',
    },
    {
      id: 'obs-02',
      timeBeforeTcaMin: initialTcaMin - 45,
      sensorName: 'LeoLabs Kiwi Space Radar',
      sensorType: 'RADAR',
      facilityLocation: 'Central Otago, New Zealand (-45.03° S, 169.68° E)',
      rawMissDistanceM: 84.1,
      radialSeparationM: 16.5,
      inTrackSeparationM: 72.8,
      crossTrackSeparationM: 38.0,
      collisionProbability: 0.0128,
      covarianceScalePct: -18,
      alertLevel: 'CRITICAL',
      notes: 'UHF phased array track refined Doppler range-rate. Confirmed high-conjunction geometry.',
    },
  ];

  return {
    id: `crisis-${Date.now()}`,
    title: 'CONJUNCTION EMERGENCY: Sentinel-6B vs Derelict SL-16 Upper Stage Fragment',
    codeName: 'AEGIS ORBITAL CRISIS // CONJUNCTION-735',
    classificationNotice: 'SIMULATED ASTRODYNAMIC CONJUNCTION MODEL — GENERATED FOR EVALUATION & DECISION TRAINING (NOT REAL-TIME USAF TELEMETRY)',
    generatedAtEpoch: Date.now(),
    isJudgeDemo,

    primaryAsset,
    secondaryHazard,

    initialTcaMinutes: initialTcaMin,
    currentClockMinutes: initialTcaMin,
    isClockRunning: true,
    timeScale: 10,

    nominalMissDistanceMeters: 78.4,
    currentMissDistanceMeters: 78.4,
    relativeVelocityKmS: 14.32,
    collisionProbability: 0.0142,
    riskLevel: 'CRITICAL',

    covariance: {
      alongTrackUncertaintyM: 320,
      crossTrackUncertaintyM: 180,
      radialUncertaintyM: 65,
      confidenceLevel: 'MEDIUM',
      lastObservationEpoch: new Date().toLocaleTimeString(),
      sensorObservationsCount: 2,
    },

    missionConstraints: [
      'Critical Humanitarian Swath: High-resolution cyclone storm surge scan over East Africa commences in T - 8 hours.',
      'Propellant Scarcity: Remaining spacecraft Δv budget is 14.8 m/s; an evasive burn of ~1.5 m/s sacrifices 4.2 months of designed operational life.',
      'Attitude Subsystem Degradation: Reaction Wheel #2 has elevated friction torque, requiring a 35-minute slow slew and thermal stabilization prior to any thruster firing.',
      'SLA Contractual Liability: Mandatory maritime and aviation route advisories incur $140,000/hr penalties if optical/radar altimetry is offline.',
      'Orbital Shell Congestion: The 730–750 km sun-synchronous band contains over 1,200 active payloads; an untracked maneuver risks secondary conjunctions.',
    ],

    perspectives: {
      missionAnalyst: {
        name: 'Dr. Sarah Vance',
        roleTitle: 'Mission Operations & Ground Coverage Lead',
        stance: 'PROTECT SENSOR UPTIME & HUMANITARIAN COVERAGE',
        recommendation: 'Delay maneuver until T - 4 hours. Wait for next optical pass from Tenerife. If burn is mandatory, limit Δv to < 0.6 m/s to prevent payload shutdown during the East Africa cyclone scan.',
        quote: 'If we execute a blind panic burn right now, our ocean radar shuts down exactly when Cyclone Kalani makes landfall on the Mozambique coast. We need 3 more radar passes to see if covariance drift clears the corridor before sacrificing life-saving data.',
        priority: 'Mission continuity, sensor uptime, coastal disaster warning reliability.',
        disagreementPoint: 'Strongly opposes premature heavy burns that knock out the scientific payload during crisis observation windows.',
      },
      satelliteOperator: {
        name: 'Commander Marcus Thorne',
        roleTitle: 'Spacecraft Bus & Propulsion Systems Engineer',
        stance: 'CONSERVE PROPELLANT & SAFEGUARD BUS INTEGRITY',
        recommendation: 'Execute a pre-planned prograde burn of 1.45 m/s at T - 6h. Do not wait until T - 2h because Reaction Wheel #2 friction makes a last-minute emergency slew dangerous for spacecraft attitude lock.',
        quote: 'Waiting until T - 2 hours is reckless engineering. Reaction wheel 2 is running hot. If we try an emergency slew in the final 90 minutes and tumble, we lose both the mission and the satellite. Burn early, burn clean, and absorb the 4 months of propellant loss.',
        priority: 'Spacecraft structural health, attitude stability, fuel conservation, collision avoidance.',
        disagreementPoint: 'Refuses to accept the Reviewer recommendation to delay past T - 4 hours due to attitude control limitations.',
      },
      sustainabilityAnalyst: {
        name: 'Dr. Elena Rostova',
        roleTitle: 'Orbital Debris Mitigation & Space Sustainability Specialist',
        stance: 'ABSOLUTE ZERO-TOLERANCE COLLISION POLICY',
        recommendation: 'Immediate evasive maneuver. A 1.4% collision risk at 14.3 km/s in the 735 km polar shell will generate 7,400 trackable fragments and trigger runaway Kessler cascade affecting 80+ constellations.',
        quote: 'A 1.4% collision probability is a catastrophic emergency in aerospace terms. The kinetic energy transfer at 14 km/s is equivalent to half a ton of TNT. That would shred Sentinel-6B, contaminate the polar orbit for 65 years, and trap future missions. Burn now.',
        priority: 'Protecting the Low Earth Orbit commons, preventing Kessler cascades, ensuring 25-year deorbit viability.',
        disagreementPoint: 'Completely rejects waiting for more data. Argues that any Pc > 10^-4 warrants immediate evasive action regardless of mission downtime.',
      },
      independentReviewer: {
        name: 'Prof. David Chen',
        roleTitle: 'Astrodynamics & Tracking Covariance Lead Auditor',
        stance: 'CHALLENGE COVARIANCE ASSUMPTIONS & TASK HIGH-PRECISION SENSORS',
        recommendation: 'Do NOT burn yet. The current along-track uncertainty is ±320 meters due to only two radar tracks. Immediately task the Kwajalein Space Fence and Zimmerwald Laser Ranging. Re-evaluate Pc at T - 6 hours with a shrunken covariance ellipsoid.',
        quote: 'You are planning to burn valuable propellant based on an ellipsoid with 320 meters of along-track slop. 78% of these apparent red alerts collapse into safe 2 km misses once a third radar pass resolves the Doppler range-rate. Task the sensors before wasting fuel.',
        priority: 'Data integrity, false alarm rejection, covariance rigor, sensor tasking before action.',
        disagreementPoint: 'Disagrees with the Sustainability Analyst panic; asserts that the high Pc is an artifact of high uncertainty rather than confirmed collision geometry.',
      },
    },

    earthImpact: {
      serviceName: 'Global Ocean Topography & Coastal Cyclone Storm Surge Altimetry',
      regionName: 'Western Indian Ocean, Madagascar & East African Seaboard',
      centerLat: -12.5,
      centerLon: 48.0,
      nominalSwathRadiusKm: 2800,
      affectedPopulationEst: '4,800,000 coastal residents and 14 major shipping corridors',
      backupSatelliteName: 'Jason-3 (Cold Standby / High Inclination)',
      backupHandoverTimeHours: 9.5,
      consequenceIfDestroyed: 'Complete catastrophic loss of real-time storm surge ocean surface telemetry. Cyclone Kalani landfall warnings degraded by 48%; search-and-rescue radar blind for 9.5 hours.',
      consequenceIfManeuvering: 'Controlled 45-minute sensor pause while attitude thrusters fire. Full sea-state measurements resume prior to primary cyclone landfall window.',
      consequenceIfCoordinated: 'Zero data gap. Adjacent constellation craft tilts sensor beam by 4.2° to fill coastal coverage footprint.',
      assumptionsModel: 'Simulated S-band Radar Altimeter cone footprint at 735 km altitude with 66° inclination swath.',
    },

    selectedBranch: 'BASELINE',
    branches: {
      baseline: baselineBranch,
      avoidanceBurn: avoidanceBranch,
      coordinated: coordinatedBranch,
    },
    decisionLog: [],
    trackingTimeline: initialObservations,
  };
}

/**
 * Generate alternative crisis scenarios for diversity
 */
export function generateAlternativeCrisis(type: 'STARLINK_CONSTELLATION' | 'CREWED_STATION' | 'ENVISAT_MEGA'): CrisisScenario {
  const base = createDefaultCrisisScenario(false);

  if (type === 'STARLINK_CONSTELLATION') {
    base.title = 'CONJUNCTION EMERGENCY: Commercial Mega-Constellation vs Cosmos 1408 ASAT Fragment';
    base.codeName = 'STARLINK-LEO // ORBITAL COLLISION ALERT';
    base.primaryAsset.name = 'STARLINK-3104 (SIMULATED)';
    base.primaryAsset.altitude = 550.2;
    base.primaryAsset.inclination = 53.2;
    base.primaryAsset.missionRole = 'Low-Latency Global Broadband & Emergency Mesh Gateway';
    base.primaryAsset.targetRegion = 'Pacific Maritime & Island Community Mesh';
    base.primaryAsset.criticalService = 'Emergency Satellite Internet for 85 Remote Atolls & Civil Aviation';
    base.secondaryHazard.name = 'COSMOS 1408 DEB #49822 (SIMULATED)';
    base.secondaryHazard.altitude = 550.5;
    base.secondaryHazard.hazardType = 'FRAGMENTATION_DEBRIS';
    base.nominalMissDistanceMeters = 42.1;
    base.collisionProbability = 0.0215;
    base.relativeVelocityKmS = 15.1;
    base.earthImpact.serviceName = 'Emergency Satellite Internet & Remote Maritime Connectivity';
    base.earthImpact.centerLat = 1.35;
    base.earthImpact.centerLon = 145.0;
  } else if (type === 'CREWED_STATION') {
    base.title = 'CONJUNCTION ALERT: Commercial Research Habitat Corridor vs Derelict Centaur Upper Stage';
    base.codeName = 'ORBITAL HAB-ALPHA // CREWED PROXIMITY EVENT';
    base.primaryAsset.name = 'AXIOM HAB-RESEARCH MOD (SIMULATED)';
    base.primaryAsset.altitude = 418.0;
    base.primaryAsset.inclination = 51.64;
    base.primaryAsset.missionRole = 'Crewed Microgravity Laboratory & Life Support Platform';
    base.primaryAsset.criticalService = '4 On-Orbit Astronaut Life Support & Station Integrity';
    base.secondaryHazard.name = 'CENTAUR D-1T DERELICT R/B (SIMULATED)';
    base.secondaryHazard.altitude = 418.3;
    base.secondaryHazard.hazardType = 'DERELICT_ROCKET_BODY';
    base.nominalMissDistanceMeters = 65.0;
    base.collisionProbability = 0.0094;
    base.relativeVelocityKmS = 11.8;
  }

  return base;
}

/**
 * Simulate advancing time and generating dynamic sensor passes
 */
export function advanceCrisisTime(scenario: CrisisScenario, minutesToAdvance: number): CrisisScenario {
  const newClock = Math.max(0, scenario.currentClockMinutes - minutesToAdvance);
  const updatedScenario = { ...scenario, currentClockMinutes: newClock };

  // If time crossed major tracking milestones, generate new tracking observations!
  const hasNewObservation = scenario.currentClockMinutes > 600 && newClock <= 600 && scenario.trackingTimeline.length < 3;
  const hasSecondObservation = scenario.currentClockMinutes > 300 && newClock <= 300 && scenario.trackingTimeline.length < 4;

  if (hasNewObservation) {
    const obs: TrackingObservation = {
      id: `obs-auto-${Date.now()}`,
      timeBeforeTcaMin: Math.round(newClock),
      sensorName: 'ESA Optical Ground Station (Tenerife)',
      sensorType: 'OPTICAL',
      facilityLocation: 'Teide Observatory, Canary Islands (28.3° N, 16.5° W)',
      rawMissDistanceM: 92.4,
      radialSeparationM: 21.0,
      inTrackSeparationM: 65.2,
      crossTrackSeparationM: 42.1,
      collisionProbability: 0.0089,
      covarianceScalePct: -38,
      alertLevel: 'HIGH',
      notes: 'High-precision charge-coupled telescope observed sunlit flash. Covariance along-track reduced to ±190m.',
    };
    updatedScenario.trackingTimeline = [...scenario.trackingTimeline, obs];
    updatedScenario.covariance = {
      ...scenario.covariance,
      alongTrackUncertaintyM: 190,
      crossTrackUncertaintyM: 120,
      radialUncertaintyM: 45,
      confidenceLevel: 'HIGH',
      sensorObservationsCount: scenario.covariance.sensorObservationsCount + 1,
      lastObservationEpoch: new Date().toLocaleTimeString(),
    };
    updatedScenario.currentMissDistanceMeters = 92.4;
    updatedScenario.collisionProbability = 0.0089;
  } else if (hasSecondObservation) {
    const obs: TrackingObservation = {
      id: `obs-auto-${Date.now()}-2`,
      timeBeforeTcaMin: Math.round(newClock),
      sensorName: 'Space Fence High-Power Radar (Kwajalein Track 2)',
      sensorType: 'RADAR',
      facilityLocation: 'Kwajalein Atoll, Marshall Islands',
      rawMissDistanceM: 104.8,
      radialSeparationM: 26.5,
      inTrackSeparationM: 58.1,
      crossTrackSeparationM: 39.0,
      collisionProbability: 0.0041,
      covarianceScalePct: -55,
      alertLevel: 'ELEVATED',
      notes: 'Second radar transit resolved radial velocity to 0.02 m/s precision. Conjunction plane confirmed.',
    };
    updatedScenario.trackingTimeline = [...updatedScenario.trackingTimeline, obs];
    updatedScenario.covariance = {
      ...updatedScenario.covariance,
      alongTrackUncertaintyM: 120,
      crossTrackUncertaintyM: 80,
      radialUncertaintyM: 30,
      confidenceLevel: 'HIGH',
      sensorObservationsCount: updatedScenario.covariance.sensorObservationsCount + 1,
      lastObservationEpoch: new Date().toLocaleTimeString(),
    };
    updatedScenario.currentMissDistanceMeters = 104.8;
    updatedScenario.collisionProbability = 0.0041;
  }

  return updatedScenario;
}

/**
 * Apply a user decision to the crisis scenario
 */
export function applyCrisisDecision(
  scenario: CrisisScenario,
  decision: UserCrisisDecisionType,
  customNotes?: string
): CrisisScenario {
  const updated = { ...scenario };

  switch (decision) {
    case 'WAIT_MORE_DATA': {
      // Advance clock by 120 minutes (2 hours), burn reaction wheel margin
      const nextClock = Math.max(120, scenario.currentClockMinutes - 120);
      updated.currentClockMinutes = nextClock;
      updated.decisionLog = [
        ...scenario.decisionLog,
        {
          id: `dec-${Date.now()}`,
          timestampMinBeforeTca: scenario.currentClockMinutes,
          decisionType: 'WAIT_MORE_DATA',
          label: 'Wait for Next Ground Station & Radar Pass',
          details: `Decision window postponed by 2 hours (T - ${Math.round(nextClock / 60)}h remaining). Reaction wheel thermal margin reduced.`,
        },
      ];
      // Generate immediate tracking update as next pass completed
      const newObs: TrackingObservation = {
        id: `obs-wait-${Date.now()}`,
        timeBeforeTcaMin: nextClock,
        sensorName: 'Zimmerwald Laser Ranging Station (Swiss Optical)',
        sensorType: 'LASER_RANGING',
        facilityLocation: 'Zimmerwald, Switzerland (46.87° N, 7.46° E)',
        rawMissDistanceM: 89.6,
        radialSeparationM: 22.4,
        inTrackSeparationM: 61.0,
        crossTrackSeparationM: 37.2,
        collisionProbability: 0.0076,
        covarianceScalePct: -42,
        alertLevel: 'HIGH',
        notes: 'Laser retroreflector pass captured high-cadence photon returns. Covariance shrunk significantly.',
      };
      updated.trackingTimeline = [...scenario.trackingTimeline, newObs];
      updated.covariance = {
        ...scenario.covariance,
        alongTrackUncertaintyM: 175,
        crossTrackUncertaintyM: 110,
        confidenceLevel: 'HIGH',
        sensorObservationsCount: scenario.covariance.sensorObservationsCount + 1,
        lastObservationEpoch: new Date().toLocaleTimeString(),
      };
      break;
    }

    case 'REQUEST_TRACKING': {
      // Task sensor network immediately
      const newObs: TrackingObservation = {
        id: `obs-task-${Date.now()}`,
        timeBeforeTcaMin: scenario.currentClockMinutes,
        sensorName: 'Priority Tasked: Space Fence High-Power S-Band Monopulse',
        sensorType: 'RADAR',
        facilityLocation: 'Kwajalein Atoll (Dedicated Tasking Window)',
        rawMissDistanceM: 94.2,
        radialSeparationM: 24.1,
        inTrackSeparationM: 62.0,
        crossTrackSeparationM: 38.0,
        collisionProbability: 0.0058,
        covarianceScalePct: -60,
        alertLevel: 'HIGH',
        notes: 'Tasked high-power radar sweep confirmed conjunction geometry. Uncertainty ellipsoid collapsed by 60%.',
      };
      updated.trackingTimeline = [...scenario.trackingTimeline, newObs];
      updated.covariance = {
        ...scenario.covariance,
        alongTrackUncertaintyM: 130,
        crossTrackUncertaintyM: 75,
        radialUncertaintyM: 28,
        confidenceLevel: 'HIGH',
        sensorObservationsCount: scenario.covariance.sensorObservationsCount + 1,
        lastObservationEpoch: new Date().toLocaleTimeString(),
      };
      updated.decisionLog = [
        ...scenario.decisionLog,
        {
          id: `dec-${Date.now()}`,
          timestampMinBeforeTca: scenario.currentClockMinutes,
          decisionType: 'REQUEST_TRACKING',
          label: 'Tasked High-Priority Radar & Optical Network',
          details: 'Dispatched emergency tasking to Space Fence and Tenerife. Covariance ellipsoid along-track shrank from ±320m to ±130m.',
        },
      ];
      break;
    }

    case 'RUN_AVOIDANCE': {
      updated.selectedBranch = 'AVOIDANCE_BURN';
      updated.decisionLog = [
        ...scenario.decisionLog,
        {
          id: `dec-${Date.now()}`,
          timestampMinBeforeTca: scenario.currentClockMinutes,
          decisionType: 'RUN_AVOIDANCE',
          label: 'Execute Evasive Prograde Clearance Burn (+1.45 m/s)',
          details: 'Command uploaded to spacecraft thruster computer. Apogee raised by +2.8 km, ensuring 4.85 km miss distance at TCA.',
        },
      ];
      break;
    }

    case 'COORDINATE_OPERATOR': {
      updated.selectedBranch = 'COORDINATED';
      updated.decisionLog = [
        ...scenario.decisionLog,
        {
          id: `dec-${Date.now()}`,
          timestampMinBeforeTca: scenario.currentClockMinutes,
          decisionType: 'COORDINATE_OPERATOR',
          label: 'Coordinated Bilateral Operator Agreement',
          details: 'Agreed on joint orbit phasing. Spacecraft executes gentle 0.52 m/s burn with zero sensor downtime. Clearance: 3.25 km.',
        },
      ];
      break;
    }

    case 'EXPLORE_HYPOTHETICAL': {
      updated.decisionLog = [
        ...scenario.decisionLog,
        {
          id: `dec-${Date.now()}`,
          timestampMinBeforeTca: scenario.currentClockMinutes,
          decisionType: 'EXPLORE_HYPOTHETICAL',
          label: 'Hypothetical What-If Simulation Explored',
          details: customNotes || 'Evaluated worst-case kinetic impact physics and secondary debris propagation cloud.',
        },
      ];
      break;
    }
  }

  return updated;
}
