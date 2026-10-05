import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import {
  SimulationScenarioId,
  DebrisEvent,
  ScenarioConfig,
  YearlySimulationPoint,
  PRESET_EVENTS,
  SCENARIO_CONFIGS,
  runSustainabilitySimulation,
} from '../utils/sustainabilitySimulation';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Flame,
  Layers,
  Sliders,
  Split,
  Maximize2,
  Info,
  Calendar,
  Rocket,
  Trash2,
  TrendingUp,
  Activity,
  ArrowRight,
  RefreshCw,
  Zap,
} from 'lucide-react';

interface OrbitalTimeMachineProps {
  onReturnToRadar?: () => void;
}

export const OrbitalTimeMachine: React.FC<OrbitalTimeMachineProps> = ({ onReturnToRadar }) => {
  // Scenario & Event State
  const [selectedScenarioId, setSelectedScenarioId] = useState<SimulationScenarioId>('MODERATE');
  const [events, setEvents] = useState<DebrisEvent[]>(PRESET_EVENTS);
  const [customConfig, setCustomConfig] = useState<ScenarioConfig>({
    ...SCENARIO_CONFIGS.CUSTOM,
  });

  // Active scenario config
  const activeScenarioConfig = useMemo(() => {
    if (selectedScenarioId === 'CUSTOM') {
      return customConfig;
    }
    return SCENARIO_CONFIGS[selectedScenarioId];
  }, [selectedScenarioId, customConfig]);

  // Baseline Scenario (for Before/After Comparison)
  const [comparisonBaselineScenarioId, setComparisonBaselineScenarioId] = useState<SimulationScenarioId>('SUSTAINABLE');
  const baselineScenarioConfig = useMemo(() => {
    return SCENARIO_CONFIGS[comparisonBaselineScenarioId];
  }, [comparisonBaselineScenarioId]);

  // Timeline State
  const [currentYear, setCurrentYear] = useState<number>(2038);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // years per sec

  // Comparison View Mode
  // 'SPLIT_SLIDER': Draggable divider over single 3D globe (Before vs After)
  // 'SIDE_BY_SIDE': Dual viewports
  // 'FULL_TIMELINE': Standard single interactive view
  const [viewMode, setViewMode] = useState<'SPLIT_SLIDER' | 'SIDE_BY_SIDE' | 'FULL_TIMELINE'>('SPLIT_SLIDER');
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0-100
  const isDraggingSliderRef = useRef<boolean>(false);

  // Active Exploded Ripple Effect for current year
  const [recentExplosion, setRecentExplosion] = useState<string | null>(null);

  // Run the Simulation for current active scenario & comparison baseline
  const activeTimeline = useMemo(() => {
    return runSustainabilitySimulation(activeScenarioConfig, events);
  }, [activeScenarioConfig, events]);

  const baselineTimeline = useMemo(() => {
    // Baseline scenario runs with clean events (no catastrophic injections) to show responsible baseline
    return runSustainabilitySimulation(baselineScenarioConfig, []);
  }, [baselineScenarioConfig]);

  // Current year data points
  const activeCurrentPoint = useMemo<YearlySimulationPoint>(() => {
    return activeTimeline.find((p) => p.year === currentYear) || activeTimeline[0];
  }, [activeTimeline, currentYear]);

  const baselineCurrentPoint = useMemo<YearlySimulationPoint>(() => {
    return baselineTimeline.find((p) => p.year === currentYear) || baselineTimeline[0];
  }, [baselineTimeline, currentYear]);

  const year2026BaselinePoint = useMemo<YearlySimulationPoint>(() => {
    return activeTimeline.find((p) => p.year === 2026) || activeTimeline[0];
  }, [activeTimeline]);

  // Handle Playback Interval
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = 1000 / playbackSpeed;
    const interval = setInterval(() => {
      setCurrentYear((prev) => {
        if (prev >= 2060) {
          setIsPlaying(false);
          return 2060;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  // Check if an event triggered in this year to show badge
  useEffect(() => {
    if (activeCurrentPoint.eventsTriggeredThisYear.length > 0) {
      setRecentExplosion(activeCurrentPoint.eventsTriggeredThisYear[0]);
      const timer = setTimeout(() => setRecentExplosion(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [activeCurrentPoint]);

  // Toggle event active status
  const handleToggleEvent = (eventId: string) => {
    setEvents((prev) =>
      prev.map((ev) => (ev.id === eventId ? { ...ev, active: !ev.active } : ev))
    );
  };

  // Three.js Mount Reference & Rendering
  const mountRef = useRef<HTMLDivElement>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  // Mouse Dragging for Split Slider
  const handleMouseDown = () => {
    isDraggingSliderRef.current = true;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSliderRef.current || !sliderContainerRef.current) return;
      const rect = sliderContainerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percentage = Math.round((x / rect.width) * 100);
      setSliderPosition(percentage);
    };

    const handleMouseUp = () => {
      isDraggingSliderRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Three.js Scene Setup with Scissor-testing for Before/After Slider
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 800;
    let height = container.clientHeight || 540;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06080e);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 5.2, 13);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setScissorTest(true);
    container.replaceChildren(renderer.domElement);

    // Earth Sphere
    const earthGeo = new THREE.SphereGeometry(3.2, 48, 48);
    const earthMat = new THREE.MeshPhongMaterial({
      color: 0x0c1e38,
      emissive: 0x040b17,
      specular: 0x224477,
      shininess: 25,
      wireframe: false,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);

    // Wireframe Grid Overlay on Earth
    const wireGeo = new THREE.SphereGeometry(3.21, 24, 24);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x1e3a6a,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wireMesh);

    // Atmosphere Glow Ring
    const atmosGeo = new THREE.SphereGeometry(3.38, 36, 36);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    scene.add(atmosMesh);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xa5f3fc, 1.4);
    dirLight.position.set(10, 8, 12);
    scene.add(dirLight);

    // Group 1: BEFORE / BASELINE PARTICLES (Sparse, Orderly, Clean)
    const beforeGroup = new THREE.Group();
    scene.add(beforeGroup);

    // Group 2: AFTER / PROJECTED PARTICLES (Dense, Congested, Debris Cluttered)
    const afterGroup = new THREE.Group();
    scene.add(afterGroup);

    // Generate Particles for Before (e.g. 2026 or Sustainable)
    const beforeSatsCount = 900;
    const beforeDebrisCount = 1400;

    const makeParticleSystem = (count: number, colorHex: number, minR: number, maxR: number, size: number) => {
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = minR + Math.random() * (maxR - minR);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color: colorHex,
        size,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      return new THREE.Points(geo, mat);
    };

    // Before Population
    const beforeSatPoints = makeParticleSystem(beforeSatsCount, 0x06b6d4, 3.6, 4.4, 0.045);
    const beforeDebrisPoints = makeParticleSystem(beforeDebrisCount, 0x94a3b8, 3.8, 5.0, 0.035);
    beforeGroup.add(beforeSatPoints);
    beforeGroup.add(beforeDebrisPoints);

    // After Population (Scales with current point metrics!)
    // Ratio of tracked debris compared to baseline 2026
    const debrisRatio = Math.min(5.0, activeCurrentPoint.trackedDebris / year2026BaselinePoint.trackedDebris);
    const satRatio = Math.min(4.5, activeCurrentPoint.activeSatellites / year2026BaselinePoint.activeSatellites);

    const afterSatCount = Math.round(900 * satRatio);
    const afterDebrisCount = Math.round(1400 * debrisRatio);
    const afterHazardDebrisCount = Math.round(800 * debrisRatio);

    const afterSatPoints = makeParticleSystem(afterSatCount, 0x38bdf8, 3.6, 4.4, 0.05);
    const afterDebrisPoints = makeParticleSystem(afterDebrisCount, 0xf43f5e, 3.7, 5.2, 0.04);
    const afterHazardBelt = makeParticleSystem(afterHazardDebrisCount, 0xf59e0b, 4.0, 4.6, 0.045);
    afterGroup.add(afterSatPoints);
    afterGroup.add(afterDebrisPoints);
    afterGroup.add(afterHazardBelt);

    // Event Explosion Shrapnel Rings if events active
    const explosionRings: THREE.Line[] = [];
    events.filter((e) => e.active && e.year <= currentYear).forEach((ev, idx) => {
      const ringGeo = new THREE.BufferGeometry();
      const pts: THREE.Vector3[] = [];
      const radius = 3.2 + (ev.altitudeKm / 6378) * 3.2;
      const inc = (ev.inclinationDeg * Math.PI) / 180;
      for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle) * Math.cos(inc);
        const z = radius * Math.sin(angle) * Math.sin(inc);
        pts.push(new THREE.Vector3(x, y, z));
      }
      ringGeo.setFromPoints(pts);
      const ringMat = new THREE.LineBasicMaterial({
        color: ev.type === 'COLLISION' ? 0xff0055 : ev.type === 'ASAT' ? 0xff5500 : 0xffaa00,
        transparent: true,
        opacity: 0.65,
      });
      const ring = new THREE.Line(ringGeo, ringMat);
      afterGroup.add(ring);
      explosionRings.push(ring);
    });

    // Orbit rings for visualization
    const orbitRingGeo = new THREE.RingGeometry(4.1, 4.12, 64);
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.15,
    });
    const ssoRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    ssoRing.rotation.x = Math.PI / 2.2;
    scene.add(ssoRing);

    // Animation Loop
    let animId: number;
    let rotationSpeed = 0.002;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      earthMesh.rotation.y += rotationSpeed * 0.4;
      wireMesh.rotation.y += rotationSpeed * 0.4;
      beforeGroup.rotation.y += rotationSpeed;
      afterGroup.rotation.y += rotationSpeed;

      const w = container.clientWidth;
      const h = container.clientHeight;

      if (viewMode === 'SPLIT_SLIDER') {
        const splitX = Math.round((sliderPosition / 100) * w);

        // Pass 1: Left Viewport (Before / Baseline)
        renderer.setViewport(0, 0, splitX, h);
        renderer.setScissor(0, 0, splitX, h);
        beforeGroup.visible = true;
        afterGroup.visible = false;
        earthMat.color.setHex(0x0c1e38);
        renderer.render(scene, camera);

        // Pass 2: Right Viewport (After / Projected Future)
        renderer.setViewport(splitX, 0, w - splitX, h);
        renderer.setScissor(splitX, 0, w - splitX, h);
        beforeGroup.visible = false;
        afterGroup.visible = true;
        // Subtle warning tint on congested Earth side
        earthMat.color.setHex(0x190e18);
        renderer.render(scene, camera);
      } else if (viewMode === 'SIDE_BY_SIDE') {
        const halfW = Math.round(w / 2);

        // Left Half: Before
        renderer.setViewport(0, 0, halfW, h);
        renderer.setScissor(0, 0, halfW, h);
        beforeGroup.visible = true;
        afterGroup.visible = false;
        earthMat.color.setHex(0x0c1e38);
        renderer.render(scene, camera);

        // Right Half: After
        renderer.setViewport(halfW, 0, halfW, h);
        renderer.setScissor(halfW, 0, halfW, h);
        beforeGroup.visible = false;
        afterGroup.visible = true;
        earthMat.color.setHex(0x190e18);
        renderer.render(scene, camera);
      } else {
        // FULL_TIMELINE
        renderer.setViewport(0, 0, w, h);
        renderer.setScissor(0, 0, w, h);
        beforeGroup.visible = false;
        afterGroup.visible = true;
        earthMat.color.setHex(0x0c1e38);
        renderer.render(scene, camera);
      }
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [
    viewMode,
    sliderPosition,
    currentYear,
    selectedScenarioId,
    activeCurrentPoint,
    year2026BaselinePoint,
    events,
  ]);

  // Delta calculations between Before & After
  const populationDelta = activeCurrentPoint.totalTrackedObjects - year2026BaselinePoint.totalTrackedObjects;
  const populationDeltaPercent = Math.round((populationDelta / year2026BaselinePoint.totalTrackedObjects) * 100);
  const debrisDelta = activeCurrentPoint.trackedDebris - year2026BaselinePoint.trackedDebris;
  const debrisDeltaPercent = Math.round((debrisDelta / year2026BaselinePoint.trackedDebris) * 100);

  return (
    <div className="flex-1 flex flex-col p-3 md:p-5 gap-4 max-w-[1780px] w-full mx-auto select-none">
      {/* Top Banner & Mode Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900/90 border border-slate-800 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-950 border border-cyan-800 rounded">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-semibold text-slate-100">
                Orbital Time Machine & Sustainability Studio
              </h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 rounded">
                ASTRODYNAMIC PROJECTION 2026–2060
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Explore how accelerating mega-constellations, debris remediation policies, and catastrophic in-orbit events shape orbital carrying capacity over time.
            </p>
          </div>
        </div>

        {/* Viewport Display Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded">
          <button
            onClick={() => setViewMode('SPLIT_SLIDER')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === 'SPLIT_SLIDER'
                ? 'bg-cyan-950 border border-cyan-700 text-cyan-200 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Interactive before-and-after slider overlay"
          >
            <Split className="w-3.5 h-3.5 text-cyan-400" />
            <span>Split Comparison Slider</span>
          </button>

          <button
            onClick={() => setViewMode('SIDE_BY_SIDE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === 'SIDE_BY_SIDE'
                ? 'bg-cyan-950 border border-cyan-700 text-cyan-200 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Dual side-by-side synchronized view"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dual Sync View</span>
          </button>

          <button
            onClick={() => setViewMode('FULL_TIMELINE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === 'FULL_TIMELINE'
                ? 'bg-cyan-950 border border-cyan-700 text-cyan-200 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Single globe time evolution view"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Full 3D Stage</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 3D Visualization Canvas (8 cols) + Scenario & Controls Console (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Left 8 Cols: Interactive 3D Comparison Stage */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {/* 3D Stage Container */}
          <div
            ref={sliderContainerRef}
            className="relative flex-1 min-h-[500px] bg-[#06080e] border border-slate-800 rounded-lg overflow-hidden group shadow-2xl"
          >
            {/* Three.js Canvas Mount */}
            <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

            {/* Split Slider Divider Bar (Only in SPLIT_SLIDER mode) */}
            {viewMode === 'SPLIT_SLIDER' && (
              <>
                {/* Vertical Divider Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-400 via-white to-cyan-400 z-20 pointer-events-none shadow-[0_0_12px_rgba(34,211,238,0.8)]"
                  style={{ left: `${sliderPosition}%` }}
                />

                {/* Draggable Handle */}
                <div
                  onMouseDown={handleMouseDown}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 w-8 h-8 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center cursor-ew-resize hover:scale-110 active:scale-95 transition-transform shadow-lg shadow-cyan-950"
                  style={{ left: `${sliderPosition}%` }}
                  title="Drag left or right to compare Before vs After"
                >
                  <Split className="w-4 h-4 text-cyan-300 rotate-90" />
                </div>

                {/* Left Side Label (BEFORE: 2026 / Sustainable) */}
                <div className="absolute top-3 left-3 z-10 px-3 py-1.5 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded text-xs text-slate-300 pointer-events-none">
                  <div className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider font-semibold">
                    ← BEFORE: BASELINE (2026)
                  </div>
                  <div className="font-semibold text-slate-100">
                    {year2026BaselinePoint.totalTrackedObjects.toLocaleString()} Tracked Objects
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono">
                    SSR: {year2026BaselinePoint.sustainabilityRating}/100 · Collision MTBC: ~5.3 yrs
                  </div>
                </div>

                {/* Right Side Label (AFTER: Projected Year / Selected Scenario) */}
                <div className="absolute top-3 right-3 z-10 px-3 py-1.5 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded text-xs text-slate-300 pointer-events-none text-right">
                  <div className="text-[10px] text-rose-400 font-mono uppercase tracking-wider font-semibold">
                    AFTER: PROJECTED ({currentYear}) →
                  </div>
                  <div className="font-semibold text-slate-100">
                    {activeCurrentPoint.totalTrackedObjects.toLocaleString()} Tracked Objects ({populationDelta >= 0 ? `+${populationDeltaPercent}%` : `${populationDeltaPercent}%`})
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono">
                    SSR: {activeCurrentPoint.sustainabilityRating}/100 · Hazard Index: {activeCurrentPoint.collisionProbabilityIndex}x
                  </div>
                </div>
              </>
            )}

            {/* Side-by-Side Mode Header Tags */}
            {viewMode === 'SIDE_BY_SIDE' && (
              <div className="absolute top-3 inset-x-3 z-10 flex justify-between pointer-events-none">
                <div className="px-3 py-1 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded text-xs text-slate-300">
                  <span className="text-cyan-400 font-mono font-semibold">2026 Baseline</span> · {year2026BaselinePoint.totalTrackedObjects.toLocaleString()} Objects
                </div>
                <div className="px-3 py-1 bg-slate-950/80 backdrop-blur-md border border-rose-900/80 rounded text-xs text-slate-300">
                  <span className="text-rose-400 font-mono font-semibold">{currentYear} Projected</span> · {activeCurrentPoint.totalTrackedObjects.toLocaleString()} Objects
                </div>
              </div>
            )}

            {/* Event Notification Floating Alert (When scrubbing across an event) */}
            {recentExplosion && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-rose-950/95 border border-rose-500 rounded-lg shadow-2xl flex items-center gap-2.5 text-xs text-rose-100 animate-bounce">
                <Flame className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <span className="font-semibold font-mono uppercase text-rose-300">Catastrophic Event Injected ({currentYear}):</span>{' '}
                  {recentExplosion}
                </div>
              </div>
            )}

            {/* Bottom Floating Scrubber HUD Overlay */}
            <div className="absolute bottom-3 inset-x-3 z-10 p-3 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-lg flex flex-col gap-2">
              {/* Year Scrubber & Controls */}
              <div className="flex items-center gap-3">
                {/* Play / Pause */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`p-2 rounded text-xs font-semibold flex items-center justify-center transition-colors ${
                    isPlaying
                      ? 'bg-amber-500/20 border border-amber-500 text-amber-300'
                      : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                  }`}
                  title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                {/* Reset to 2026 */}
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentYear(2026);
                  }}
                  className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-100 transition-colors"
                  title="Reset to 2026 Present Baseline"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Big Year Badge */}
                <div className="flex items-baseline gap-1 font-mono shrink-0">
                  <span className="text-xl font-bold text-slate-100">{currentYear}</span>
                  <span className="text-[10px] text-slate-500 uppercase">EPOCH</span>
                </div>

                {/* Interactive Slider Input */}
                <div className="relative flex-1 flex items-center">
                  <input
                    type="range"
                    min={2026}
                    max={2060}
                    step={1}
                    value={currentYear}
                    onChange={(e) => setCurrentYear(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
                  />

                  {/* Marker Pins for Debris Events on Timeline */}
                  {events
                    .filter((e) => e.active)
                    .map((ev) => {
                      const percent = ((ev.year - 2026) / (2060 - 2026)) * 100;
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => setCurrentYear(ev.year)}
                          className="absolute -top-1 w-2.5 h-3.5 bg-rose-500 hover:scale-125 transition-transform rounded-sm shadow-sm cursor-pointer z-10"
                          style={{ left: `${percent}%` }}
                          title={`Jump to ${ev.year}: ${ev.name}`}
                          aria-label={`Jump to ${ev.year}: ${ev.name}`}
                        />
                      );
                    })}
                </div>

                {/* Speed Multiplier */}
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded p-0.5 text-[11px] font-mono">
                  {[1, 2, 5].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        playbackSpeed === speed ? 'bg-cyan-950 text-cyan-300 font-bold' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Milestone Quick Jump Buttons */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/80 overflow-x-auto gap-2">
                <button
                  onClick={() => setCurrentYear(2026)}
                  className={`hover:text-cyan-300 transition-colors ${currentYear === 2026 ? 'text-cyan-400 font-bold' : ''}`}
                >
                  2026: Present Day
                </button>
                <span>·</span>
                <button
                  onClick={() => setCurrentYear(2032)}
                  className={`hover:text-cyan-300 transition-colors ${currentYear === 2032 ? 'text-cyan-400 font-bold' : ''}`}
                >
                  2032: Constellation Crest
                </button>
                <span>·</span>
                <button
                  onClick={() => setCurrentYear(2040)}
                  className={`hover:text-cyan-300 transition-colors ${currentYear === 2040 ? 'text-cyan-400 font-bold' : ''}`}
                >
                  2040: Critical Cascade Tipping
                </button>
                <span>·</span>
                <button
                  onClick={() => setCurrentYear(2055)}
                  className={`hover:text-cyan-300 transition-colors ${currentYear === 2055 ? 'text-cyan-400 font-bold' : ''}`}
                >
                  2055: Long-Term Steady State
                </button>
              </div>
            </div>
          </div>

          {/* Standout Comparison Metrics Bar (Before vs After) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
            {/* Metric 1: Tracked Population */}
            <div className="flex flex-col gap-1 p-2 bg-slate-950/60 border border-slate-800/80 rounded">
              <span className="text-[10px] font-mono uppercase text-slate-400">Total Tracked Objects</span>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-slate-100 font-mono">
                  {activeCurrentPoint.totalTrackedObjects.toLocaleString()}
                </span>
                <span
                  className={`text-[10px] font-mono font-semibold ${
                    populationDelta >= 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {populationDelta >= 0 ? `+${populationDeltaPercent}%` : `${populationDeltaPercent}%`}
                </span>
              </div>
              <div className="text-[9px] text-slate-500 font-mono">
                vs 2026 Baseline: {year2026BaselinePoint.totalTrackedObjects.toLocaleString()}
              </div>
            </div>

            {/* Metric 2: Lethal Small Debris (1-10cm) */}
            <div className="flex flex-col gap-1 p-2 bg-slate-950/60 border border-slate-800/80 rounded">
              <span className="text-[10px] font-mono uppercase text-slate-400">Untracked Lethal Debris (1-10cm)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-rose-300 font-mono">
                  ~{(activeCurrentPoint.smallLethalFragments / 1000000).toFixed(2)}M
                </span>
                <span className="text-[10px] font-mono text-rose-400">
                  +{Math.round(((activeCurrentPoint.smallLethalFragments - year2026BaselinePoint.smallLethalFragments) / year2026BaselinePoint.smallLethalFragments) * 100)}%
                </span>
              </div>
              <div className="text-[9px] text-slate-500 font-mono">
                Lethal hypervelocity shrapnel
              </div>
            </div>

            {/* Metric 3: Collision Risk Multiplier */}
            <div className="flex flex-col gap-1 p-2 bg-slate-950/60 border border-slate-800/80 rounded">
              <span className="text-[10px] font-mono uppercase text-slate-400">Collision Hazard Multiplier</span>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-amber-300 font-mono">
                  {activeCurrentPoint.collisionProbabilityIndex}x
                </span>
                <span className="text-[10px] font-mono text-amber-400">
                  MTBC: {activeCurrentPoint.meanTimeBetweenCollisionsMonths < 12 ? `${activeCurrentPoint.meanTimeBetweenCollisionsMonths} mo` : `${(activeCurrentPoint.meanTimeBetweenCollisionsMonths / 12).toFixed(1)} yr`}
                </span>
              </div>
              <div className="text-[9px] text-slate-500 font-mono">
                Cross-sectional flux density
              </div>
            </div>

            {/* Metric 4: Space Sustainability Rating (SSR) */}
            <div className="flex flex-col gap-1 p-2 bg-slate-950/60 border border-slate-800/80 rounded">
              <span className="text-[10px] font-mono uppercase text-slate-400">Space Sustainability (SSR)</span>
              <div className="flex items-baseline justify-between">
                <span
                  className={`text-base font-bold font-mono ${
                    activeCurrentPoint.sustainabilityRating > 70
                      ? 'text-emerald-400'
                      : activeCurrentPoint.sustainabilityRating > 45
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {activeCurrentPoint.sustainabilityRating}/100
                </span>
                <span
                  className={`text-[10px] font-mono uppercase font-semibold ${
                    activeCurrentPoint.sustainabilityRating > 70
                      ? 'text-emerald-400'
                      : activeCurrentPoint.sustainabilityRating > 45
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {activeCurrentPoint.sustainabilityRating > 70
                    ? 'SUSTAINABLE'
                    : activeCurrentPoint.sustainabilityRating > 45
                    ? 'STRESSED'
                    : 'RUNAWAY'}
                </span>
              </div>
              <div className="text-[9px] text-slate-500 font-mono">
                Orbital carrying capacity metric
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Scenario Selector, Event Injection & Remediation Levers */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Section 1: Growth Scenario Selection */}
          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Rocket className="w-3.5 h-3.5 text-cyan-400" />
                <span>Launch & Growth Scenario</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Select Assumption</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {(['SUSTAINABLE', 'MODERATE', 'RUNAWAY', 'CUSTOM'] as SimulationScenarioId[]).map((scId) => {
                const sc = SCENARIO_CONFIGS[scId];
                const isSelected = selectedScenarioId === scId;
                return (
                  <button
                    key={scId}
                    onClick={() => setSelectedScenarioId(scId)}
                    className={`p-2.5 rounded border text-left transition-all ${
                      isSelected
                        ? 'bg-slate-950 border-cyan-500 ring-1 ring-cyan-500/30'
                        : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-100">{sc.name}</span>
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                          scId === 'SUSTAINABLE'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                            : scId === 'MODERATE'
                            ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                            : scId === 'RUNAWAY'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {sc.tagline}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {sc.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 font-mono">
                      <span>Launches: ~{sc.annualLaunchRate}/yr</span>
                      <span>·</span>
                      <span>PMD: {Math.round(sc.pmdComplianceRate * 100)}%</span>
                      <span>·</span>
                      <span>ADR: {sc.adrRemovalsPerYear}/yr</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Parameter Slider Controls if 'CUSTOM' is selected */}
            {selectedScenarioId === 'CUSTOM' && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded flex flex-col gap-2.5 text-xs">
                <span className="font-semibold text-cyan-300 text-[11px] font-mono">Custom Sandbox Levers:</span>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Annual Launch Cadence:</span>
                    <span className="font-mono text-slate-200">{customConfig.annualLaunchRate} sats/yr</span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={6000}
                    step={100}
                    value={customConfig.annualLaunchRate}
                    onChange={(e) =>
                      setCustomConfig({ ...customConfig, annualLaunchRate: Number(e.target.value) })
                    }
                    className="w-full h-1 bg-slate-800 rounded accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>5-Yr Deorbit Compliance (PMD):</span>
                    <span className="font-mono text-slate-200">{Math.round(customConfig.pmdComplianceRate * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.3}
                    max={0.99}
                    step={0.01}
                    value={customConfig.pmdComplianceRate}
                    onChange={(e) =>
                      setCustomConfig({ ...customConfig, pmdComplianceRate: Number(e.target.value) })
                    }
                    className="w-full h-1 bg-slate-800 rounded accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Active Debris Removals (ADR):</span>
                    <span className="font-mono text-slate-200">{customConfig.adrRemovalsPerYear} derelicts/yr</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    step={1}
                    value={customConfig.adrRemovalsPerYear}
                    onChange={(e) =>
                      setCustomConfig({ ...customConfig, adrRemovalsPerYear: Number(e.target.value) })
                    }
                    className="w-full h-1 bg-slate-800 rounded accent-cyan-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Hypothetical Debris-Generating Events */}
          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>Hypothetical Debris Injections</span>
              </h3>
              <span className="text-[10px] text-rose-400 font-mono">Toggle Catastrophes</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Inject real-world failure scenarios to explore how individual fragmentation events accelerate long-term cascade rates.
            </p>

            <div className="flex flex-col gap-2">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className={`p-2.5 rounded border transition-colors ${
                    ev.active
                      ? 'bg-rose-950/20 border-rose-800/80'
                      : 'bg-slate-950/40 border-slate-800/80 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ev.active}
                        onChange={() => handleToggleEvent(ev.id)}
                        className="rounded border-slate-700 text-rose-500 focus:ring-rose-500/20 cursor-pointer accent-rose-500"
                      />
                      <span className="text-xs font-semibold text-slate-100">{ev.name}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-900 text-slate-300 rounded border border-slate-800">
                      {ev.year} ({ev.altitudeKm} km)
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 mt-1 pl-5">
                    {ev.description}
                  </p>

                  <div className="flex items-center justify-between pl-5 mt-1.5 text-[9px] font-mono text-slate-500">
                    <span className="text-rose-400">+{ev.fragmentsGenerated.toLocaleString()} tracked fragments</span>
                    <button
                      onClick={() => setCurrentYear(ev.year)}
                      className="text-cyan-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      Jump to {ev.year} <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Orbital Shell Density Profile */}
          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Altitude Shell Congestion ({currentYear})</span>
              </h3>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              {/* ISS Band 400-500km */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">400–500 km (Crewed / ISS Safe Corridor)</span>
                  <span className="font-mono text-slate-200">{activeCurrentPoint.altitudeDensities.leoLow_400_500}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${activeCurrentPoint.altitudeDensities.leoLow_400_500}%` }}
                  />
                </div>
              </div>

              {/* Mega-Constellations 500-650km */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">500–650 km (Mega-Constellations Shell)</span>
                  <span className="font-mono text-amber-300">{activeCurrentPoint.altitudeDensities.leoMega_500_650}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${activeCurrentPoint.altitudeDensities.leoMega_500_650}%` }}
                  />
                </div>
              </div>

              {/* Congested SSO 750-850km */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">750–850 km (Sun-Synchronous / Envisat Peak)</span>
                  <span className="font-mono text-rose-400">{activeCurrentPoint.altitudeDensities.leoSso_750_850}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 transition-all duration-300"
                    style={{ width: `${activeCurrentPoint.altitudeDensities.leoSso_750_850}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono leading-relaxed">
              *Normalized spatial density index relative to empirical 2024 peak density (~800 km, ESA Space Debris Office).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
