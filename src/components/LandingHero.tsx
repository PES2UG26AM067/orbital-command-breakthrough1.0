import React from 'react';
import { ArrowRight, ShieldCheck, Activity, Globe, Compass } from 'lucide-react';
import { CosmicLogo } from './CosmicLogo';

interface LandingHeroProps {
  onEnter: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onEnter }) => {
  return (
    <div className="relative min-h-[calc(100vh-60px)] flex flex-col justify-between p-8 md:p-14 bg-[#07090e] border border-slate-900 select-none">
      {/* Subtle background coordinate grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top Tagline */}
      <div className="relative z-10 flex items-center justify-between text-xs font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-slate-400 tracking-wider">CIVIL SPACE TRAFFIC MANAGEMENT & SITUATIONAL AWARENESS</span>
        </div>
        <div className="hidden sm:block">SYSTEM PROTOCOL // OC-2026.4</div>
      </div>

      {/* Core Typography & Value Proposition */}
      <div className="relative z-10 my-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <CosmicLogo size="lg" showText={false} />
          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-3 py-1.5 rounded">
            <span>AIR TRAFFIC CONTROL FOR ORBITAL SPACE</span>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-100 font-sans">
          COSMIC <span className="text-cyan-400">GRID</span>
        </h1>

        <p className="text-xl md:text-2xl text-slate-300 font-normal leading-relaxed text-wrap">
          Orbital traffic awareness for an increasingly crowded Earth orbit.
        </p>

        <p className="text-sm text-cyan-400/90 font-mono tracking-wide">
          Visualize. Analyze. Simulate.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <button
            onClick={onEnter}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-sm rounded shadow-lg shadow-cyan-950 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>ENTER MISSION CONTROL</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <span className="text-xs text-slate-500 font-mono">
            Prototype · Scientific visualization · Not for operational collision avoidance
          </span>
        </div>
      </div>

      {/* Bottom Technical Indicators & Narrative Principle */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-slate-900 text-xs">
        <div>
          <div className="font-semibold text-slate-300 flex items-center gap-2 mb-1">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive 3D Astrodynamics</span>
          </div>
          <p className="text-slate-500 leading-normal">
            Real Keplerian elements, orbital trajectories, and ground-track propagation for active constellations and debris.
          </p>
        </div>

        <div>
          <div className="font-semibold text-slate-300 flex items-center gap-2 mb-1">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Conjunction Assessment</span>
          </div>
          <p className="text-slate-500 leading-normal">
            Deterministic closest-approach screening with separation timelines and relative encounter velocity calculations.
          </p>
        </div>

        <div>
          <div className="font-semibold text-slate-300 flex items-center gap-2 mb-1">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Orbit Simulation & What-If</span>
          </div>
          <p className="text-slate-500 leading-normal">
            Modify altitude, inclination, and impulsive maneuvers to immediately observe orbital period shifts and conjunction resolution.
          </p>
        </div>
      </div>
    </div>
  );
};
