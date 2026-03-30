import React, { useState } from 'react';
import { Camera, Maximize2, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CCTVFeed {
    id: string;
    name: string;
    location: string;
    youtubeId: string;
    status: 'live' | 'offline' | 'archived';
    riskLevel: 'low' | 'medium' | 'high';
    lat: string;
    lng: string;
}

const CCTV_FEEDS: CCTVFeed[] = [
    { id: 'kyiv-1', name: 'Kyiv Multi-View', location: 'Kyiv, Ukraine', youtubeId: 'e2gC37ILQmk', status: 'live', riskLevel: 'high', lat: '50.4501° N', lng: '30.5234° E' },
    { id: 'taipei-1', name: 'Taipei 101 Skyline', location: 'Taipei, Taiwan', youtubeId: 'z_fY1pj1VBw', status: 'live', riskLevel: 'medium', lat: '25.0330° N', lng: '121.5654° E' },
    { id: 'telaviv-1', name: 'Middle East Live', location: 'Tel Aviv, Israel', youtubeId: 'Ad210DlxTlY', status: 'live', riskLevel: 'high', lat: '32.0853° N', lng: '34.7818° E' },
    { id: 'times-square', name: 'Times Square Live', location: 'New York, USA', youtubeId: 'rnXIjl_Rzy4', status: 'live', riskLevel: 'low', lat: '40.7580° N', lng: '73.9855° W' },
    { id: 'shibuya', name: 'Shibuya Scramble', location: 'Tokyo, Japan', youtubeId: 'dfVK7ld38Ys', status: 'live', riskLevel: 'low', lat: '35.6595° N', lng: '139.7005° E' },
    { id: 'london', name: 'Abbey Road Cam', location: 'London, UK', youtubeId: 'M3EYAY2MftI', status: 'live', riskLevel: 'low', lat: '51.4895° N', lng: '0.0731° W' }
];

export function LiveCCTV() {
    const [activeFeed, setActiveFeed] = useState<CCTVFeed | null>(CCTV_FEEDS[0]);
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={cn(
            "flex flex-col border border-white/[0.06] bg-[#0a0b0d] rounded-lg overflow-hidden transition-all",
            isExpanded ? "fixed inset-4 z-[9999] shadow-2xl" : "h-full w-full"
        )}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] bg-black/40">
                <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#00f5ff]" />
                    <span className="font-mono text-[11px] font-bold text-foreground uppercase tracking-[0.1em]">LIVE CCTV FEEDS</span>
                    <div className="flex bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded items-center gap-1 ml-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="font-mono text-[9px] font-bold text-red-500 uppercase">REC</span>
                    </div>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 text-muted-foreground hover:text-white transition-colors"
                >
                    {isExpanded ? <X className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
            </div>

            <div className={cn("flex flex-1 overflow-hidden", isExpanded ? "flex-row" : "flex-col")}>
                {/* Main Viewer */}
                <div className={cn("relative bg-black flex flex-col", isExpanded ? "flex-[3] border-r border-white/10" : "h-[220px] shrink-0")}>
                    <div className="absolute inset-0 z-10 pointer-events-none">
                        {/* Scanline Effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%] opacity-20" />
                        
                        {/* Corner Brackets */}
                        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#00f5ff]/40" />
                        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#00f5ff]/40" />
                        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#00f5ff]/40" />
                        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#00f5ff]/40" />

                        {/* Tactical Telemetry */}
                        <div className="absolute top-4 left-12 flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                <span className="font-mono text-[10px] font-bold text-red-500 uppercase tracking-widest">SIGNAL_OK</span>
                            </div>
                            <span className="font-mono text-[9px] text-white/40 tracking-tighter">BITRATE: 4.2 MBPS</span>
                        </div>

                        {/* Coordinates OSD (Bottom Left) */}
                        <div className="absolute bottom-6 left-6 font-mono text-[10px] text-[#00f5ff]/60 tracking-wider flex flex-col gap-0">
                            <div className="flex items-center gap-1.5 border-b border-[#00f5ff]/20 pb-0.5 mb-0.5">
                                <span className="text-[9px] opacity-40">COORD:</span>
                                <span>{activeFeed?.location.split(',')[0].toUpperCase()}</span>
                            </div>
                            <span>LAT: {activeFeed?.lat}</span>
                            <span>LNG: {activeFeed?.lng}</span>
                        </div>

                        {/* Center Reticle */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center opacity-20">
                            <div className="w-1 h-8 bg-[#00f5ff]/40 absolute" />
                            <div className="w-8 h-1 bg-[#00f5ff]/40 absolute" />
                        </div>
                    </div>

                    {activeFeed ? (
                        <div className="absolute inset-0 w-full h-full bg-black z-0">
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${activeFeed.youtubeId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1`}
                                title={activeFeed.name}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full object-cover scale-[1.05]"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center w-full h-full text-muted-foreground font-mono text-xs gap-2">
                            <AlertCircle className="w-4 h-4" /> NO FEED SELECTED
                        </div>
                    )}
                    {activeFeed && (
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent pointer-events-none z-20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-mono text-[13px] font-bold text-white shadow-black drop-shadow-md">{activeFeed.name}</div>
                                    <div className="font-mono text-[10px] text-white/70 shadow-black drop-shadow-md">{activeFeed.location}</div>
                                </div>
                                <div className={cn(
                                    "px-2 py-1 rounded-sm font-mono text-[10px] font-bold uppercase",
                                    activeFeed.riskLevel === 'high' ? "bg-red-500/20 text-red-500 border border-red-500/30" :
                                        activeFeed.riskLevel === 'medium' ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                                            "bg-green-500/20 text-green-400 border border-green-500/30"
                                )}>
                                    {activeFeed.riskLevel} RISK
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Feed List Grid */}
                <div className={cn(
                    "overflow-y-auto bg-[#0a0b0d]",
                    isExpanded ? "flex-1 w-[300px]" : "flex-1 border-t border-white/[0.06]"
                )}>
                    <div className="grid grid-cols-1 divide-y divide-white/[0.06]">
                        {CCTV_FEEDS.map(feed => (
                            <button
                                key={feed.id}
                                onClick={() => setActiveFeed(feed)}
                                className={cn(
                                    "flex items-center gap-3 p-3 text-left transition-colors hover:bg-white/[0.03]",
                                    activeFeed?.id === feed.id ? "bg-[#00f5ff]/10 border-l-2 border-[#00f5ff]" : "border-l-2 border-transparent"
                                )}
                            >
                                <div className="relative w-16 h-10 bg-black rounded shrink-0 overflow-hidden border border-white/[0.1]">
                                    <img
                                        src={`https://img.youtube.com/vi/${feed.youtubeId}/mqdefault.jpg`}
                                        alt={feed.name}
                                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                                    />
                                    {feed.status === 'live' && (
                                        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    )}
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="font-mono text-[11px] font-bold text-foreground truncate">{feed.name}</span>
                                    <span className="font-mono text-[9px] text-muted-foreground truncate">{feed.location}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
