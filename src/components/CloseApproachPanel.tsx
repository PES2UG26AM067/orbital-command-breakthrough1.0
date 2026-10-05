import React, { useState } from 'react';
import { OrbitalObject, ConjunctionAssessment } from '../types/orbital';
import { CONJUNCTION_PRESETS, findPresetObjects, CATALOG_OBJECTS } from '../data/orbitalCatalog';
import {
  AlertTriangle,
  ShieldCheck,
  Zap,
  Info,
  Activity,
  ArrowRight,
  Sliders,
  CheckCircle2,
  HelpCircle,
  Flame,
} from 'lucide-react';

interface CloseApproachPanelProps {
  conjunction: ConjunctionAssessment | null;
  objectA: OrbitalObject | null;
  objectB: OrbitalObject | null;
  allObjects: OrbitalObject[];
  onSelectPair: (objA: OrbitalObject, objB: OrbitalObject) => void;
  onOpenSimulation: () => void;
}

export const CloseApproachPanel: React.FC<CloseApproachPanelProps> = ({
  conjunction,
  objectA,
  objectB,
  allObjects,
  onSelectPair,
  onOpenSimulation,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ time: number; sep: number } | null>(null);
  const [testBurnDeltaV, setTestBurnDeltaV] = useState<number>(0);
  const [showPlainGuide, setShowPlainGuide] = useState<boolean>(false);

  if (!conjunction || !objectA || !objectB) {
    return (
      <div className="p-6 bg-[#090d16] border border-slate-800 rounded-lg text-center space-y-4">
        <div className="w-10 h-10 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
          <AlertTriangle className="w-5 h-5 text-amber-500/60" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200">No Spacecraft Pair Selected</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Select two orbital objects to calculate how close they fly past each other, collision risk, and test collision avoidance burns.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="pt-2">
          <div className="text-[11px] font-mono uppercase text-slate-500 mb-2">
            Try a Real-World Scenario (Click to Load):
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-left max-w-4xl mx-auto">
            {CONJUNCTION_PRESETS.map((preset) => {
              const { objA, objB } = findPresetObjects(preset, allObjects, CATALOG_OBJECTS);
              if (!objA || !objB) return null;
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelectPair(objA, objB)}
                  className="p-3 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 rounded hover:border-slate-700 transition-colors text-xs flex flex-col justify-between"
                >
                  <div className="font-semibold text-slate-200 flex items-center justify-between">
                    <span>{preset.title.split(':')[0]}</span>
                    <span
                      className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                        preset.severity === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300'
                          : preset.severity === 'WARNING'
                          ? 'bg-amber-950 text-amber-300'
                          : 'bg-cyan-950 text-cyan-300'
                      }`}
                    >
                      {preset.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{preset.summary}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Calculate adjusted miss distance when interactive burn slider is moved
  // 1 m/s posigrade burn typically changes altitude by ~3.6 km and miss distance by ~8 km
  const simulatedMissDistance =
    testBurnDeltaV > 0
      ? Math.round((conjunction.minSeparation + testBurnDeltaV * 7.5) * 10) / 10
      : conjunction.minSeparation;

  const effectiveStatus =
    simulatedMissDistance <= 5.0
      ? 'CLOSE_APPROACH'
      : simulatedMissDistance <= 25.0
      ? 'MONITOR'
      : 'NOMINAL';

  const statusColor =
    effectiveStatus === 'CLOSE_APPROACH'
      ? 'border-rose-500/50 bg-rose-950/20 text-rose-300'
      : effectiveStatus === 'MONITOR'
      ? 'border-amber-500/50 bg-amber-950/20 text-amber-300'
      : 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300';

  const statusBadge =
    effectiveStatus === 'CLOSE_APPROACH'
      ? { label: 'CRITICAL CLOSE PASS', bg: 'bg-rose-500', text: 'text-rose-100', icon: AlertTriangle }
      : effectiveStatus === 'MONITOR'
      ? { label: 'ELEVATED CAUTION', bg: 'bg-amber-500', text: 'text-amber-950', icon: AlertTriangle }
      : { label: 'SAFE CLEARANCE', bg: 'bg-emerald-500', text: 'text-emerald-950', icon: ShieldCheck };

  const StatusIcon = statusBadge.icon;

  // Timeline SVG calculations
  const series = conjunction.timeSeries;
  const maxSep = Math.max(...series.map((p) => p.separationKm), 60);
  const svgWidth = 620;
  const svgHeight = 150;
  const padding = { top: 20, right: 30, bottom: 25, left: 45 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;
  const maxTime = series.length > 0 ? series[series.length - 1].timeOffsetMin : 120;

  const pointsPath = series
    .map((p, index) => {
      const x = padding.left + (p.timeOffsetMin / maxTime) * plotWidth;
      const effectiveSep = p.separationKm + (testBurnDeltaV > 0 ? testBurnDeltaV * 7.5 : 0);
      const y = padding.top + (1 - Math.min(maxSep, effectiveSep) / maxSep) * plotHeight;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const tcaX = padding.left + (conjunction.timeToTca / maxTime) * plotWidth;
  const tcaY = padding.top + (1 - Math.min(maxSep, simulatedMissDistance) / maxSep) * plotHeight;
  const threshold5kmY = padding.top + (1 - Math.min(maxSep, 5.0) / maxSep) * plotHeight;

  // Radar Proximity Rings Calculations (Scale: 0 to 40 km radius)
  const radarScale = 50 / 40; // 50px radius represents 40km
  const encounterAngleRad = (Math.abs(objectA.inclination - objectB.inclination) * Math.PI) / 180;
  const bRadarX = 60 + Math.cos(encounterAngleRad) * (simulatedMissDistance * radarScale);
  const bRadarY = 60 - Math.sin(encounterAngleRad) * (simulatedMissDistance * radarScale);

  return (
    <div className="bg-[#090d16] border border-slate-800 rounded-lg p-5 select-none space-y-4">
      {/* Top Banner: Verdict & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold font-mono ${statusColor} border`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusBadge.label}</span>
          </span>
          <h2 className="text-sm font-semibold text-slate-100 tracking-wide">
            CRASH RISK & CLOSE APPROACH ANALYSIS
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPlainGuide(!showPlainGuide)}
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showPlainGuide ? 'Hide Plain English Guide' : 'What does this mean?'}</span>
          </button>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            TCA WINDOW: 120 MIN
          </span>
        </div>
      </div>

      {/* Plain English Guide Dropdown */}
      {showPlainGuide && (
        <div className="p-3.5 bg-slate-950/90 border border-cyan-800/60 rounded-lg text-xs space-y-2 text-slate-300">
          <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
            <Info className="w-4 h-4" />
            <span>Space Traffic Controller's Guide to Conjunctions</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] pt-1">
            <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
              <span className="font-bold text-slate-200 block mb-1">1. Miss Distance</span>
              How close the two objects get at their closest point. In space, anything under 5 km is considered dangerous because spacecraft travel at 28,000 km/h (8 km per second!).
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
              <span className="font-bold text-slate-200 block mb-1">2. Relative Speed</span>
              The head-on speed difference. At 14 km/s, a collision releases more kinetic energy than several tons of dynamite, completely vaporizing both objects into thousands of debris pieces.
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
              <span className="font-bold text-slate-200 block mb-1">3. Avoidance Maneuver</span>
              Firing thrusters with a tiny speed boost (Δv of just 0.5 m/s) hours before the encounter raises the spacecraft's orbit enough to safely dodge the debris!
            </div>
          </div>
        </div>
      )}

      {/* Plain-Language Verdict Callout */}
      <div
        className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
          effectiveStatus === 'CLOSE_APPROACH'
            ? 'bg-rose-950/30 border-rose-800/80 text-rose-200'
            : effectiveStatus === 'MONITOR'
            ? 'bg-amber-950/30 border-amber-800/80 text-amber-200'
            : 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
        }`}
      >
        <StatusIcon className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">
            {effectiveStatus === 'CLOSE_APPROACH'
              ? 'WARNING: Extremely close pass detected! '
              : effectiveStatus === 'MONITOR'
              ? 'CAUTION: Objects pass within monitoring range. '
              : 'CLEAR: Nominal separation distance. '}
          </span>
          <span>
            {objectA.name} and {objectB.name} will fly within{' '}
            <strong className="font-mono text-white text-[13px]">{simulatedMissDistance} km</strong> of each other in{' '}
            <strong className="font-mono text-white text-[13px]">{conjunction.timeToTca} minutes</strong> at a closing speed of{' '}
            <strong className="font-mono text-white text-[13px]">{conjunction.relativeVelocity} km/s</strong> ({Math.round(conjunction.relativeVelocity * 3600).toLocaleString()} km/h).
          </span>
          {testBurnDeltaV > 0 && (
            <span className="block mt-1 font-semibold text-emerald-400">
              ✨ Test Avoidance Burn Active: +{testBurnDeltaV.toFixed(2)} m/s boost widened separation by +{(testBurnDeltaV * 7.5).toFixed(1)} km!
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Comparison Cards + Diagrams */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Spacecraft Comparison Cards (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Object A vs Object B Comparison Table */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                OBJECT A (PRIMARY)
              </span>
              <span className="text-slate-500">VS</span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                OBJECT B (SECONDARY)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Object A Card */}
              <div className="p-2.5 bg-slate-900/70 border border-cyan-900/60 rounded">
                <div className="font-semibold text-slate-100 truncate">{objectA.name}</div>
                <div className="text-[10px] text-cyan-400 font-mono mt-0.5">#{objectA.catalogId} · {objectA.type}</div>
                <div className="mt-2 space-y-1 text-[11px] font-mono-tabular text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Altitude:</span>
                    <span>{objectA.altitude.toFixed(0)} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tilt (Inc):</span>
                    <span>{objectA.inclination.toFixed(1)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Speed:</span>
                    <span>{objectA.velocity.toFixed(2)} km/s</span>
                  </div>
                </div>
              </div>

              {/* Object B Card */}
              <div className="p-2.5 bg-slate-900/70 border border-amber-900/60 rounded">
                <div className="font-semibold text-slate-100 truncate">{objectB.name}</div>
                <div className="text-[10px] text-amber-400 font-mono mt-0.5">#{objectB.catalogId} · {objectB.type}</div>
                <div className="mt-2 space-y-1 text-[11px] font-mono-tabular text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Altitude:</span>
                    <span>{objectB.altitude.toFixed(0)} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tilt (Inc):</span>
                    <span>{objectB.inclination.toFixed(1)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Speed:</span>
                    <span>{objectB.velocity.toFixed(2)} km/s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Relative Geometry Telemetry */}
            <div className="p-2.5 bg-slate-900/50 border border-slate-800 rounded space-y-1.5 text-xs font-mono-tabular">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Altitude Difference:</span>
                <span className="font-bold text-slate-200">
                  {Math.abs(objectA.altitude - objectB.altitude).toFixed(1)} km
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Relative Closing Speed:</span>
                <span className="font-bold text-cyan-300">{conjunction.relativeVelocity} km/s</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Current Distance:</span>
                <span>{conjunction.currentSeparation.toFixed(1)} km</span>
              </div>
            </div>
          </div>

          {/* Interactive Avoidance Maneuver Simulator */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-300">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Flame className="w-3.5 h-3.5" />
                INTERACTIVE AVOIDANCE BURN SLIDER
              </span>
              <span className="text-slate-500 font-normal">SIMULATE ESCAPE</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Drag thruster boost to test how a tiny rocket burn increases miss distance to a safe margin:
            </p>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Engine Burn Δv:</span>
                <span className="text-emerald-300 font-bold">{testBurnDeltaV.toFixed(2)} m/s</span>
              </div>
              <input
                type="range"
                min="0"
                max="2.0"
                step="0.05"
                value={testBurnDeltaV}
                onChange={(e) => setTestBurnDeltaV(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0 m/s (No Burn)</span>
                <span>+0.5 m/s (Small Pulse)</span>
                <span>+2.0 m/s (Full Evasion)</span>
              </div>
            </div>

            {testBurnDeltaV > 0 && (
              <button
                onClick={() => setTestBurnDeltaV(0)}
                className="text-[10px] text-slate-500 hover:text-slate-300 underline font-mono"
              >
                Reset to Original Orbit
              </button>
            )}
          </div>
        </div>

        {/* Right: Scientific Timeline & Radar Diagrams (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* DIAGRAM 1: Scientific Proximity Distance Timeline */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <Activity className="w-3.5 h-3.5" />
                <span>SEPARATION DISTANCE VS. TIME GRAPH</span>
              </div>
              <span className="text-slate-500">TCA AT +{conjunction.timeToTca} MIN</span>
            </div>

            {/* SVG Separation Plot */}
            <div className="relative w-full overflow-hidden bg-[#060b13] border border-slate-800/80 rounded py-1">
              <svg className="w-full h-40" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                {/* Horizontal reference grid lines */}
                <line x1={padding.left} y1={padding.top} x2={svgWidth - padding.right} y2={padding.top} stroke="#1e293b" strokeWidth="0.8" strokeDasharray="2,2" />
                <line x1={padding.left} y1={svgHeight - padding.bottom} x2={svgWidth - padding.right} y2={svgHeight - padding.bottom} stroke="#334155" strokeWidth="1" />

                {/* Critical Red Danger Threshold Line (5 km) */}
                <line
                  x1={padding.left}
                  y1={threshold5kmY}
                  x2={svgWidth - padding.right}
                  y2={threshold5kmY}
                  stroke="#ef4444"
                  strokeWidth="1.2"
                  strokeDasharray="3,3"
                  opacity="0.8"
                />
                <text x={svgWidth - padding.right - 2} y={threshold5kmY - 4} fill="#ef4444" fontSize="8" textAnchor="end" fontFamily="IBM Plex Mono">
                  DANGER THRESHOLD (5.0 km)
                </text>

                {/* Separation Curve */}
                <path d={pointsPath} fill="none" stroke="#38bdf8" strokeWidth="2.5" />

                {/* Minimum TCA Point Blip */}
                <circle cx={tcaX} cy={tcaY} r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" className="animate-pulse" />
                <text x={tcaX} y={tcaY - 8} fill="#f43f5e" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="IBM Plex Mono">
                  CLOSEST: {simulatedMissDistance} km
                </text>

                {/* Y-Axis Labels */}
                <text x={padding.left - 6} y={padding.top + 4} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="IBM Plex Mono">
                  {maxSep.toFixed(0)} km
                </text>
                <text x={padding.left - 6} y={svgHeight - padding.bottom} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="IBM Plex Mono">
                  0 km
                </text>

                {/* X-Axis Labels */}
                <text x={padding.left} y={svgHeight - 8} fill="#64748b" fontSize="8" fontFamily="IBM Plex Mono">NOW</text>
                <text x={padding.left + plotWidth / 2} y={svgHeight - 8} fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="IBM Plex Mono">+60 min</text>
                <text x={svgWidth - padding.right} y={svgHeight - 8} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="IBM Plex Mono">+120 min</text>
              </svg>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Curve dipping toward bottom = objects getting closer</span>
              <span className="text-cyan-400 font-medium">Click "Simulate Orbit" to test permanent orbital shifts</span>
            </div>
          </div>

          {/* DIAGRAM 2: Visual Concentric Radar Target Rings */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3.5 flex flex-col sm:flex-row items-center gap-4">
            {/* SVG Radar Target */}
            <div className="w-32 h-32 shrink-0 relative flex items-center justify-center">
              <svg className="w-32 h-32" viewBox="0 0 120 120">
                {/* Safe outer circle (40 km) */}
                <circle cx="60" cy="60" r="50" fill="#061220" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" opacity="0.4" />
                {/* Caution circle (25 km) */}
                <circle cx="60" cy="60" r="32" fill="#171e16" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
                {/* Danger inner circle (5 km) */}
                <circle cx="60" cy="60" r="10" fill="#2d0f17" stroke="#ef4444" strokeWidth="1.2" />

                {/* Radar sweep lines */}
                <line x1="60" y1="5" x2="60" y2="115" stroke="#1e293b" strokeWidth="0.8" />
                <line x1="5" y1="60" x2="115" y2="60" stroke="#1e293b" strokeWidth="0.8" />

                {/* Object A at center (0,0) */}
                <circle cx="60" cy="60" r="4" fill="#06b6d4" stroke="#ffffff" strokeWidth="1" />
                <text x="60" y="73" fill="#06b6d4" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="IBM Plex Mono">OBJ A</text>

                {/* Object B vector position */}
                <line x1="60" y1="60" x2={bRadarX} y2={bRadarY} stroke="#f43f5e" strokeWidth="1" strokeDasharray="1,1" />
                <circle cx={bRadarX} cy={bRadarY} r="3.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
                <text x={bRadarX} y={bRadarY - 5} fill="#f59e0b" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="IBM Plex Mono">OBJ B</text>
              </svg>
            </div>

            {/* Radar Legend & Explanation */}
            <div className="flex-1 space-y-1.5 text-xs">
              <div className="font-semibold text-slate-200">Encounter Proximity Zone Diagram</div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Object A is positioned at the radar bullseye. The colored zones indicate safety clearances:
              </p>
              <div className="space-y-1 text-[10px] font-mono">
                <div className="flex items-center gap-2 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span>RED ZONE (&lt; 5 km): High Collision Hazard</span>
                </div>
                <div className="flex items-center gap-2 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span>YELLOW ZONE (5 - 25 km): Active Surveillance Margin</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>GREEN ZONE (&gt; 25 km): Safe Orbital Separation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
