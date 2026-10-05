import React, { useState, useMemo } from 'react';
import { OrbitalObject, ConjunctionAssessment, SimulationResult, SimulationParams } from '../types/orbital';
import { CONJUNCTION_PRESETS, findPresetObjects, CATALOG_OBJECTS } from '../data/orbitalCatalog';
import {
  AlertTriangle,
  ShieldCheck,
  Zap,
  Play,
  Crosshair,
  Search,
  Activity,
  Layers,
  Flame,
  Radio,
  ExternalLink,
  ChevronRight,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  propagateKeplerian,
  cartesianToGeographic,
  simulateOrbitModification,
} from '../utils/orbitalMechanics';

interface DebrisOperationsConsoleProps {
  conjunction: ConjunctionAssessment | null;
  objectA: OrbitalObject | null;
  objectB: OrbitalObject | null;
  activeInspectorObject: OrbitalObject | null;
  allObjects: OrbitalObject[];
  onSelectObject: (obj: OrbitalObject) => void;
  onSelectPair: (objA: OrbitalObject, objB: OrbitalObject) => void;
  onSetObjectA: (obj: OrbitalObject) => void;
  onSetObjectB: (obj: OrbitalObject) => void;
  onOpenSimulation: () => void;
  onApplySimulation?: (result: SimulationResult | null) => void;
  simulationResult?: SimulationResult | null;
  onOpenBrief: () => void;
  onOpenTimeMachine?: () => void;
  onOpenCrisisSimulator?: () => void;
  activeConsoleTab: 'WATCHLIST' | 'INSPECTOR' | 'KESSLER';
  setActiveConsoleTab: (tab: 'WATCHLIST' | 'INSPECTOR' | 'KESSLER') => void;
}

export const DebrisOperationsConsole: React.FC<DebrisOperationsConsoleProps> = ({
  conjunction,
  objectA,
  objectB,
  activeInspectorObject,
  allObjects,
  onSelectObject,
  onSelectPair,
  onSetObjectA,
  onSetObjectB,
  onOpenSimulation,
  onApplySimulation,
  simulationResult,
  onOpenBrief,
  onOpenTimeMachine,
  onOpenCrisisSimulator,
  activeConsoleTab,
  setActiveConsoleTab,
}) => {
  const [debrisSearch, setDebrisSearch] = useState<string>('');
  const [debrisCategory, setDebrisCategory] = useState<'ALL' | 'DEBRIS' | 'ROCKET_BODY' | 'PAYLOAD'>('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Inspector object (default to activeInspectorObject, or objectA, or first object)
  const displayObject = activeInspectorObject || objectA || allObjects[0];

  // Real-time geo position calculation for the inspected object
  const geoPos = useMemo(() => {
    if (!displayObject) return { latitude: 0, longitude: 0, altitude: 0 };
    const nowSec = (Date.now() / 1000) % 86400;
    const cartPos = propagateKeplerian(displayObject, nowSec);
    return cartesianToGeographic(cartPos, nowSec);
  }, [displayObject]);

  // Filtered debris objects list
  const filteredDebris = useMemo(() => {
    let list = allObjects;
    if (debrisCategory !== 'ALL') {
      list = list.filter((o) => o.type === debrisCategory);
    }
    if (debrisSearch.trim()) {
      const q = debrisSearch.toLowerCase();
      list = list.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.catalogId.includes(q) ||
          o.operator.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allObjects, debrisCategory, debrisSearch]);

  const notify = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <div className="flex flex-col h-full bg-[#090d16] border border-slate-800 rounded-lg overflow-hidden select-none shadow-2xl">
      {/* Console Tab Navigation */}
      <div className="flex items-center border-b border-slate-800 bg-[#070b13] px-2 pt-1 text-xs">
        <button
          onClick={() => setActiveConsoleTab('WATCHLIST')}
          className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeConsoleTab === 'WATCHLIST'
              ? 'border-rose-500 text-rose-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span>Collision Watchlist</span>
          <span className="text-[10px] px-1 py-0.2 bg-rose-950/80 text-rose-300 border border-rose-800/80 rounded font-mono">
            3 High-Risk
          </span>
        </button>

        <button
          onClick={() => setActiveConsoleTab('INSPECTOR')}
          className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeConsoleTab === 'INSPECTOR'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span>Debris Inspector</span>
        </button>

        <button
          onClick={() => setActiveConsoleTab('KESSLER')}
          className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeConsoleTab === 'KESSLER'
              ? 'border-amber-400 text-amber-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          <span>Debris Analytics</span>
        </button>
      </div>

      {/* Floating Action Notice Toast */}
      {actionNotice && (
        <div className="px-3 py-1.5 bg-cyan-950 border-b border-cyan-800 text-cyan-200 text-xs flex items-center justify-between font-mono animate-fadeIn">
          <span>✓ {actionNotice}</span>
          <button
            onClick={() => setActionNotice(null)}
            className="text-cyan-400 hover:text-cyan-200 text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tab 1: Collision Watchlist & Scenarios */}
      {activeConsoleTab === 'WATCHLIST' && (
        <div className="flex-1 flex flex-col p-3 overflow-hidden gap-3 text-xs">
          {/* Orbital Crisis Simulator Quick Launch Banner */}
          {onOpenCrisisSimulator && (
            <div className="p-3 rounded-lg bg-gradient-to-r from-rose-950/80 via-slate-900 to-cyan-950/80 border border-rose-600/70 shadow-lg flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/20 text-rose-400 rounded-md shrink-0 animate-pulse">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                    <span>ORBITAL CRISIS SIMULATOR</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-rose-900/80 text-rose-200 rounded">HALO AI</span>
                  </div>
                  <div className="text-[11px] text-slate-400 leading-tight">
                    Experience evolving crises, countdown, 4 conflicting AI perspectives &amp; Earth impacts.
                  </div>
                </div>
              </div>
              <button
                onClick={onOpenCrisisSimulator}
                className="px-3 py-1.5 rounded bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs shrink-0 transition-colors shadow-sm cursor-pointer"
              >
                Launch
              </button>
            </div>
          )}

          {/* Active Conjunction Warnings */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-400 font-semibold">
              <span className="flex items-center gap-1 text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Active Close Approach Alerts</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Click to Track</span>
            </div>

            <div className="flex flex-col gap-2">
              {CONJUNCTION_PRESETS.map((preset) => {
                const { objA, objB } = findPresetObjects(preset, allObjects, CATALOG_OBJECTS);
                const isSelected =
                  (objectA?.id === objA.id && objectB?.id === objB.id) ||
                  (objectA?.id === objB.id && objectB?.id === objA.id) ||
                  (objectA?.catalogId === objA.catalogId && objectB?.catalogId === objB.catalogId);

                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      onSelectPair(objA, objB);
                      notify(`Tracking conjunction: ${objA.name} vs ${objB.name}`);
                    }}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-950/40 border-rose-500/90 shadow-lg shadow-rose-950/60 ring-1 ring-rose-500/50'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700/90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              preset.severity === 'CRITICAL'
                                ? 'bg-rose-500 animate-pulse'
                                : 'bg-amber-400'
                            }`}
                          />
                          <span className="font-semibold text-slate-100 text-xs tracking-tight">
                            {preset.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {preset.summary}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                            preset.severity === 'CRITICAL'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {preset.severity}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-mono text-cyan-400 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                            TRACKING ACTIVE
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Astrodynamics Quick Telemetry */}
                    <div className="mt-2 grid grid-cols-3 gap-1.5 py-1.5 px-2 bg-slate-950/70 border border-slate-850 rounded font-mono text-[10px]">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Miss Distance</span>
                        <span className="text-rose-400 font-bold">{preset.missDistanceKm < 1 ? `< 1.0 km` : `${preset.missDistanceKm} km`}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Rel Velocity</span>
                        <span className="text-amber-300 font-semibold">{preset.relSpeedKmS} km/s</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Altitude Shell</span>
                        <span className="text-cyan-300 font-semibold">{preset.orbitAltitudeKm} km</span>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPair(objA, objB);
                          notify(`Tracking conjunction: ${objA.name} vs ${objB.name}`);
                        }}
                        className={`px-3 py-1.5 rounded text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400'
                            : 'bg-slate-800 hover:bg-slate-700 text-cyan-200 border border-slate-700'
                        }`}
                        title="Display this collision pair on 3D Debris Radar"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                        <span>Track Conjunction</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPair(objA, objB);
                          const params: SimulationParams = {
                            altitudeDeltaKm: 15.0,
                            inclinationDeltaDeg: 0.0,
                            eccentricityDelta: 0.0,
                            simulationDurationMin: 120,
                            timeStepSec: 30,
                          };
                          if (onApplySimulation) {
                            const sim = simulateOrbitModification(objA, params, objB);
                            onApplySimulation(sim);
                          }
                          onOpenSimulation();
                          notify(`Running collision avoidance simulation for ${objA.name}`);
                        }}
                        className="px-3 py-1.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/80 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        title="Open Collision Avoidance & Orbit Maneuver Simulator"
                      >
                        <Play className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Run Simulation</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Debris Catalog Search & Filter */}
          <div className="flex-1 flex flex-col min-h-0 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between pb-1.5">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">
                Tracked Debris Catalog
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {filteredDebris.length} items
              </span>
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-1 mb-2">
              <div className="relative flex-1">
                <Search className="w-3 h-3 absolute left-2 top-2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter debris by name, NORAD #..."
                  value={debrisSearch}
                  onChange={(e) => setDebrisSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded pl-7 pr-2 py-1 text-[11px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <select
                value={debrisCategory}
                onChange={(e) => setDebrisCategory(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Types</option>
                <option value="DEBRIS">Fragments</option>
                <option value="ROCKET_BODY">Rocket Stages</option>
                <option value="PAYLOAD">Satellites</option>
              </select>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-850/60 pr-1 space-y-0.5">
              {filteredDebris.slice(0, 40).map((obj) => {
                const isSelected = displayObject?.id === obj.id;
                const isA = objectA?.id === obj.id;
                const isB = objectB?.id === obj.id;

                return (
                  <div
                    key={obj.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      onSelectObject(obj);
                      setActiveConsoleTab('INSPECTOR');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectObject(obj);
                        setActiveConsoleTab('INSPECTOR');
                      }
                    }}
                    className={`w-full text-left p-2 rounded transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-slate-850 border border-slate-700/80 text-slate-100'
                        : 'hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-medium text-xs truncate flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            obj.type === 'DEBRIS'
                              ? 'bg-rose-400'
                              : obj.type === 'ROCKET_BODY'
                              ? 'bg-amber-400'
                              : 'bg-cyan-400'
                          }`}
                        />
                        <span className="truncate">{obj.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {obj.altitude.toFixed(0)} km · {obj.inclination.toFixed(1)}° · {obj.regime}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetObjectA(obj);
                          const params: SimulationParams = {
                            altitudeDeltaKm: 15.0,
                            inclinationDeltaDeg: 0.0,
                            eccentricityDelta: 0.0,
                            simulationDurationMin: 120,
                            timeStepSec: 30,
                          };
                          if (onApplySimulation) {
                            const sim = simulateOrbitModification(obj, params, objectB || undefined);
                            onApplySimulation(sim);
                          }
                          onOpenSimulation();
                          notify(`Running avoidance simulation for ${obj.name}`);
                        }}
                        className="px-2 py-0.5 rounded bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 font-mono text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                        title={`Run collision avoidance simulation on ${obj.name}`}
                      >
                        <Play className="w-2.5 h-2.5 text-emerald-400" />
                        <span>Sim</span>
                      </button>

                      {isA && (
                        <span className="text-[9px] font-mono px-1 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-800/60 rounded">
                          OBJ A
                        </span>
                      )}
                      {isB && (
                        <span className="text-[9px] font-mono px-1 py-0.2 bg-rose-950 text-rose-300 border border-rose-800/60 rounded">
                          HAZARD B
                        </span>
                      )}
                      <span className="font-mono text-slate-500 text-[10px]">#{obj.catalogId}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Debris Inspector & Threat Analysis */}
      {activeConsoleTab === 'INSPECTOR' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {/* Identity Header */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    displayObject.type === 'DEBRIS'
                      ? 'bg-rose-500'
                      : displayObject.type === 'ROCKET_BODY'
                      ? 'bg-amber-500'
                      : 'bg-cyan-400'
                  }`}
                />
                <span className="text-[11px] font-mono text-cyan-400 font-bold">
                  NORAD #{displayObject.catalogId}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-[11px] font-mono text-slate-300 font-semibold">
                  {displayObject.regime} ORBIT
                </span>
              </div>

              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                {displayObject.type === 'DEBRIS'
                  ? '💥 Fragmentation Debris'
                  : displayObject.type === 'ROCKET_BODY'
                  ? '🚀 Spent Upper Stage'
                  : '🛰️ Operational Payload'}
              </span>
            </div>

            <h3 className="text-sm font-semibold text-slate-100 mt-1">
              {displayObject.name}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Operator / Origin: <span className="text-slate-300">{displayObject.operator} ({displayObject.country})</span>
            </p>
          </div>

          {/* Debris Provenance / Incident Background */}
          <div className="p-3 bg-[#070b13] border border-slate-800 rounded-lg space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
              Debris Provenance & History
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {displayObject.description ||
                `${displayObject.name} is a tracked space object orbiting in low Earth orbit. Cataloged by Space-Track and the US Space Surveillance Network.`}
            </p>
            <div className="pt-1 flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
              <span>Launch / Event: {displayObject.launchDate}</span>
              <span>·</span>
              <span>Intl Desig: {displayObject.internationalDesignator}</span>
            </div>
          </div>

          {/* Scientific Telemetry Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
              <span className="text-[10px] text-slate-500 font-mono uppercase">Current Altitude</span>
              <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
                {displayObject.altitude.toFixed(1)} <span className="text-xs text-slate-400 font-normal">km</span>
              </div>
              <span className="text-[10px] text-slate-500 font-sans">Above Earth sea level</span>
            </div>

            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
              <span className="text-[10px] text-slate-500 font-mono uppercase">Orbital Speed</span>
              <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
                {displayObject.velocity.toFixed(2)} <span className="text-xs text-slate-400 font-normal">km/s</span>
              </div>
              <span className="text-[10px] text-slate-500 font-sans">
                {Math.round(displayObject.velocity * 3600).toLocaleString()} km/h
              </span>
            </div>

            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
              <span className="text-[10px] text-slate-500 font-mono uppercase">Inclination (Tilt)</span>
              <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
                {displayObject.inclination.toFixed(2)}°
              </div>
              <span className="text-[10px] text-slate-500 font-sans">
                {displayObject.inclination > 85 ? 'Polar / SSO Orbit' : 'Inclined Orbit'}
              </span>
            </div>

            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
              <span className="text-[10px] text-slate-500 font-mono uppercase">Orbital Period</span>
              <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
                {displayObject.orbitalPeriod.toFixed(1)} <span className="text-xs text-slate-400 font-normal">min</span>
              </div>
              <span className="text-[10px] text-slate-500 font-sans">
                ~{(1440 / displayObject.orbitalPeriod).toFixed(1)} revs / day
              </span>
            </div>
          </div>

          {/* Sub-Satellite Geographic Coordinates */}
          <div className="p-2.5 bg-[#070b13] border border-slate-800 rounded flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Sub-Satellite Point</span>
              <div className="text-slate-200 mt-0.5">
                {geoPos.latitude.toFixed(2)}° {geoPos.latitude >= 0 ? 'N' : 'S'} ·{' '}
                {geoPos.longitude.toFixed(2)}° {geoPos.longitude >= 0 ? 'E' : 'W'}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase">Atmospheric Lifetime</span>
              <div className="text-amber-400 font-semibold">
                {displayObject.altitude > 800 ? '> 100 Years' : displayObject.altitude > 500 ? '15–25 Years' : '< 5 Years'}
              </div>
            </div>
          </div>

          {/* Pair Assignment & Maneuver Buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-500">
              Conjunction Screening Actions:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onSetObjectA(displayObject);
                  notify(`Set ${displayObject.name} as Protected Asset (Obj A)`);
                }}
                className={`px-3 py-2 rounded text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 ${
                  objectA?.id === displayObject.id
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                <span>Set as Protected (Obj A)</span>
              </button>

              <button
                onClick={() => {
                  onSetObjectB(displayObject);
                  notify(`Set ${displayObject.name} as Debris Hazard (Obj B)`);
                }}
                className={`px-3 py-2 rounded text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 ${
                  objectB?.id === displayObject.id
                    ? 'bg-rose-950 border-rose-500 text-rose-200'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Set as Hazard (Obj B)</span>
              </button>
            </div>

            <button
              onClick={() => {
                onSetObjectA(displayObject);
                const params: SimulationParams = {
                  altitudeDeltaKm: 15.0,
                  inclinationDeltaDeg: 0.0,
                  eccentricityDelta: 0.0,
                  simulationDurationMin: 120,
                  timeStepSec: 30,
                };
                if (onApplySimulation) {
                  const sim = simulateOrbitModification(displayObject, params, objectB || undefined);
                  onApplySimulation(sim);
                }
                onOpenSimulation();
                notify(`Running avoidance simulation for ${displayObject.name}`);
              }}
              className="w-full py-2 px-3 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800/80 rounded text-emerald-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulate Evasive Trajectory Shift</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Kessler Syndrome & Debris Risk Analytics */}
      {activeConsoleTab === 'KESSLER' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {/* Orbital Time Machine Interactive Launch Card */}
          {onOpenTimeMachine && (
            <div className="p-3 bg-gradient-to-r from-cyan-950/70 via-slate-900 to-slate-950 border border-cyan-500/50 rounded-lg flex flex-col gap-2 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-cyan-900/60 border border-cyan-600 rounded text-cyan-300">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100 text-xs flex items-center gap-1.5">
                      <span>Orbital Time Machine</span>
                      <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-700">
                        2026–2060
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Travel forward in time &amp; explore before/after sustainability scenarios
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Explore how accelerated satellite launches and hypothetical debris-generating collisions alter orbital congestion over time with an interactive split-screen comparison slider.
              </p>
              <button
                onClick={onOpenTimeMachine}
                className="w-full py-2 px-3 bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <span>Launch Orbital Time Machine</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Scientific Context Card */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400 shrink-0" />
                <h3 className="font-semibold text-slate-100 text-xs">
                  Kessler Syndrome Threat Assessment
                </h3>
              </div>
              <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/80 shrink-0">
                NASA JSC (1978)
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Formulated by NASA astrophysicist Donald J. Kessler &amp; Burton G. Cour-Palais (1978): above a critical spatial density threshold in Low Earth Orbit, collisions between orbital objects generate fragments faster than atmospheric drag can naturally remove them, initiating a self-propagating cascade.
            </p>
            <div className="pt-0.5 text-[9px] font-mono text-slate-500">
              Citation: Kessler &amp; Cour-Palais, <span className="italic">J. Geophys. Res.</span>, 83(A6), 2637–2646 (1978).
            </div>
          </div>

          {/* Quantitative Distribution Stats (ESA / NASA Grounded) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                Global Space Debris Population
              </span>
              <span className="text-[9px] font-mono text-slate-500">
                ESA Space Debris Office (2024)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">&gt;10 cm (Tracked)</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-rose-400 mt-0.5">~40,500+</div>
                  <span className="text-[9px] text-slate-400 block mt-0.5 leading-tight">
                    Regularly cataloged; catastrophic on impact
                  </span>
                </div>
                <div className="mt-1.5 pt-1 border-t border-slate-850 text-[8.5px] font-mono text-slate-500">
                  SSN / Space-Track (2024)
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">1–10 cm (Model)</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">~1,000,000</div>
                  <span className="text-[9px] text-slate-400 block mt-0.5 leading-tight">
                    Untracked; penetrates Whipple shielding
                  </span>
                </div>
                <div className="mt-1.5 pt-1 border-t border-slate-850 text-[8.5px] font-mono text-slate-500">
                  ESA MASTER-8 (2024)
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">1 mm–1 cm</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-300 mt-0.5">~130M+</div>
                  <span className="text-[9px] text-slate-400 block mt-0.5 leading-tight">
                    Statistical model; ablates solar arrays
                  </span>
                </div>
                <div className="mt-1.5 pt-1 border-t border-slate-850 text-[8.5px] font-mono text-slate-500">
                  ESA DISCOS (2024)
                </div>
              </div>
            </div>

            <div className="px-2.5 py-1.5 bg-[#070b13] border border-slate-850 rounded flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Total Mass in Earth Orbit:</span>
              <span className="text-cyan-300 font-semibold">&gt;11,500 tonnes</span>
              <span className="text-[9px] text-slate-500">ESA Space Environment Report (2024)</span>
            </div>
          </div>

          {/* Altitude Congestion Zones */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                Debris Congestion by Orbital Band
              </span>
              <span className="text-[9px] font-mono text-slate-500">
                Relative Spatial Density Index
              </span>
            </div>

            <div className="space-y-2.5 pt-1 font-mono text-[11px]">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>750–850 km (Sun-Synchronous LEO)</span>
                  <span className="text-rose-400 font-bold">Peak Risk (100–500+ yr decay)</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded overflow-hidden">
                  <div className="h-full bg-rose-500 w-[92%]" title="Normalized spatial density: ~92% of peak LEO density" />
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 mt-0.5 font-sans">
                  <span>Fengyun-1C &amp; Cosmos-2251 fragment belts</span>
                  <span className="font-mono">Spatial index: 92% (NASA ODPO 2024)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>500–600 km (Mega-Constellations)</span>
                  <span className="text-amber-400 font-bold">High Density (5–25 yr life)</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded overflow-hidden">
                  <div className="h-full bg-amber-500 w-[68%]" title="Normalized spatial density: ~68% of peak density" />
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 mt-0.5 font-sans">
                  <span>Commercial satellite constellations; rapid drag decay</span>
                  <span className="font-mono">Spatial index: 68% (ESA 2024)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>400–420 km (ISS / Crewed Flight)</span>
                  <span className="text-emerald-400 font-bold">Protected (0.5–2 yr life)</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[24%]" title="Normalized spatial density: ~24% of peak density" />
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 mt-0.5 font-sans">
                  <span>Thermospheric clearing; active collision avoidance maneuvers</span>
                  <span className="font-mono">Spatial index: 24% (NASA 2024)</span>
                </div>
              </div>
            </div>

            <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-850 font-mono">
              *Bars reflect normalized spatial density relative to the ~800 km peak. Lifetimes assume ballistic drag without propulsion.
            </div>
          </div>

          {/* Priority Targets for Active Debris Removal (ADR) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                Priority Targets for Active Debris Removal (ADR)
              </span>
              <span className="text-[9px] font-mono text-slate-500">
                McKnight et al. (2021) / LeoLabs
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">1. ENVISAT (ESA #27386)</div>
                  <div className="text-[10px] text-slate-400">
                    8,211 kg launch mass (~8,050 kg dry) at 768 km altitude (98.5° SSO)
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    Ranked #1 single derelict payload; 26 m × 10 m cross-section in peak debris shell.
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                  <span className="text-[10px] font-mono text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800">
                    Critical Risk
                  </span>
                  <span className="text-[8.5px] font-mono text-slate-500">ESA Clean Space (2021)</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">2. SL-16 ZENIT-2 R/B (#22220)</div>
                  <div className="text-[10px] text-slate-400">
                    ~8,300 kg dry mass spent rocket stage at 842 km altitude (71.0° inc)
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    Launched 1992 (Cosmos 2219); one of 18 Zenit-2 stages forming LEO's highest mass cluster.
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                    High Risk
                  </span>
                  <span className="text-[8.5px] font-mono text-slate-500">McKnight / LeoLabs (2021)</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">3. SL-8 KOSMOS-3M R/B (#13119)</div>
                  <div className="text-[10px] text-slate-400">
                    ~1,435 kg dry mass stage at 975 km altitude (82.9° inc)
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    Launched 1982 (Cosmos 1346); representative of 140+ derelict stages with historic breakups.
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                    Elevated Risk
                  </span>
                  <span className="text-[8.5px] font-mono text-slate-500">NASA ODPO / Space-Track (2021)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Audit & Methodology Footnote */}
          <div className="p-2 bg-[#060a12] border border-slate-850 rounded text-[9.5px] text-slate-400 space-y-1">
            <div className="font-mono text-slate-300 font-semibold flex items-center gap-1.5">
              <Info className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>Scientific Audit &amp; Data Verification Note</span>
            </div>
            <p className="leading-relaxed">
              Orbital population statistics are validated against the <span className="text-slate-300">ESA Space Debris Office 2024 Space Environment Report</span> and <span className="text-slate-300">NASA Orbital Debris Program Office</span>. Derelict remediation rankings correspond to the peer-reviewed MCMA multi-criteria scoring model published by McKnight et al. in <span className="italic">Acta Astronautica</span> (2021). Orbital congestion graphics represent normalized spatial density relative to empirical peak concentrations.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onOpenBrief}
              className="w-full py-2 px-3 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-200 font-semibold rounded text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Export Full Debris Vulnerability Brief</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
