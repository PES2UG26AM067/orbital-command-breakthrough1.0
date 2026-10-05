import React, { useState, useEffect } from 'react';
import { ShieldAlert, Radio, RefreshCw } from 'lucide-react';

interface StatsStripProps {
  filterRegime: 'ALL' | 'LEO' | 'MEO' | 'GEO';
  setFilterRegime: (regime: 'ALL' | 'LEO' | 'MEO' | 'GEO') => void;
  filterType: 'ALL' | 'PAYLOAD' | 'DEBRIS' | 'ROCKET_BODY';
  setFilterType: (type: 'ALL' | 'PAYLOAD' | 'DEBRIS' | 'ROCKET_BODY') => void;
  conjunctionAlertsCount: number;
  isLiveFeed?: boolean;
  liveCount?: number;
  onRefreshLive?: () => void;
  isRefreshing?: boolean;
  sourceText?: string;
}

export const StatsStrip: React.FC<StatsStripProps> = ({
  filterRegime,
  setFilterRegime,
  filterType,
  setFilterType,
  conjunctionAlertsCount,
  isLiveFeed = true,
  liveCount = 175,
  onRefreshLive,
  isRefreshing = false,
  sourceText = 'CELESTRAK NORAD GP',
}) => {
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border-b border-slate-800 bg-[#070b13] px-6 py-2 flex flex-wrap items-center justify-between gap-4 text-xs font-mono select-none">
      {/* Metric Strip */}
      <div className="flex flex-wrap items-center gap-5 divide-x divide-slate-800 text-slate-400">
        {/* Live Data Feed */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] tracking-wider uppercase text-emerald-400 font-sans font-bold">
            NORAD FEED
          </span>
          <span className="text-sm font-semibold text-slate-100 tabular-nums">{liveCount} live</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {sourceText}
          </span>
          {onRefreshLive && (
            <button
              onClick={onRefreshLive}
              disabled={isRefreshing}
              title="Refresh live orbital data from CelesTrak / NORAD"
              className="p-1 text-slate-500 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          )}
        </div>

        <div className="pl-5 flex items-center gap-2">
          <span className="text-[10px] tracking-wider uppercase text-slate-500 font-sans font-medium">Tracked Debris</span>
          <span className="text-sm font-semibold text-rose-400 tabular-nums">~40,500+</span>
          <span className="text-[10px] text-slate-500 font-sans" title="Regularly tracked by Space Surveillance Networks (>10 cm, ESA 2024)">(&gt;10 cm · ESA 2024)</span>
        </div>

        <div className="pl-5 flex items-center gap-2">
          <span className="text-[10px] tracking-wider uppercase text-slate-500 font-sans font-medium">Derelict Rocket Stages</span>
          <span className="text-sm font-semibold text-amber-400 tabular-nums">2,150</span>
        </div>

        <div className="pl-5 flex items-center gap-2">
          <span className="text-[10px] tracking-wider uppercase text-slate-500 font-sans font-medium flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Active Collision Alerts
          </span>
          <span className="text-sm font-semibold text-rose-300 tabular-nums">{conjunctionAlertsCount}</span>
        </div>

        <div className="pl-5 hidden xl:flex items-center gap-2">
          <span className="text-[10px] tracking-wider uppercase text-slate-500 font-sans font-medium">Peak Hazard Corridor</span>
          <span className="text-sm font-semibold text-cyan-300 tabular-nums">780 km</span>
          <span className="text-[10px] text-slate-500 font-sans">(LEO-SSO)</span>
        </div>
      </div>

      {/* Regime and Type Controls */}
      <div className="flex items-center gap-3">
        {/* Altitude Regime Filter */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded">
          <span className="text-[10px] text-slate-500 font-mono px-1">ALT:</span>
          {(['ALL', 'LEO', 'MEO', 'GEO'] as const).map((regime) => (
            <button
              key={regime}
              onClick={() => setFilterRegime(regime)}
              className={`px-2 py-0.5 text-[11px] font-sans font-medium rounded transition-colors ${
                filterRegime === regime
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {regime}
            </button>
          ))}
        </div>

        {/* Object Filter */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-2 py-0.5 text-[11px] font-sans font-medium rounded transition-colors ${
              filterType === 'ALL' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('DEBRIS')}
            className={`px-2 py-0.5 text-[11px] font-sans font-medium rounded transition-colors ${
              filterType === 'DEBRIS' ? 'bg-slate-800 text-rose-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Debris
          </button>
          <button
            onClick={() => setFilterType('ROCKET_BODY')}
            className={`px-2 py-0.5 text-[11px] font-sans font-medium rounded transition-colors ${
              filterType === 'ROCKET_BODY' ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Boosters
          </button>
          <button
            onClick={() => setFilterType('PAYLOAD')}
            className={`px-2 py-0.5 text-[11px] font-sans font-medium rounded transition-colors ${
              filterType === 'PAYLOAD' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Satellites
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400 border-l border-slate-800 pl-3 font-mono">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>{utcTime || 'SYNCHRONIZING UTC...'}</span>
        </div>
      </div>
    </div>
  );
};
