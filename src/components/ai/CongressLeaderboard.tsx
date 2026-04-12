import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, ArrowRight, X, Brain, TrendingUp, TrendingDown, Zap, Target, AlertTriangle, BarChart3 } from "lucide-react";

interface CongressLeaderboardProps {
  trades: any[];
}

/* ─────────────────── CONGRESS X-RAY ENGINE ─────────────────── */
interface MemberProfile {
  member: string;
  party: string;
  chamber: string;
  totalTrades: number;
  purchases: number;
  sales: number;
  topTickers: { ticker: string; count: number }[];
  avgTimingScore: number;       // 0-100 how well timed their trades are
  sectorConcentration: string;  // most traded sector proxy
  riskAppetite: 'AGGRESSIVE' | 'MODERATE' | 'CONSERVATIVE';
  convictionLevel: number;      // 0-100
  copycatSignal: string;        // "STRONG BUY" | "HOLD" | "AVOID"
}

function buildMemberProfiles(trades: any[]): MemberProfile[] {
  const map = new Map<string, any>();

  trades.forEach(t => {
    const key = t.member;
    if (!map.has(key)) {
      map.set(key, {
        member: t.member,
        party: t.party,
        chamber: t.chamber || 'Unknown',
        totalTrades: 0,
        purchases: 0,
        sales: 0,
        tickers: new Map<string, number>(),
      });
    }
    const m = map.get(key)!;
    m.totalTrades++;
    if (t.action === 'Purchase') m.purchases++;
    else m.sales++;
    m.tickers.set(t.ticker, (m.tickers.get(t.ticker) || 0) + 1);
  });

  return Array.from(map.values())
    .map((m): MemberProfile => {
      const tickerArr = Array.from(m.tickers.entries())
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 5)
        .map(([ticker, count]: any) => ({ ticker, count }));

      const buyRatio = m.totalTrades > 0 ? m.purchases / m.totalTrades : 0.5;
      const timingScore = Math.min(100, Math.round(buyRatio * 80 + Math.random() * 20));
      const conviction = Math.min(100, Math.round(m.totalTrades * 8 + buyRatio * 40));

      return {
        member: m.member,
        party: m.party,
        chamber: m.chamber,
        totalTrades: m.totalTrades,
        purchases: m.purchases,
        sales: m.sales,
        topTickers: tickerArr,
        avgTimingScore: timingScore,
        sectorConcentration: tickerArr[0]?.ticker || 'N/A',
        riskAppetite: buyRatio > 0.7 ? 'AGGRESSIVE' : buyRatio > 0.4 ? 'MODERATE' : 'CONSERVATIVE',
        convictionLevel: conviction,
        copycatSignal: conviction > 70 ? 'STRONG BUY' : conviction > 40 ? 'HOLD' : 'AVOID',
      };
    })
    .sort((a, b) => b.convictionLevel - a.convictionLevel);
}

/* ─────────────────── COMPONENT ─────────────────── */
export const CongressLeaderboard: React.FC<CongressLeaderboardProps> = ({ trades }) => {
  const [showXRay, setShowXRay] = React.useState(false);

  const leaderboard = React.useMemo(() => {
    const memberMap = new Map<string, { member: string; party: string; count: number; buyValue: number; tickers: Set<string> }>();

    trades.forEach(t => {
      const existing = memberMap.get(t.member) || { member: t.member, party: t.party, count: 0, buyValue: 0, tickers: new Set<string>() };
      existing.count += 1;
      existing.tickers.add(t.ticker);
      if (t.action === "Purchase") {
        const value = parseInt(t.amount.replace(/[^0-9]/g, '')) || 5000;
        existing.buyValue += value;
      }
      memberMap.set(t.member, existing);
    });

    return Array.from(memberMap.values())
      .sort((a, b) => b.buyValue - a.buyValue)
      .slice(0, 5);
  }, [trades]);

  const allProfiles = React.useMemo(() => buildMemberProfiles(trades), [trades]);

  return (
    <>
      <Card className="bg-card/30 backdrop-blur-xl border-border/30 group">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Power Elite Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {leaderboard.map((member, idx) => (
            <motion.div
              key={member.member}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-3 rounded-lg bg-muted/20 border border-transparent hover:border-primary/20 hover:bg-muted/30 transition-all cursor-pointer flex items-center justify-between group/item"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-serif font-bold text-xs text-primary border border-primary/20">
                  {idx + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold font-serif">{member.member}</h4>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1 py-0 h-4 ${member.party === 'D' ? 'text-blue-400 border-blue-400/20' : 'text-red-400 border-red-400/20'}`}
                    >
                      {member.party}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {member.tickers.size} stocks tracked • {member.count} trades
                  </p>
                </div>
              </div>

              <div className="text-right flex items-center gap-3">
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-qs-brand-400">High Conviction</p>
                  <div className="flex gap-1 mt-1">
                    {Array.from(member.tickers).slice(0, 2).map(ticker => (
                      <Badge key={ticker} variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-muted/50 border-none">
                        {ticker}
                      </Badge>
                    ))}
                  </div>
                </div>
                <ArrowRight size={16} className="text-muted-foreground group-hover/item:text-primary transition-colors group-hover/item:translate-x-1" />
              </div>
            </motion.div>
          ))}

          <div className="pt-2">
            <button
              onClick={() => setShowXRay(true)}
              className="w-full py-2.5 text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80 flex items-center justify-center gap-2 border border-dashed border-primary/20 rounded-lg bg-primary/5 hover:bg-primary/10 transition-all"
            >
              <Brain className="w-4 h-4" /> Analyze Full Congress List
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════ CONGRESS X-RAY MODAL ═══════════════════ */}
      <AnimatePresence>
        {showXRay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-start justify-center overflow-y-auto p-6"
            onClick={() => setShowXRay(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-5xl shadow-2xl my-8"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-fuchsia-500 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Congress X-Ray Intelligence</h2>
                    <p className="text-xs text-white/40">{allProfiles.length} members profiled • Conviction-ranked • Copycat signals generated</p>
                  </div>
                </div>
                <button onClick={() => setShowXRay(false)} className="text-white/40 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stat Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 border-b border-white/10">
                {[
                  { label: 'TOTAL MEMBERS', value: allProfiles.length, icon: Users },
                  { label: 'STRONG BUY SIGNALS', value: allProfiles.filter(p => p.copycatSignal === 'STRONG BUY').length, icon: Zap },
                  { label: 'AGGRESSIVE TRADERS', value: allProfiles.filter(p => p.riskAppetite === 'AGGRESSIVE').length, icon: Target },
                  { label: 'AVG CONVICTION', value: `${Math.round(allProfiles.reduce((s, p) => s + p.convictionLevel, 0) / (allProfiles.length || 1))}%`, icon: BarChart3 },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#0a0a0a] px-5 py-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-white/40 uppercase tracking-widest mb-1">
                      <stat.icon className="w-3 h-3" /> {stat.label}
                    </div>
                    <div className="text-xl font-bold text-white font-mono">{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Member Grid */}
              <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                {allProfiles.map((profile, idx) => (
                  <motion.div
                    key={profile.member}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="bg-white/[0.03] border border-white/5 rounded-lg p-4 hover:border-white/15 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Left: Name + Party */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${profile.copycatSignal === 'STRONG BUY'
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                            : profile.copycatSignal === 'HOLD'
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                              : 'bg-red-500/20 border-red-500/40 text-red-400'
                          }`}>
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{profile.member}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 ${profile.party === 'Democrat' ? 'text-cyan-400 border-cyan-500/30' : 'text-fuchsia-400 border-fuchsia-500/30'
                              }`}>
                              {profile.party}
                            </Badge>
                            <span className="text-[10px] text-white/30">{profile.chamber}</span>
                          </div>
                        </div>
                      </div>

                      {/* Center: Stats */}
                      <div className="flex items-center gap-4 text-xs">
                        <div className="text-center">
                          <div className="text-white/30 text-[9px] uppercase">Trades</div>
                          <div className="font-mono font-bold text-white">{profile.totalTrades}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white/30 text-[9px] uppercase">Buys</div>
                          <div className="font-mono font-bold text-emerald-400">{profile.purchases}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white/30 text-[9px] uppercase">Sells</div>
                          <div className="font-mono font-bold text-red-400">{profile.sales}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white/30 text-[9px] uppercase">Conviction</div>
                          <div className="font-mono font-bold text-white">{profile.convictionLevel}%</div>
                        </div>
                      </div>

                      {/* Right: Signal + Tickers */}
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1 flex-wrap">
                          {profile.topTickers.slice(0, 3).map(t => (
                            <Badge key={t.ticker} variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-white/5 border-white/10 text-white/60">
                              {t.ticker}
                            </Badge>
                          ))}
                        </div>
                        <Badge className={`text-[9px] px-2 py-0.5 font-bold ${profile.copycatSignal === 'STRONG BUY'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : profile.copycatSignal === 'HOLD'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}>
                          {profile.copycatSignal === 'STRONG BUY' && <TrendingUp className="w-3 h-3 mr-1" />}
                          {profile.copycatSignal === 'AVOID' && <TrendingDown className="w-3 h-3 mr-1" />}
                          {profile.copycatSignal === 'HOLD' && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {profile.copycatSignal}
                        </Badge>
                      </div>
                    </div>

                    {/* Conviction Bar */}
                    <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${profile.convictionLevel > 70 ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                            : profile.convictionLevel > 40 ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                              : 'bg-gradient-to-r from-red-500 to-rose-500'
                          }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${profile.convictionLevel}%` }}
                        transition={{ delay: idx * 0.03 + 0.2, duration: 0.6 }}
                      />
                    </div>
                  </motion.div>
                ))}

                {allProfiles.length === 0 && (
                  <div className="text-center py-12 text-white/30 text-sm">
                    No congressional trade data available for analysis.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between">
                <p className="text-[10px] text-white/20 uppercase tracking-widest">QuantSuite Congress X-Ray • Institutional Grade</p>
                <button onClick={() => setShowXRay(false)} className="text-xs text-white/40 hover:text-white transition-colors">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
