import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarDays, Clock, TrendingUp, TrendingDown, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EarningsEvent {
  symbol: string;
  companyName: string;
  earningsDate: string;
  epsEstimate: number | null;
  epsActual: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
  surprise: number | null;
  surprisePercent: number | null;
  timing: 'BMO' | 'AMC' | 'TNS' | null;
}

type ViewMode = 'calendar' | 'timeline';
type FilterMode = 'all' | 'this_week' | 'next_week' | 'beats' | 'misses';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function EarningsCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const { data: earningsData, isLoading } = useQuery({
    queryKey: ['earnings-calendar'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-earnings', {
        body: {},
      });
      if (error) throw error;
      return data?.events as EarningsEvent[] || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const events = earningsData || [];

  const filteredEvents = useMemo(() => {
    let filtered = events;
    if (filterMode === 'beats') {
      filtered = filtered.filter(e => e.surprise !== null && e.surprise > 0);
    } else if (filterMode === 'misses') {
      filtered = filtered.filter(e => e.surprise !== null && e.surprise < 0);
    }
    return filtered;
  }, [events, filterMode]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, EarningsEvent[]> = {};
    filteredEvents.forEach(e => {
      if (!map[e.earningsDate]) map[e.earningsDate] = [];
      map[e.earningsDate].push(e);
    });
    return map;
  }, [filteredEvents]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startOffset = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: { date: number; month: number; year: number; isCurrentMonth: boolean; dateStr: string }[] = [];

    // Previous month fill
    const prevLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevLastDay - i;
      const m = currentMonth - 1;
      const y = m < 0 ? currentYear - 1 : currentYear;
      const actualMonth = m < 0 ? 11 : m;
      days.push({
        date: d,
        month: actualMonth,
        year: y,
        isCurrentMonth: false,
        dateStr: `${y}-${String(actualMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    // Current month
    for (let d = 1; d <= totalDays; d++) {
      days.push({
        date: d,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true,
        dateStr: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    // Next month fill
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = currentMonth + 1;
      const y = m > 11 ? currentYear + 1 : currentYear;
      const actualMonth = m > 11 ? 0 : m;
      days.push({
        date: d,
        month: actualMonth,
        year: y,
        isCurrentMonth: false,
        dateStr: `${y}-${String(actualMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    return days;
  }, [currentMonth, currentYear]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const navigateMonth = (dir: -1 | 1) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + dir, 1));
    setSelectedDay(null);
  };

  const selectedDayEvents = selectedDay ? (eventsByDate[selectedDay] || []) : [];

  // Stats
  const totalBeats = events.filter(e => e.surprise !== null && e.surprise > 0).length;
  const totalMisses = events.filter(e => e.surprise !== null && e.surprise < 0).length;
  const upcoming = events.filter(e => new Date(e.earningsDate) >= today).length;

  // Timeline events sorted
  const timelineEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => a.earningsDate.localeCompare(b.earningsDate));
  }, [filteredEvents]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background p-4 md:p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Earnings Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">Track upcoming earnings reports for major companies</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            className="gap-1.5"
          >
            <CalendarDays className="w-4 h-4" /> Calendar
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('timeline')}
            className="gap-1.5"
          >
            <Clock className="w-4 h-4" /> Timeline
          </Button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Events', value: events.length, color: 'hsl(var(--primary))' },
          { label: 'Upcoming', value: upcoming, color: 'hsl(var(--chart-2))' },
          { label: 'Beat Estimates', value: totalBeats, color: 'hsl(var(--trading-profit))' },
          { label: 'Missed Estimates', value: totalMisses, color: 'hsl(var(--trading-loss))' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-4"
          >
            <div className="absolute top-0 left-0 w-1 h-full" style={{ background: stat.color }} />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1 font-mono">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {(['all', 'beats', 'misses'] as FilterMode[]).map(f => (
          <Button
            key={f}
            variant={filterMode === f ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterMode(f)}
            className="text-xs capitalize"
          >
            {f === 'all' ? 'All Events' : f === 'beats' ? '✓ Beats Only' : '✗ Misses Only'}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl overflow-hidden">
              {/* Month Navigation */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-lg font-semibold text-foreground">
                  {MONTHS[currentMonth]} {currentYear}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 border-b border-border/20">
                {WEEKDAYS.map(day => (
                  <div key={day} className="text-center py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, idx) => {
                  const dayEvents = eventsByDate[day.dateStr] || [];
                  const isToday = day.dateStr === todayStr;
                  const isSelected = day.dateStr === selectedDay;
                  const hasEarnings = dayEvents.length > 0;
                  const hasBeat = dayEvents.some(e => e.surprise !== null && e.surprise > 0);
                  const hasMiss = dayEvents.some(e => e.surprise !== null && e.surprise < 0);
                  const isPast = new Date(day.dateStr) < today;

                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => hasEarnings ? setSelectedDay(day.dateStr) : null}
                      className={cn(
                        "relative min-h-[90px] md:min-h-[100px] p-2 border-r border-b border-border/10 transition-all duration-200 text-left group",
                        !day.isCurrentMonth && "opacity-30",
                        isToday && "bg-primary/5 ring-1 ring-inset ring-primary/30",
                        isSelected && "bg-primary/10 ring-2 ring-inset ring-primary/50",
                        hasEarnings && "cursor-pointer hover:bg-muted/30",
                        !hasEarnings && "cursor-default"
                      )}
                    >
                      {/* Date Number */}
                      <span className={cn(
                        "text-sm font-medium",
                        isToday ? "text-primary font-bold" : day.isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {day.date}
                      </span>

                      {/* Today indicator */}
                      {isToday && (
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
                      )}

                      {/* Earnings Dots */}
                      {hasEarnings && (
                        <div className="mt-1 space-y-0.5">
                          {dayEvents.slice(0, 3).map((event, i) => (
                            <div
                              key={i}
                              className={cn(
                                "text-[10px] leading-tight px-1.5 py-0.5 rounded-md truncate font-mono transition-all",
                                event.surprise !== null && event.surprise > 0
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                  : event.surprise !== null && event.surprise < 0
                                  ? "bg-red-500/15 text-red-400 border border-red-500/20"
                                  : "bg-primary/10 text-primary/80 border border-primary/15"
                              )}
                            >
                              {event.symbol}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-[10px] text-muted-foreground font-mono pl-1">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bottom bar indicator */}
                      {hasEarnings && (
                        <div className={cn(
                          "absolute bottom-0 left-0 right-0 h-[3px] transition-all",
                          hasBeat && hasMiss
                            ? "bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500"
                            : hasBeat
                            ? "bg-emerald-500"
                            : hasMiss
                            ? "bg-red-500"
                            : "bg-primary/50"
                        )} />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detail Panel */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {selectedDay ? (
                <motion.div
                  key={selectedDay}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-border/30">
                    <h3 className="text-sm font-semibold text-foreground">
                      {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedDayEvents.length} earnings report{selectedDayEvents.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="divide-y divide-border/20 max-h-[500px] overflow-y-auto">
                    {selectedDayEvents.map((event, i) => (
                      <EarningsCard key={event.symbol} event={event} index={i} />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl p-8 text-center"
                >
                  <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Select a day with earnings to view details</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Legend */}
            <div className="rounded-xl border border-border/30 bg-card/30 p-4 space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Legend</h4>
              <div className="space-y-2">
                {[
                  { color: 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400', label: 'Beat Estimate' },
                  { color: 'bg-red-500/15 border-red-500/20 text-red-400', label: 'Missed Estimate' },
                  { color: 'bg-primary/10 border-primary/15 text-primary/80', label: 'Upcoming / Pending' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={cn("w-8 h-4 rounded border text-[9px] flex items-center justify-center font-mono", item.color)}>
                      SYM
                    </div>
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">BMO</span>
                  <span className="text-xs text-muted-foreground">Before Market Open</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">AMC</span>
                  <span className="text-xs text-muted-foreground">After Market Close</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Timeline View */
        <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border/30">
            <h3 className="text-sm font-semibold text-foreground">Earnings Timeline</h3>
          </div>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-border/40" />

            <div className="divide-y divide-border/10">
              {timelineEvents.map((event, i) => {
                const isPast = new Date(event.earningsDate) < today;
                const isEventToday = event.earningsDate === todayStr;
                const beat = event.surprise !== null && event.surprise > 0;
                const miss = event.surprise !== null && event.surprise < 0;

                return (
                  <motion.div
                    key={`${event.symbol}-${event.earningsDate}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={cn(
                      "relative flex items-start gap-4 px-6 py-4 hover:bg-muted/20 transition-colors",
                      isEventToday && "bg-primary/5"
                    )}
                  >
                    {/* Timeline dot */}
                    <div className={cn(
                      "relative z-10 mt-1.5 w-4 h-4 rounded-full border-2 flex-shrink-0",
                      beat
                        ? "bg-emerald-500/20 border-emerald-500"
                        : miss
                        ? "bg-red-500/20 border-red-500"
                        : isEventToday
                        ? "bg-primary/20 border-primary animate-pulse"
                        : isPast
                        ? "bg-muted border-muted-foreground/30"
                        : "bg-primary/10 border-primary/40"
                    )} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-foreground">{event.symbol}</span>
                        <span className="text-xs text-muted-foreground truncate">{event.companyName}</span>
                        {event.timing && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-mono">
                            {event.timing}
                          </Badge>
                        )}
                        {isEventToday && (
                          <Badge className="text-[10px] px-1.5 py-0 h-5 bg-primary/20 text-primary border-primary/30">
                            TODAY
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-1.5">
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.earningsDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>

                        {event.epsEstimate !== null && (
                          <span className="text-xs text-muted-foreground font-mono">
                            Est: ${event.epsEstimate.toFixed(2)}
                          </span>
                        )}

                        {event.epsActual !== null && (
                          <span className={cn(
                            "text-xs font-mono font-semibold",
                            beat ? "text-emerald-400" : "text-red-400"
                          )}>
                            Act: ${event.epsActual.toFixed(2)}
                          </span>
                        )}

                        {event.surprisePercent !== null && (
                          <span className={cn(
                            "inline-flex items-center gap-0.5 text-xs font-mono font-semibold",
                            beat ? "text-emerald-400" : "text-red-400"
                          )}>
                            {beat ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {beat ? '+' : ''}{event.surprisePercent.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function EarningsCard({ event, index }: { event: EarningsEvent; index: number }) {
  const beat = event.surprise !== null && event.surprise > 0;
  const miss = event.surprise !== null && event.surprise < 0;
  const isPending = event.epsActual === null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="px-5 py-4 hover:bg-muted/10 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-foreground">{event.symbol}</span>
          {event.timing && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-mono">
              {event.timing}
            </Badge>
          )}
        </div>
        {!isPending && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-semibold",
            beat ? "text-emerald-400" : "text-red-400"
          )}>
            {beat ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {beat ? 'BEAT' : 'MISS'}
          </div>
        )}
        {isPending && (
          <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 font-mono">
            UPCOMING
          </Badge>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-1 truncate">{event.companyName}</p>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="space-y-0.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">EPS Est.</p>
          <p className="text-sm font-mono text-foreground">
            {event.epsEstimate !== null ? `$${event.epsEstimate.toFixed(2)}` : '—'}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">EPS Act.</p>
          <p className={cn(
            "text-sm font-mono font-semibold",
            isPending ? "text-muted-foreground" : beat ? "text-emerald-400" : "text-red-400"
          )}>
            {event.epsActual !== null ? `$${event.epsActual.toFixed(2)}` : '—'}
          </p>
        </div>
      </div>

      {event.surprisePercent !== null && (
        <div className={cn(
          "mt-3 px-3 py-2 rounded-lg text-center font-mono text-sm font-bold",
          beat
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "bg-red-500/10 text-red-400 border border-red-500/20"
        )}>
          {beat ? '+' : ''}{event.surprisePercent.toFixed(2)}% Surprise
        </div>
      )}
    </motion.div>
  );
}
