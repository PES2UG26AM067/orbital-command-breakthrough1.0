import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitalObject, SimulationResult } from '../types/orbital';
import { EARTH_RADIUS_KM, propagateKeplerian } from '../utils/orbitalMechanics';
import { RotateCcw, Crosshair, Play, Pause, FastForward, Clock, Sliders, X, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface EarthVisualizationProps {
  objects: OrbitalObject[];
  selectedObjectA: OrbitalObject | null;
  selectedObjectB: OrbitalObject | null;
  simulationResult: SimulationResult | null;
  onSelectObject: (obj: OrbitalObject) => void;
  filterRegime: 'ALL' | 'LEO' | 'MEO' | 'GEO';
  filterType: 'ALL' | 'PAYLOAD' | 'DEBRIS' | 'ROCKET_BODY';
  showOrbits: boolean;
  showLabels: boolean;
  showGrid: boolean;
  showBackground: boolean;
  showDebrisBelt?: boolean;
  onTimeUpdate?: (timeSec: number) => void;
  onResetSimulation?: () => void;
  onOpenSimulation?: () => void;
  crisisContext?: {
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
  } | null;
}

export const EarthVisualization: React.FC<EarthVisualizationProps> = ({
  objects,
  selectedObjectA,
  selectedObjectB,
  simulationResult,
  onSelectObject,
  filterRegime,
  filterType,
  showOrbits,
  showLabels,
  showGrid,
  showBackground,
  showDebrisBelt = true,
  onTimeUpdate,
  onResetSimulation,
  onOpenSimulation,
  crisisContext,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredObject, setHoveredObject] = useState<OrbitalObject | null>(null);
  const [cameraMode, setCameraMode] = useState<'FREE' | 'FOCUS_A' | 'GEO' | 'POLAR'>('FREE');
  const [screenLabels, setScreenLabels] = useState<
    { id: string; name: string; catalogId: string; type: string; x: number; y: number; isPrimary: boolean; isSecondary: boolean }[]
  >([]);

  // Simulation Time Controls
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [timeScale, setTimeScale] = useState<number>(60); // 60x default (1 sec = 1 min)
  const [simTimeSec, setSimTimeSec] = useState<number>(0);

  const simTimeSecRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(true);
  const timeScaleRef = useRef<number>(60);
  const simulationResultRef = useRef<SimulationResult | null>(simulationResult);
  const selectedObjectARef = useRef<OrbitalObject | null>(selectedObjectA);
  const selectedObjectBRef = useRef<OrbitalObject | null>(selectedObjectB);

  useEffect(() => {
    simTimeSecRef.current = simTimeSec;
  }, [simTimeSec]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    timeScaleRef.current = timeScale;
  }, [timeScale]);

  useEffect(() => {
    simulationResultRef.current = simulationResult;
    // When simulation is applied, ensure playback is running so user sees the trajectory motion
    if (simulationResult) {
      setIsPlaying(true);
      isPlayingRef.current = true;
    }
  }, [simulationResult]);

  useEffect(() => {
    selectedObjectARef.current = selectedObjectA;
  }, [selectedObjectA]);

  useEffect(() => {
    selectedObjectBRef.current = selectedObjectB;
  }, [selectedObjectB]);

  // Internal Three.js references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const orbitsGroupRef = useRef<THREE.Group | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const gridGroupRef = useRef<THREE.Group | null>(null);
  const debrisBeltGroupRef = useRef<THREE.Group | null>(null);
  const conjunctionGroupRef = useRef<THREE.Group | null>(null);
  const footprintGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Interaction tracking
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraDistanceRef = useRef<number>(24);
  const cameraAnglesRef = useRef<{ theta: number; phi: number }>({ theta: 0.8, phi: 1.1 });
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Scale: Earth radius in Three.js units = 5.0
  const R_SCALE = 5.0;
  const KM_TO_UNIT = R_SCALE / EARTH_RADIUS_KM;

  // Generate crisp procedural scientific Earth texture with vector continents and graticule
  const createScientificEarthTexture = (): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Deep space ocean background
    ctx.fillStyle = '#060d17';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle bathymetry shading
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#040912');
    grad.addColorStop(0.5, '#071220');
    grad.addColorStop(1, '#040912');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Continental landmass paths (simplified high-contrast tactical outlines)
    ctx.fillStyle = '#0f2333';
    ctx.strokeStyle = '#1d425c';
    ctx.lineWidth = 1.5;

    const drawLandmass = (coords: [number, number][]) => {
      ctx.beginPath();
      coords.forEach(([lon, lat], index) => {
        const x = ((lon + 180) / 360) * canvas.width;
        const y = ((90 - lat) / 180) * canvas.height;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    // North America
    drawLandmass([
      [-168, 70], [-140, 70], [-125, 50], [-124, 38], [-117, 32], [-105, 20],
      [-90, 16], [-80, 25], [-81, 30], [-74, 40], [-64, 45], [-55, 50],
      [-60, 60], [-85, 68], [-120, 72], [-168, 70]
    ]);
    // South America
    drawLandmass([
      [-80, 10], [-75, -5], [-70, -20], [-72, -45], [-68, -55], [-60, -50],
      [-48, -28], [-35, -5], [-50, 0], [-60, 8], [-80, 10]
    ]);
    // Eurasia
    drawLandmass([
      [-10, 36], [0, 42], [10, 54], [25, 70], [60, 75], [100, 76],
      [140, 72], [170, 65], [140, 50], [130, 35], [120, 22], [105, 10],
      [100, 20], [80, 15], [70, 25], [50, 28], [35, 32], [28, 41],
      [15, 38], [-5, 36], [-10, 36]
    ]);
    // Africa
    drawLandmass([
      [-17, 15], [-5, 36], [10, 37], [32, 31], [43, 12], [51, 10],
      [40, -10], [30, -32], [18, -34], [12, -15], [8, 4], [-17, 15]
    ]);
    // Australia
    drawLandmass([
      [114, -22], [115, -34], [130, -32], [140, -38], [150, -34],
      [153, -28], [144, -14], [136, -12], [128, -15], [114, -22]
    ]);
    // Antarctica
    drawLandmass([
      [-180, -75], [-120, -78], [-60, -70], [0, -70], [60, -68],
      [120, -72], [180, -75], [180, -90], [-180, -90]
    ]);

    // Reference Coordinate Graticule (every 15 degrees)
    ctx.strokeStyle = '#14293d';
    ctx.lineWidth = 1;

    for (let lat = -75; lat <= 75; lat += 15) {
      const y = ((90 - lat) / 180) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    for (let lon = -180; lon <= 180; lon += 15) {
      const x = ((lon + 180) / 360) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Equator Line (Distinct Cyan)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Greenwich Prime Meridian Line
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  };

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07090e);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition();

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(30, 20, 25);
    scene.add(sunLight);

    // Earth Sphere
    const earthGeometry = new THREE.SphereGeometry(R_SCALE, 64, 64);
    const earthTexture = createScientificEarthTexture();
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.85,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earthMesh);
    earthMeshRef.current = earthMesh;

    // Coordinate Reference Polar Axis Ring
    const gridGroup = new THREE.Group();
    const polarAxisGeo = new THREE.CylinderGeometry(0.02, 0.02, R_SCALE * 2.8, 16);
    const polarAxisMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
    const polarAxis = new THREE.Mesh(polarAxisGeo, polarAxisMat);
    gridGroup.add(polarAxis);

    const equatorRingGeo = new THREE.RingGeometry(R_SCALE * 1.002, R_SCALE * 1.015, 64);
    const equatorRingMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const equatorRing = new THREE.Mesh(equatorRingGeo, equatorRingMat);
    equatorRing.rotation.x = Math.PI / 2;
    gridGroup.add(equatorRing);

    scene.add(gridGroup);
    gridGroupRef.current = gridGroup;

    // 780 km LEO-SSO Debris Hazard Congestion Ring (Cosmos-2251 & Fengyun-1C band)
    const debrisBeltGroup = new THREE.Group();
    const debrisRadius = (EARTH_RADIUS_KM + 780) * KM_TO_UNIT;
    const debrisRingGeo = new THREE.RingGeometry(debrisRadius * 0.994, debrisRadius * 1.016, 80);
    const debrisRingMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.32,
    });
    const debrisRing = new THREE.Mesh(debrisRingGeo, debrisRingMat);
    // Inclined 98.6° representing sun-synchronous debris belt
    debrisRing.rotation.x = (98.6 * Math.PI) / 180;
    debrisBeltGroup.add(debrisRing);

    scene.add(debrisBeltGroup);
    debrisBeltGroupRef.current = debrisBeltGroup;

    // Groups for orbits, markers, and conjunction vectors
    const orbitsGroup = new THREE.Group();
    scene.add(orbitsGroup);
    orbitsGroupRef.current = orbitsGroup;

    const markersGroup = new THREE.Group();
    scene.add(markersGroup);
    markersGroupRef.current = markersGroup;

    const conjunctionGroup = new THREE.Group();
    scene.add(conjunctionGroup);
    conjunctionGroupRef.current = conjunctionGroup;

    const footprintGroup = new THREE.Group();
    scene.add(footprintGroup);
    footprintGroupRef.current = footprintGroup;

    // Animation Render Loop
    let lastTime = performance.now();
    let tickCounter = 0;

    const animate = () => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Advance simulation time if playing
      if (isPlayingRef.current) {
        simTimeSecRef.current += dt * timeScaleRef.current;
        if (simTimeSecRef.current > 7200) {
          simTimeSecRef.current = 0; // Loop 2-hour window
        }
        tickCounter++;
        if (tickCounter % 15 === 0) {
          setSimTimeSec(Math.round(simTimeSecRef.current));
          if (onTimeUpdate) onTimeUpdate(simTimeSecRef.current);
        }
      }

      const currentT = simTimeSecRef.current;

      // Realistic Earth rotation tied to simulation time
      if (earthMeshRef.current) {
        earthMeshRef.current.rotation.y = (currentT * 7.2921159e-5) % (Math.PI * 2);
      }

      // Live update satellite markers positions along orbits!
      if (markersGroupRef.current) {
        markersGroupRef.current.children.forEach((child) => {
          if (child.userData?.isSimulated && simulationResultRef.current) {
            const sp = propagateKeplerian(simulationResultRef.current.modifiedElements, currentT);
            child.position.set(sp.x * KM_TO_UNIT, sp.z * KM_TO_UNIT, -sp.y * KM_TO_UNIT);
          } else {
            const obj = child.userData?.objectData as OrbitalObject;
            if (obj) {
              const p = propagateKeplerian(obj, currentT);
              child.position.set(p.x * KM_TO_UNIT, p.z * KM_TO_UNIT, -p.y * KM_TO_UNIT);
            }
          }
        });
      }

      // Live update dynamic conjunction line position
      if (conjunctionGroupRef.current) {
        const line = conjunctionGroupRef.current.getObjectByName('conjunctionLine') as THREE.Line;
        const objA = selectedObjectARef.current;
        const objB = selectedObjectBRef.current;
        const simRes = simulationResultRef.current;
        if (line && objA && objB) {
          const posA = simRes
            ? propagateKeplerian(simRes.modifiedElements, currentT)
            : propagateKeplerian(objA, currentT);
          const posB = propagateKeplerian(objB, currentT);

          const vA = new THREE.Vector3(posA.x * KM_TO_UNIT, posA.z * KM_TO_UNIT, -posA.y * KM_TO_UNIT);
          const vB = new THREE.Vector3(posB.x * KM_TO_UNIT, posB.z * KM_TO_UNIT, -posB.y * KM_TO_UNIT);

          line.geometry.setFromPoints([vA, vB]);
          line.computeLineDistances();
        }
      }

      // Smooth camera lookAt
      if (cameraRef.current) {
        cameraRef.current.lookAt(targetLookAtRef.current);
      }

      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
      earthTexture.dispose();
      earthGeometry.dispose();
      earthMaterial.dispose();
    };
  }, []);

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi } = cameraAnglesRef.current;
    const dist = cameraDistanceRef.current;

    const x = dist * Math.sin(phi) * Math.sin(theta);
    const y = dist * Math.cos(phi);
    const z = dist * Math.sin(phi) * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(targetLookAtRef.current);
  };

  // Re-render orbits and markers whenever objects or selection change
  useEffect(() => {
    if (!orbitsGroupRef.current || !markersGroupRef.current || !conjunctionGroupRef.current) return;

    while (orbitsGroupRef.current.children.length > 0) {
      const obj = orbitsGroupRef.current.children[0] as THREE.Line;
      if (obj.geometry) obj.geometry.dispose();
      orbitsGroupRef.current.remove(obj);
    }

    while (markersGroupRef.current.children.length > 0) {
      const obj = markersGroupRef.current.children[0] as THREE.Mesh;
      if (obj.geometry) obj.geometry.dispose();
      markersGroupRef.current.remove(obj);
    }

    while (conjunctionGroupRef.current.children.length > 0) {
      const obj = conjunctionGroupRef.current.children[0] as THREE.Mesh;
      if (obj.geometry) obj.geometry.dispose();
      conjunctionGroupRef.current.remove(obj);
    }

    if (footprintGroupRef.current) {
      while (footprintGroupRef.current.children.length > 0) {
        const obj = footprintGroupRef.current.children[0] as THREE.Mesh;
        if (obj.geometry) obj.geometry.dispose();
        footprintGroupRef.current.remove(obj);
      }
    }

    if (gridGroupRef.current) {
      gridGroupRef.current.visible = showGrid;
    }
    if (debrisBeltGroupRef.current) {
      debrisBeltGroupRef.current.visible = showDebrisBelt;
    }

    const filteredObjects = objects.filter((obj) => {
      if (filterRegime !== 'ALL' && obj.regime !== filterRegime) return false;
      if (filterType !== 'ALL' && obj.type !== filterType) return false;
      return true;
    });

    // 1. Draw Orbits
    if (showOrbits) {
      filteredObjects.forEach((obj) => {
        const isObjA = selectedObjectA?.id === obj.id;
        const isObjB = selectedObjectB?.id === obj.id;

        if (!showBackground && !isObjA && !isObjB) return;

        const periodSec = obj.orbitalPeriod * 60;
        const points: THREE.Vector3[] = [];
        const numPoints = 80;

        for (let i = 0; i <= numPoints; i++) {
          const t = (i / numPoints) * periodSec;
          const pos = propagateKeplerian(obj, t);
          points.push(new THREE.Vector3(pos.x * KM_TO_UNIT, pos.z * KM_TO_UNIT, -pos.y * KM_TO_UNIT));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        let color = 0x1e3a5f;
        let opacity = 0.25;

        if (isObjA) {
          color = 0x06b6d4; // Cyan
          opacity = 0.95;
        } else if (isObjB) {
          color = 0xf59e0b; // Amber
          opacity = 0.95;
        } else if (obj.type === 'DEBRIS') {
          color = 0xef4444;
          opacity = 0.2;
        } else if (obj.type === 'ROCKET_BODY') {
          color = 0xf97316;
          opacity = 0.2;
        }

        const material = new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity,
        });

        const orbitLine = new THREE.Line(geometry, material);
        orbitsGroupRef.current?.add(orbitLine);
      });
    }

    // 2. Draw Modified Orbit in Simulation
    if (simulationResult && showOrbits) {
      const simElements = simulationResult.modifiedElements;
      const periodSec = simElements.orbitalPeriod * 60;
      const points: THREE.Vector3[] = [];
      const numPoints = 120;

      for (let i = 0; i <= numPoints; i++) {
        const t = (i / numPoints) * periodSec;
        const pos = propagateKeplerian(simElements, t);
        points.push(new THREE.Vector3(pos.x * KM_TO_UNIT, pos.z * KM_TO_UNIT, -pos.y * KM_TO_UNIT));
      }

      const simGeo = new THREE.BufferGeometry().setFromPoints(points);
      const simMat = new THREE.LineDashedMaterial({
        color: 0x10b981,
        dashSize: 0.35,
        gapSize: 0.15,
      });
      const simLine = new THREE.Line(simGeo, simMat);
      simLine.computeLineDistances();
      orbitsGroupRef.current?.add(simLine);

      // Add a dedicated simulated evasive satellite marker moving along this new orbit!
      const simPos = propagateKeplerian(simElements, simTimeSecRef.current);
      const simMarkerPos = new THREE.Vector3(simPos.x * KM_TO_UNIT, simPos.z * KM_TO_UNIT, -simPos.y * KM_TO_UNIT);

      const simMarkerGeo = new THREE.SphereGeometry(0.34, 16, 16);
      const simMarkerMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const simMarkerMesh = new THREE.Mesh(simMarkerGeo, simMarkerMat);
      simMarkerMesh.position.copy(simMarkerPos);
      simMarkerMesh.userData = {
        isSimulated: true,
        objectData: {
          ...selectedObjectA,
          ...simElements,
          name: `${selectedObjectA?.name || 'Asset'} (Simulated Evasive Maneuver)`,
        },
      };
      markersGroupRef.current?.add(simMarkerMesh);

      // Pulsing emerald target reticle ring
      const simRingGeo = new THREE.RingGeometry(0.34 * 1.5, 0.34 * 1.9, 24);
      const simRingMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
      });
      const simRingMesh = new THREE.Mesh(simRingGeo, simRingMat);
      simRingMesh.position.copy(simMarkerPos);
      simRingMesh.lookAt(new THREE.Vector3(0, 0, 0));
      markersGroupRef.current?.add(simRingMesh);
    }

    // 3. Draw Object Markers
    filteredObjects.forEach((obj) => {
      const isObjA = selectedObjectA?.id === obj.id;
      const isObjB = selectedObjectB?.id === obj.id;

      if (!showBackground && !isObjA && !isObjB) return;

      const pos = propagateKeplerian(obj, simTimeSecRef.current);
      const markerPos = new THREE.Vector3(pos.x * KM_TO_UNIT, pos.z * KM_TO_UNIT, -pos.y * KM_TO_UNIT);

      let markerSize = isObjA || isObjB ? 0.30 : obj.type === 'ROCKET_BODY' ? 0.16 : obj.type === 'DEBRIS' ? 0.13 : 0.09;
      let markerColor = 0x38bdf8;

      if (isObjA) markerColor = simulationResult ? 0x0284c7 : 0x06b6d4; // Cyan Protected Asset (dimmed if simulation is displaying new evasive satellite)
      else if (isObjB) markerColor = 0xf43f5e; // Rose Debris Hazard
      else if (obj.type === 'DEBRIS') markerColor = 0xef4444; // Debris Crimson
      else if (obj.type === 'ROCKET_BODY') markerColor = 0xf59e0b; // Rocket Body Amber

      const markerGeo = new THREE.SphereGeometry(markerSize, 12, 12);
      const markerMat = new THREE.MeshBasicMaterial({ color: markerColor });
      const markerMesh = new THREE.Mesh(markerGeo, markerMat);
      markerMesh.position.copy(markerPos);
      markerMesh.userData = { objectData: obj };
      markersGroupRef.current?.add(markerMesh);

      // Add target reticle ring around selected objects
      if (isObjA || isObjB) {
        const ringGeo = new THREE.RingGeometry(markerSize * 1.5, markerSize * 1.85, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: isObjA ? 0x06b6d4 : 0xf43f5e,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.copy(markerPos);
        ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
        markersGroupRef.current?.add(ringMesh);
      }
    });

    // 4. Conjunction Line between Object A and B
    if (selectedObjectA && selectedObjectB) {
      const posA = simulationResult
        ? propagateKeplerian(simulationResult.modifiedElements, simTimeSecRef.current)
        : propagateKeplerian(selectedObjectA, simTimeSecRef.current);
      const posB = propagateKeplerian(selectedObjectB, simTimeSecRef.current);

      const vA = new THREE.Vector3(posA.x * KM_TO_UNIT, posA.z * KM_TO_UNIT, -posA.y * KM_TO_UNIT);
      const vB = new THREE.Vector3(posB.x * KM_TO_UNIT, posB.z * KM_TO_UNIT, -posB.y * KM_TO_UNIT);

      const lineGeo = new THREE.BufferGeometry().setFromPoints([vA, vB]);
      const lineMat = new THREE.LineDashedMaterial({
        color: simulationResult ? 0x10b981 : 0xf43f5e,
        dashSize: 0.15,
        gapSize: 0.1,
      });
      const connLine = new THREE.Line(lineGeo, lineMat);
      connLine.name = 'conjunctionLine';
      connLine.computeLineDistances();
      conjunctionGroupRef.current?.add(connLine);
    }

    // 4b. Draw 3D Ground Footprint & Satellite Projection Beam (Crisis Mode)
    if (crisisContext?.active && crisisContext.earthImpact && footprintGroupRef.current) {
      const { centerLat, centerLon, swathRadiusKm, coverageStatus } = crisisContext.earthImpact;
      const latRad = (centerLat * Math.PI) / 180;
      const lonRad = (centerLon * Math.PI) / 180;

      // Position on Earth surface (radius R_SCALE, matching texture alignment)
      const sphereR = R_SCALE * 1.003;
      const fx = sphereR * Math.cos(latRad) * Math.sin(lonRad);
      const fy = sphereR * Math.sin(latRad);
      const fz = -sphereR * Math.cos(latRad) * Math.cos(lonRad);
      const centerVec = new THREE.Vector3(fx, fy, fz);

      const footprintRadiusUnit = (swathRadiusKm / EARTH_RADIUS_KM) * R_SCALE;

      let footprintColor = 0x06b6d4; // Cyan Nominal
      if (coverageStatus === 'TEMPORARY_OUTAGE') footprintColor = 0xf59e0b; // Amber
      else if (coverageStatus === 'PERMANENT_LOSS') footprintColor = 0xef4444; // Crimson Red

      // Translucent ground footprint circular disc
      const discGeo = new THREE.CircleGeometry(footprintRadiusUnit, 32);
      const discMat = new THREE.MeshBasicMaterial({
        color: footprintColor,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const discMesh = new THREE.Mesh(discGeo, discMat);
      discMesh.position.copy(centerVec);
      discMesh.lookAt(new THREE.Vector3(0, 0, 0));
      footprintGroupRef.current.add(discMesh);

      // Outer border perimeter ring
      const ringGeo = new THREE.RingGeometry(footprintRadiusUnit * 0.95, footprintRadiusUnit, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: footprintColor,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(centerVec);
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
      footprintGroupRef.current.add(ringMesh);

      // Downward projection sensor beam from primary satellite to ground footprint
      if (selectedObjectA) {
        const satPos = simulationResult
          ? propagateKeplerian(simulationResult.modifiedElements, simTimeSecRef.current)
          : propagateKeplerian(selectedObjectA, simTimeSecRef.current);
        const satVec = new THREE.Vector3(satPos.x * KM_TO_UNIT, satPos.z * KM_TO_UNIT, -satPos.y * KM_TO_UNIT);

        const beamGeo = new THREE.BufferGeometry().setFromPoints([satVec, centerVec]);
        const beamMat = new THREE.LineDashedMaterial({
          color: footprintColor,
          dashSize: 0.25,
          gapSize: 0.15,
          transparent: true,
          opacity: coverageStatus === 'PERMANENT_LOSS' ? 0.3 : 0.75,
        });
        const beamLine = new THREE.Line(beamGeo, beamMat);
        beamLine.computeLineDistances();
        footprintGroupRef.current.add(beamLine);
      }
    }

    // 5. Update Screen Labels
    const container = mountRef.current;
    if (showLabels && cameraRef.current && container) {
      const labels: typeof screenLabels = [];
      const cam = cameraRef.current;
      const w = container.clientWidth;
      const h = container.clientHeight;

      const targetLabelObjects = filteredObjects.filter((o) => {
        if (selectedObjectA?.id === o.id || selectedObjectB?.id === o.id) return true;
        return [
          'iss-25544',
          'norad-25544',
          'tiangong-48274',
          'norad-48274',
          'hubble-20580',
          'norad-20580',
          'cosmos-2251-deb',
          'envisat-27386',
        ].includes(o.id);
      });

      targetLabelObjects.forEach((obj) => {
        const isPrimary = selectedObjectA?.id === obj.id;
        const isSecondary = selectedObjectB?.id === obj.id;
        const pos = propagateKeplerian(obj, simTimeSecRef.current);
        const v = new THREE.Vector3(pos.x * KM_TO_UNIT, pos.z * KM_TO_UNIT, -pos.y * KM_TO_UNIT);

        v.project(cam);
        if (v.z < 1) {
          const x = ((v.x + 1) * w) / 2;
          const y = ((-v.y + 1) * h) / 2;
          if (x > 20 && x < w - 20 && y > 20 && y < h - 20) {
            labels.push({
              id: obj.id,
              name: obj.name,
              catalogId: obj.catalogId,
              type: obj.type,
              x,
              y,
              isPrimary,
              isSecondary,
            });
          }
        }
      });
      setScreenLabels(labels);
    } else {
      setScreenLabels([]);
    }
  }, [
    objects,
    selectedObjectA,
    selectedObjectB,
    simulationResult,
    filterRegime,
    filterType,
    showOrbits,
    showGrid,
    showBackground,
    showLabels,
    crisisContext,
  ]);

  // Mouse Interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      cameraAnglesRef.current.theta -= deltaX * 0.006;
      cameraAnglesRef.current.phi = Math.max(0.08, Math.min(Math.PI - 0.08, cameraAnglesRef.current.phi - deltaY * 0.006));

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
      updateCameraPosition();
      setCameraMode('FREE');
    }

    const container = mountRef.current;
    if (!container || !cameraRef.current || !markersGroupRef.current) return;

    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 0.3 };
    raycaster.setFromCamera(mouse, cameraRef.current);

    const intersects = raycaster.intersectObjects(markersGroupRef.current.children);
    if (intersects.length > 0 && intersects[0].object.userData.objectData) {
      setHoveredObject(intersects[0].object.userData.objectData);
    } else {
      setHoveredObject(null);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    cameraDistanceRef.current = Math.max(7.0, Math.min(50.0, cameraDistanceRef.current + e.deltaY * 0.015));
    updateCameraPosition();
  };

  const handleClick = (e: React.MouseEvent) => {
    const container = mountRef.current;
    if (!container || !cameraRef.current || !markersGroupRef.current) return;

    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const intersects = raycaster.intersectObjects(markersGroupRef.current.children);
    if (intersects.length > 0 && intersects[0].object.userData.objectData) {
      onSelectObject(intersects[0].object.userData.objectData);
    }
  };

  // Camera Presets
  const resetCamera = () => {
    cameraAnglesRef.current = { theta: 0.8, phi: 1.1 };
    cameraDistanceRef.current = 24;
    targetLookAtRef.current.set(0, 0, 0);
    updateCameraPosition();
    setCameraMode('FREE');
  };

  const focusObjectA = () => {
    if (!selectedObjectA) return;
    const pos = propagateKeplerian(selectedObjectA, simTimeSecRef.current);
    const target = new THREE.Vector3(pos.x * KM_TO_UNIT, pos.z * KM_TO_UNIT, -pos.y * KM_TO_UNIT);
    targetLookAtRef.current.copy(target);
    cameraDistanceRef.current = 11;
    updateCameraPosition();
    setCameraMode('FOCUS_A');
  };

  const setPolarView = () => {
    cameraAnglesRef.current = { theta: 0, phi: 0.08 };
    cameraDistanceRef.current = 26;
    targetLookAtRef.current.set(0, 0, 0);
    updateCameraPosition();
    setCameraMode('POLAR');
  };

  const setGeoView = () => {
    cameraAnglesRef.current = { theta: 0, phi: Math.PI / 2 };
    cameraDistanceRef.current = 42;
    targetLookAtRef.current.set(0, 0, 0);
    updateCameraPosition();
    setCameraMode('GEO');
  };

  // Format seconds to mm:ss
  const formatSimTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    return `+${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <div className="relative w-full h-full min-h-[460px] bg-[#07090e] select-none overflow-hidden border border-slate-800/80 rounded-lg">
      {/* 3D WebGL Canvas Mount */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
      />

      {/* Top Left: Operational HUD Coordinates */}
      <div className="absolute top-3 left-3 pointer-events-none flex flex-col gap-1 text-[11px] text-slate-400 font-mono-tabular">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-semibold tracking-wider">3D ORBITAL VIEWPORT</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 flex items-center gap-1 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE FLIGHT SIM
          </span>
        </div>
        <div className="text-slate-500">
          ALTITUDE: {((cameraDistanceRef.current - R_SCALE) * (EARTH_RADIUS_KM / R_SCALE)).toFixed(0)} km · FOV: 45°
        </div>
      </div>

      {/* Active Crisis Earth Impact Swath HUD Banner */}
      {crisisContext?.active && crisisContext.earthImpact && !simulationResult && (
        <div className="absolute top-16 left-3 right-3 sm:right-auto sm:max-w-md bg-[#090f1d]/95 border border-cyan-500/80 backdrop-blur-md rounded-lg p-3 text-xs shadow-2xl z-30 font-sans">
          <div className="flex items-center justify-between gap-2 border-b border-cyan-900/80 pb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-bold text-cyan-200 text-xs">
                3D EARTH COVERAGE SWATH
              </span>
            </div>
            <span
              className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                crisisContext.earthImpact.coverageStatus === 'PERMANENT_LOSS'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : crisisContext.earthImpact.coverageStatus === 'TEMPORARY_OUTAGE'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {crisisContext.earthImpact.coverageStatus === 'PERMANENT_LOSS'
                ? 'COVERAGE BLACKOUT'
                : crisisContext.earthImpact.coverageStatus === 'TEMPORARY_OUTAGE'
                ? '45M SLEW OUTAGE'
                : '100% NOMINAL SWATH'}
            </span>
          </div>

          <div className="mt-2 space-y-1 text-slate-300">
            <div className="font-semibold text-slate-100 text-xs">
              {crisisContext.earthImpact.serviceName}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Region: <strong className="text-cyan-300">{crisisContext.earthImpact.regionName}</strong></span>
              <span className="font-mono text-emerald-300">{crisisContext.earthImpact.affectedPopulationEst}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1 pt-1 border-t border-slate-800 flex items-center justify-between">
              <span>Footprint Radius: {crisisContext.earthImpact.swathRadiusKm} km</span>
              <span className="text-cyan-400/90">[HYPOTHETICAL MODEL]</span>
            </div>
          </div>
        </div>
      )}

      {/* Active Simulation HUD Overlay Banner */}
      {simulationResult && (
        <div className="absolute top-16 left-3 right-3 sm:right-auto sm:max-w-md bg-emerald-950/95 border border-emerald-500/80 backdrop-blur-md rounded-lg p-3 text-xs shadow-2xl z-30">
          <div className="flex items-center justify-between gap-2 border-b border-emerald-800/80 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="font-mono text-emerald-300 font-bold uppercase tracking-wider text-[11px] truncate">
                EVASIVE SIMULATION RUNNING
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {onOpenSimulation && (
                <button
                  onClick={onOpenSimulation}
                  className="px-2 py-0.5 rounded bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 text-[10px] font-mono transition-colors cursor-pointer"
                  title="Modify altitude or inclination burn parameters"
                >
                  Adjust
                </button>
              )}
              {onResetSimulation && (
                <button
                  onClick={onResetSimulation}
                  className="px-2 py-0.5 rounded bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono transition-colors cursor-pointer"
                  title="Reset to baseline nominal trajectory"
                >
                  Exit
                </button>
              )}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[10px]">
            <div>
              <span className="text-emerald-400/80 block uppercase text-[9px]">Target Asset</span>
              <span className="text-slate-100 font-semibold truncate block">
                {selectedObjectA?.name || 'Primary Satellite'}
              </span>
              <span className="text-emerald-400 font-mono text-[9px]">Simulating Evasive Shift</span>
            </div>
            <div>
              <span className="text-emerald-400/80 block uppercase text-[9px]">Burn Maneuver</span>
              <span className="text-cyan-300 font-bold">
                Δh: {simulationResult.modifiedElements.altitude - (selectedObjectA?.altitude || 0) > 0 ? '+' : ''}
                {(simulationResult.modifiedElements.altitude - (selectedObjectA?.altitude || 0)).toFixed(0)} km
              </span>
              <span className="text-[9px] text-slate-300 block font-normal">
                Δv: {simulationResult.deltaV.toFixed(1)} m/s
              </span>
            </div>
            <div>
              <span className="text-emerald-400/80 block uppercase text-[9px]">Clearance Achieved</span>
              <span className="text-emerald-300 font-bold">
                {simulationResult.conjunctionImpact
                  ? `${simulationResult.conjunctionImpact.newMinSeparation.toFixed(1)} km`
                  : 'SAFE'}
              </span>
              <span className="text-[9px] text-emerald-400 block font-normal">Hazard Cleared</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Right: Camera Presets */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 p-1 bg-slate-900/85 backdrop-blur-sm border border-slate-800 rounded-md">
        <button
          onClick={resetCamera}
          title="Reset View"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={focusObjectA}
          disabled={!selectedObjectA}
          title="Focus Selected Object"
          className={`p-1.5 rounded transition-colors ${
            selectedObjectA
              ? 'text-cyan-400 hover:bg-slate-800 hover:text-cyan-300'
              : 'text-slate-600 cursor-not-allowed'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={setPolarView}
          title="Polar Inclination View"
          className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
            cameraMode === 'POLAR' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/50' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          POLAR
        </button>
        <button
          onClick={setGeoView}
          title="Geostationary Arc View"
          className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
            cameraMode === 'GEO' ? 'bg-purple-950 text-purple-300 border border-purple-700/50' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          GEO
        </button>
      </div>

      {/* Dynamic 2D Screen Space Labels */}
      {showLabels &&
        screenLabels.map((lbl) => (
          <div
            key={lbl.id}
            style={{ left: `${lbl.x}px`, top: `${lbl.y}px` }}
            className={`absolute pointer-events-none -translate-x-1/2 -translate-y-8 px-1.5 py-0.5 rounded border text-[9px] font-mono whitespace-nowrap shadow-md ${
              lbl.isPrimary
                ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/80 font-bold z-20'
                : lbl.isSecondary
                ? 'bg-amber-950/90 text-amber-300 border-amber-500/80 font-bold z-20'
                : lbl.type === 'DEBRIS'
                ? 'bg-slate-950/70 text-rose-300 border-rose-900/60 z-10'
                : lbl.type === 'ROCKET_BODY'
                ? 'bg-slate-950/70 text-amber-300 border-amber-900/60 z-10'
                : 'bg-slate-950/70 text-slate-300 border-slate-800 z-10'
            }`}
          >
            <div className="flex items-center gap-1">
              <span>{lbl.name}</span>
              <span className="opacity-60 text-[8px]">#{lbl.catalogId}</span>
            </div>
          </div>
        ))}

      {/* Floating Hover Card */}
      {hoveredObject && (
        <div className="absolute bottom-16 left-4 pointer-events-none p-2.5 bg-slate-950/90 backdrop-blur border border-slate-700/80 rounded-md shadow-lg text-xs max-w-xs z-30">
          <div className="font-semibold text-slate-100 flex items-center justify-between gap-3">
            <span>{hoveredObject.name}</span>
            <span className="font-mono text-cyan-400 text-[10px]">#{hoveredObject.catalogId}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400 font-mono-tabular">
            <span>{hoveredObject.type}</span>
            <span>·</span>
            <span>{hoveredObject.altitude} km</span>
            <span>·</span>
            <span>{hoveredObject.inclination}°</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 truncate">{hoveredObject.operator}</div>
        </div>
      )}

      {/* Interactive Orbital Flight Time Controller HUD */}
      <div className="absolute bottom-3 left-3 right-3 bg-[#090e1a]/90 backdrop-blur-md border border-slate-800 px-3 py-2 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs z-30 shadow-xl">
        {/* Play/Pause & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 rounded transition-colors"
            title={isPlaying ? 'Pause Motion' : 'Play Motion'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => {
              simTimeSecRef.current = 0;
              setSimTimeSec(0);
            }}
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded font-mono text-[10px]"
          >
            NOW (T+0)
          </button>

          {/* Speed Multipliers */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 border border-slate-800 rounded text-[10px] font-mono">
            {[1, 10, 60, 300].map((s) => (
              <button
                key={s}
                onClick={() => setTimeScale(s)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  timeScale === s
                    ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/60'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Time Slider Scrubber */}
        <div className="flex-1 flex items-center gap-2 max-w-md mx-2">
          <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <input
            type="range"
            min="0"
            max="7200"
            step="10"
            value={simTimeSec}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              simTimeSecRef.current = val;
              setSimTimeSec(val);
            }}
            className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="font-mono text-[11px] text-cyan-300 whitespace-nowrap min-w-[70px] text-right">
            {formatSimTime(simTimeSec)}
          </span>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>OBJ A</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>OBJ B</span>
          </div>
        </div>
      </div>
    </div>
  );
};
