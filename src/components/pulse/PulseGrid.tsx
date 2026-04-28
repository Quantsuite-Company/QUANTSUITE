import { cn } from '@/lib/utils';
import { ReactNode, useRef, useState, useCallback } from 'react';
import { Info, Download, Pin, X, Maximize2 } from 'lucide-react';
import html2canvas from 'html2canvas';

interface PulsePanelProps {
  title: string;
  category: 'MACRO' | 'COMMODITIES' | 'CRYPTO' | 'MARKETS' | 'TRADE' | 'GEOPOLITICS' | 'SYSTEM';
  children: ReactNode;
  className?: string;
  badge?: string;
  badgeColor?: string;
  /** Plain-English analysis text shown in expanded view */
  analysis?: string;
  /** Extra content shown only in expanded view */
  expandedContent?: ReactNode;
  panelId?: string;
  onExpand?: (id: string) => void;
  expanded?: boolean;
  onClose?: () => void;
}

const CAT_COLORS: Record<string, string> = {
  MACRO: 'text-blue-500',
  COMMODITIES: 'text-amber-500',
  CRYPTO: 'text-purple-500',
  MARKETS: 'text-emerald-500',
  TRADE: 'text-cyan-500',
  GEOPOLITICS: 'text-rose-500',
  SYSTEM: 'text-slate-400',
};

const CAT_BORDER: Record<string, string> = {
  MACRO: 'border-blue-500/40',
  COMMODITIES: 'border-amber-500/40',
  CRYPTO: 'border-purple-500/40',
  MARKETS: 'border-emerald-500/40',
  TRADE: 'border-cyan-500/40',
  GEOPOLITICS: 'border-rose-500/40',
  SYSTEM: 'border-slate-500/40',
};

export function PulsePanel({ 
  title, category, className, children, badge, badgeColor, 
  analysis, expandedContent, panelId, onExpand, expanded, onClose 
}: PulsePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);

  const handleDownload = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!panelRef.current) return;
    try {
      const canvas = await html2canvas(panelRef.current, {
        backgroundColor: '#0a0e17',
        scale: 2,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `pulse-${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    }
  }, [title]);

  const handlePin = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPinned(prev => !prev);
  }, []);

  const handleExpand = useCallback(() => {
    if (onExpand && panelId) onExpand(panelId);
  }, [onExpand, panelId]);

  // ──── EXPANDED FULL-SCREEN OVERLAY ────
  if (expanded) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8" onClick={onClose}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
        <div 
          ref={panelRef}
          className={cn(
            "relative z-10 w-full max-w-4xl max-h-[90vh] bg-bg-card border rounded-2xl overflow-y-auto flex flex-col shadow-2xl shadow-black/60",
            CAT_BORDER[category]
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Expanded Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-bg-elevated/50 shrink-0 sticky top-0 z-10 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className={cn("text-[10px] font-mono tracking-widest font-bold", CAT_COLORS[category])}>
                {category}
              </span>
              <h2 className="font-bold text-white text-lg tracking-tight">{title}</h2>
              {badge && (
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded font-bold"
                  style={{ color: badgeColor || '#3b82f6', backgroundColor: `${badgeColor || '#3b82f6'}15`, border: `1px solid ${badgeColor || '#3b82f6'}30` }}>
                  {badge}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleDownload} className="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-lg" title="Download as PNG">
                <Download className="w-4 h-4" />
              </button>
              <button onClick={handlePin} className={cn("transition-colors p-1.5 rounded-lg", pinned ? "text-cyan-400 bg-cyan-500/10" : "text-slate-400 hover:text-white hover:bg-white/5")} title="Pin panel">
                <Pin className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-lg ml-2" title="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-6 flex flex-col gap-6">
            {/* Original panel content at larger scale */}
            <div className="flex-1 min-h-[200px]">
              {children}
            </div>

            {/* Expanded extra content (additional charts, deeper data) */}
            {expandedContent && (
              <div className="border-t border-white/5 pt-4">
                {expandedContent}
              </div>
            )}

            {/* Wolf-of-Wall-Street Analysis Block */}
            {analysis && (
              <div className="border-t border-white/5 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                  <span className="text-xs font-mono font-bold text-blue-400 tracking-widest uppercase">Institutional Analysis</span>
                </div>
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
                  <p className="text-sm text-slate-300 leading-relaxed font-medium">
                    {analysis}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ──── NORMAL COMPACT VIEW ────
  return (
    <div 
      ref={panelRef}
      className={cn(
        "relative bg-bg-card border rounded-xl overflow-hidden flex flex-col group transition-all duration-300 cursor-pointer",
        "hover:border-white/10 hover:shadow-xl hover:shadow-black/20",
        pinned ? "border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]" : "border-white/5",
        className
      )}
      onClick={handleExpand}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.03] bg-bg-elevated/50 shrink-0">
        <div className="flex items-center gap-2">
          <span className={cn("text-[9px] font-mono tracking-widest font-bold", CAT_COLORS[category])}>
            {category}
          </span>
        </div>
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleDownload} className="text-slate-500 hover:text-slate-300 transition-colors p-[1px]" title="Download"><Download className="w-3 h-3" /></button>
          <button onClick={handlePin} className={cn("transition-colors p-[1px]", pinned ? "text-cyan-400" : "text-slate-500 hover:text-slate-300")} title="Pin"><Pin className="w-3 h-3" /></button>
          <button onClick={(e) => { e.stopPropagation(); handleExpand(); }} className="text-slate-500 hover:text-slate-300 transition-colors p-[1px]" title="Expand"><Maximize2 className="w-3 h-3" /></button>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 pt-2 pb-1 shrink-0">
        <div className="flex items-center gap-1.5">
          <h3 className="font-bold text-slate-200 text-sm tracking-tight">{title}</h3>
          <Info className="w-3.5 h-3.5 text-slate-600 hover:text-slate-400" />
        </div>
        
        {badge && (
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded font-bold" 
            style={{ color: badgeColor || '#3b82f6', backgroundColor: `${badgeColor || '#3b82f6'}15`, border: `1px solid ${badgeColor || '#3b82f6'}30` }}>
            {badge}
          </span>
        )}
      </div>

      {/* Content Body */}
      <div className="flex-1 relative p-3 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}

export function PulseGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-3 lg:gap-4",
      className
    )}>
      {children}
    </div>
  );
}
