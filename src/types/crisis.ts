import { OrbitalObject, SimulationResult } from './orbital';

export type PerspectiveRole = 
  | 'HALO'
  | 'MISSION_ANALYST'
  | 'SATELLITE_OPERATOR'
  | 'SUSTAINABILITY'
  | 'INDEPENDENT_REVIEWER';

export type UserCrisisDecisionType = 
  | 'WAIT_MORE_DATA'
  | 'REQUEST_TRACKING'
  | 'RUN_AVOIDANCE'
  | 'COORDINATE_OPERATOR'
  | 'EXPLORE_HYPOTHETICAL';

export interface TrackingObservation {
  id: string;
  timeBeforeTcaMin: number;
  sensorName: string;
  sensorType: 'RADAR' | 'OPTICAL' | 'LASER_RANGING';
  facilityLocation: string;
  rawMissDistanceM: number;
  radialSeparationM: number;
  inTrackSeparationM: number;
  crossTrackSeparationM: number;
  collisionProbability: number;
  covarianceScalePct: number; // e.g. -45% uncertainty
  alertLevel: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'NOMINAL';
  notes: string;
}

export interface BranchOutcome {
  branchKey: 'BASELINE' | 'AVOIDANCE_BURN' | 'COORDINATED';
  title: string;
  description: string;
  missDistanceKm: number;
  deltaVRequiredMs: number;
  remainingFuelDeltaV: number;
  operationalLifeLostMonths: number;
  newOrbit: {
    altitudeKm: number;
    periodMin: number;
    inclinationDeg: number;
  };
  relativeVelocityKmS: number;
  collisionProbability: number;
  uncertaintyRadiusM: number;
  missionImpactSummary: string;
  sustainabilityImpactSummary: string;
  kesslerFragmentationRiskPct: number;
  earthCoverageStatus: 'NOMINAL' | 'TEMPORARY_OUTAGE' | 'PERMANENT_LOSS' | 'BACKUP_ACTIVE';
  earthCoverageSummary: string;
}

export interface CrisisScenario {
  id: string;
  title: string;
  codeName: string;
  classificationNotice: string;
  generatedAtEpoch: number;
  isJudgeDemo?: boolean;

  // Spacecraft & Hazard details
  primaryAsset: OrbitalObject & {
    missionRole: string;
    coverageType: 'COMMUNICATIONS' | 'EARTH_OBSERVATION' | 'NAVIGATION';
    coverageFootprintKm: number;
    targetRegion: string;
    fuelRemainingDeltaV: number; // m/s
    maneuverSlewTimeMin: number;
    reactionWheelStatus: string;
    criticalService: string;
    slaPenaltyPerHr?: string;
  };

  secondaryHazard: OrbitalObject & {
    hazardType: 'FRAGMENTATION_DEBRIS' | 'DERELICT_ROCKET_BODY' | 'DEFUNCT_PAYLOAD';
    radarCrossSectionM2: number;
    trackingSource: string;
    estimatedFragmentsIfCollision: number;
    debrisCloudLongevityYears: number;
  };

  // Conjunction Parameters
  initialTcaMinutes: number;
  currentClockMinutes: number; // counts down to 0
  isClockRunning: boolean;
  timeScale: number; // e.g. 1x, 10x, 60x

  nominalMissDistanceMeters: number;
  currentMissDistanceMeters: number;
  relativeVelocityKmS: number;
  collisionProbability: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'ELEVATED';

  // Covariance & Tracking Uncertainty
  covariance: {
    alongTrackUncertaintyM: number;
    crossTrackUncertaintyM: number;
    radialUncertaintyM: number;
    confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    lastObservationEpoch: string;
    sensorObservationsCount: number;
  };

  // Operational Constraints
  missionConstraints: string[];

  // 4 AI Specialist Perspectives
  perspectives: {
    missionAnalyst: {
      name: string;
      roleTitle: string;
      stance: string;
      recommendation: string;
      quote: string;
      priority: string;
      disagreementPoint: string;
    };
    satelliteOperator: {
      name: string;
      roleTitle: string;
      stance: string;
      recommendation: string;
      quote: string;
      priority: string;
      disagreementPoint: string;
    };
    sustainabilityAnalyst: {
      name: string;
      roleTitle: string;
      stance: string;
      recommendation: string;
      quote: string;
      priority: string;
      disagreementPoint: string;
    };
    independentReviewer: {
      name: string;
      roleTitle: string;
      stance: string;
      recommendation: string;
      quote: string;
      priority: string;
      disagreementPoint: string;
    };
  };

  // Earth Impact Model
  earthImpact: {
    serviceName: string;
    regionName: string;
    centerLat: number;
    centerLon: number;
    nominalSwathRadiusKm: number;
    affectedPopulationEst: string;
    backupSatelliteName: string;
    backupHandoverTimeHours: number;
    consequenceIfDestroyed: string;
    consequenceIfManeuvering: string;
    consequenceIfCoordinated: string;
    assumptionsModel: string;
  };

  // History & Branching
  selectedBranch: 'BASELINE' | 'AVOIDANCE_BURN' | 'COORDINATED';
  branches: {
    baseline: BranchOutcome;
    avoidanceBurn: BranchOutcome;
    coordinated: BranchOutcome;
  };
  decisionLog: {
    id: string;
    timestampMinBeforeTca: number;
    decisionType: UserCrisisDecisionType;
    label: string;
    details: string;
  }[];
  trackingTimeline: TrackingObservation[];
}

export interface HaloChatMessage {
  id: string;
  senderRole: PerspectiveRole | 'USER';
  senderName: string;
  timestamp: string;
  content: string;
  suggestedFollowUps?: string[];
}
