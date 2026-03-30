import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface PremiumHeaderProps {
  userName: string;
}

export function PremiumHeader({ userName }: PremiumHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Check if market is open (Mon-Fri, 9:30 AM - 4:00 PM ET)
      const day = now.getDay();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const timeInMinutes = hours * 60 + minutes;
      const isWeekday = day >= 1 && day <= 5;
      const isDuringHours = timeInMinutes >= 570 && timeInMinutes < 960;
      setIsMarketOpen(isWeekday && isDuringHours);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-xl bg-card/30 backdrop-blur-xl border border-border/30 p-5"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Welcome message - text focused */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
            Command Center
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back, <span className="text-foreground font-medium">{userName}</span>
          </p>
        </div>

        {/* Right: Minimal status indicators */}
        <div className="flex items-center gap-4 text-sm">
          {/* Market Status - minimal */}
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2 h-2 rounded-full",
              isMarketOpen 
                ? "bg-emerald-500 animate-pulse" 
                : "bg-muted-foreground"
            )} />
            <span className={cn(
              "font-medium",
              isMarketOpen ? "text-emerald-400" : "text-muted-foreground"
            )}>
              {isMarketOpen ? 'Market Open' : 'Market Closed'}
            </span>
          </div>

          {/* Time - minimal */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono text-foreground">{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
