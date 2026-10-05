import React, { useState } from 'react';
import { OrbitalObject } from '../types/orbital';
import { Info, Target, Compass, Layers, ShieldCheck, AlertTriangle } from 'lucide-react';

interface OrbitHeightsDiagramProps {
  objects: OrbitalObject[];
  selectedObjectA: OrbitalObject | null;
  selectedObjectB: OrbitalObject | null;
  onSelectObject: (obj: OrbitalObject) => void;
  onSetObjectA: (obj: OrbitalObject) => void;
  onSetObjectB: (obj: OrbitalObject) => void;
}

export const OrbitHeightsDiagram: React.FC<OrbitHeightsDiagramProps> = ({
  objects,
  selectedObjectA,
  selectedObjectB,
  onSelectObject,
  onSetObjectA,
  onSetObjectB,
}) => {
  const [zoomLevel, setZoomLevel] = useState<'ALL' | 'LEO' | 'MEO_GEO'>('LEO');
  const [hoveredSatellite, setHoveredSatellite] = useState<OrbitalObject | null>(null);

  // Filter objects based on zoom level
  const displayedObjects = objects.filter((o) => {
    if (zoomLevel === 'LEO') return o.altitude <= 2000;
    if (zoomLevel === 'MEO_GEO') return o.altitude > 1000;
    return true;
  });

  // Calculate vertical position percentage (from bottom of diagram)
  const getAltitudeYPercent = (alt: number) => {
    if (zoomLevel === 'LEO') {
      // 0 to 2000 km (linear scale)
      return Math.min(94, Math.max(6, (alt / 2000) * 88 + 6));
    } else if (zoomLevel === 'MEO_GEO') {
      // 1000 to 36,000 km
      return Math.min(94, Math.max(6, ((alt - 1000) / 35000) * 88 + 6));
    } else {
      // Logarithmic / tiered scale for full 0 to 36,000 km
      if (alt <= 2000) {
        return (alt / 2000) * 45 + 6; // First 45% is LEO
      } else {
        return 51 + ((alt - 2000) / 34000) * 43; // Remaining is MEO/GEO
      }
    }
  };

  const altitudeDiff =
    selectedObjectA && selectedObjectB
      ? Math.abs(selectedObjectA.altitude - selectedObjectB.altitude)
      : null;

  return (
    <div className="w-full h-full bg-[#070b14] border border-slate-800 rounded-lg flex flex-col overflow-hidden relative select-none">
      {/* Top Diagram Controls */}
      <div className="px-4 py-2.5 border-b border-slate-800 bg-[#090e1a] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-100 uppercase tracking-wider text-[11px] font-mono">
            ORBITAL ALTITUDE CROSS-SECTION DIAGRAM
          </span>
          <span className="text-[10px] text-slate-400 font-sans hidden sm:inline">
            (Interactive altitude map showing real satellite orbits above Earth)
          </span>
        </div>

        {/* Zoom Scope Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 border border-slate-800 rounded">
          <span className="text-[10px] text-slate-500 font-mono px-1">VIEW:</span>
          <button
            onClick={() => setZoomLevel('LEO')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              zoomLevel === 'LEO'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            LEO Focus (0 - 2,000 km)
          </button>
          <button
            onClick={() => setZoomLevel('MEO_GEO')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              zoomLevel === 'MEO_GEO'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Deep Space / GEO (36,000 km)
          </button>
          <button
            onClick={() => setZoomLevel('ALL')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              zoomLevel === 'ALL'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Heights (Log Scale)
          </button>
        </div>
      </div>

      {/* Main Interactive Diagram Canvas */}
      <div className="flex-1 relative overflow-hidden flex">
        {/* Left Vertical Altitude Scale Ruler */}
        <div className="w-20 md:w-28 bg-[#060911] border-r border-slate-800/80 py-4 flex flex-col justify-between items-end pr-2 text-[10px] font-mono text-slate-500 select-none shrink-0 z-10">
          {zoomLevel === 'LEO' ? (
            <>
              <div>2,000 km (LEO Top)</div>
              <div>1,500 km</div>
              <div>1,000 km</div>
              <div>750 km (Earth Obs)</div>
              <div>550 km (Starlink)</div>
              <div>420 km (ISS Orbit)</div>
              <div>100 km (Space Edge)</div>
              <div>0 km (Earth Surface)</div>
            </>
          ) : zoomLevel === 'MEO_GEO' ? (
            <>
              <div>36,000 km (GEO Belt)</div>
              <div>30,000 km</div>
              <div>23,222 km (Galileo)</div>
              <div>20,200 km (GPS MEO)</div>
              <div>10,000 km (Van Allen)</div>
              <div>5,000 km</div>
              <div>1,000 km</div>
            </>
          ) : (
            <>
              <div>35,786 km (GEO)</div>
              <div>20,200 km (GPS)</div>
              <div>2,000 km (LEO limit)</div>
              <div>800 km</div>
              <div>420 km (Space Station)</div>
              <div>100 km (Kármán line)</div>
              <div>0 km (Earth)</div>
            </>
          )}
        </div>

        {/* Diagram Interactive Body */}
        <div className="flex-1 relative bg-gradient-to-t from-[#0b1626] via-[#070d18] to-[#04070e] overflow-hidden">
          {/* Reference Atmospheric & Orbital Zones Background Bands */}
          <div className="absolute inset-0 pointer-events-none">
            {zoomLevel === 'LEO' && (
              <>
                {/* Earth Atmosphere band (0 - 100km) */}
                <div
                  className="absolute bottom-0 left-0 right-0 border-t border-cyan-800/50 bg-cyan-950/20"
                  style={{ height: `${(100 / 2000) * 88 + 6}%` }}
                >
                  <div className="absolute top-1 left-3 text-[9px] font-mono text-cyan-400 font-semibold">
                    KÁRMÁN LINE (100 km) — OFFICIAL BOUNDARY OF SPACE
                  </div>
                </div>

                {/* Human Spaceflight Zone (380 - 450 km) */}
                <div
                  className="absolute left-0 right-0 border-y border-emerald-500/20 bg-emerald-950/10"
                  style={{
                    bottom: `${(380 / 2000) * 88 + 6}%`,
                    height: `${(70 / 2000) * 88}%`,
                  }}
                >
                  <span className="absolute top-0.5 right-3 text-[9px] font-mono text-emerald-400">
                    CREWED HABITAT ZONE (ISS & TIANGONG)
                  </span>
                </div>

                {/* Mega Constellation Shell (500 - 600 km) */}
                <div
                  className="absolute left-0 right-0 border-y border-cyan-500/15 bg-cyan-950/10"
                  style={{
                    bottom: `${(500 / 2000) * 88 + 6}%`,
                    height: `${(100 / 2000) * 88}%`,
                  }}
                >
                  <span className="absolute top-0.5 right-3 text-[9px] font-mono text-cyan-500/70">
                    STARLINK / MEGA-CONSTELLATION SHELL (530 - 570 km)
                  </span>
                </div>

                {/* Sun-Synchronous Debris Hazard Belt (700 - 900 km) */}
                <div
                  className="absolute left-0 right-0 border-y border-rose-500/30 bg-rose-950/20"
                  style={{
                    bottom: `${(700 / 2000) * 88 + 6}%`,
                    height: `${(200 / 2000) * 88}%`,
                  }}
                >
                  <span className="absolute top-0.5 right-3 text-[9px] font-mono text-rose-400 font-semibold">
                    CRITICAL DEBRIS HAZARD BELT (700–900 km COSMOS-2251 &amp; FENGYUN-1C FRAGMENTS)
                  </span>
                </div>
              </>
            )}

            {/* Subtle horizontal grid lines */}
            {[20, 40, 60, 80].map((pct) => (
              <div
                key={pct}
                className="absolute left-0 right-0 border-b border-slate-800/40"
                style={{ bottom: `${pct}%` }}
              />
            ))}
          </div>

          {/* Interactive Satellite Pins */}
          <div className="absolute inset-0 p-4">
            {displayedObjects.map((obj, idx) => {
              const yPct = getAltitudeYPercent(obj.altitude);
              // Distribute X position evenly across width to prevent clustering
              const xPct = 12 + ((idx * 29) % 76);
              const isObjA = selectedObjectA?.id === obj.id;
              const isObjB = selectedObjectB?.id === obj.id;

              return (
                <div
                  key={obj.id}
                  style={{ bottom: `${yPct}%`, left: `${xPct}%` }}
                  className="absolute -translate-x-1/2 translate-y-1/2 z-20 group"
                  onMouseEnter={() => setHoveredSatellite(obj)}
                  onMouseLeave={() => setHoveredSatellite(null)}
                >
                  {/* Pin Circle */}
                  <button
                    onClick={() => {
                      onSelectObject(obj);
                      if (!selectedObjectA) onSetObjectA(obj);
                    }}
                    className={`relative flex items-center justify-center transition-transform hover:scale-125 focus:outline-none ${
                      isObjA || isObjB ? 'scale-125' : ''
                    }`}
                  >
                    {/* Glowing ring for selected */}
                    {(isObjA || isObjB) && (
                      <span
                        className={`absolute w-7 h-7 rounded-full border animate-ping ${
                          isObjA ? 'border-cyan-400/80' : 'border-amber-400/80'
                        }`}
                      />
                    )}

                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold shadow-lg border ${
                        isObjA
                          ? 'bg-cyan-400 text-slate-950 border-white shadow-cyan-500/50'
                          : isObjB
                          ? 'bg-amber-400 text-slate-950 border-white shadow-amber-500/50'
                          : obj.type === 'PAYLOAD'
                          ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                          : obj.type === 'ROCKET_BODY'
                          ? 'bg-orange-500 text-white border-orange-300'
                          : 'bg-rose-500 text-white border-rose-300'
                      }`}
                    >
                      {isObjA ? 'A' : isObjB ? 'B' : ''}
                    </span>

                    {/* Satellite Tag Label */}
                    <span
                      className={`absolute left-full ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono whitespace-nowrap pointer-events-none transition-opacity ${
                        isObjA
                          ? 'bg-cyan-950 text-cyan-200 border border-cyan-700 opacity-100'
                          : isObjB
                          ? 'bg-amber-950 text-amber-200 border border-amber-700 opacity-100'
                          : 'bg-slate-900/90 text-slate-300 border border-slate-800 opacity-80 group-hover:opacity-100 group-hover:z-30'
                      }`}
                    >
                      {obj.name.split(' ')[0]} ({obj.altitude.toFixed(0)} km)
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Hovered or Selected Satellite Quick Info Floating Card */}
          {hoveredSatellite && (
            <div className="absolute top-3 right-3 p-3 bg-slate-950/95 border border-slate-700 rounded-lg shadow-2xl z-40 text-xs w-64 backdrop-blur pointer-events-none">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                <span className="font-semibold text-slate-100 truncate">{hoveredSatellite.name}</span>
                <span className="text-[10px] font-mono text-cyan-400">#{hoveredSatellite.catalogId}</span>
              </div>
              <div className="space-y-1 text-[11px] font-mono-tabular">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Altitude:</span>
                  <span className="font-bold text-cyan-300">{hoveredSatellite.altitude.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Speed:</span>
                  <span>{hoveredSatellite.velocity.toFixed(2)} km/s ({Math.round(hoveredSatellite.velocity * 3600).toLocaleString()} km/h)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Orbit Time:</span>
                  <span>{hoveredSatellite.orbitalPeriod.toFixed(1)} min / orbit</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Type:</span>
                  <span className="text-slate-200">{hoveredSatellite.type}</span>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-slate-400 italic">
                Click pin to inspect or assign to Conjunction Pair
              </div>
            </div>
          )}

          {/* Altitude Comparison Bar between Object A and Object B */}
          {selectedObjectA && selectedObjectB && altitudeDiff !== null && (
            <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-700/80 px-3 py-2 rounded-lg text-xs flex items-center gap-3 shadow-xl backdrop-blur z-30">
              <div className="flex items-center gap-1.5 text-cyan-400 font-mono font-semibold text-[11px]">
                <Target className="w-3.5 h-3.5" />
                <span>ALTITUDE COMPARISON</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 font-mono-tabular text-[11px]">
                <span className="text-cyan-300 font-medium">{selectedObjectA.name.split(' ')[0]} ({selectedObjectA.altitude.toFixed(0)} km)</span>
                <span className="text-slate-500">vs</span>
                <span className="text-amber-300 font-medium">{selectedObjectB.name.split(' ')[0]} ({selectedObjectB.altitude.toFixed(0)} km)</span>
              </div>
              <div className="border-l border-slate-800 pl-3 flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">Vertical Gap:</span>
                <span
                  className={`font-mono font-bold text-xs ${
                    altitudeDiff <= 5
                      ? 'text-rose-400'
                      : altitudeDiff <= 30
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {altitudeDiff.toFixed(1)} km
                </span>
                <span className="text-[10px] text-slate-500">
                  {altitudeDiff <= 5
                    ? '(Hazardous Co-Altitude)'
                    : altitudeDiff <= 30
                    ? '(Near-Crossing Orbit)'
                    : '(Clear Altitude Separation)'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
