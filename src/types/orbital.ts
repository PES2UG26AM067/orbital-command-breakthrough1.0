export type OrbitRegime = 'LEO' | 'MEO' | 'GEO' | 'HEO';
export type ObjectType = 'PAYLOAD' | 'DEBRIS' | 'ROCKET_BODY';
export type ConjunctionStatus = 'NOMINAL' | 'MONITOR' | 'CLOSE_APPROACH';

export interface OrbitalElements {
  semiMajorAxis: number; // km (radius from Earth center: a = R_E + altitude)
  altitude: number; // km (approximate perigee / circular altitude)
  inclination: number; // degrees (0 to 180)
  eccentricity: number; // 0 to <1
  raan: number; // Right Ascension of the Ascending Node (deg)
  argPerigee: number; // Argument of perigee (deg)
  meanAnomaly: number; // Mean anomaly at epoch (deg)
  orbitalPeriod: number; // minutes
  velocity: number; // km/s (approx circular orbital velocity)
}

export interface OrbitalObject extends OrbitalElements {
  id: string;
  name: string;
  catalogId: string; // NORAD ID
  internationalDesignator: string;
  type: ObjectType;
  regime: OrbitRegime;
  operator: string;
  country: string;
  launchDate: string;
  status: 'OPERATIONAL' | 'DERELICT' | 'DECAYING';
  massKg?: number;
  radarCrossSectionM2?: number;
  color?: string;
  description?: string;
  epoch?: string;
  isLive?: boolean;
}

export interface CartesianPosition {
  x: number;
  y: number;
  z: number;
  vx?: number;
  vy?: number;
  vz?: number;
}

export interface GeographicPosition {
  latitude: number;
  longitude: number;
  altitude: number;
}

export interface ConjunctionAssessment {
  objectA: OrbitalObject;
  objectB: OrbitalObject;
  timeToTca: number; // minutes from now
  tcaDate: Date;
  minSeparation: number; // km
  currentSeparation: number; // km
  relativeVelocity: number; // km/s
  status: ConjunctionStatus;
  geometry: string;
  radialSeparation: number; // km
  inTrackSeparation: number; // km
  crossTrackSeparation: number; // km
  timeSeries: { timeOffsetMin: number; separationKm: number }[];
  scientificReason: string;
}

export interface SimulationParams {
  altitudeDeltaKm: number; // e.g., +150 km
  inclinationDeltaDeg: number; // e.g., +2.5 deg
  eccentricityDelta: number; // e.g., +0.05
  simulationDurationMin: number;
  timeStepSec: number;
}

export interface SimulationResult {
  originalObject: OrbitalObject;
  modifiedElements: OrbitalElements;
  deltaV: number; // m/s required for maneuver
  deltaVAltitude: number; // m/s
  deltaVPlaneChange: number; // m/s
  newPeriodMin: number;
  newVelocityKmS: number;
  newSemiMajorAxisKm: number;
  explanation: string;
  conjunctionImpact?: {
    originalMinSeparation: number;
    newMinSeparation: number;
    status: ConjunctionStatus;
  };
}

export interface TransferPlan {
  originAltitude: number;
  destinationAltitude: number;
  originInclination: number;
  destinationInclination: number;
  missionObjective: string;
  deltaV1: number; // m/s
  deltaV2: number; // m/s
  deltaVPlaneChange: number; // m/s
  totalDeltaV: number; // m/s
  transferTimeMin: number;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  fuelFractionEstimate: number; // % of spacecraft mass assuming Isp ~ 310s
}
