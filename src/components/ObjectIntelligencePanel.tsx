import React, { useState, useEffect } from 'react';
import { OrbitalObject } from '../types/orbital';
import {
  propagateKeplerian,
  cartesianToGeographic,
  EARTH_RADIUS_KM,
} from '../utils/orbitalMechanics';
import { Info, Target, GitCompare, Play, X, Compass, Activity, Gauge, HelpCircle, Layers } from 'lucide-react';

interface ObjectIntelligencePanelProps {
  object: OrbitalObject | null;
  onClose: () => void;
  onSetObjectA: (obj: OrbitalObject) => void;
  onSetObjectB: (obj: OrbitalObject) => void;
  onOpenSimulation: (obj: OrbitalObject) => void;
  isObjectA: boolean;
  isObjectB: boolean;
}

export const ObjectIntelligencePanel: React.FC<ObjectIntelligencePanelProps> = ({
  object,
  onClose,
  onSetObjectA,
  onSetObjectB,
  onOpenSimulation,
  isObjectA,
  isObjectB,
}) => {
  const [geoPos, setGeoPos] = useState<{ latitude: number; longitude: number; altitude: number }>({
    latitude: 0,
    longitude: 0,
    altitude: 0,
  });

  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [showSpeedComparison, setShowSpeedComparison] = useState<boolean>(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!object) return;

    const updatePosition = () => {
      const nowSec = (Date.now() / 1000) % 86400;
      const cartPos = propagateKeplerian(object, nowSec);
      const geo = cartesianToGeographic(cartPos, nowSec);
      setGeoPos(geo);
    };

    updatePosition();
    const interval = setInterval(updatePosition, 1000);
    return () => clearInterval(interval);
  }, [object]);

  if (!object) return null;

  const handleAssignA = () => {
    onSetObjectA(object);
    setActionNotice(`Assigned ${object.name.split(' ')[0]} as Object A`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleAssignB = () => {
    onSetObjectB(object);
    setActionNotice(`Assigned ${object.name.split(' ')[0]} as Object B`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const scrollToConjunction = () => {
    const el = document.getElementById('conjunction-section');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const tooltipDefinitions: Record<string, string> = {
    inclination: 'Orbit Tilt: The angle of the path compared to the Equator. 0° flies along the equator; 90° flies directly over the North and South Poles.',
    eccentricity: 'Orbit Shape: 0 means a perfectly round circle. Numbers above 0 mean an oval or egg shape.',
    orbitalPeriod: 'Orbit Time: How many minutes it takes to complete one complete loop around Earth.',
    velocity: 'Speed: Satellite speed needed to avoid falling back into Earth’s atmosphere (roughly 28,000 km/h in Low Orbit).',
    altitude: 'Height: Distance above Earth’s sea level. Space begins at the Kármán line (100 km).',
  };

  // Diagram 1: Altitude gauge proportions
  const altPercent =
    object.regime === 'GEO'
      ? 95
      : object.regime === 'MEO'
      ? Math.min(80, 45 + ((object.altitude - 2000) / 33786) * 35)
      : Math.min(40, 10 + (object.altitude / 2000) * 30);

  // Diagram 2: Inclination visualizer
  const incRad = (object.inclination * Math.PI) / 180;
  const incX = 40 + 34 * Math.cos(incRad);
  const incY = 40 - 34 * Math.sin(incRad);

  // Diagram 3: Mini World Map Footprint
  const mapX = ((geoPos.longitude + 180) / 360) * 100;
  const mapY = ((90 - geoPos.latitude) / 180) * 100;

  // Speed in km/h
  const speedKmH = Math.round(object.velocity * 3600);

  return (
    <div className="w-80 lg:w-96 bg-[#090d16] border border-slate-800 rounded-lg flex flex-col max-h-full overflow-hidden shadow-2xl select-none">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-start justify-between bg-slate-900/70">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                object.type === 'PAYLOAD'
                  ? 'bg-cyan-400'
                  : object.type === 'ROCKET_BODY'
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
              }`}
            />
            <span className="text-[11px] font-mono text-cyan-400 font-bold">NORAD #{object.catalogId}</span>
            <span className="text-slate-600">·</span>
            <span className="text-[11px] font-mono text-slate-300 font-semibold">{object.regime}</span>
          </div>
          <h2 className="text-sm font-semibold text-slate-100 tracking-wide mt-0.5">{object.name}</h2>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Intelligence Body */}
      <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
        {/* Simple Type & Operator Badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-slate-400">
          <span className="px-2 py-0.5 bg-slate-800/80 border border-slate-700/60 rounded text-[11px] font-mono font-medium text-slate-200">
            {object.type === 'PAYLOAD' ? '🛰️ Satellite / Payload' : object.type === 'ROCKET_BODY' ? '🚀 Spent Rocket Stage' : '💥 Debris Fragment'}
          </span>
          <span className="px-2 py-0.5 bg-slate-800/80 border border-slate-700/60 rounded text-[11px]">
            {object.operator}
          </span>
        </div>

        {/* Plain-English Overview Card */}
        <div className="p-2.5 bg-slate-950/90 border border-slate-800 rounded space-y-1.5 font-sans">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            KEY FLIGHT METRICS (PLAIN ENGLISH)
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-0.5">
            <div>
              <span className="text-slate-500 block">Height Above Earth:</span>
              <span className="font-bold text-cyan-300 font-mono text-xs">{object.altitude.toFixed(0)} km</span>
              <span className="text-[10px] text-slate-500 block">({object.regime === 'LEO' ? 'Low Earth Orbit' : object.regime === 'GEO' ? 'Geostationary' : 'Medium Orbit'})</span>
            </div>
            <div>
              <span className="text-slate-500 block">Current Speed:</span>
              <span className="font-bold text-white font-mono text-xs">{speedKmH.toLocaleString()} km/h</span>
              <span className="text-[10px] text-slate-500 block">({object.velocity.toFixed(2)} km/s · Mach 22)</span>
            </div>
            <div>
              <span className="text-slate-500 block">Time Per Full Orbit:</span>
              <span className="font-bold text-white font-mono text-xs">{object.orbitalPeriod.toFixed(1)} minutes</span>
              <span className="text-[10px] text-slate-500 block">(~{(1440 / object.orbitalPeriod).toFixed(1)} trips/day)</span>
            </div>
            <div>
              <span className="text-slate-500 block">Orbit Tilt (Angle):</span>
              <span className="font-bold text-white font-mono text-xs">{object.inclination.toFixed(1)}°</span>
              <span className="text-[10px] text-slate-500 block">{object.inclination > 80 ? 'Flies over poles' : 'Flies over mid-latitudes'}</span>
            </div>
          </div>
        </div>

        {/* DIAGRAM 1: 2D Sub-Satellite Ground Track Footprint */}
        <div className="p-3 bg-slate-950/80 border border-slate-800/90 rounded space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <Compass className="w-3.5 h-3.5" />
              <span>LIVE SUB-SATELLITE POSITION (NADIR)</span>
            </div>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>

          {/* Minimap Projection */}
          <div className="relative w-full h-24 bg-[#050b14] border border-slate-800/80 rounded overflow-hidden">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 50" preserveAspectRatio="none">
              <line x1="0" y1="25" x2="100" y2="25" stroke="#06b6d4" strokeWidth="0.5" strokeOpacity="0.4" />
              <line x1="50" y1="0" x2="50" y2="50" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.3" />
              <line x1="0" y1="12.5" x2="100" y2="12.5" stroke="#1e293b" strokeWidth="0.3" strokeDasharray="1,1" />
              <line x1="0" y1="37.5" x2="100" y2="37.5" stroke="#1e293b" strokeWidth="0.3" strokeDasharray="1,1" />
              <path
                d="M15,10 L30,12 L35,22 L25,35 L20,45 L15,35 Z M50,10 L75,12 L85,25 L75,35 L60,25 Z M55,20 L65,30 L60,45 L50,30 Z M75,32 L85,32 L85,42 L75,42 Z"
                fill="#0f2333"
                opacity="0.6"
              />
            </svg>

            {/* Target Beacon Blip */}
            <div
              style={{ left: `${Math.max(4, Math.min(96, mapX))}%`, top: `${Math.max(6, Math.min(94, mapY))}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
            >
              <div className="w-5 h-5 rounded-full border border-cyan-400/80 animate-ping absolute" />
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            </div>

            <div className="absolute bottom-1 left-2 text-[9px] font-mono text-slate-500">
              EQUATOR 0° // GREENWICH 0°
            </div>
            <div className="absolute top-1 right-2 text-[10px] font-mono-tabular text-cyan-300 font-semibold">
              {geoPos.latitude >= 0 ? `+${geoPos.latitude.toFixed(1)}°N` : `${Math.abs(geoPos.latitude).toFixed(1)}°S`},{' '}
              {geoPos.longitude >= 0 ? `+${geoPos.longitude.toFixed(1)}°E` : `${Math.abs(geoPos.longitude).toFixed(1)}°W`}
            </div>
          </div>
        </div>

        {/* DIAGRAM 2: Visual Orbit Tilt & Altitude Scale Gauges */}
        <div className="grid grid-cols-2 gap-2">
          {/* Inclination Angle Gauge Diagram */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>ORBIT TILT</span>
              <span className="font-semibold text-slate-200">{object.inclination.toFixed(1)}°</span>
            </div>

            <div className="py-1 flex items-center justify-center">
              <svg className="w-18 h-18" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="16" fill="#0d1b2a" stroke="#1d425c" strokeWidth="1.2" />
                <line x1="10" y1="40" x2="70" y2="40" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
                <text x="72" y="42" fill="#06b6d4" fontSize="6" fontFamily="IBM Plex Mono">0°</text>
                <line x1="40" y1="12" x2="40" y2="68" stroke="#334155" strokeWidth="0.8" strokeDasharray="1,1" />
                <line
                  x1={40 - (incX - 40)}
                  y1={40 - (incY - 40)}
                  x2={incX}
                  y2={incY}
                  stroke="#38bdf8"
                  strokeWidth="2"
                />
                <circle cx={incX} cy={incY} r="3" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
                <path
                  d={`M 56 40 A 16 16 0 0 0 ${40 + 16 * Math.cos(incRad)} ${40 - 16 * Math.sin(incRad)}`}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="1"
                />
              </svg>
            </div>
            <div className="text-[9px] font-mono text-slate-400 text-center">
              {object.inclination > 85 && object.inclination < 100
                ? 'POLAR / SUN-SYNC'
                : object.inclination < 20
                ? 'EQUATORIAL'
                : 'MID-INCLINATION'}
            </div>
          </div>

          {/* Orbital Altitude Scale Gauge */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>ALTITUDE</span>
              <span className="font-semibold text-cyan-300">{object.altitude.toFixed(0)} km</span>
            </div>

            <div className="py-1 flex items-center gap-2">
              <div className="relative w-3.5 h-20 bg-slate-900 border border-slate-800 rounded-full overflow-hidden flex flex-col justify-end p-0.5">
                <div
                  style={{ height: `${altPercent}%` }}
                  className="w-full bg-gradient-to-t from-cyan-600 via-sky-400 to-cyan-300 rounded-full transition-all duration-500"
                />
              </div>

              <div className="flex-1 space-y-1 text-[9px] font-mono-tabular">
                <div className={`flex justify-between ${object.regime === 'GEO' ? 'text-purple-300 font-bold' : 'text-slate-500'}`}>
                  <span>GEO</span>
                  <span>35,786 km</span>
                </div>
                <div className={`flex justify-between ${object.regime === 'MEO' ? 'text-emerald-300 font-bold' : 'text-slate-500'}`}>
                  <span>MEO</span>
                  <span>20,200 km</span>
                </div>
                <div className={`flex justify-between ${object.regime === 'LEO' ? 'text-cyan-300 font-bold' : 'text-slate-500'}`}>
                  <span>LEO</span>
                  <span>160-2000 km</span>
                </div>
              </div>
            </div>
            <div className="text-[9px] font-mono text-cyan-400/90 text-center font-semibold">
              ZONE: {object.regime}
            </div>
          </div>
        </div>

        {/* DIAGRAM 3: Interactive Speed Comparison Gauge */}
        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span className="flex items-center gap-1 text-cyan-400 font-semibold">
              <Gauge className="w-3.5 h-3.5" />
              SPEED COMPARISON
            </span>
            <span className="font-bold text-white">{speedKmH.toLocaleString()} km/h</span>
          </div>

          <div className="space-y-1.5 text-[10px] font-mono">
            <div>
              <div className="flex justify-between text-slate-400 mb-0.5">
                <span>Passenger Jet</span>
                <span>900 km/h</span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-slate-600 rounded-full" style={{ width: '3%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-0.5">
                <span>Rifle Bullet</span>
                <span>3,200 km/h</span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-slate-500 rounded-full" style={{ width: '12%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-cyan-300 font-bold mb-0.5">
                <span>{object.name.split(' ')[0]}</span>
                <span>{speedKmH.toLocaleString()} km/h</span>
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-sky-300 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
          <div className="text-[9px] text-slate-500 italic">
            Orbital velocity is fast enough to travel from New York to London in under 12 minutes!
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/80 flex flex-col gap-2">
        {actionNotice && (
          <div className="p-2 rounded bg-cyan-950/90 border border-cyan-700/80 text-[11px] text-cyan-200 flex items-center justify-between">
            <span className="truncate">{actionNotice}</span>
            <button
              onClick={scrollToConjunction}
              className="text-[10px] font-bold underline text-cyan-300 hover:text-white shrink-0 ml-2 cursor-pointer"
            >
              View Risk ↓
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleAssignA}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs font-medium transition-colors cursor-pointer ${
              isObjectA
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isObjectA ? 'Primary (Obj A)' : 'Set as Obj A'}</span>
          </button>

          <button
            onClick={handleAssignB}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs font-medium transition-colors cursor-pointer ${
              isObjectB
                ? 'bg-amber-950 text-amber-300 border border-amber-700/60 font-semibold'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5 text-amber-400" />
            <span>{isObjectB ? 'Target (Obj B)' : 'Set as Obj B'}</span>
          </button>
        </div>

        <button
          onClick={() => onOpenSimulation(object)}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800/90 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-slate-700 rounded text-xs font-semibold transition-colors cursor-pointer"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Simulate Orbit Shift on {object.name.split(' ')[0]}</span>
        </button>
      </div>
    </div>
  );
};
