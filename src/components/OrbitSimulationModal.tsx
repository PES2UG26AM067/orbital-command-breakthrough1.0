import React, { useState, useEffect } from 'react';
import { OrbitalObject, SimulationParams, SimulationResult } from '../types/orbital';
import { simulateOrbitModification, EARTH_RADIUS_KM } from '../utils/orbitalMechanics';
import { WHAT_IF_SCENARIOS } from '../data/orbitalCatalog';
import { Play, RotateCcw, X, Sliders, ArrowRight, CheckCircle2, TrendingUp, Compass } from 'lucide-react';

interface OrbitSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetObject: OrbitalObject | null;
  secondaryObject: OrbitalObject | null;
  onApplySimulation: (result: SimulationResult | null) => void;
  allObjects: OrbitalObject[];
  onSelectTargetObject: (obj: OrbitalObject) => void;
}

export const OrbitSimulationModal: React.FC<OrbitSimulationModalProps> = ({
  isOpen,
  onClose,
  targetObject,
  secondaryObject,
  onApplySimulation,
  allObjects,
  onSelectTargetObject,
}) => {
  const [altDelta, setAltDelta] = useState<number>(15.0);
  const [incDelta, setIncDelta] = useState<number>(0.0);
  const [eccDelta, setEccDelta] = useState<number>(0.0);
  const [currentResult, setCurrentResult] = useState<SimulationResult | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionNotice, setExecutionNotice] = useState<string | null>(null);

  const currentObj = targetObject || allObjects[0];

  // Automatically calculate simulation solution when modal opens or target/secondary pair changes
  useEffect(() => {
    if (isOpen && currentObj) {
      const params: SimulationParams = {
        altitudeDeltaKm: altDelta,
        inclinationDeltaDeg: incDelta,
        eccentricityDelta: eccDelta,
        simulationDurationMin: 120,
        timeStepSec: 30,
      };
      const result = simulateOrbitModification(currentObj, params, secondaryObject || undefined);
      setCurrentResult(result);
      onApplySimulation(result);
    }
  }, [isOpen, currentObj?.id, secondaryObject?.id]);

  if (!isOpen) return null;

  const handleRunSimulation = () => {
    if (!currentObj) return;

    setIsExecuting(true);
    const params: SimulationParams = {
      altitudeDeltaKm: altDelta,
      inclinationDeltaDeg: incDelta,
      eccentricityDelta: eccDelta,
      simulationDurationMin: 120,
      timeStepSec: 30,
    };

    const result = simulateOrbitModification(currentObj, params, secondaryObject || undefined);
    setCurrentResult(result);
    onApplySimulation(result);

    setTimeout(() => {
      setIsExecuting(false);
      setExecutionNotice(`Simulation active: Evasive maneuver calculated for ${currentObj.name}`);
      setTimeout(() => setExecutionNotice(null), 3000);
    }, 300);
  };

  const handleRunAndLaunch = () => {
    handleRunSimulation();
    onClose();
  };

  const handleReset = () => {
    setAltDelta(0);
    setIncDelta(0);
    setEccDelta(0);
    setCurrentResult(null);
    onApplySimulation(null);
  };

  const loadScenario = (scenario: (typeof WHAT_IF_SCENARIOS)[0]) => {
    setAltDelta(scenario.altitudeDeltaKm);
    setIncDelta(scenario.inclinationDeltaDeg);
    setEccDelta(scenario.eccentricityDelta);

    const params: SimulationParams = {
      altitudeDeltaKm: scenario.altitudeDeltaKm,
      inclinationDeltaDeg: scenario.inclinationDeltaDeg,
      eccentricityDelta: scenario.eccentricityDelta,
      simulationDurationMin: 120,
      timeStepSec: 30,
    };

    const result = simulateOrbitModification(currentObj, params, secondaryObject || undefined);
    setCurrentResult(result);
    onApplySimulation(result);
  };

  // Diagram metrics: Original vs Modified Geometry
  const targetAlt = currentObj ? currentObj.altitude + altDelta : 500;
  const targetInc = currentObj ? currentObj.inclination + incDelta : 51.6;

  // SVG Ellipse radii scaling
  const rBase = 32;
  const rModified = Math.max(18, Math.min(50, rBase + (altDelta / 400) * 16));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="w-full max-w-4xl bg-[#090d16] border border-slate-700/80 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <div>
              <h2 className="text-sm font-semibold text-slate-100 tracking-wide">
                Collision Avoidance &amp; Orbit Maneuver Simulator
              </h2>
              <p className="text-[11px] text-slate-400">
                Evasive velocity budget (Δv), miss distance clearance, and trajectory modifications.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Target Object Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded">
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-500">SIMULATION TARGET ASSET</span>
              <div className="font-semibold text-slate-200 text-sm mt-0.5">
                {currentObj.name} <span className="font-mono text-cyan-400 text-xs">#{currentObj.catalogId}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono-tabular">
                Current Alt: {currentObj.altitude.toFixed(1)} km · Inc: {currentObj.inclination.toFixed(2)}° · Period: {currentObj.orbitalPeriod.toFixed(2)} min
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={currentObj.id}
                onChange={(e) => {
                  const found = allObjects.find((o) => o.id === e.target.value);
                  if (found) {
                    onSelectTargetObject(found);
                    setCurrentResult(null);
                  }
                }}
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {allObjects.slice(0, 20).map((obj) => (
                  <option key={obj.id} value={obj.id}>
                    {obj.name} (#{obj.catalogId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SIMULATION DIAGRAM 1: Orbit Plane Cross-Section Comparison (Original vs Simulated) */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2">
              <span className="text-cyan-400 font-semibold uppercase">TRAJECTORY SHIFT GEOMETRY DIAGRAM</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" />
                  ORIGINAL ({currentObj.altitude.toFixed(0)} km)
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="w-2.5 h-0.5 bg-emerald-400 border-b border-dashed border-emerald-400 inline-block" />
                  SIMULATED ({targetAlt.toFixed(0)} km)
                </span>
              </div>
            </div>

            {/* SVG Trajectory Overlay Diagram */}
            <div className="flex items-center justify-center py-2">
              <svg className="w-full max-w-md h-36" viewBox="0 0 320 140">
                {/* Earth Sphere in Center */}
                <circle cx="160" cy="70" r="18" fill="#081424" stroke="#1d425c" strokeWidth="1.2" />
                <circle cx="160" cy="70" r="2.5" fill="#38bdf8" />
                <text x="160" y="73" textAnchor="middle" fill="#94a3b8" fontSize="6" fontFamily="IBM Plex Mono">EARTH</text>

                {/* Original Orbit Circle (Cyan) */}
                <ellipse
                  cx="160"
                  cy="70"
                  rx={rBase * 2.2}
                  ry={rBase * 1.5}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="1.8"
                  opacity="0.8"
                />
                <circle cx={160 + rBase * 2.2} cy="70" r="3.5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1" />
                <text x={160 + rBase * 2.2 + 6} y="73" fill="#06b6d4" fontSize="8" fontFamily="IBM Plex Mono">
                  T={currentObj.orbitalPeriod.toFixed(1)}m
                </text>

                {/* Modified Simulation Orbit Circle (Emerald dashed) */}
                <ellipse
                  cx="160"
                  cy="70"
                  rx={rModified * 2.2}
                  ry={rModified * 1.5}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="4,3"
                />
                <circle cx={160 + rModified * 2.2} cy="70" r="3.5" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
                <text x={160 + rModified * 2.2 + 6} y="85" fill="#10b981" fontSize="8" fontFamily="IBM Plex Mono" fontWeight="bold">
                  SIM T={currentResult ? `${currentResult.newPeriodMin.toFixed(1)}m` : '...'}
                </text>

                {/* Altitude Transfer Vector Line */}
                {Math.abs(altDelta) > 1 && (
                  <g>
                    <line
                      x1={160 + rBase * 2.2}
                      y1="70"
                      x2={160 + rModified * 2.2}
                      y2="70"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="2,2"
                    />
                    <text x={(160 + rBase * 2.2 + 160 + rModified * 2.2) / 2} y="64" textAnchor="middle" fill="#f59e0b" fontSize="7.5" fontFamily="IBM Plex Mono" fontWeight="bold">
                      Δh = {altDelta > 0 ? `+${altDelta.toFixed(0)}` : altDelta.toFixed(0)} km
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* Quick Scenario Presets */}
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-500 mb-2">QUICK "WHAT IF?" SCENARIOS</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WHAT_IF_SCENARIOS.map((scen) => (
                <button
                  key={scen.id}
                  onClick={() => loadScenario(scen)}
                  className="p-2.5 bg-slate-900/50 hover:bg-slate-850 border border-slate-800 rounded text-left transition-colors hover:border-cyan-800/60"
                >
                  <div className="font-semibold text-slate-200 text-xs flex items-center justify-between">
                    <span>{scen.title}</span>
                    <ArrowRight className="w-3 h-3 text-cyan-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">{scen.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Parameter Sliders */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded space-y-4">
            <div className="font-semibold text-slate-300 flex items-center justify-between">
              <span>Astrodynamic Parameter Modifiers</span>
              <span className="text-[10px] font-mono text-slate-500">IMPULSIVE PROPULSION MODEL</span>
            </div>

            {/* Altitude Slider */}
            <div className="space-y-1">
              <div className="flex justify-between font-mono-tabular">
                <span className="text-slate-400">Altitude Adjustment (Δh)</span>
                <span className="text-cyan-300 font-semibold">
                  {altDelta > 0 ? `+${altDelta.toFixed(1)}` : altDelta.toFixed(1)} km
                  <span className="text-slate-500 font-normal ml-2">
                    (Target: {(currentObj.altitude + altDelta).toFixed(1)} km)
                  </span>
                </span>
              </div>
              <input
                type="range"
                min="-200"
                max="400"
                step="1"
                value={altDelta}
                onChange={(e) => setAltDelta(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-200 km (De-orbit)</span>
                <span>0 km (Nominal)</span>
                <span>+400 km (Orbit Raise)</span>
              </div>
            </div>

            {/* Inclination Slider */}
            <div className="space-y-1">
              <div className="flex justify-between font-mono-tabular">
                <span className="text-slate-400">Inclination Shift (Δi)</span>
                <span className="text-cyan-300 font-semibold">
                  {incDelta > 0 ? `+${incDelta.toFixed(1)}` : incDelta.toFixed(1)}°
                  <span className="text-slate-500 font-normal ml-2">
                    (Target: {(currentObj.inclination + incDelta).toFixed(2)}°)
                  </span>
                </span>
              </div>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.1"
                value={incDelta}
                onChange={(e) => setIncDelta(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>

          {/* Simulation Output Card with Visual Velocity & Conjunction Gauges */}
          {currentResult && (
            <div className="p-4 bg-emerald-950/20 border border-emerald-800/60 rounded space-y-3">
              <div className="flex items-center justify-between text-emerald-400">
                <div className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>SIMULATION TRAJECTORY SOLVED & RENDERED</span>
                </div>
                <span className="text-[10px] font-mono">KEPLERIAN PROPAGATION</span>
              </div>

              {/* Astrodynamic Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono-tabular">
                <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Total Required Δv</div>
                  <div className="text-base font-bold text-cyan-300 mt-0.5">
                    {currentResult.deltaV.toFixed(1)} <span className="text-xs font-normal text-slate-400">m/s</span>
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Alt: {currentResult.deltaVAltitude} m/s · Plane: {currentResult.deltaVPlaneChange} m/s
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">New Orbital Period</div>
                  <div className="text-base font-bold text-slate-100 mt-0.5">
                    {currentResult.newPeriodMin.toFixed(2)} <span className="text-xs font-normal text-slate-400">min</span>
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Δ: {(currentResult.newPeriodMin - currentObj.orbitalPeriod).toFixed(2)} min
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">New Mean Velocity</div>
                  <div className="text-base font-bold text-slate-100 mt-0.5">
                    {currentResult.newVelocityKmS.toFixed(3)} <span className="text-xs font-normal text-slate-400">km/s</span>
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Δ: {(currentResult.newVelocityKmS - currentObj.velocity).toFixed(3)} km/s
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">New Conjunction Miss</div>
                  <div className="text-base font-bold mt-0.5 text-emerald-400">
                    {currentResult.conjunctionImpact
                      ? `${currentResult.conjunctionImpact.newMinSeparation.toFixed(2)} km`
                      : 'N/A'}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {currentResult.conjunctionImpact
                      ? `Before: ${currentResult.conjunctionImpact.originalMinSeparation.toFixed(2)} km`
                      : 'No secondary paired'}
                  </div>
                </div>
              </div>

              {/* Scientific Explanation */}
              <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80 text-[11px] text-slate-300 font-sans leading-relaxed">
                <span className="font-semibold text-slate-100">Astrodynamics Assessment: </span>
                {currentResult.explanation}
              </div>
            </div>
          )}
        </div>

        {/* Execution Notice Toast */}
        {executionNotice && (
          <div className="px-5 py-2 bg-emerald-950/90 border-t border-emerald-800 text-emerald-200 text-xs font-mono flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{executionNotice}</span>
            </span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Parameters</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 rounded transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleRunSimulation}
              disabled={isExecuting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-cyan-200 bg-slate-800 hover:bg-slate-700 border border-cyan-800/80 rounded transition-colors cursor-pointer"
              title="Compute simulation trajectory without closing window"
            >
              <Play className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isExecuting ? 'Computing...' : 'Recalculate'}</span>
            </button>
            <button
              onClick={handleRunAndLaunch}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors shadow-lg shadow-emerald-950/40 cursor-pointer"
              title="Apply trajectory and launch live 3D orbital simulation on radar"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Apply & Run in 3D Radar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
