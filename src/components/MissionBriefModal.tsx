import React, { useState, useEffect } from 'react';
import { OrbitalObject, ConjunctionAssessment, SimulationResult } from '../types/orbital';
import { FileText, Copy, Check, Download, X, Loader2, ShieldCheck } from 'lucide-react';

interface MissionBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  objectA: OrbitalObject | null;
  objectB: OrbitalObject | null;
  conjunction: ConjunctionAssessment | null;
  simulation: SimulationResult | null;
}

export const MissionBriefModal: React.FC<MissionBriefModalProps> = ({
  isOpen,
  onClose,
  objectA,
  objectB,
  conjunction,
  simulation,
}) => {
  const [briefText, setBriefText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sourceTag, setSourceTag] = useState<string>('ORBITAL_COMMAND_ENGINE');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchBrief = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/mission-brief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            objectA,
            objectB,
            conjunction: conjunction
              ? {
                  currentSeparation: conjunction.currentSeparation,
                  minSeparation: conjunction.minSeparation,
                  timeToTca: conjunction.timeToTca,
                  relativeVelocity: conjunction.relativeVelocity,
                  status: conjunction.status,
                  geometry: conjunction.geometry,
                }
              : null,
            simulation: simulation
              ? {
                  modifiedAltitude: simulation.modifiedElements.altitude,
                  deltaAltitude: simulation.modifiedElements.altitude - (objectA?.altitude || 0),
                  deltaV: simulation.deltaV,
                  newPeriod: simulation.newPeriodMin,
                }
              : null,
          }),
        });

        if (!response.ok) {
          throw new Error('Server returned non-200');
        }

        const data = await response.json();
        setBriefText(data.briefing || 'Unable to generate brief.');
        setSourceTag(data.source || 'ORBITAL_COMMAND_ENGINE');
      } catch (err) {
        console.warn('Fallback to local deterministic brief:', err);
        setSourceTag('DETERMINISTIC_ENGINE');
        setBriefText(
          `[ORBITAL COMMAND // CONJUNCTION ASSESSMENT REPORT // SSA-OPS]\n` +
            `DOCUMENT ID: OC-CAR-${Date.now().toString().slice(-6)}\n` +
            `DATE / TIME OF TRANSMISSION: ${new Date().toISOString()}\n\n` +
            `1. EXECUTIVE SUMMARY\n` +
            `Conjunction screening confirmed between primary asset ${objectA?.name || 'ASSET-A'} (NORAD #${objectA?.catalogId || '25544'}) and secondary object ${objectB ? objectB.name + ' (NORAD #' + objectB.catalogId + ')' : 'UNIDENTIFIED SECONDARY DEBRIS'}.\n` +
            `Predicted closest approach occurs in +${conjunction?.timeToTca || 34.2} min at minimum separation of ${conjunction?.minSeparation || 1.42} km.\n\n` +
            `2. ORBITAL REGIME & TRACKING CONFIDENCE\n` +
            `• Primary Object: ${objectA?.name} | Alt: ${objectA?.altitude} km | Inc: ${objectA?.inclination}° | Period: ${objectA?.orbitalPeriod} min\n` +
            `• Secondary Object: ${objectB?.name || 'N/A'} | Alt: ${objectB?.altitude || 'N/A'} km | Inc: ${objectB?.inclination || 'N/A'}°\n` +
            `• Propagation Engine: Two-body Keplerian propagator with deterministic state vectors.\n\n` +
            `3. GEOMETRIC INTERSECTION ANALYSIS\n` +
            `Crossing geometry exhibits high-energy relative encounter velocity of ${conjunction?.relativeVelocity || 14.1} km/s. Current separation is ${conjunction?.currentSeparation || 48.2} km.\n\n` +
            `4. OPERATIONAL RECOMMENDATION\n` +
            `${(conjunction?.minSeparation || 10) <= 5.0 ? '• RED CONJUNCTION ALERT: Candidate Collision Avoidance Maneuver (COLA) recommended.\n• Continue active radar telemetry updates.' : '• NOMINAL MONITORING: Maintain tracking through TCA.'}`
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrief();
  }, [isOpen, objectA, objectB, conjunction, simulation]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(briefText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-2xl bg-[#090d16] border border-slate-700 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-cyan-400" />
            <div>
              <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
                MISSION BRIEF // SPACE SITUATIONAL AWARENESS
              </h2>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                <span>ENGINE: {sourceTag}</span>
                <span>·</span>
                <span className="text-emerald-400">UNCLASSIFIED CIVIL TRAFFIC</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Brief Text Content */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-950 font-mono-tabular text-slate-200 text-xs">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <div className="text-xs font-mono">SYNTHESIZING ORBITAL ASSESSMENT BRIEFING...</div>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-slate-300">
              {briefText}
            </pre>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">
            NOT FOR OPERATIONAL COLLISION AVOIDANCE · DEMONSTRATION USE
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
