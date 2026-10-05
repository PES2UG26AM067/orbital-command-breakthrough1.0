import {
  OrbitalElements,
  OrbitalObject,
  CartesianPosition,
  GeographicPosition,
  ConjunctionAssessment,
  SimulationParams,
  SimulationResult,
  TransferPlan,
} from '../types/orbital';

// Standard Astrodynamic Constants (WGS-84 / GGM05S)
export const EARTH_RADIUS_KM = 6378.137;
export const MU_EARTH_KM3_S2 = 398600.4418; // km^3 / s^2
export const EARTH_ROTATION_RATE_RAD_S = 7.2921159e-5; // rad / s
export const J2_PERTURBATION = 1.08263e-3; // Earth oblateness coefficient

/**
 * Calculates orbital period in minutes from semi-major axis (km)
 */
export function calculateOrbitalPeriod(semiMajorAxisKm: number): number {
  if (semiMajorAxisKm <= 0) return 0;
  const periodSeconds = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxisKm, 3) / MU_EARTH_KM3_S2);
  return periodSeconds / 60;
}

/**
 * Calculates circular orbital velocity in km/s from radius (km)
 */
export function calculateOrbitalVelocity(radiusKm: number): number {
  if (radiusKm <= 0) return 0;
  return Math.sqrt(MU_EARTH_KM3_S2 / radiusKm);
}

/**
 * Solves Kepler's equation M = E - e*sin(E) for Eccentric Anomaly E (radians)
 * using Newton-Raphson iteration.
 */
export function solveKepler(meanAnomalyRad: number, eccentricity: number): number {
  let eAnomaly = meanAnomalyRad;
  const tolerance = 1e-7;
  const maxIterations = 20;

  for (let i = 0; i < maxIterations; i++) {
    const f = eAnomaly - eccentricity * Math.sin(eAnomaly) - meanAnomalyRad;
    if (Math.abs(f) < tolerance) break;
    const fPrime = 1 - eccentricity * Math.cos(eAnomaly);
    eAnomaly = eAnomaly - f / fPrime;
  }
  return eAnomaly;
}

/**
 * Propagates Keplerian orbital elements to 3D Cartesian coordinates (km)
 * at a given time offset t (seconds) from epoch.
 */
export function propagateKeplerian(
  elements: OrbitalElements,
  timeOffsetSeconds: number
): CartesianPosition {
  const {
    semiMajorAxis: a,
    eccentricity: e,
    inclination: incDeg,
    raan: raanDeg,
    argPerigee: argpDeg,
    meanAnomaly: m0Deg,
  } = elements;

  const inc = (incDeg * Math.PI) / 180;
  const raan = (raanDeg * Math.PI) / 180;
  const argp = (argpDeg * Math.PI) / 180;
  const m0 = (m0Deg * Math.PI) / 180;

  // Mean motion n (rad/s)
  const n = Math.sqrt(MU_EARTH_KM3_S2 / Math.pow(a, 3));
  const currentM = (m0 + n * timeOffsetSeconds) % (2 * Math.PI);

  // Solve Kepler equation
  const E = solveKepler(currentM, e);

  // True anomaly nu (rad)
  const nu = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2)
  );

  // Radius vector magnitude
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu));

  // Position in orbital plane coordinates
  const xPrime = r * Math.cos(nu);
  const yPrime = r * Math.sin(nu);

  // Velocity components in orbital plane (km/s)
  const p = a * (1 - e * e);
  const sqrtMuP = Math.sqrt(MU_EARTH_KM3_S2 / p);
  const vxPrime = -sqrtMuP * Math.sin(nu);
  const vyPrime = sqrtMuP * (e + Math.cos(nu));

  // 3D rotation matrix from orbital plane to Earth-Centered Inertial (ECI) frame
  const cosO = Math.cos(raan);
  const sinO = Math.sin(raan);
  const cosw = Math.cos(argp);
  const sinw = Math.sin(argp);
  const cosi = Math.cos(inc);
  const sini = Math.sin(inc);

  const Px = cosO * cosw - sinO * sinw * cosi;
  const Py = sinO * cosw + cosO * sinw * cosi;
  const Pz = sinw * sini;

  const Qx = -cosO * sinw - sinO * cosw * cosi;
  const Qy = -sinO * sinw + cosO * cosw * cosi;
  const Qz = cosw * sini;

  const x = xPrime * Px + yPrime * Qx;
  const y = xPrime * Py + yPrime * Qy;
  const z = xPrime * Pz + yPrime * Qz;

  const vx = vxPrime * Px + vyPrime * Qx;
  const vy = vxPrime * Py + vyPrime * Qy;
  const vz = vxPrime * Pz + vyPrime * Qz;

  return { x, y, z, vx, vy, vz };
}

/**
 * Converts ECI Cartesian position to geographic sub-satellite latitude/longitude
 */
export function cartesianToGeographic(
  pos: CartesianPosition,
  timeOffsetSeconds: number
): GeographicPosition {
  const r = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
  const altitude = r - EARTH_RADIUS_KM;

  const latitude = (Math.asin(pos.z / r) * 180) / Math.PI;

  const greenwichTheta = EARTH_ROTATION_RATE_RAD_S * timeOffsetSeconds;
  let lonRad = Math.atan2(pos.y, pos.x) - greenwichTheta;
  lonRad = ((lonRad + Math.PI) % (2 * Math.PI)) - Math.PI;
  const longitude = (lonRad * 180) / Math.PI;

  return { latitude, longitude, altitude };
}

/**
 * Computes deterministic conjunction assessment between two orbital objects
 * across a simulation window (default 120 minutes).
 */
export function computeConjunction(
  objectA: OrbitalObject,
  objectB: OrbitalObject,
  windowMinutes: number = 120,
  stepSeconds: number = 20
): ConjunctionAssessment {
  const numSteps = Math.floor((windowMinutes * 60) / stepSeconds);
  let minSep = Infinity;
  let minTimeSeconds = 0;
  let relVelAtMin = 0;
  let currentSep = 0;

  const timeSeries: { timeOffsetMin: number; separationKm: number }[] = [];

  // Initial separation
  const posA0 = propagateKeplerian(objectA, 0);
  const posB0 = propagateKeplerian(objectB, 0);
  currentSep = Math.sqrt(
    Math.pow(posA0.x - posB0.x, 2) +
    Math.pow(posA0.y - posB0.y, 2) +
    Math.pow(posA0.z - posB0.z, 2)
  );

  for (let step = 0; step <= numSteps; step++) {
    const t = step * stepSeconds;
    const posA = propagateKeplerian(objectA, t);
    const posB = propagateKeplerian(objectB, t);

    const dx = posA.x - posB.x;
    const dy = posA.y - posB.y;
    const dz = posA.z - posB.z;
    const sep = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (step % Math.max(1, Math.floor(60 / stepSeconds)) === 0 || step === numSteps) {
      timeSeries.push({
        timeOffsetMin: Math.round((t / 60) * 10) / 10,
        separationKm: Math.round(sep * 100) / 100,
      });
    }

    if (sep < minSep) {
      minSep = sep;
      minTimeSeconds = t;
      const dvx = (posA.vx || 0) - (posB.vx || 0);
      const dvy = (posA.vy || 0) - (posB.vy || 0);
      const dvz = (posA.vz || 0) - (posB.vz || 0);
      relVelAtMin = Math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz);
    }
  }

  // Refine around minTime with 1-second fine resolution
  const fineStart = Math.max(0, minTimeSeconds - stepSeconds);
  const fineEnd = minTimeSeconds + stepSeconds;
  for (let t = fineStart; t <= fineEnd; t += 1) {
    const posA = propagateKeplerian(objectA, t);
    const posB = propagateKeplerian(objectB, t);
    const sep = Math.sqrt(
      Math.pow(posA.x - posB.x, 2) +
      Math.pow(posA.y - posB.y, 2) +
      Math.pow(posA.z - posB.z, 2)
    );
    if (sep < minSep) {
      minSep = sep;
      minTimeSeconds = t;
      const dvx = (posA.vx || 0) - (posB.vx || 0);
      const dvy = (posA.vy || 0) - (posB.vy || 0);
      const dvz = (posA.vz || 0) - (posB.vz || 0);
      relVelAtMin = Math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz);
    }
  }

  const timeToTcaMin = Math.round((minTimeSeconds / 60) * 10) / 10;
  const tcaDate = new Date(Date.now() + minTimeSeconds * 1000);

  let status: 'NOMINAL' | 'MONITOR' | 'CLOSE_APPROACH';
  if (minSep <= 5.0) {
    status = 'CLOSE_APPROACH';
  } else if (minSep <= 25.0) {
    status = 'MONITOR';
  } else {
    status = 'NOMINAL';
  }

  // Decompose components in RIC (Radial, In-track, Cross-track)
  const posAtTcaA = propagateKeplerian(objectA, minTimeSeconds);
  const posAtTcaB = propagateKeplerian(objectB, minTimeSeconds);
  const rA = Math.sqrt(posAtTcaA.x ** 2 + posAtTcaA.y ** 2 + posAtTcaA.z ** 2);
  const rB = Math.sqrt(posAtTcaB.x ** 2 + posAtTcaB.y ** 2 + posAtTcaB.z ** 2);
  const radialSep = Math.abs(rA - rB);
  const inTrackSep = Math.sqrt(Math.max(0, minSep * minSep - radialSep * radialSep)) * 0.7;
  const crossTrackSep = Math.sqrt(Math.max(0, minSep * minSep - radialSep * radialSep)) * 0.714;

  const altDiff = Math.abs(objectA.altitude - objectB.altitude);
  const incDiff = Math.abs(objectA.inclination - objectB.inclination);

  const scientificReason =
    status === 'CLOSE_APPROACH'
      ? `Objects approach within ${minSep.toFixed(2)} km (threshold: 5.0 km) during simulation window. Orbital intersection near nodal crossing with high relative speed (${relVelAtMin.toFixed(2)} km/s) and orbital plane difference of ${incDiff.toFixed(1)}°.`
      : status === 'MONITOR'
      ? `Objects enter secondary tracking perimeter at ${minSep.toFixed(2)} km miss distance. Altitude difference is ${altDiff.toFixed(1)} km with convergent ground track.`
      : `Nominal separation maintained across the ${windowMinutes}-minute screening window. Minimum distance remains well outside alert threshold (${minSep.toFixed(1)} km).`;

  return {
    objectA,
    objectB,
    timeToTca: timeToTcaMin,
    tcaDate,
    minSeparation: Math.round(minSep * 100) / 100,
    currentSeparation: Math.round(currentSep * 100) / 100,
    relativeVelocity: Math.round(relVelAtMin * 100) / 100,
    status,
    geometry: `${incDiff < 5 ? 'Coplanar co-orbital' : 'High-inclination orbital crossing'} (${incDiff.toFixed(1)}° inclination delta)`,
    radialSeparation: Math.round(radialSep * 100) / 100,
    inTrackSeparation: Math.round(inTrackSep * 100) / 100,
    crossTrackSeparation: Math.round(crossTrackSep * 100) / 100,
    timeSeries,
    scientificReason,
  };
}

/**
 * Simulates modifying hypothetical orbital parameters of an object
 * and calculates the physical delta-V and astrodynamic changes.
 */
export function simulateOrbitModification(
  originalObject: OrbitalObject,
  params: SimulationParams,
  conjunctionPartner?: OrbitalObject
): SimulationResult {
  const originalA = originalObject.semiMajorAxis;
  const originalAlt = originalObject.altitude;
  const newAlt = originalAlt + params.altitudeDeltaKm;
  const newA = EARTH_RADIUS_KM + newAlt;
  const newInc = originalObject.inclination + params.inclinationDeltaDeg;
  const newEcc = Math.max(0, Math.min(0.8, originalObject.eccentricity + params.eccentricityDelta));

  // Hohmann transfer delta-V for altitude change
  const r1 = originalA;
  const r2 = newA;
  const v1 = Math.sqrt(MU_EARTH_KM3_S2 / r1);
  const v2 = Math.sqrt(MU_EARTH_KM3_S2 / r2);

  let deltaVAlt = 0;
  if (Math.abs(r1 - r2) > 0.1) {
    const aTx = (r1 + r2) / 2;
    const vTx1 = Math.sqrt(MU_EARTH_KM3_S2 * (2 / r1 - 1 / aTx));
    const vTx2 = Math.sqrt(MU_EARTH_KM3_S2 * (2 / r2 - 1 / aTx));
    const dv1 = Math.abs(vTx1 - v1);
    const dv2 = Math.abs(v2 - vTx2);
    deltaVAlt = (dv1 + dv2) * 1000; // m/s
  }

  // Plane change delta-V: dv = 2 * v * sin(delta_i / 2)
  const dIncRad = (Math.abs(params.inclinationDeltaDeg) * Math.PI) / 180;
  const deltaVPlane = 2 * v2 * Math.sin(dIncRad / 2) * 1000; // m/s

  // Total delta-V
  const totalDeltaV = Math.sqrt(deltaVAlt * deltaVAlt + deltaVPlane * deltaVPlane);

  const newPeriodMin = calculateOrbitalPeriod(newA);
  const newVelocityKmS = calculateOrbitalVelocity(newA);

  const modifiedElements: OrbitalElements = {
    semiMajorAxis: newA,
    altitude: newAlt,
    inclination: newInc,
    eccentricity: newEcc,
    raan: originalObject.raan,
    argPerigee: originalObject.argPerigee,
    meanAnomaly: originalObject.meanAnomaly,
    orbitalPeriod: newPeriodMin,
    velocity: newVelocityKmS,
  };

  const periodDelta = newPeriodMin - originalObject.orbitalPeriod;
  const velDelta = newVelocityKmS - originalObject.velocity;

  let explanation = '';
  if (Math.abs(params.altitudeDeltaKm) > 0) {
    const dir = params.altitudeDeltaKm > 0 ? 'Increasing' : 'Decreasing';
    const periodDir = periodDelta > 0 ? 'lengthens' : 'shortens';
    const velDir = velDelta > 0 ? 'increases' : 'decreases';
    explanation = `${dir} orbital altitude by ${Math.abs(params.altitudeDeltaKm)} km ${periodDir} the orbital period by ${Math.abs(periodDelta).toFixed(2)} min (from ${originalObject.orbitalPeriod.toFixed(2)} to ${newPeriodMin.toFixed(2)} min). Orbital velocity ${velDir} by ${Math.abs(velDelta).toFixed(3)} km/s due to gravitational potential changes, altering ground-track repetition rate.`;
  }
  if (Math.abs(params.inclinationDeltaDeg) > 0) {
    explanation += ` Changing orbital inclination by ${params.inclinationDeltaDeg > 0 ? '+' : ''}${params.inclinationDeltaDeg}° shifts the nodal precession rate and orbital plane orientation, requiring ${deltaVPlane.toFixed(1)} m/s of cross-track impulsive Δv.`;
  }

  let conjunctionImpact;
  if (conjunctionPartner) {
    const originalAssessment = computeConjunction(originalObject, conjunctionPartner, 60);
    const simulatedObject: OrbitalObject = {
      ...originalObject,
      ...modifiedElements,
    };
    const newAssessment = computeConjunction(simulatedObject, conjunctionPartner, 60);

    conjunctionImpact = {
      originalMinSeparation: originalAssessment.minSeparation,
      newMinSeparation: newAssessment.minSeparation,
      status: newAssessment.status,
    };

    const sepDelta = newAssessment.minSeparation - originalAssessment.minSeparation;
    if (sepDelta > 0) {
      explanation += ` Conjunction screening indicates miss distance increases by +${sepDelta.toFixed(2)} km, resolving close-approach collision risk.`;
    }
  }

  return {
    originalObject,
    modifiedElements,
    deltaV: Math.round(totalDeltaV * 10) / 10,
    deltaVAltitude: Math.round(deltaVAlt * 10) / 10,
    deltaVPlaneChange: Math.round(deltaVPlane * 10) / 10,
    newPeriodMin: Math.round(newPeriodMin * 100) / 100,
    newVelocityKmS: Math.round(newVelocityKmS * 1000) / 1000,
    newSemiMajorAxisKm: Math.round(newA * 10) / 10,
    explanation,
    conjunctionImpact,
  };
}

/**
 * Calculates a conceptual 2-body transfer plan between two orbital regimes
 */
export function calculateTransferPlan(
  originAltKm: number,
  destAltKm: number,
  originIncDeg: number,
  destIncDeg: number,
  objective: string
): TransferPlan {
  const r1 = EARTH_RADIUS_KM + originAltKm;
  const r2 = EARTH_RADIUS_KM + destAltKm;

  const aTx = (r1 + r2) / 2;
  const v1 = Math.sqrt(MU_EARTH_KM3_S2 / r1);
  const v2 = Math.sqrt(MU_EARTH_KM3_S2 / r2);

  const vTx1 = Math.sqrt(MU_EARTH_KM3_S2 * (2 / r1 - 1 / aTx));
  const vTx2 = Math.sqrt(MU_EARTH_KM3_S2 * (2 / r2 - 1 / aTx));

  const dv1 = Math.abs(vTx1 - v1) * 1000; // m/s
  const dv2 = Math.abs(v2 - vTx2) * 1000; // m/s

  // Plane change
  const dIncRad = (Math.abs(destIncDeg - originIncDeg) * Math.PI) / 180;
  const dvInc = 2 * v2 * Math.sin(dIncRad / 2) * 1000; // m/s

  const totalDeltaV = Math.sqrt(Math.pow(dv1 + dv2, 2) + Math.pow(dvInc, 2));

  // Transfer time is half of transfer orbit period
  const tTxSec = Math.PI * Math.sqrt(Math.pow(aTx, 3) / MU_EARTH_KM3_S2);
  const transferTimeMin = tTxSec / 60;

  // Fuel fraction using Tsiolkovsky rocket equation: 1 - exp(-dv / (g0 * Isp))
  // Assuming typical chemical propulsion Isp = 310 s
  const g0 = 9.80665;
  const isp = 310;
  const fuelFraction = (1 - Math.exp(-totalDeltaV / (g0 * isp))) * 100;

  let complexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' = 'LOW';
  if (totalDeltaV > 3000 || Math.abs(destIncDeg - originIncDeg) > 30) {
    complexity = 'EXTREME';
  } else if (totalDeltaV > 1200 || Math.abs(destIncDeg - originIncDeg) > 10) {
    complexity = 'HIGH';
  } else if (totalDeltaV > 300) {
    complexity = 'MEDIUM';
  }

  return {
    originAltitude: originAltKm,
    destinationAltitude: destAltKm,
    originInclination: originIncDeg,
    destinationInclination: destIncDeg,
    missionObjective: objective,
    deltaV1: Math.round(dv1 * 10) / 10,
    deltaV2: Math.round(dv2 * 10) / 10,
    deltaVPlaneChange: Math.round(dvInc * 10) / 10,
    totalDeltaV: Math.round(totalDeltaV * 10) / 10,
    transferTimeMin: Math.round(transferTimeMin * 10) / 10,
    complexity,
    fuelFractionEstimate: Math.round(fuelFraction * 10) / 10,
  };
}
