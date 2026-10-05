import React, { useState, useMemo, useEffect } from 'react';
import { OrbitalObject, ConjunctionAssessment, SimulationResult } from './types/orbital';
import { CATALOG_OBJECTS, generateBackgroundPopulation, CONJUNCTION_PRESETS } from './data/orbitalCatalog';
import { computeConjunction } from './utils/orbitalMechanics';
import { Header } from './components/Header';
import { StatsStrip } from './components/StatsStrip';
import { EarthVisualization } from './components/EarthVisualization';
import { OrbitHeightsDiagram } from './components/OrbitHeightsDiagram';
import { DebrisOperationsConsole } from './components/DebrisOperationsConsole';
import { OrbitSimulationModal } from './components/OrbitSimulationModal';
import { MissionPlanningModal } from './components/MissionPlanningModal';
import { MissionBriefModal } from './components/MissionBriefModal';
import { OrbitalTimeMachine } from './components/OrbitalTimeMachine';
import { OrbitalCrisisSimulator } from './components/OrbitalCrisisSimulator';
import { Globe, BarChart2, Layers, Clock, AlertTriangle, Sparkles } from 'lucide-react';

export default function App() {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'CONJUNCTION' | 'SIMULATION' | 'PLANNER' | 'TIMEMACHINE' | 'CRISIS'>('DASHBOARD');
  const [centerViewMode, setCenterViewMode] = useState<'GLOBE_3D' | 'HEIGHTS_2D'>('GLOBE_3D');
  const [activeConsoleTab, setActiveConsoleTab] = useState<'WATCHLIST' | 'INSPECTOR' | 'KESSLER'>('WATCHLIST');

  // Crisis Visual State for Earth Map
  const [crisisVisualContext, setCrisisVisualContext] = useState<{
    active: boolean;
    scenarioTitle?: string;
    earthImpact?: {
      regionName: string;
      centerLat: number;
      centerLon: number;
      swathRadiusKm: number;
      coverageStatus: 'NOMINAL' | 'TEMPORARY_OUTAGE' | 'PERMANENT_LOSS' | 'BACKUP_ACTIVE';
      serviceName: string;
      affectedPopulationEst: string;
    };
  } | null>(null);

  // Live Real Data State
  const [liveObjects, setLiveObjects] = useState<OrbitalObject[]>([]);
  const [isRefreshingLive, setIsRefreshingLive] = useState<boolean>(false);
  const [liveSourceText, setLiveSourceText] = useState<string>('CELESTRAK NORAD GP');
  const [liveEpoch, setLiveEpoch] = useState<string>('');

  // Fallback / Base Catalog
  const baseCatalog = useMemo(() => CATALOG_OBJECTS, []);
  const backgroundCatalog = useMemo(() => generateBackgroundPopulation(), []);

  // Fetch live CelesTrak / NORAD GP data on mount
  const fetchLiveData = async (forceRefresh = false) => {
    setIsRefreshingLive(true);
    try {
      const url = forceRefresh ? '/api/live-orbit-data?refresh=true' : '/api/live-orbit-data';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.objects && Array.isArray(data.objects) && data.objects.length > 0) {
          setLiveObjects(data.objects);
          setLiveSourceText(data.source === 'CELESTRAK_NORAD_LIVE_GP' ? 'CELESTRAK NORAD GP' : 'NORAD TELEMETRY');
          setLiveEpoch(data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '');
        }
      }
    } catch (err) {
      console.warn('Live orbit data fetch error:', err);
    } finally {
      setIsRefreshingLive(false);
    }
  };

  useEffect(() => {
    fetchLiveData(false);
  }, []);

  // Merged Active Objects Catalog:
  // Combines live fetched satellites with our verified real debris objects, all base catalog spacecraft, and background population
  const allObjects = useMemo(() => {
    if (liveObjects.length === 0) {
      return [...baseCatalog, ...backgroundCatalog];
    }

    // Merge live objects and all base catalog objects cleanly without dropping presets
    const seen = new Set<string>();
    const merged: OrbitalObject[] = [];

    // Prioritize live objects
    liveObjects.forEach((obj) => {
      seen.add(obj.catalogId);
      merged.push(obj);
    });

    // Add ALL base catalog objects (satellites, rockets, debris) not covered in the live feed
    baseCatalog.forEach((obj) => {
      if (!seen.has(obj.catalogId)) {
        seen.add(obj.catalogId);
        merged.push(obj);
      }
    });

    return [...merged, ...backgroundCatalog];
  }, [liveObjects, baseCatalog, backgroundCatalog]);

  // Selected Objects for Inspection & Conjunction (Default: Starlink vs Cosmos 2251 Debris)
  const defaultObjA = useMemo(() => {
    return allObjects.find((o) => o.id === 'starlink-3104' || o.catalogId === '55123') || baseCatalog[2];
  }, [allObjects, baseCatalog]);

  const defaultObjB = useMemo(() => {
    return allObjects.find((o) => o.id === 'cosmos-2251-deb' || o.catalogId === '34120') || baseCatalog.find((o) => o.type === 'DEBRIS') || baseCatalog[0];
  }, [allObjects, baseCatalog]);

  const [selectedObjectA, setSelectedObjectA] = useState<OrbitalObject | null>(defaultObjA);
  const [selectedObjectB, setSelectedObjectB] = useState<OrbitalObject | null>(defaultObjB);
  const [activeInspectorObject, setActiveInspectorObject] = useState<OrbitalObject | null>(defaultObjB);

  // Sync defaults once allObjects loads if initially unset
  useEffect(() => {
    if (!selectedObjectA && defaultObjA) setSelectedObjectA(defaultObjA);
    if (!selectedObjectB && defaultObjB) setSelectedObjectB(defaultObjB);
  }, [defaultObjA, defaultObjB, selectedObjectA, selectedObjectB]);

  // Filters & Layers
  const [filterRegime, setFilterRegime] = useState<'ALL' | 'LEO' | 'MEO' | 'GEO'>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'PAYLOAD' | 'DEBRIS' | 'ROCKET_BODY'>('ALL');
  const [showOrbits, setShowOrbits] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showBackground, setShowBackground] = useState<boolean>(true);
  const [showDebrisBelt, setShowDebrisBelt] = useState<boolean>(true);

  // Search
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isSimModalOpen, setIsSimModalOpen] = useState<boolean>(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState<boolean>(false);
  const [isBriefOpen, setIsBriefOpen] = useState<boolean>(false);

  // Active Simulation Result
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allObjects.filter(
      (obj) =>
        obj.name.toLowerCase().includes(query) ||
        obj.catalogId.includes(query) ||
        obj.operator.toLowerCase().includes(query) ||
        obj.type.toLowerCase().includes(query)
    );
  }, [searchQuery, allObjects]);

  // Real-time Conjunction Assessment
  const activeConjunction = useMemo<ConjunctionAssessment | null>(() => {
    if (!selectedObjectA || !selectedObjectB) return null;
    return computeConjunction(selectedObjectA, selectedObjectB, 120, 30);
  }, [selectedObjectA, selectedObjectB]);

  // Handle Object Selection
  const handleSelectObject = (obj: OrbitalObject) => {
    setActiveInspectorObject(obj);
    if (!selectedObjectA) {
      setSelectedObjectA(obj);
    }
  };

  const handleSelectPair = (objA: OrbitalObject, objB: OrbitalObject) => {
    setSelectedObjectA(objA);
    setSelectedObjectB(objB);
    setActiveInspectorObject(objA);
    setCenterViewMode('GLOBE_3D');
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Bar with Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'DASHBOARD') {
            setCenterViewMode('GLOBE_3D');
          } else if (tab === 'CONJUNCTION') {
            setActiveConsoleTab('WATCHLIST');
          } else if (tab === 'SIMULATION') {
            setIsSimModalOpen(true);
          } else if (tab === 'PLANNER') {
            setActiveConsoleTab('KESSLER');
          }
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        onSelectSearchResult={(obj) => {
          setActiveInspectorObject(obj);
          setSelectedObjectA(obj);
          setActiveConsoleTab('INSPECTOR');
        }}
        onOpenBriefModal={() => setIsBriefOpen(true)}
        onOpenSimulationModal={() => setIsSimModalOpen(true)}
        onOpenCrisisSimulator={() => setActiveTab('CRISIS')}
        onOpenJudgeMode={() => setActiveTab('CRISIS')}
      />

      {/* Top Telemetry Strip with Debris Metrics */}
      <StatsStrip
        filterRegime={filterRegime}
        setFilterRegime={setFilterRegime}
        filterType={filterType}
        setFilterType={setFilterType}
        conjunctionAlertsCount={17}
        isLiveFeed={true}
        liveCount={liveObjects.length > 0 ? liveObjects.length : 175}
        onRefreshLive={() => fetchLiveData(true)}
        isRefreshing={isRefreshingLive}
        sourceText={liveSourceText}
      />

      {/* Main Simplified 2-Pane Console Layout OR Orbital Time Machine View OR Orbital Crisis Simulator */}
      {activeTab === 'TIMEMACHINE' ? (
        <OrbitalTimeMachine
          onReturnToRadar={() => {
            setActiveTab('DASHBOARD');
            setCenterViewMode('GLOBE_3D');
          }}
        />
      ) : activeTab === 'CRISIS' ? (
        /* View 2: Interactive Orbital Crisis Simulator Command Center */
        <main className="flex-1 flex flex-col p-3 md:p-4 gap-4 max-w-[1880px] w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[660px]">
            {/* Left 3D Globe & Earth Impact Swath Viewport (5.5 cols on lg) */}
            <div className="lg:col-span-5 flex flex-col gap-2 min-h-[480px]">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>3D Conjunction &amp; Earth Swath Radar</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setActiveTab('DASHBOARD');
                      setCenterViewMode('GLOBE_3D');
                    }}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded text-xs transition-colors"
                  >
                    Return to Full Radar
                  </button>
                </div>
              </div>

              <div className="flex-1 w-full h-full min-h-[460px]">
                <EarthVisualization
                  objects={allObjects}
                  selectedObjectA={selectedObjectA}
                  selectedObjectB={selectedObjectB}
                  simulationResult={simulationResult}
                  onResetSimulation={() => setSimulationResult(null)}
                  onOpenSimulation={() => {
                    setIsSimModalOpen(true);
                  }}
                  onSelectObject={(obj) => {
                    handleSelectObject(obj);
                    setActiveConsoleTab('INSPECTOR');
                  }}
                  filterRegime="ALL"
                  filterType="ALL"
                  showOrbits={showOrbits}
                  showLabels={showLabels}
                  showGrid={showGrid}
                  showBackground={showBackground}
                  showDebrisBelt={showDebrisBelt}
                  crisisContext={crisisVisualContext}
                />
              </div>
            </div>

            {/* Right Interactive Orbital Crisis Simulator & HALO Panel (7 cols on lg) */}
            <div className="lg:col-span-7 flex flex-col min-h-[520px]">
              <OrbitalCrisisSimulator
                onSelectPair={handleSelectPair}
                onApplySimulation={(result) => setSimulationResult(result)}
                onOpenSimulationModal={() => setIsSimModalOpen(true)}
                onSwitchToGlobe={() => {
                  setCenterViewMode('GLOBE_3D');
                }}
                onUpdateCrisisVisual={(c) => {
                  if (c) {
                    setCrisisVisualContext({
                      active: true,
                      scenarioTitle: c.title,
                      earthImpact: {
                        regionName: c.earthImpact.regionName,
                        centerLat: c.earthImpact.centerLat,
                        centerLon: c.earthImpact.centerLon,
                        swathRadiusKm: c.earthImpact.nominalSwathRadiusKm,
                        coverageStatus:
                          c.selectedBranch === 'BASELINE'
                            ? c.branches.baseline.earthCoverageStatus
                            : c.selectedBranch === 'AVOIDANCE_BURN'
                            ? c.branches.avoidanceBurn.earthCoverageStatus
                            : c.branches.coordinated.earthCoverageStatus,
                        serviceName: c.earthImpact.serviceName,
                        affectedPopulationEst: c.earthImpact.affectedPopulationEst,
                      },
                    });
                  } else {
                    setCrisisVisualContext(null);
                  }
                }}
              />
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 flex flex-col p-3 md:p-4 gap-4 max-w-[1780px] w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[640px]">
            {/* Left Viewport Pane: 3D Debris Radar / 2D Density Profile (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-2 min-h-[520px]">
              {/* Viewport Control Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                {/* Primary View Toggle */}
                <div className="flex items-center gap-1.5 p-0.5 bg-slate-900 border border-slate-800 rounded">
                  <button
                    onClick={() => setCenterViewMode('GLOBE_3D')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                      centerViewMode === 'GLOBE_3D'
                        ? 'bg-cyan-950 border border-cyan-700/80 text-cyan-200'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>3D Debris Radar</span>
                  </button>

                  <button
                    onClick={() => setCenterViewMode('HEIGHTS_2D')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                      centerViewMode === 'HEIGHTS_2D'
                        ? 'bg-cyan-950 border border-cyan-700/80 text-cyan-200'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Altitude Density Profile</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('TIMEMACHINE')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
                    title="Travel forward through simulated orbital environments (2026–2060)"
                  >
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Time Machine (2026–2060)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('CRISIS')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 border border-rose-900/60 transition-colors"
                    title="Open Interactive Orbital Crisis Simulator & HALO AI Assistant"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    <span>Crisis Simulator (HALO)</span>
                  </button>
                </div>

                {/* Quick Debris & Layer Toggles */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setShowDebrisBelt(!showDebrisBelt)}
                    className={`px-2.5 py-1.5 rounded text-xs font-mono border transition-colors ${
                      showDebrisBelt
                        ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                    title="Toggle 780 km Sun-Synchronous Debris Hazard Congestion Ring"
                  >
                    780km Debris Belt
                  </button>
                  <button
                    onClick={() => setShowOrbits(!showOrbits)}
                    className={`px-2.5 py-1.5 rounded text-xs font-mono border transition-colors ${
                      showOrbits
                        ? 'bg-cyan-950/80 border-cyan-800 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    Orbits
                  </button>
                  <button
                    onClick={() => setShowLabels(!showLabels)}
                    className={`px-2.5 py-1.5 rounded text-xs font-mono border transition-colors ${
                      showLabels
                        ? 'bg-cyan-950/80 border-cyan-800 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    Labels
                  </button>
                </div>
              </div>

              {/* Viewport Canvas Stage */}
              <div className="flex-1 w-full h-full min-h-[480px]">
                {centerViewMode === 'GLOBE_3D' ? (
                  <EarthVisualization
                    objects={allObjects}
                    selectedObjectA={selectedObjectA}
                    selectedObjectB={selectedObjectB}
                    simulationResult={simulationResult}
                    onResetSimulation={() => setSimulationResult(null)}
                    onOpenSimulation={() => {
                      setCenterViewMode('GLOBE_3D');
                      setIsSimModalOpen(true);
                    }}
                    onSelectObject={(obj) => {
                      handleSelectObject(obj);
                      setActiveConsoleTab('INSPECTOR');
                    }}
                    filterRegime={filterRegime}
                    filterType={filterType}
                    showOrbits={showOrbits}
                    showLabels={showLabels}
                    showGrid={showGrid}
                    showBackground={showBackground}
                    showDebrisBelt={showDebrisBelt}
                    crisisContext={crisisVisualContext}
                  />
                ) : (
                  <OrbitHeightsDiagram
                    objects={allObjects.slice(0, 45)}
                    selectedObjectA={selectedObjectA}
                    selectedObjectB={selectedObjectB}
                    onSelectObject={(obj) => {
                      handleSelectObject(obj);
                      setActiveConsoleTab('INSPECTOR');
                    }}
                    onSetObjectA={(obj) => setSelectedObjectA(obj)}
                    onSetObjectB={(obj) => setSelectedObjectB(obj)}
                  />
                )}
              </div>
            </div>

            {/* Right Operations Console Pane (4 cols) */}
            <div className="lg:col-span-4 flex flex-col min-h-[520px]">
              <DebrisOperationsConsole
                conjunction={activeConjunction}
                objectA={selectedObjectA}
                objectB={selectedObjectB}
                activeInspectorObject={activeInspectorObject}
                allObjects={allObjects}
                onSelectObject={handleSelectObject}
                onSelectPair={handleSelectPair}
                onSetObjectA={(obj) => setSelectedObjectA(obj)}
                onSetObjectB={(obj) => setSelectedObjectB(obj)}
                onOpenSimulation={() => {
                  setCenterViewMode('GLOBE_3D');
                  setIsSimModalOpen(true);
                }}
                onApplySimulation={(result) => setSimulationResult(result)}
                simulationResult={simulationResult}
                onOpenBrief={() => setIsBriefOpen(true)}
                onOpenTimeMachine={() => setActiveTab('TIMEMACHINE')}
                onOpenCrisisSimulator={() => setActiveTab('CRISIS')}
                activeConsoleTab={activeConsoleTab}
                setActiveConsoleTab={setActiveConsoleTab}
              />
            </div>
          </div>
        </main>
      )}

      {/* Orbit Simulation Modal (Collision Avoidance) */}
      <OrbitSimulationModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        targetObject={selectedObjectA}
        secondaryObject={selectedObjectB}
        onApplySimulation={(result) => setSimulationResult(result)}
        allObjects={allObjects}
        onSelectTargetObject={(obj) => setSelectedObjectA(obj)}
      />

      {/* Conceptual Active Debris Removal Planner */}
      <MissionPlanningModal
        isOpen={isPlannerOpen}
        onClose={() => setIsPlannerOpen(false)}
      />

      {/* Debris Risk Brief Modal */}
      <MissionBriefModal
        isOpen={isBriefOpen}
        onClose={() => setIsBriefOpen(false)}
        objectA={selectedObjectA}
        objectB={selectedObjectB}
        conjunction={activeConjunction}
        simulation={simulationResult}
      />
    </div>
  );
}
