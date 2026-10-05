import React, { useState, useEffect, useRef } from 'react';
import {
  CrisisScenario,
  PerspectiveRole,
  UserCrisisDecisionType,
  HaloChatMessage,
  BranchOutcome,
} from '../types/crisis';
import {
  createDefaultCrisisScenario,
  generateAlternativeCrisis,
  advanceCrisisTime,
  applyCrisisDecision,
} from '../utils/crisisEngine';
import { SimulationResult, OrbitalObject } from '../types/orbital';
import { simulateOrbitModification } from '../utils/orbitalMechanics';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Clock,
  Radio,
  Send,
  MessageSquare,
  Users,
  Compass,
  Globe,
  Layers,
  Sparkles,
  Star,
  CheckCircle2,
  ChevronRight,
  Info,
  HelpCircle,
  Eye,
  Sliders,
  ExternalLink,
  Flame,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface OrbitalCrisisSimulatorProps {
  onSelectPair: (objA: OrbitalObject, objB: OrbitalObject) => void;
  onApplySimulation: (result: SimulationResult | null) => void;
  onOpenSimulationModal: () => void;
  onSwitchToGlobe: () => void;
  onUpdateCrisisVisual: (crisis: CrisisScenario | null) => void;
}

export const OrbitalCrisisSimulator: React.FC<OrbitalCrisisSimulatorProps> = ({
  onSelectPair,
  onApplySimulation,
  onOpenSimulationModal,
  onSwitchToGlobe,
  onUpdateCrisisVisual,
}) => {
  // Active Crisis Scenario
  const [crisis, setCrisis] = useState<CrisisScenario>(() => createDefaultCrisisScenario(false));
  const [activeTab, setActiveTab] = useState<'DECISION_BRANCHES' | 'HALO_CHAT' | 'PERSPECTIVES_PANEL' | 'EARTH_IMPACT' | 'TRACKING_LOG'>('DECISION_BRANCHES');
  const [selectedPerspective, setSelectedPerspective] = useState<PerspectiveRole>('HALO');

  // HALO Chat State
  const [chatMessages, setChatMessages] = useState<HaloChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Judge / Demo Mode Stepper
  const [isJudgeMode, setIsJudgeMode] = useState<boolean>(false);
  const [judgeStep, setJudgeStep] = useState<number>(1); // 1 to 7

  // Generating new crisis loading
  const [isGeneratingCrisis, setIsGeneratingCrisis] = useState<boolean>(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const notify = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  // Sync crisis visual context with App & 3D Globe
  useEffect(() => {
    onUpdateCrisisVisual(crisis);
    onSelectPair(crisis.primaryAsset, crisis.secondaryHazard);
  }, [crisis]);

  // Initial welcome message in chat
  useEffect(() => {
    const welcomeMsg: HaloChatMessage = {
      id: 'msg-welcome',
      senderRole: 'HALO',
      senderName: 'HALO AI Operations',
      timestamp: new Date().toLocaleTimeString(),
      content: `HALO Online. Conjunction emergency detected between ${crisis.primaryAsset.name} and ${crisis.secondaryHazard.name}. Time to closest approach is ${(crisis.currentClockMinutes / 60).toFixed(1)} hours with a nominal miss distance of ${crisis.currentMissDistanceMeters.toFixed(1)}m. Collision probability is ${(crisis.collisionProbability * 100).toFixed(2)}%. How would you like to proceed?`,
      suggestedFollowUps: [
        "What's happening?",
        "Should we maneuver?",
        "What information are we missing?",
        "What happens if we wait?",
        "Explain the orbital mechanics.",
      ],
    };
    setChatMessages([welcomeMsg]);
  }, [crisis.id]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Clock Countdown Timer Effect
  useEffect(() => {
    if (!crisis.isClockRunning) return;

    const interval = setInterval(() => {
      setCrisis((prev) => {
        if (prev.currentClockMinutes <= 0) return prev;
        // In real seconds, decrement clock by (timeScale / 60) minutes
        const decrement = (prev.timeScale / 60) * 0.5;
        const nextMin = Math.max(0, prev.currentClockMinutes - decrement);
        return { ...prev, currentClockMinutes: nextMin };
      });
    }, 500);

    return () => clearInterval(interval);
  }, [crisis.isClockRunning, crisis.timeScale]);

  // Handler: Generate Crisis via Gemini backend
  const handleGenerateCrisis = async (type: 'RANDOM' | 'JUDGE' | 'MEGA' | 'CREWED') => {
    setIsGeneratingCrisis(true);
    notify('Gemini AI generating structured orbital emergency...');

    try {
      if (type === 'JUDGE') {
        const scenario = createDefaultCrisisScenario(true);
        setCrisis(scenario);
        setIsJudgeMode(true);
        setJudgeStep(1);
        notify('Judge Demo Scenario loaded. Follow guided steps 1–7.');
        setIsGeneratingCrisis(false);
        return;
      }

      if (type === 'MEGA') {
        const scenario = generateAlternativeCrisis('STARLINK_CONSTELLATION');
        setCrisis(scenario);
        setIsJudgeMode(false);
        notify('Loaded Starlink Broadband vs ASAT Debris crisis.');
        setIsGeneratingCrisis(false);
        return;
      }

      if (type === 'CREWED') {
        const scenario = generateAlternativeCrisis('CREWED_STATION');
        setCrisis(scenario);
        setIsJudgeMode(false);
        notify('Loaded Crewed Research Habitat vs Centaur Stage crisis.');
        setIsGeneratingCrisis(false);
        return;
      }

      // Default / Random: Call Gemini API endpoint
      const res = await fetch('/api/generate-crisis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioType: 'RANDOM' }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data && data.data.title) {
          const generated = createDefaultCrisisScenario(false);
          // Enrich with Gemini-generated narrative & parameters
          generated.title = data.data.title;
          generated.codeName = data.data.codeName || generated.codeName;
          if (data.data.primaryAsset?.name) generated.primaryAsset.name = data.data.primaryAsset.name;
          if (data.data.primaryAsset?.missionRole) generated.primaryAsset.missionRole = data.data.primaryAsset.missionRole;
          if (data.data.primaryAsset?.criticalService) generated.primaryAsset.criticalService = data.data.primaryAsset.criticalService;
          if (data.data.secondaryHazard?.name) generated.secondaryHazard.name = data.data.secondaryHazard.name;
          if (data.data.perspectives) {
            generated.perspectives.missionAnalyst.quote = data.data.perspectives.missionAnalyst?.quote || generated.perspectives.missionAnalyst.quote;
            generated.perspectives.satelliteOperator.quote = data.data.perspectives.satelliteOperator?.quote || generated.perspectives.satelliteOperator.quote;
            generated.perspectives.sustainabilityAnalyst.quote = data.data.perspectives.sustainabilityAnalyst?.quote || generated.perspectives.sustainabilityAnalyst.quote;
            generated.perspectives.independentReviewer.quote = data.data.perspectives.independentReviewer?.quote || generated.perspectives.independentReviewer.quote;
          }
          setCrisis(generated);
          notify(`Generated: ${generated.title}`);
        } else {
          // Fallback to built-in generator
          const scenario = createDefaultCrisisScenario(false);
          setCrisis(scenario);
          notify('Loaded high-fidelity astrodynamic crisis scenario.');
        }
      } else {
        const scenario = createDefaultCrisisScenario(false);
        setCrisis(scenario);
        notify('Loaded crisis scenario (deterministic astrodynamic engine).');
      }
    } catch (err) {
      console.warn('Crisis generation error:', err);
      const scenario = createDefaultCrisisScenario(false);
      setCrisis(scenario);
      notify('Loaded astrodynamic crisis scenario.');
    } finally {
      setIsGeneratingCrisis(false);
    }
  };

  // Handler: Advance Timeline
  const handleAdvanceTime = (minutes: number) => {
    const updated = advanceCrisisTime(crisis, minutes);
    setCrisis(updated);
    notify(`Timeline advanced by +${minutes} minutes. New observations generated.`);
  };

  // Handler: User Decisions
  const handleApplyDecision = (decisionType: UserCrisisDecisionType) => {
    const updated = applyCrisisDecision(crisis, decisionType);
    setCrisis(updated);

    if (decisionType === 'RUN_AVOIDANCE') {
      // Formulate simulation result and apply to visualizer!
      const simParams = {
        altitudeDeltaKm: 2.8,
        inclinationDeltaDeg: 0.0,
        eccentricityDelta: 0.0003,
        simulationDurationMin: 120,
        timeStepSec: 30,
      };
      const result = simulateOrbitModification(crisis.primaryAsset, simParams, crisis.secondaryHazard);
      onApplySimulation(result);
      notify('Clearance burn uploaded. New trajectory loaded into 3D Debris Radar.');
    } else if (decisionType === 'COORDINATE_OPERATOR') {
      const simParams = {
        altitudeDeltaKm: 1.2,
        inclinationDeltaDeg: 0.02,
        eccentricityDelta: 0.0,
        simulationDurationMin: 120,
        timeStepSec: 30,
      };
      const result = simulateOrbitModification(crisis.primaryAsset, simParams, crisis.secondaryHazard);
      onApplySimulation(result);
      notify('Bilateral coordination confirmed. Phased trajectory active.');
    } else if (decisionType === 'WAIT_MORE_DATA') {
      notify('Decision window postponed by 2 hours. Observation pass acquired.');
    } else if (decisionType === 'REQUEST_TRACKING') {
      notify('Space Fence & LeoLabs tasked. Uncertainty covariance reduced by 60%.');
    }
  };

  // Handler: Send Message in HALO Chat
  const handleSendMessage = async (customText?: string) => {
    const query = (customText || chatInput).trim();
    if (!query) return;

    const userMsg: HaloChatMessage = {
      id: `msg-user-${Date.now()}`,
      senderRole: 'HALO',
      senderName: 'Flight Director (You)',
      timestamp: new Date().toLocaleTimeString(),
      content: query,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!customText) setChatInput('');
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/crisis-halo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crisis,
          role: selectedPerspective,
          messages: [...chatMessages, userMsg],
          userQuery: query,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        let speakerName = 'HALO AI';
        if (selectedPerspective === 'MISSION_ANALYST') speakerName = crisis.perspectives.missionAnalyst.name;
        else if (selectedPerspective === 'SATELLITE_OPERATOR') speakerName = crisis.perspectives.satelliteOperator.name;
        else if (selectedPerspective === 'SUSTAINABILITY') speakerName = crisis.perspectives.sustainabilityAnalyst.name;
        else if (selectedPerspective === 'INDEPENDENT_REVIEWER') speakerName = crisis.perspectives.independentReviewer.name;

        const aiMsg: HaloChatMessage = {
          id: `msg-ai-${Date.now()}`,
          senderRole: selectedPerspective,
          senderName: speakerName,
          timestamp: new Date().toLocaleTimeString(),
          content: data.reply || 'Observation logged. Telemetry confirms stable tracking.',
        };
        setChatMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err) {
      console.warn('HALO chat error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Format TCA countdown display
  const hoursRemaining = Math.floor(crisis.currentClockMinutes / 60);
  const minutesRemaining = Math.floor(crisis.currentClockMinutes % 60);
  const secondsRemaining = Math.floor((crisis.currentClockMinutes * 60) % 60);

  return (
    <div className="flex flex-col h-full bg-[#070b13] border border-slate-800 rounded-lg overflow-hidden select-none shadow-2xl text-slate-100">
      {/* Action Notification Toast */}
      {noticeMessage && (
        <div className="bg-cyan-950 border-b border-cyan-700/80 px-4 py-2 text-xs font-mono text-cyan-200 flex items-center justify-between animate-fadeIn z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{noticeMessage}</span>
          </div>
          <button
            onClick={() => setNoticeMessage(null)}
            className="text-cyan-400 hover:text-cyan-200 ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner: Emergency Title, Live Countdown, and Main Generation Controls */}
      <div className="bg-[#090e1a] border-b border-slate-800 p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-rose-950/80 border border-rose-600/80 rounded-lg text-rose-400 shrink-0 shadow-lg shadow-rose-950/60 animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700 font-bold uppercase tracking-wider">
                {crisis.riskLevel} CONJUNCTION ALERT
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700">
                {crisis.codeName}
              </span>
              <span className="text-[9px] font-mono text-amber-400/90 hidden lg:inline">
                [SIMULATED CONJUNCTION MODEL // HYPOTHETICAL CRISIS]
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-slate-100 mt-1 leading-snug">
              {crisis.title}
            </h1>
            <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
              <span>Primary: <strong className="text-cyan-300">{crisis.primaryAsset.name}</strong></span>
              <span>·</span>
              <span>Hazard: <strong className="text-rose-300">{crisis.secondaryHazard.name}</strong></span>
              <span>·</span>
              <span>Rel Velocity: <strong className="text-amber-300 font-mono">{crisis.relativeVelocityKmS} km/s</strong></span>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons: GENERATE CRISIS & JUDGE MODE */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleGenerateCrisis('JUDGE')}
            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
              isJudgeMode
                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-amber-950/50'
                : 'bg-slate-850 hover:bg-slate-800 text-amber-300 border border-amber-500/50 hover:border-amber-400'
            }`}
            title="Launch streamlined 3–5 minute step-by-step Crisis Walkthrough for judges"
          >
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>JUDGE MODE (3-5 MIN)</span>
          </button>

          <div className="relative group">
            <button
              onClick={() => handleGenerateCrisis('RANDOM')}
              disabled={isGeneratingCrisis}
              className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-950 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>{isGeneratingCrisis ? 'GENERATING CRISIS...' : 'GENERATE CRISIS'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Judge Mode Interactive Guidance Stepper (Visible when Judge Mode is enabled) */}
      {isJudgeMode && (
        <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-950 border-b border-amber-600/60 p-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-mono font-bold text-[10px] rounded uppercase">
                Step {judgeStep} of 7
              </span>
              <span className="font-semibold text-amber-200">
                {judgeStep === 1 && '1. CRISIS INITIATION — Inspect 78m close approach & high Pc.'}
                {judgeStep === 2 && '2. WATCH IT EVOLVE — Advance time by +2 hours & observe new radar track.'}
                {judgeStep === 3 && '3. QUESTION HALO AI — Ask "Should we maneuver?" in the chat panel.'}
                {judgeStep === 4 && '4. HEAR CONFLICTING PERSPECTIVES — See Dr. Vance & Cmdr. Thorne clash.'}
                {judgeStep === 5 && '5. MAKE A DECISION — Choose "RUN AVOIDANCE MANEUVER" or "COORDINATE".'}
                {judgeStep === 6 && '6. BRANCHING FUTURES — Compare Original Trajectory vs Alternative Burn.'}
                {judgeStep === 7 && '7. 3D EARTH IMPACT — Inspect coastal cyclone early warning coverage footprint.'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  if (judgeStep === 1) {
                    setJudgeStep(2);
                    setActiveTab('DECISION_BRANCHES');
                  } else if (judgeStep === 2) {
                    handleAdvanceTime(120);
                    setJudgeStep(3);
                    setActiveTab('HALO_CHAT');
                  } else if (judgeStep === 3) {
                    handleSendMessage('Should we maneuver?');
                    setJudgeStep(4);
                    setActiveTab('PERSPECTIVES_PANEL');
                  } else if (judgeStep === 4) {
                    setJudgeStep(5);
                    setActiveTab('DECISION_BRANCHES');
                  } else if (judgeStep === 5) {
                    handleApplyDecision('RUN_AVOIDANCE');
                    setJudgeStep(6);
                    setActiveTab('DECISION_BRANCHES');
                  } else if (judgeStep === 6) {
                    setJudgeStep(7);
                    setActiveTab('EARTH_IMPACT');
                  } else {
                    notify('Demo complete! Feel free to explore other decisions.');
                  }
                }}
                className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>{judgeStep < 7 ? 'Auto-Advance Step' : 'Restart Walkthrough'}</span>
                <ChevronRight className="w-3 h-3" />
              </button>

              <button
                onClick={() => setIsJudgeMode(false)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1"
                title="Exit Judge Mode"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Crisis Control Matrix: Telemetry Bar & Countdown */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-3 bg-[#080d17] border-b border-slate-800/80 font-mono text-xs">
        {/* Countdown to TCA */}
        <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg">
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1 text-rose-400 font-bold uppercase">
              <Clock className="w-3 h-3" />
              <span>TIME TO CLOSE APPROACH</span>
            </span>
          </div>
          <div className="text-base sm:text-lg font-bold text-rose-400 mt-1 tracking-wider">
            {hoursRemaining}h : {minutesRemaining}m : {secondsRemaining}s
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Initial TCA: {Math.round(crisis.initialTcaMinutes / 60)}h · {crisis.isClockRunning ? 'COUNTDOWN LIVE' : 'PAUSED'}
          </div>
        </div>

        {/* Miss Distance */}
        <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg">
          <div className="text-[10px] text-slate-400 uppercase">Predicted Miss Distance</div>
          <div className="text-base sm:text-lg font-bold text-rose-400 mt-1">
            {crisis.currentMissDistanceMeters < 1000
              ? `${crisis.currentMissDistanceMeters.toFixed(1)} m`
              : `${(crisis.currentMissDistanceMeters / 1000).toFixed(2)} km`}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Radial: {crisis.trackingTimeline[crisis.trackingTimeline.length - 1]?.radialSeparationM?.toFixed(1) || '14.2'}m
          </div>
        </div>

        {/* Collision Probability Pc */}
        <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg">
          <div className="text-[10px] text-slate-400 uppercase">Collision Probability (Pc)</div>
          <div className="text-base sm:text-lg font-bold text-rose-400 mt-1">
            {(crisis.collisionProbability * 100).toFixed(3)}%
          </div>
          <div className="text-[9px] text-rose-400/90 mt-0.5">
            Exceeds 10⁻⁴ Red Safety Threshold
          </div>
        </div>

        {/* Covariance / Uncertainty */}
        <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg">
          <div className="text-[10px] text-slate-400 uppercase">Tracking Uncertainty</div>
          <div className="text-base sm:text-lg font-bold text-cyan-300 mt-1">
            ±{crisis.covariance.alongTrackUncertaintyM} m
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Along-Track (Confidence: {crisis.covariance.confidenceLevel})
          </div>
        </div>

        {/* Spacecraft Δv Reserve */}
        <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg col-span-2 md:col-span-1">
          <div className="text-[10px] text-slate-400 uppercase">Propellant Budget</div>
          <div className="text-base sm:text-lg font-bold text-emerald-400 mt-1">
            {crisis.primaryAsset.fuelRemainingDeltaV} m/s
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Remaining Δv (Estimated 14 mo lifetime)
          </div>
        </div>
      </div>

      {/* Tab Navigation for Crisis Console */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-[#070b13] px-3 pt-2 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('DECISION_BRANCHES')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'DECISION_BRANCHES'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Decisions &amp; Branching Futures</span>
          </button>

          <button
            onClick={() => setActiveTab('HALO_CHAT')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'HALO_CHAT'
                ? 'border-purple-400 text-purple-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
            <span>HALO AI Crisis Chat</span>
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
          </button>

          <button
            onClick={() => setActiveTab('PERSPECTIVES_PANEL')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'PERSPECTIVES_PANEL'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>4-Perspective Council</span>
            <span className="text-[10px] px-1 bg-amber-950 border border-amber-800 rounded font-mono text-amber-300">
              Debate
            </span>
          </button>

          <button
            onClick={() => setActiveTab('EARTH_IMPACT')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'EARTH_IMPACT'
                ? 'border-emerald-400 text-emerald-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Earth Impact &amp; Swath</span>
          </button>

          <button
            onClick={() => setActiveTab('TRACKING_LOG')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'TRACKING_LOG'
                ? 'border-blue-400 text-blue-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            <span>Sensor Passes ({crisis.trackingTimeline.length})</span>
          </button>
        </div>

        {/* Quick Timeline Controls in Tab Bar */}
        <div className="flex items-center gap-1.5 py-1">
          <button
            onClick={() => setCrisis((p) => ({ ...p, isClockRunning: !p.isClockRunning }))}
            className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded transition-colors"
            title={crisis.isClockRunning ? 'Pause Time' : 'Resume Time'}
          >
            {crisis.isClockRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => handleAdvanceTime(30)}
            className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded font-mono text-[10px]"
            title="Advance +30 min"
          >
            +30m
          </button>

          <button
            onClick={() => handleAdvanceTime(120)}
            className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded font-mono text-[10px]"
            title="Advance +2 hours"
          >
            +2h
          </button>

          <button
            onClick={() => handleAdvanceTime(360)}
            className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded font-mono text-[10px]"
            title="Advance +6 hours"
          >
            +6h
          </button>
        </div>
      </div>

      {/* Main Tab Views Content */}
      <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
        {/* TAB 1: DECISIONS & BRANCHING FUTURES */}
        {activeTab === 'DECISION_BRANCHES' && (
          <div className="space-y-4">
            {/* User Decision Actions Bar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase text-slate-200 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>Choose Operational Response (Flight Director Authority)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Select an action to formulate the branch
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                {/* 1. Wait for More Data */}
                <button
                  onClick={() => handleApplyDecision('WAIT_MORE_DATA')}
                  className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-700/80 hover:border-slate-500 rounded-lg text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                    <span>1. WAIT FOR MORE DATA</span>
                    <Clock className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Advance clock +2h. Wait for next Tenerife optical pass. Burns through reaction wheel margin.
                  </p>
                </button>

                {/* 2. Request Tracking Update */}
                <button
                  onClick={() => handleApplyDecision('REQUEST_TRACKING')}
                  className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-cyan-800/80 hover:border-cyan-500 rounded-lg text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
                    <span>2. TASK SENSORS</span>
                    <Radio className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Task Space Fence radar network. Collapses covariance ellipsoid by 60% to verify geometry.
                  </p>
                </button>

                {/* 3. Run Avoidance Maneuver */}
                <button
                  onClick={() => handleApplyDecision('RUN_AVOIDANCE')}
                  className={`p-2.5 rounded-lg text-left transition-all group cursor-pointer border ${
                    crisis.selectedBranch === 'AVOIDANCE_BURN'
                      ? 'bg-emerald-950/80 border-emerald-500 shadow-md shadow-emerald-950 ring-1 ring-emerald-500'
                      : 'bg-slate-950 hover:bg-slate-850 border-emerald-800/80 hover:border-emerald-500'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                    <span>3. AVOIDANCE BURN</span>
                    <Flame className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Prograde burn (+1.45 m/s at perigee). Clears miss distance to 4.85 km. Sacrifices 4.2 mo fuel.
                  </p>
                </button>

                {/* 4. Coordinate with Operator */}
                <button
                  onClick={() => handleApplyDecision('COORDINATE_OPERATOR')}
                  className={`p-2.5 rounded-lg text-left transition-all group cursor-pointer border ${
                    crisis.selectedBranch === 'COORDINATED'
                      ? 'bg-blue-950/80 border-blue-500 shadow-md shadow-blue-950 ring-1 ring-blue-500'
                      : 'bg-slate-950 hover:bg-slate-850 border-blue-800/80 hover:border-blue-500'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-300">
                    <span>4. COORDINATE</span>
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Bilateral drag &amp; out-of-plane trim. 3.25 km clearance at 1/3 propellant expenditure.
                  </p>
                </button>

                {/* 5. Explore Hypothetical */}
                <button
                  onClick={() => handleApplyDecision('EXPLORE_HYPOTHETICAL')}
                  className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-purple-800/80 hover:border-purple-500 rounded-lg text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-purple-300">
                    <span>5. HYPOTHETICAL</span>
                    <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Simulate extreme what-if: reaction wheel stall, partial burn, or hypervelocity fragmentation.
                  </p>
                </button>
              </div>
            </div>

            {/* Branching Futures Side-by-Side Comparison Matrix */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>Branching Futures Comparison Matrix</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  Active Branch: <strong className="text-cyan-300">{crisis.selectedBranch}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Branch A: Baseline Trajectory */}
                <div
                  className={`p-3.5 rounded-lg border flex flex-col justify-between transition-all ${
                    crisis.selectedBranch === 'BASELINE'
                      ? 'bg-rose-950/30 border-rose-500/90 shadow-lg shadow-rose-950/50 ring-1 ring-rose-500'
                      : 'bg-slate-900/80 border-slate-800 opacity-90'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-300">ORIGINAL TRAJECTORY</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                        BASELINE
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {crisis.branches.baseline.description}
                    </p>

                    <div className="mt-3 space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">Miss Distance:</span>
                        <span className="text-rose-400 font-bold">
                          {crisis.branches.baseline.missDistanceKm * 1000} m
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">Δv Burn Cost:</span>
                        <span className="text-slate-200">0.0 m/s (0 fuel)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">Collision Risk (Pc):</span>
                        <span className="text-rose-400 font-bold">
                          {(crisis.branches.baseline.collisionProbability * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">Kessler Cascade:</span>
                        <span className="text-rose-400">7,400+ Fragments</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">Earth Coverage:</span>
                        <span className="text-rose-400 font-semibold">PERMANENT OUTAGE</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setCrisis((p) => ({ ...p, selectedBranch: 'BASELINE' }))}
                      className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                    >
                      {crisis.selectedBranch === 'BASELINE' ? '✓ Currently Selected' : 'Select Baseline Branch'}
                    </button>
                  </div>
                </div>

                {/* Branch B: Alternative Maneuver */}
                <div
                  className={`p-3.5 rounded-lg border flex flex-col justify-between transition-all ${
                    crisis.selectedBranch === 'AVOIDANCE_BURN'
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-500'
                      : 'bg-slate-900/80 border-slate-800 opacity-90'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300">ALTERNATIVE MANEUVER</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        PROGRADE BURN
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {crisis.branches.avoidanceBurn.description}
                    </p>

                    <div className="mt-3 space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">Miss Distance:</span>
                        <span className="text-emerald-400 font-bold">
                          {crisis.branches.avoidanceBurn.missDistanceKm} km
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">Δv Burn Cost:</span>
                        <span className="text-amber-300">
                          {crisis.branches.avoidanceBurn.deltaVRequiredMs} m/s (4.2 mo life)
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">Collision Risk (Pc):</span>
                        <span className="text-emerald-400 font-bold">
                          {(crisis.branches.avoidanceBurn.collisionProbability * 100).toFixed(5)}%
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">Kessler Cascade:</span>
                        <span className="text-emerald-400">Eliminated (0.01%)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">Earth Coverage:</span>
                        <span className="text-amber-300 font-semibold">45m Pause, Then 100%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-800 flex flex-col gap-1.5">
                    <button
                      onClick={() => {
                        setCrisis((p) => ({ ...p, selectedBranch: 'AVOIDANCE_BURN' }));
                        handleApplyDecision('RUN_AVOIDANCE');
                      }}
                      className="w-full py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {crisis.selectedBranch === 'AVOIDANCE_BURN' ? '✓ Active Branch (Burn Engaged)' : 'Execute Avoidance Burn'}
                    </button>

                    <button
                      onClick={() => onOpenSimulationModal()}
                      className="w-full py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-mono flex items-center justify-center gap-1 transition-colors"
                    >
                      <Sliders className="w-3 h-3 text-cyan-400" />
                      <span>Tune in Maneuver Simulator</span>
                    </button>
                  </div>
                </div>

                {/* Branch C: Coordinated Response */}
                <div
                  className={`p-3.5 rounded-lg border flex flex-col justify-between transition-all ${
                    crisis.selectedBranch === 'COORDINATED'
                      ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-950/60 ring-1 ring-blue-500'
                      : 'bg-slate-900/80 border-slate-800 opacity-90'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-300">COORDINATED RESPONSE</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                        BILATERAL
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {crisis.branches.coordinated.description}
                    </p>

                    <div className="mt-3 space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">Miss Distance:</span>
                        <span className="text-cyan-300 font-bold">
                          {crisis.branches.coordinated.missDistanceKm} km
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">Δv Burn Cost:</span>
                        <span className="text-emerald-400">
                          {crisis.branches.coordinated.deltaVRequiredMs} m/s (1.4 mo life)
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">Collision Risk (Pc):</span>
                        <span className="text-cyan-300 font-bold">
                          {(crisis.branches.coordinated.collisionProbability * 100).toFixed(5)}%
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">Kessler Cascade:</span>
                        <span className="text-emerald-400">Preserved (0.02%)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">Earth Coverage:</span>
                        <span className="text-emerald-400 font-semibold">100% NOMINAL UPTIME</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setCrisis((p) => ({ ...p, selectedBranch: 'COORDINATED' }));
                        handleApplyDecision('COORDINATE_OPERATOR');
                      }}
                      className="w-full py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {crisis.selectedBranch === 'COORDINATED' ? '✓ Active Branch (Coordinated)' : 'Select Coordinated Plan'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mission Constraints Card */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3 text-xs">
              <h4 className="font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Active Mission &amp; Hardware Constraints</span>
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 text-[11px]">
                {crisis.missionConstraints.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5 bg-slate-950/60 p-2 rounded border border-slate-850">
                    <span className="text-cyan-400 font-mono">▸</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* TAB 2: HALO AI CRISIS CHAT */}
        {activeTab === 'HALO_CHAT' && (
          <div className="flex flex-col h-[520px] bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
            {/* AI Perspective Switcher Bar */}
            <div className="bg-slate-900 border-b border-slate-800 p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-mono">Talk to Specialist:</span>
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    onClick={() => setSelectedPerspective('HALO')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      selectedPerspective === 'HALO'
                        ? 'bg-purple-950 text-purple-200 border border-purple-700 font-bold'
                        : 'bg-slate-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    HALO (Lead AI)
                  </button>
                  <button
                    onClick={() => setSelectedPerspective('MISSION_ANALYST')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      selectedPerspective === 'MISSION_ANALYST'
                        ? 'bg-cyan-950 text-cyan-200 border border-cyan-700 font-bold'
                        : 'bg-slate-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Dr. Vance (Mission Ops)
                  </button>
                  <button
                    onClick={() => setSelectedPerspective('SATELLITE_OPERATOR')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      selectedPerspective === 'SATELLITE_OPERATOR'
                        ? 'bg-amber-950 text-amber-200 border border-amber-700 font-bold'
                        : 'bg-slate-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Cmdr. Thorne (Propulsion)
                  </button>
                  <button
                    onClick={() => setSelectedPerspective('SUSTAINABILITY')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      selectedPerspective === 'SUSTAINABILITY'
                        ? 'bg-rose-950 text-rose-200 border border-rose-700 font-bold'
                        : 'bg-slate-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Dr. Rostova (Sustainability)
                  </button>
                  <button
                    onClick={() => setSelectedPerspective('INDEPENDENT_REVIEWER')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      selectedPerspective === 'INDEPENDENT_REVIEWER'
                        ? 'bg-blue-950 text-blue-200 border border-blue-700 font-bold'
                        : 'bg-slate-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Prof. Chen (Reviewer)
                  </button>
                </div>
              </div>

              <span className="text-[10px] font-mono text-purple-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Live Gemini Grounded
              </span>
            </div>

            {/* Chat Conversation Scroll Area */}
            <div ref={chatScrollRef} className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
              {chatMessages.map((msg) => {
                const isUser = msg.senderName.includes('You') || msg.senderRole === 'USER';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-slate-500">
                      <span className="font-semibold text-slate-400">{msg.senderName}</span>
                      <span>·</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-[85%] p-3 rounded-lg leading-relaxed ${
                        isUser
                          ? 'bg-cyan-950 border border-cyan-800 text-cyan-100'
                          : msg.senderRole === 'SUSTAINABILITY'
                          ? 'bg-rose-950/50 border border-rose-800 text-rose-100'
                          : msg.senderRole === 'SATELLITE_OPERATOR'
                          ? 'bg-amber-950/50 border border-amber-800 text-amber-100'
                          : msg.senderRole === 'MISSION_ANALYST'
                          ? 'bg-sky-950/50 border border-sky-800 text-sky-100'
                          : 'bg-slate-900 border border-slate-800 text-slate-200'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>

                      {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                          {msg.suggestedFollowUps.map((q, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendMessage(q)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] transition-colors text-left"
                            >
                              💬 {q}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isAiLoading && (
                <div className="flex items-center gap-2 text-xs text-purple-400 font-mono animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>HALO consulting live astrodynamic simulation telemetry...</span>
                </div>
              )}
            </div>

            {/* Quick Prompt Chips */}
            <div className="p-2 bg-slate-900/60 border-t border-slate-800 flex flex-wrap gap-1.5 text-[11px]">
              <span className="text-[10px] text-slate-500 font-mono self-center">Ask:</span>
              {[
                "What's happening?",
                "Should we maneuver?",
                "What information are we missing?",
                "What happens if we wait?",
                "Explain the orbital mechanics.",
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  disabled={isAiLoading}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-cyan-300 text-[10px] transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Ask ${selectedPerspective === 'HALO' ? 'HALO' : selectedPerspective} about the active crisis...`}
                className="flex-1 bg-slate-950 border border-slate-750 rounded px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isAiLoading || !chatInput.trim()}
                className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold rounded text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: 4-PERSPECTIVE COUNCIL (DEBATE GRID) */}
        {activeTab === 'PERSPECTIVES_PANEL' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>The Four Operational Perspectives (Conflicting Priorities)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Real space operations involve genuine conflicts between sensor uptime, bus health, debris mitigation, and statistical confidence.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* 1. Mission Analyst */}
              <div className="p-4 bg-slate-900/90 border border-cyan-800/80 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                      MISSION CONTINUITY &amp; COVERAGE
                    </span>
                    <h4 className="text-sm font-bold text-slate-100">{crisis.perspectives.missionAnalyst.name}</h4>
                    <span className="text-[11px] text-slate-400">{crisis.perspectives.missionAnalyst.roleTitle}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                    SENSORS FIRST
                  </span>
                </div>
                <div className="mt-3 p-2.5 bg-slate-950/70 border-l-2 border-cyan-500 rounded text-xs italic text-cyan-200">
                  "{crisis.perspectives.missionAnalyst.quote}"
                </div>
                <div className="mt-3 text-xs space-y-1.5 text-slate-300">
                  <div>
                    <strong className="text-slate-400">Formal Stance:</strong> {crisis.perspectives.missionAnalyst.stance}
                  </div>
                  <div>
                    <strong className="text-slate-400">Recommendation:</strong> {crisis.perspectives.missionAnalyst.recommendation}
                  </div>
                  <div className="text-[11px] text-amber-300">
                    <strong>Disagreement:</strong> {crisis.perspectives.missionAnalyst.disagreementPoint}
                  </div>
                </div>
              </div>

              {/* 2. Satellite Operator */}
              <div className="p-4 bg-slate-900/90 border border-amber-800/80 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                      SPACECRAFT HEALTH &amp; FUEL
                    </span>
                    <h4 className="text-sm font-bold text-slate-100">{crisis.perspectives.satelliteOperator.name}</h4>
                    <span className="text-[11px] text-slate-400">{crisis.perspectives.satelliteOperator.roleTitle}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
                    BUS INTEGRITY
                  </span>
                </div>
                <div className="mt-3 p-2.5 bg-slate-950/70 border-l-2 border-amber-500 rounded text-xs italic text-amber-200">
                  "{crisis.perspectives.satelliteOperator.quote}"
                </div>
                <div className="mt-3 text-xs space-y-1.5 text-slate-300">
                  <div>
                    <strong className="text-slate-400">Formal Stance:</strong> {crisis.perspectives.satelliteOperator.stance}
                  </div>
                  <div>
                    <strong className="text-slate-400">Recommendation:</strong> {crisis.perspectives.satelliteOperator.recommendation}
                  </div>
                  <div className="text-[11px] text-amber-300">
                    <strong>Disagreement:</strong> {crisis.perspectives.satelliteOperator.disagreementPoint}
                  </div>
                </div>
              </div>

              {/* 3. Sustainability Analyst */}
              <div className="p-4 bg-slate-900/90 border border-rose-800/80 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-rose-400 font-bold">
                      DEBRIS MITIGATION &amp; KESSLER RISK
                    </span>
                    <h4 className="text-sm font-bold text-slate-100">{crisis.perspectives.sustainabilityAnalyst.name}</h4>
                    <span className="text-[11px] text-slate-400">{crisis.perspectives.sustainabilityAnalyst.roleTitle}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800">
                    ZERO TOLERANCE
                  </span>
                </div>
                <div className="mt-3 p-2.5 bg-slate-950/70 border-l-2 border-rose-500 rounded text-xs italic text-rose-200">
                  "{crisis.perspectives.sustainabilityAnalyst.quote}"
                </div>
                <div className="mt-3 text-xs space-y-1.5 text-slate-300">
                  <div>
                    <strong className="text-slate-400">Formal Stance:</strong> {crisis.perspectives.sustainabilityAnalyst.stance}
                  </div>
                  <div>
                    <strong className="text-slate-400">Recommendation:</strong> {crisis.perspectives.sustainabilityAnalyst.recommendation}
                  </div>
                  <div className="text-[11px] text-amber-300">
                    <strong>Disagreement:</strong> {crisis.perspectives.sustainabilityAnalyst.disagreementPoint}
                  </div>
                </div>
              </div>

              {/* 4. Independent Reviewer */}
              <div className="p-4 bg-slate-900/90 border border-blue-800/80 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-blue-400 font-bold">
                      UNCERTAINTY &amp; EVIDENCE AUDIT
                    </span>
                    <h4 className="text-sm font-bold text-slate-100">{crisis.perspectives.independentReviewer.name}</h4>
                    <span className="text-[11px] text-slate-400">{crisis.perspectives.independentReviewer.roleTitle}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800">
                    TASK SENSORS FIRST
                  </span>
                </div>
                <div className="mt-3 p-2.5 bg-slate-950/70 border-l-2 border-blue-500 rounded text-xs italic text-blue-200">
                  "{crisis.perspectives.independentReviewer.quote}"
                </div>
                <div className="mt-3 text-xs space-y-1.5 text-slate-300">
                  <div>
                    <strong className="text-slate-400">Formal Stance:</strong> {crisis.perspectives.independentReviewer.stance}
                  </div>
                  <div>
                    <strong className="text-slate-400">Recommendation:</strong> {crisis.perspectives.independentReviewer.recommendation}
                  </div>
                  <div className="text-[11px] text-amber-300">
                    <strong>Disagreement:</strong> {crisis.perspectives.independentReviewer.disagreementPoint}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EARTH IMPACT & REGIONAL SWATH */}
        {activeTab === 'EARTH_IMPACT' && (
          <div className="space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                    TERRESTRIAL SERVICE &amp; SENSOR SWATH
                  </span>
                  <h3 className="text-base font-bold text-slate-100 mt-0.5">
                    {crisis.earthImpact.serviceName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Target Region: <strong className="text-slate-200">{crisis.earthImpact.regionName}</strong> · Approx Population Protected: <strong className="text-cyan-300">{crisis.earthImpact.affectedPopulationEst}</strong>
                  </p>
                </div>

                <button
                  onClick={() => onSwitchToGlobe()}
                  className="px-3.5 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-950" />
                  <span>View 3D Swath on Earth Globe</span>
                </button>
              </div>

              {/* Scenarios of Coverage Impact */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-xs">
                {/* 1. If Destroyed */}
                <div className="p-3 bg-rose-950/30 border border-rose-800 rounded-lg">
                  <div className="flex items-center gap-2 text-rose-400 font-bold mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>IF DESTROYED / COLLISION</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {crisis.earthImpact.consequenceIfDestroyed}
                  </p>
                  <div className="mt-2 text-[10px] font-mono text-rose-300">
                    Backup satellite ({crisis.earthImpact.backupSatelliteName}) takes <strong>{crisis.earthImpact.backupHandoverTimeHours} hours</strong> to re-phase over the basin.
                  </div>
                </div>

                {/* 2. If Avoidance Maneuver Executed */}
                <div className="p-3 bg-amber-950/30 border border-amber-800 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
                    <Flame className="w-3.5 h-3.5" />
                    <span>IF AVOIDANCE BURN EXECUTED</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {crisis.earthImpact.consequenceIfManeuvering}
                  </p>
                  <div className="mt-2 text-[10px] font-mono text-emerald-300">
                    Temporary 45-minute pause during slew; 100% telemetry restored prior to cyclone surge window.
                  </div>
                </div>

                {/* 3. If Coordinated Response */}
                <div className="p-3 bg-blue-950/30 border border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-400 font-bold mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>IF COORDINATED CROSS-OPERATOR</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {crisis.earthImpact.consequenceIfCoordinated}
                  </p>
                  <div className="mt-2 text-[10px] font-mono text-blue-300">
                    Constellation inter-satellite link fills telemetry without any ground sensor outage.
                  </div>
                </div>
              </div>

              {/* Stated Assumptions & Model Label */}
              <div className="mt-4 p-2.5 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Model Assumptions: {crisis.earthImpact.assumptionsModel}</span>
                <span className="font-mono text-cyan-400 text-[10px]">VERIFIED ASTRODYNAMICS MODEL</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: TRACKING LOG & SENSOR PASSES */}
        {activeTab === 'TRACKING_LOG' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-blue-400" />
                <span>Sensor Network Passes &amp; Doppler Tracking Telemetry</span>
              </h3>
              <button
                onClick={() => handleApplyDecision('REQUEST_TRACKING')}
                className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-200 text-xs rounded font-mono"
              >
                + Force High-Power Radar Sweep
              </button>
            </div>

            <div className="space-y-2">
              {crisis.trackingTimeline.map((obs) => (
                <div
                  key={obs.id}
                  className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span className="font-bold text-slate-100">{obs.sensorName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                        {obs.sensorType}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        T - {Math.round(obs.timeBeforeTcaMin / 60)}h ({obs.timeBeforeTcaMin} min)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {obs.facilityLocation} · {obs.notes}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
                    <div className="text-right">
                      <div className="text-[9px] text-slate-500">MISS DISTANCE</div>
                      <div className="text-rose-400 font-bold">{obs.rawMissDistanceM.toFixed(1)} m</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-slate-500">PROBABILITY (Pc)</div>
                      <div className="text-rose-400 font-bold">{(obs.collisionProbability * 100).toFixed(3)}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-slate-500">COVARIANCE DELTA</div>
                      <div className="text-cyan-400 font-bold">{obs.covarianceScalePct}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
