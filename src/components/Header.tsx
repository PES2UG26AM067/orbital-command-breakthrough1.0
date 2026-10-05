import React from 'react';
import { Search, FileText, Play, Clock, AlertTriangle, Sparkles, Star } from 'lucide-react';
import { OrbitalObject } from '../types/orbital';
import { CosmicLogo } from './CosmicLogo';

interface HeaderProps {
  activeTab: 'DASHBOARD' | 'CONJUNCTION' | 'SIMULATION' | 'PLANNER' | 'TIMEMACHINE' | 'CRISIS';
  setActiveTab: (tab: 'DASHBOARD' | 'CONJUNCTION' | 'SIMULATION' | 'PLANNER' | 'TIMEMACHINE' | 'CRISIS') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: OrbitalObject[];
  onSelectSearchResult: (obj: OrbitalObject) => void;
  onOpenBriefModal: () => void;
  onOpenSimulationModal: () => void;
  onOpenCrisisSimulator?: () => void;
  onOpenJudgeMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  searchResults,
  onSelectSearchResult,
  onOpenBriefModal,
  onOpenSimulationModal,
  onOpenCrisisSimulator,
  onOpenJudgeMode,
}) => {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-slate-800 bg-[#090d16] select-none">
      {/* Zone 1: Single text element wordmark with active radar pulse & insignia logo */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => setActiveTab('DASHBOARD')}
          className="group hover:opacity-95 transition-opacity text-left cursor-pointer"
          title="Return to 3D Radar Dashboard"
        >
          <CosmicLogo size="md" />
        </button>

        {/* Global Debris & Satellite Search */}
        <div className="relative hidden xl:block w-64">
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded text-xs text-slate-200 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/20">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search debris piece, rocket stage, NORAD #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-xs text-slate-100 placeholder:text-slate-500"
            />
          </div>

          {/* Search Dropdown */}
          {searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-80 bg-slate-950 border border-slate-800 rounded shadow-2xl z-50 max-h-64 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((obj) => (
                  <button
                    key={obj.id}
                    onClick={() => {
                      onSelectSearchResult(obj);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-3 py-2 border-b border-slate-900 hover:bg-slate-900/80 flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="font-medium text-slate-200 flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            obj.type === 'DEBRIS'
                              ? 'bg-rose-400'
                              : obj.type === 'ROCKET_BODY'
                              ? 'bg-amber-400'
                              : 'bg-cyan-400'
                          }`}
                        />
                        <span>{obj.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono-tabular">
                        {obj.type === 'DEBRIS' ? 'Debris Fragment' : obj.type === 'ROCKET_BODY' ? 'Rocket Stage' : 'Active Satellite'} · {obj.operator}
                      </div>
                    </div>
                    <span className="font-mono text-cyan-400 text-[10px]">#{obj.catalogId}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-xs text-slate-500 text-center">
                  No debris or object matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Zone 2: Clean text navigation links */}
      <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('CRISIS')}
          className={`hover:text-slate-100 transition-colors pb-1 border-b-2 flex items-center gap-1.5 ${
            activeTab === 'CRISIS' ? 'border-rose-500 text-rose-300 font-bold' : 'border-transparent text-rose-400/90 hover:text-rose-300'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>Crisis Simulator</span>
          <span className="text-[9px] px-1 bg-rose-950 border border-rose-800 rounded font-mono text-rose-300">
            HALO AI
          </span>
        </button>

        <button
          onClick={() => setActiveTab('DASHBOARD')}
          className={`hover:text-slate-200 transition-colors pb-1 border-b-2 ${
            activeTab === 'DASHBOARD' ? 'border-cyan-400 text-slate-100 font-semibold' : 'border-transparent'
          }`}
        >
          Debris Radar 3D
        </button>
        <button
          onClick={() => setActiveTab('CONJUNCTION')}
          className={`hover:text-slate-200 transition-colors pb-1 border-b-2 ${
            activeTab === 'CONJUNCTION' ? 'border-cyan-400 text-slate-100 font-semibold' : 'border-transparent'
          }`}
        >
          Collision Watchlist
        </button>
        <button
          onClick={() => setActiveTab('SIMULATION')}
          className={`hover:text-slate-200 transition-colors pb-1 border-b-2 ${
            activeTab === 'SIMULATION' ? 'border-cyan-400 text-slate-100 font-semibold' : 'border-transparent'
          }`}
        >
          Avoidance Simulator
        </button>
        <button
          onClick={() => setActiveTab('TIMEMACHINE')}
          className={`hover:text-slate-200 transition-colors pb-1 border-b-2 flex items-center gap-1.5 ${
            activeTab === 'TIMEMACHINE' ? 'border-cyan-400 text-slate-100 font-semibold' : 'border-transparent'
          }`}
          title="Travel forward through simulated orbital environments and explore long-term space sustainability"
        >
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Time Machine</span>
        </button>
        <button
          onClick={() => setActiveTab('PLANNER')}
          className={`hover:text-slate-200 transition-colors pb-1 border-b-2 ${
            activeTab === 'PLANNER' ? 'border-cyan-400 text-slate-100 font-semibold' : 'border-transparent'
          }`}
        >
          Debris Removal (ADR)
        </button>
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2">
        {/* Judge Mode Quick Launch Button */}
        <button
          onClick={() => {
            setActiveTab('CRISIS');
            if (onOpenJudgeMode) onOpenJudgeMode();
          }}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/70 hover:bg-amber-900/80 border border-amber-600/70 rounded transition-colors whitespace-nowrap cursor-pointer shadow-sm"
          title="Interactive 3-5 minute demo walkthrough for judges"
        >
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>Judge Mode</span>
        </button>

        {/* Prominent GENERATE CRISIS Button */}
        <button
          onClick={() => {
            setActiveTab('CRISIS');
            if (onOpenCrisisSimulator) onOpenCrisisSimulator();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-300 to-rose-400 hover:opacity-95 rounded transition-all whitespace-nowrap shadow-md shadow-cyan-950 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-slate-950" />
          <span>GENERATE CRISIS</span>
        </button>

        <button
          onClick={onOpenSimulationModal}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700 rounded transition-colors whitespace-nowrap"
        >
          <Play className="w-3.5 h-3.5 text-emerald-400" />
          <span>Avoidance Burn</span>
        </button>

        <button
          onClick={onOpenBriefModal}
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-850 hover:bg-slate-800 rounded border border-slate-750 transition-colors whitespace-nowrap"
        >
          <FileText className="w-3 h-3 text-cyan-400" />
          <span>Brief</span>
        </button>
      </div>
    </header>
  );
};

