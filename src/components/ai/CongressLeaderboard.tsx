import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Users, Search, ArrowRight } from "lucide-react";

interface CongressLeaderboardProps {
  trades: any[];
}

export const CongressLeaderboard: React.FC<CongressLeaderboardProps> = ({ trades }) => {
  const leaderboard = React.useMemo(() => {
    const memberMap = new Map<string, { member: string; party: string; count: number; buyValue: number; tickers: Set<string> }>();
    
    trades.forEach(t => {
      const existing = memberMap.get(t.member) || { member: t.member, party: t.party, count: 0, buyValue: 0, tickers: new Set<string>() };
      existing.count += 1;
      existing.tickers.add(t.ticker);
      
      // Rough estimation for amount sorting (e.g. $100k-$250k -> 175k)
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

  return (
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
          <button className="w-full py-2 text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80 flex items-center justify-center gap-2 border border-dashed border-primary/20 rounded-lg bg-primary/5 hover:bg-primary/10 transition-all">
            <Search className="w-3 h-3" /> Analyze Full Congress List
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
