import React, { useState } from 'react';
import { calculateTransferPlan } from '../utils/orbitalMechanics';
import { Compass, X, ArrowRight, Gauge, Check } from 'lucide-react';

interface MissionPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MissionPlanningModal: React.FC<MissionPlanningModalProps> = ({ isOpen, onClose }) => {
  const [originAlt, setOriginAlt] = useState<number>(400);
  const [destAlt, setDestAlt] = useState<number>(705);
  const [originInc, setOriginInc] = useState<number>(51.6);
  const [destInc, setDestInc] = useState<number>(98.2);
  const [objective, setObjective] = useState<string>('LEO Constellation Phasing & SSO Transfer');

  if (!isOpen) return null;

  const plan = calculateTransferPlan(originAlt, destAlt, originInc, destInc, objective);

  const presets = [
    {
      name: 'ISS to Sun-Synchronous (400 km → 705 km, 51.6° → 98.2°)',
      originAlt: 400,
      destAlt: 705,
      originInc: 51.6,
      destInc: 98.2,
      obj: 'SSO Orbit Injection & Plane Change',
    },
    {
      name: 'GTO to GEO Circularization (300 km → 35,786 km, 28.5° → 0.0°)',
      originAlt: 300,
      destAlt: 35786,
      originInc: 28.5,
      destInc: 0.05,
      obj: 'Geostationary Insertion Burn',
    },
    {
      name: 'End-of-Life Disposal De-orbit (550 km → 180 km)',
      originAlt: 550,
      destAlt: 180,
      originInc: 53.0,
      destInc: 53.0,
      obj: 'Atmospheric Re-entry Disposal',
    },
  ];

  // SVG Diagram Dimensions for Hohmann Ellipse
  const r1 = 30;
  const r2 = Math.max(38, Math.min(85, r1 + (Math.abs(destAlt - originAlt) / 1000) * 35));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="w-full max-w-3xl bg-[#090d16] border border-slate-700/80 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Compass className="w-4 h-4 text-cyan-400" />
            <div>
              <h2 className="text-sm font-semibold text-slate-100 tracking-wide">
                CONCEPTUAL MISSION PLANNING // TRANSFER TRAJECTORY
              </h2>
              <p className="text-[11px] text-slate-400">
                Visual two-impulse Hohmann transfer trajectory and velocity budget.
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
          {/* Preset Buttons */}
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-500 mb-2">MISSION PROFILE PRESETS</div>
            <div className="space-y-1.5">
              {presets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setOriginAlt(preset.originAlt);
                    setDestAlt(preset.destAlt);
                    setOriginInc(preset.originInc);
                    setDestInc(preset.destInc);
                    setObjective(preset.obj);
                  }}
                  className="w-full text-left p-2.5 bg-slate-900/50 hover:bg-slate-850 border border-slate-800 rounded transition-colors text-xs flex items-center justify-between hover:border-slate-700"
                >
                  <span className="font-medium text-slate-200">{preset.name}</span>
                  <span className="text-[10px] font-mono text-cyan-400">LOAD</span>
                </button>
              ))}
            </div>
          </div>

          {/* DIAGRAM: Visual Hohmann Transfer Arc */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2">
              <span className="text-cyan-400 font-semibold uppercase">TWO-IMPULSE HOHMANN TRANSFER DIAGRAM</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" />
                  ORIGIN ({originAlt} km)
                </span>
                <span className="flex items-center gap-1.5 text-amber-300">
                  <span className="w-2.5 h-0.5 bg-amber-400 inline-block" />
                  DESTINATION ({destAlt} km)
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2.5 h-0.5 bg-rose-400 border-b border-dashed border-rose-400 inline-block" />
                  TRANSFER ARC
                </span>
              </div>
            </div>

            {/* SVG Hohmann Diagram */}
            <div className="flex items-center justify-center py-2">
              <svg className="w-full max-w-md h-36" viewBox="0 0 340 140">
                {/* Earth Sphere in Center */}
                <circle cx="170" cy="70" r="16" fill="#081424" stroke="#1d425c" strokeWidth="1.2" />
                <text x="170" y="73" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="IBM Plex Mono">EARTH</text>

                {/* Inner Origin Orbit (Cyan) */}
                <circle cx="170" cy="70" r={r1} fill="none" stroke="#06b6d4" strokeWidth="1.5" />
                <circle cx={170 - r1} cy="70" r="3" fill="#06b6d4" stroke="#ffffff" strokeWidth="1" />
                <text x={170 - r1 - 4} y="62" textAnchor="end" fill="#06b6d4" fontSize="7.5" fontFamily="IBM Plex Mono" fontWeight="bold">
                  Δv1: {plan.deltaV1} m/s
                </text>

                {/* Outer Destination Orbit (Amber) */}
                <circle cx="170" cy="70" r={r2} fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                <circle cx={170 + r2} cy="70" r="3" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
                <text x={170 + r2 + 4} y="74" fill="#f59e0b" fontSize="7.5" fontFamily="IBM Plex Mono" fontWeight="bold">
                  Δv2: {plan.deltaV2} m/s
                </text>

                {/* Hohmann Semi-Elliptical Transfer Arc (Rose Dashed) */}
                <path
                  d={`M ${170 - r1} 70 A ${(r1 + r2) / 2} ${(r1 + r2) / 2} 0 0 1 ${170 + r2} 70`}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  strokeDasharray="3,3"
                />

                {/* Transfer duration annotation */}
                <text x="170" y="24" textAnchor="middle" fill="#fca5a5" fontSize="8" fontFamily="IBM Plex Mono" fontWeight="bold">
                  TRANSFER TIME: {plan.transferTimeMin.toFixed(1)} MIN
                </text>
              </svg>
            </div>
          </div>

          {/* Form Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-950 border border-slate-800 rounded">
            {/* Origin */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-cyan-400 uppercase font-mono">Origin Orbit</div>
              <div>
                <label className="text-slate-400 block text-[11px]">Altitude (km)</label>
                <input
                  type="number"
                  value={originAlt}
                  onChange={(e) => setOriginAlt(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono-tabular"
                />
              </div>
              <div>
                <label className="text-slate-400 block text-[11px]">Inclination (°)</label>
                <input
                  type="number"
                  value={originInc}
                  onChange={(e) => setOriginInc(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono-tabular"
                />
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-amber-400 uppercase font-mono">Destination Orbit</div>
              <div>
                <label className="text-slate-400 block text-[11px]">Altitude (km)</label>
                <input
                  type="number"
                  value={destAlt}
                  onChange={(e) => setDestAlt(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono-tabular"
                />
              </div>
              <div>
                <label className="text-slate-400 block text-[11px]">Inclination (°)</label>
                <input
                  type="number"
                  value={destInc}
                  onChange={(e) => setDestInc(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono-tabular"
                />
              </div>
            </div>
          </div>

          {/* Results Summary Strip with Graphical Gauges */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-200">Impulsive Maneuver Budget (Δv)</div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                  plan.complexity === 'EXTREME'
                    ? 'bg-rose-950 text-rose-300'
                    : plan.complexity === 'HIGH'
                    ? 'bg-amber-950 text-amber-300'
                    : 'bg-emerald-950 text-emerald-300'
                }`}
              >
                COMPLEXITY: {plan.complexity}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono-tabular text-xs">
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Total Required Δv</div>
                <div className="text-base font-bold text-cyan-300 mt-0.5">{plan.totalDeltaV.toFixed(1)} m/s</div>
              </div>
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Hohmann Δv1 + Δv2</div>
                <div className="text-base font-bold text-slate-200 mt-0.5">
                  {(plan.deltaV1 + plan.deltaV2).toFixed(1)} m/s
                </div>
              </div>
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Plane Change Δv</div>
                <div className="text-base font-bold text-slate-200 mt-0.5">{plan.deltaVPlaneChange.toFixed(1)} m/s</div>
              </div>
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Transfer Duration</div>
                <div className="text-base font-bold text-slate-200 mt-0.5">{plan.transferTimeMin.toFixed(1)} min</div>
              </div>
            </div>

            {/* Propellant Fraction Meter */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] font-mono-tabular">
                <span className="text-slate-400">Estimated Propellant Mass Fraction (Isp = 310s)</span>
                <span className="text-cyan-300 font-semibold">{plan.fuelFractionEstimate.toFixed(1)}% of spacecraft mass</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, plan.fuelFractionEstimate)}%` }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-amber-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Keplerian 2-body approximation · Excludes non-spherical J2 perturbations
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
