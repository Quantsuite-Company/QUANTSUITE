import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

// We dynamically import Leaflet to avoid SSR issues
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { type MarketEvent } from './EventTimeline';

interface FinancialCenter {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  type: 'exchange' | 'central-bank' | 'commodity' | 'financial' | 'cable' | 'route';
  details: string;
}

const CENTERS: FinancialCenter[] = [
  // Americas
  { id: 'nyse', name: 'NYSE', city: 'New York', country: 'US', lat: 40.7069, lng: -74.0089, type: 'exchange', details: 'New York Stock Exchange' },
  { id: 'nasdaq', name: 'NASDAQ', city: 'New York', country: 'US', lat: 40.7561, lng: -73.9876, type: 'exchange', details: 'NASDAQ Composite' },
  { id: 'fed', name: 'Federal Reserve', city: 'Washington', country: 'US', lat: 38.8929, lng: -77.0457, type: 'central-bank', details: 'Federal Reserve System' },
  { id: 'cme', name: 'CME', city: 'Chicago', country: 'US', lat: 41.8819, lng: -87.6329, type: 'commodity', details: 'Chicago Mercantile Exchange' },
  { id: 'tsx', name: 'TSX', city: 'Toronto', country: 'CA', lat: 43.6487, lng: -79.3819, type: 'exchange', details: 'Toronto Stock Exchange' },
  { id: 'b3', name: 'B3', city: 'São Paulo', country: 'BR', lat: -23.5489, lng: -46.6338, type: 'exchange', details: 'B3 Brasil Bolsa Balcão' },

  // Europe
  { id: 'lse', name: 'LSE', city: 'London', country: 'UK', lat: 51.5139, lng: -0.0864, type: 'exchange', details: 'London Stock Exchange' },
  { id: 'boe', name: 'Bank of England', city: 'London', country: 'UK', lat: 51.5142, lng: -0.0885, type: 'central-bank', details: 'Bank of England' },
  { id: 'xetra', name: 'XETRA', city: 'Frankfurt', country: 'DE', lat: 50.1109, lng: 8.6821, type: 'exchange', details: 'Frankfurt Stock Exchange' },
  { id: 'ecb', name: 'ECB', city: 'Frankfurt', country: 'DE', lat: 50.1128, lng: 8.7032, type: 'central-bank', details: 'European Central Bank' },
  { id: 'enx', name: 'Euronext', city: 'Paris', country: 'FR', lat: 48.8703, lng: 2.3412, type: 'exchange', details: 'Euronext Paris' },
  { id: 'six', name: 'SIX', city: 'Zurich', country: 'CH', lat: 47.3769, lng: 8.5417, type: 'exchange', details: 'Swiss Exchange' },
  { id: 'moex', name: 'MOEX', city: 'Moscow', country: 'RU', lat: 55.7558, lng: 37.6173, type: 'exchange', details: 'Moscow Exchange' },

  // Asia
  { id: 'jpx', name: 'JPX', city: 'Tokyo', country: 'JP', lat: 35.6817, lng: 139.7718, type: 'exchange', details: 'Tokyo Stock Exchange' },
  { id: 'boj', name: 'Bank of Japan', city: 'Tokyo', country: 'JP', lat: 35.6849, lng: 139.7678, type: 'central-bank', details: 'Bank of Japan' },
  { id: 'hkex', name: 'HKEX', city: 'Hong Kong', country: 'HK', lat: 22.2793, lng: 114.1628, type: 'exchange', details: 'Hong Kong Exchange' },
  { id: 'sse', name: 'SSE', city: 'Shanghai', country: 'CN', lat: 31.2345, lng: 121.4781, type: 'exchange', details: 'Shanghai Stock Exchange' },
  { id: 'pboc', name: 'PBOC', city: 'Beijing', country: 'CN', lat: 39.9123, lng: 116.4036, type: 'central-bank', details: 'People\'s Bank of China' },
  { id: 'bse', name: 'BSE', city: 'Mumbai', country: 'IN', lat: 18.9316, lng: 72.8335, type: 'exchange', details: 'Bombay Stock Exchange' },
  { id: 'nse', name: 'NSE', city: 'Mumbai', country: 'IN', lat: 19.0549, lng: 72.8621, type: 'exchange', details: 'National Stock Exchange' },
  { id: 'sgx', name: 'SGX', city: 'Singapore', country: 'SG', lat: 1.2863, lng: 103.8520, type: 'exchange', details: 'Singapore Exchange' },
  { id: 'krx', name: 'KRX', city: 'Seoul', country: 'KR', lat: 37.5259, lng: 126.9247, type: 'exchange', details: 'Korea Exchange' },
  { id: 'twse', name: 'TWSE', city: 'Taipei', country: 'TW', lat: 25.0330, lng: 121.5654, type: 'exchange', details: 'Taiwan Stock Exchange' },

  // MENA
  { id: 'tadawul', name: 'Tadawul', city: 'Riyadh', country: 'SA', lat: 24.7115, lng: 46.6829, type: 'exchange', details: 'Saudi Stock Exchange' },
  { id: 'dfm', name: 'DFM', city: 'Dubai', country: 'AE', lat: 25.2173, lng: 55.2659, type: 'exchange', details: 'Dubai Financial Market' },
  { id: 'qe', name: 'QSE', city: 'Doha', country: 'QA', lat: 25.2854, lng: 51.5310, type: 'exchange', details: 'Qatar Stock Exchange' },

  // Africa  
  { id: 'jse', name: 'JSE', city: 'Johannesburg', country: 'ZA', lat: -26.2027, lng: 28.0441, type: 'exchange', details: 'Johannesburg Stock Exchange' },
  { id: 'egx', name: 'EGX', city: 'Cairo', country: 'EG', lat: 30.0444, lng: 31.2357, type: 'exchange', details: 'Egyptian Exchange' },

  // Oceania
  { id: 'asx', name: 'ASX', city: 'Sydney', country: 'AU', lat: -33.8688, lng: 151.2093, type: 'exchange', details: 'Australian Securities Exchange' },
  { id: 'nzx', name: 'NZX', city: 'Wellington', country: 'NZ', lat: -41.2865, lng: 174.7762, type: 'exchange', details: 'New Zealand Exchange' },

  // Commodities
  { id: 'nymex', name: 'NYMEX', city: 'New York', country: 'US', lat: 40.7127, lng: -74.0134, type: 'commodity', details: 'New York Mercantile Exchange' },
  { id: 'lme', name: 'LME', city: 'London', country: 'UK', lat: 51.5165, lng: -0.0813, type: 'commodity', details: 'London Metal Exchange' },
  { id: 'shfe', name: 'SHFE', city: 'Shanghai', country: 'CN', lat: 31.2304, lng: 121.4737, type: 'commodity', details: 'Shanghai Futures Exchange' },
  { id: 'tocom', name: 'TOCOM', city: 'Tokyo', country: 'JP', lat: 35.6895, lng: 139.6917, type: 'commodity', details: 'Tokyo Commodity Exchange' },

  // Undersea Cables (Landing Points)
  { id: 'bude', name: 'GTT Atlantic', city: 'Bude', country: 'UK', lat: 50.8306, lng: -4.5445, type: 'cable', details: 'Major Transatlantic Cable Landing' },
  { id: 'mumbai-cable', name: 'SeaMeWe-3', city: 'Mumbai', country: 'IN', lat: 18.9220, lng: 72.8347, type: 'cable', details: 'Asia-Europe Cable Connection' },
  { id: 'fujairah', name: 'SMEA', city: 'Fujairah', country: 'AE', lat: 25.1288, lng: 56.3265, type: 'cable', details: 'Middle East Cable Hub' },
  { id: 'alexandria', name: 'TE North', city: 'Alex', country: 'EG', lat: 31.2001, lng: 29.9187, type: 'cable', details: 'Mediterranean Cable Hub' },

  // Trade Routes (Major Chokepoints)
  { id: 'suez', name: 'Suez Canal', city: 'Egypt', country: 'EG', lat: 30.5852, lng: 32.2654, type: 'route', details: 'Global Trade Chokepoint' },
  { id: 'panama', name: 'Panama Canal', city: 'Panama', country: 'PA', lat: 9.1438, lng: -79.7303, type: 'route', details: 'Global Trade Chokepoint' },
  { id: 'hormuz', name: 'Strait of Hormuz', city: 'Oman', country: 'OM', lat: 26.5667, lng: 56.2500, type: 'route', details: 'Oil Transit Chokepoint' },
  { id: 'malacca', name: 'Strait of Malacca', city: 'Singapore', country: 'SG', lat: 1.4300, lng: 102.8900, type: 'route', details: 'Asian Trade Chokepoint' },
];

// worldmonitor-style color coding
const typeColors: Record<string, { fill: string; stroke: string; className: string }> = {
  'exchange': { fill: '#FFD700', stroke: '#FFD700', className: 'exchange-marker' },     // Gold (yellow in worldmonitor)
  'financial': { fill: '#00f5ff', stroke: '#00f5ff', className: 'financial-marker' },    // Cyan (their financial center color)
  'central-bank': { fill: '#10b981', stroke: '#10b981', className: 'central-bank-marker' }, // Green
  'commodity': { fill: '#ff8c00', stroke: '#ff8c00', className: 'commodity-marker' },    // Orange
  'cable': { fill: '#e879f9', stroke: '#e879f9', className: 'cable-marker' },            // Purple
  'route': { fill: '#3b82f6', stroke: '#3b82f6', className: 'route-marker' },            // Blue
};

const REGION_BOUNDS: Record<string, [[number, number], [number, number]]> = {
  'Global': [[-50, -180], [70, 180]],
  'Americas': [[-40, -130], [55, -30]],
  'Europe': [[35, -15], [72, 45]],
  'Asia': [[-10, 60], [55, 145]],
  'MENA': [[10, 25], [42, 65]],
  'Africa': [[-35, -20], [38, 55]],
  'Oceania': [[-50, 110], [-5, 180]],
};

function getMarketStatus(center: FinancialCenter): 'open' | 'closed' | 'pre' | 'post' {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const country = center.country;

  if (['US', 'CA'].includes(country)) {
    if (utcHour >= 14 && utcHour < 21) return 'open';
    if (utcHour >= 13 && utcHour < 14) return 'pre';
    if (utcHour >= 21 && utcHour < 22) return 'post';
  } else if (['UK', 'DE', 'FR', 'CH'].includes(country)) {
    if (utcHour >= 8 && utcHour < 16) return 'open';
    if (utcHour >= 7 && utcHour < 8) return 'pre';
  } else if (['JP', 'KR', 'TW'].includes(country)) {
    if (utcHour >= 0 && utcHour < 6) return 'open';
  } else if (['CN', 'HK'].includes(country)) {
    if (utcHour >= 1 && utcHour < 7) return 'open';
  } else if (['IN'].includes(country)) {
    if (utcHour >= 4 && utcHour < 10) return 'open';
  } else if (['SG'].includes(country)) {
    if (utcHour >= 1 && utcHour < 9) return 'open';
  } else if (['SA', 'AE', 'QA'].includes(country)) {
    if (utcHour >= 7 && utcHour < 14) return 'open';
  } else if (['AU', 'NZ'].includes(country)) {
    if (utcHour >= 23 || utcHour < 5) return 'open';
  }
  return 'closed';
}

interface InteractiveMapProps {
  region: string;
  layers?: string[];
  events?: MarketEvent[];
}

// Custom hook to fetch live flights using OpenSky Network
function useLiveFlights(map: L.Map | null, enabled: boolean) {
  const [flights, setFlights] = useState<any[]>([]);

  useEffect(() => {
    if (!map || !enabled) {
      setFlights([]);
      return;
    }
    let interval: NodeJS.Timeout;
    const fetchFlights = async () => {
      try {
        const bounds = map.getBounds();
        const wrapLomin = Math.max(-180, bounds.getWest());
        const wrapLomax = Math.min(180, bounds.getEast());
        const wrapLamin = Math.max(-90, bounds.getSouth());
        const wrapLamax = Math.min(90, bounds.getNorth());

        const res = await fetch(`https://opensky-network.org/api/states/all?lamin=${wrapLamin}&lomin=${wrapLomin}&lamax=${wrapLamax}&lomax=${wrapLomax}`);
        if (res.ok) {
          const data = await res.json();
          if (data.states) {
            setFlights(data.states.map((s: any[]) => ({
              id: s[0], callsign: s[1]?.trim(), country: s[2], lng: s[5], lat: s[6], velocity: s[9], track: s[10]
            })).filter((f: any) => f.lat && f.lng));
          }
        }
      } catch (err) {
        console.error('OpenSky Error:', err);
      }
    };
    fetchFlights();
    interval = setInterval(fetchFlights, 10000);
    map.on('moveend', fetchFlights);

    return () => {
      clearInterval(interval);
      map.off('moveend', fetchFlights);
    };
  }, [map, enabled]);

  return flights;
}

// Helper to generate realistic mock vessels along major routes
function generateMockVessels(count: number) {
  const routes = [
    // Med to Suez
    { latStr: 33, latEnd: 31, lngStr: 25, lngEnd: 32 },
    // Malacca
    { latStr: 5, latEnd: 1, lngStr: 98, lngEnd: 104 },
    // English Channel
    { latStr: 49, latEnd: 51, lngStr: -5, lngEnd: 2 },
    // US East Coast
    { latStr: 25, latEnd: 40, lngStr: -78, lngEnd: -70 }
  ];

  const mocks: Record<string, any> = {};
  for (let i = 0; i < count; i++) {
    const route = routes[Math.floor(Math.random() * routes.length)];
    const progress = Math.random();

    // Add some jitter
    const lat = route.latStr + (route.latEnd - route.latStr) * progress + (Math.random() - 0.5);
    const lng = route.lngStr + (route.lngEnd - route.lngStr) * progress + (Math.random() - 0.5);

    // Calculate heading roughly based on route direction
    const dLat = route.latEnd - route.latStr;
    const dLng = route.lngEnd - route.lngStr;
    let heading = (Math.atan2(dLng, dLat) * 180 / Math.PI);
    if (heading < 0) heading += 360;

    mocks[`mock-${i}`] = {
      id: `999${Math.floor(Math.random() * 100000)}`,
      lat,
      lng,
      cog: heading,
      sog: 12 + Math.random() * 8, // 12-20 knots
      trueHeading: heading,
      timestamp: Date.now()
    };
  }
  return mocks;
}

// Custom Hook to stream Live Vessels via AISStream WebSockets
function useLiveVessels(map: L.Map | null, enabled: boolean) {
  const [vessels, setVessels] = useState<Record<string, any>>({});
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    if (!map || !enabled) {
      setVessels({});
      return;
    }

    // We attempt connection. If user has API key in localStorage, we use it.
    // Otherwise, we use a public proxy if available, or just fallback silently.
    const apiKey = localStorage.getItem('AISSTREAM_API_KEY') || 'e6e3ea0836cedbcba579debbc5ee72d4c06497f5';

    let socket: WebSocket | null = null;
    let fallbackTimer: NodeJS.Timeout;

    const triggerFallback = () => {
      setUseFallback(true);
      setVessels(generateMockVessels(45)); // Generate 45 realistic ships
      // Update mock positions slowly
      fallbackTimer = setInterval(() => {
        setVessels(prev => {
          const updated = { ...prev };
          Object.values(updated).forEach(v => {
            // Move slightly along heading
            const hdgRad = v.cog * Math.PI / 180;
            const distSq = (v.sog / 3600) * 0.01; // Tiny fraction of degrees
            v.lat += Math.cos(hdgRad) * distSq;
            v.lng += Math.sin(hdgRad) * distSq;
          });
          return updated;
        });
      }, 5000);
    };

    const connect = () => {
      socket = new WebSocket("wss://stream.aisstream.io/v0/stream");

      const connectionTimeout = setTimeout(() => {
        if (Object.keys(vessels).length === 0) triggerFallback();
      }, 5000); // 5 seconds to get real data or fallback

      socket.onopen = () => {
        const bbox = [[
          [-60, -180],
          [75, 180]
        ]];

        socket?.send(JSON.stringify({
          APIKey: apiKey,
          BoundingBoxes: bbox
        }));
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.MessageType === "PositionReport") {
            const report = msg.Message.PositionReport;
            if (report && report.Latitude && report.Longitude) {
              clearTimeout(connectionTimeout); // We got real data
              if (useFallback) {
                setUseFallback(false);
                clearInterval(fallbackTimer);
                setVessels({}); // Clear mocks
              }

              setVessels(prev => {
                const updated = { ...prev };
                updated[report.UserID] = {
                  id: report.UserID,
                  lat: report.Latitude,
                  lng: report.Longitude,
                  cog: report.Cog,
                  sog: report.Sog,
                  trueHeading: report.TrueHeading,
                  timestamp: Date.now()
                };

                // Keep only fresh vessels (last 2 mins) and limit total count so UI doesn't crash
                const now = Date.now();
                const keys = Object.keys(updated);

                if (keys.length > 300) {
                  // Delete oldest if we have too many
                  const sorted = keys.sort((a, b) => updated[b].timestamp - updated[a].timestamp);
                  for (let i = 300; i < sorted.length; i++) delete updated[sorted[i]];
                }

                keys.forEach(k => {
                  if (now - updated[k].timestamp > 120000) delete updated[k];
                });
                return updated;
              });
            }
          }
        } catch (e) { }
      };

      socket.onerror = () => {
        if (!useFallback && Object.keys(vessels).length === 0) triggerFallback();
        if (socket) socket.close();
      };

      socket.onclose = () => {
        if (!useFallback && Object.keys(vessels).length === 0) triggerFallback();
        setTimeout(connect, 15000); // Reconnect loop slower
      };
    };

    connect();

    const updateBBox = () => {
      if (socket && socket.readyState === WebSocket.OPEN && !useFallback) {
        const bbox = [[
          [-60, -180],
          [75, 180]
        ]];
        socket.send(JSON.stringify({
          APIKey: apiKey,
          BoundingBoxes: bbox
        }));
      }
    };
    map.on('moveend', updateBBox);

    return () => {
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      clearInterval(fallbackTimer);
      map.off('moveend', updateBBox);
    };
  }, [map, enabled]);

  return Object.values(vessels);
}

export function InteractiveMap({ region, layers, events }: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [animatedPos, setAnimatedPos] = useState({ lat: 18.9750, lng: 72.8258, t: 0 });

  // Smooth animation for special vessel
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedPos(prev => {
        const nextT = (prev.t + 0.001) % 1;
        const indiaPos: [number, number] = [18.9750, 72.8258];
        const australiaPos: [number, number] = [-33.8688, 151.2093];

        // Simple interpolation with waypoints
        let lat, lng;
        if (nextT < 0.33) {
          const p = nextT / 0.33;
          lat = indiaPos[0] + (2 - indiaPos[0]) * p;
          lng = indiaPos[1] + (80 - indiaPos[1]) * p;
        } else if (nextT < 0.66) {
          const p = (nextT - 0.33) / 0.33;
          lat = 2 + (-15 - 2) * p;
          lng = 80 + (110 - 80) * p;
        } else {
          const p = (nextT - 0.66) / 0.34;
          lat = -15 + (australiaPos[0] - (-15)) * p;
          lng = 110 + (australiaPos[1] - 110) * p;
        }
        return { lat, lng, t: nextT };
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [28, 45],
      zoom: 3,
      zoomControl: false,
      attributionControl: false,
      minZoom: 2,
      maxZoom: 12,
    });

    // Dark tile layer — CartoDB Dark Matter (like worldmonitor's dark theme)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
    }).addTo(map);

    // Labels layer on top (lighter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      opacity: 0.6,
    }).addTo(map);

    // Tactical coordinate grid overlay
    const gridLayer = L.layerGroup().addTo(map);
    const drawGrid = () => {
      gridLayer.clearLayers();
      const bounds = map.getBounds();
      const west = Math.floor(bounds.getWest() / 10) * 10;
      const east = Math.ceil(bounds.getEast() / 10) * 10;
      const south = Math.floor(bounds.getSouth() / 10) * 10;
      const north = Math.ceil(bounds.getNorth() / 10) * 10;

      for (let x = west; x <= east; x += 20) {
        L.polyline([[south, x], [north, x]], { color: '#ffffff', weight: 0.5, opacity: 0.05, dashArray: '4, 4' }).addTo(gridLayer);
      }
      for (let y = south; y <= north; y += 20) {
        L.polyline([[y, west], [y, east]], { color: '#ffffff', weight: 0.5, opacity: 0.05, dashArray: '4, 4' }).addTo(gridLayer);
      }
    };
    drawGrid();
    map.on('moveend', drawGrid);

    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    // Fix map loading glitch: force Leaflet to recalculate container size
    // after a short delay so that it accurately renders all tiles
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    // Also observe container size changes (e.g., window resize)
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  // Update markers when region or layers change
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    // Clear existing markers
    markersRef.current.clearLayers();

    // Mapping layers checkboxes to data types
    const layerTypesMap: Record<string, string[]> = {
      'exchanges': ['exchange'],
      'financial': ['financial'],
      'central-banks': ['central-bank'],
      'commodities': ['commodity'],
      'trade-routes': ['route'],
      'cables': ['cable'],
    };

    const activeTypes = layers?.flatMap(l => layerTypesMap[l] || []) || [];

    // Filter centers by region
    const regionCountryMap: Record<string, string[]> = {
      'Global': [],
      'Americas': ['US', 'CA', 'BR', 'PA'],
      'Europe': ['UK', 'DE', 'FR', 'CH', 'RU'],
      'Asia': ['JP', 'KR', 'CN', 'HK', 'IN', 'SG', 'TW'],
      'MENA': ['SA', 'AE', 'QA', 'EG', 'OM'],
      'Africa': ['ZA', 'EG'],
      'Oceania': ['AU', 'NZ'],
    };

    const filteredCenters = region === 'Global'
      ? CENTERS
      : CENTERS.filter(c => regionCountryMap[region]?.includes(c.country));

    // Add markers
    filteredCenters.forEach(center => {
      const status = getMarketStatus(center);
      const colors = typeColors[center.type];
      const isOpen = status === 'open';

      // Create pulsing circle marker
      const markerSize = isOpen ? 8 : 6;

      // RADAR SIGNATURE HTML
      const markerHtml = `
        <div class="radar-signature" style="--sig-color: ${colors.fill}; --sig-opacity: ${isOpen ? 1 : 0.4};">
          <div class="sig-square"></div>
          ${isOpen ? '<div class="sig-scan"></div>' : ''}
          <div class="sig-bracket-tl"></div>
          <div class="sig-bracket-br"></div>
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'financial-marker-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([center.lat, center.lng], { icon }).addTo(markersRef.current!);

      // Worldmonitor-style tooltip
      const statusColor = status === 'open' ? '#10b981' : status === 'pre' ? '#f59e0b' : status === 'post' ? '#a855f7' : '#6b7280';
      const statusLabel = status.toUpperCase();

      marker.bindPopup(`
        <div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:8px;padding:12px;min-width:180px;color:#e0e0e0;font-family:'JetBrains Mono',monospace;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <div style="width:8px;height:8px;border-radius:50%;background:${colors.fill};box-shadow:0 0 8px ${colors.fill}60;"></div>
            <span style="font-size:13px;font-weight:700;letter-spacing:0.05em;">${center.name}</span>
          </div>
          <div style="font-size:11px;color:#9ca3af;margin-bottom:4px;">${center.details}</div>
          <div style="font-size:11px;color:#9ca3af;margin-bottom:8px;">${center.city}, ${center.country}</div>
          <div style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:0.1em;background:${statusColor}20;color:${statusColor};border:1px solid ${statusColor}40;">
            ${statusLabel}
          </div>
        </div>
      `, {
        className: 'dark-popup',
        closeButton: false,
        offset: [0, -8],
      });
    });

    // Fly to region bounds
    const bounds = REGION_BOUNDS[region];
    if (bounds) {
      mapRef.current.flyToBounds(bounds, {
        duration: 1.2,
        padding: [20, 20],
      });
    }
  }, [region, layers]); // Separated to prevent full rerender when live events arrive

  // Draw real-time dynamic AI events
  const aiEventsRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!aiEventsRef.current) {
      aiEventsRef.current = L.layerGroup().addTo(mapRef.current);
    }

    const layer = aiEventsRef.current;
    layer.clearLayers();

    events?.forEach(ev => {
      if (!ev.lat || !ev.lng) return;

      const isHighImpact = ev.impact === 'high';
      const eventColor = isHighImpact ? '#ef4444' : '#f97316'; // Red for high, Orange for medium

      const icon = L.divIcon({
        className: 'financial-marker-icon',
        html: `
          <div class="relative flex items-center justify-center w-12 h-12">
            <!-- Ripple FX -->
            ${isHighImpact ? `
              <div class="absolute w-full h-full rounded-full border border-${eventColor} animate-[ping_3s_linear_infinite] opacity-40"></div>
              <div class="absolute w-full h-full rounded-full border border-${eventColor} animate-[ping_3s_linear_infinite] opacity-20 delay-1000"></div>
            ` : ''}
            <div class="tactical-marker" style="--marker-color: ${eventColor}">
              <div class="marker-core"></div>
              <div class="marker-outline"></div>
            </div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      L.marker([ev.lat, ev.lng], { icon }).addTo(layer)
        .bindTooltip(`
          <div class="flex flex-col gap-1">
            <div style="color:${eventColor};font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">🚨 LIVE EVENT</div>
            <div style="font-size:11px;font-weight:600;color:#fff;">${ev.title}</div>
          </div>
        `, {
          className: 'dark-popup',
          direction: 'top',
          offset: [0, -10]
        });
    });

  }, [events]);

  // LIVE DATA RENDERERS
  const liveDataLayerRef = useRef<L.LayerGroup | null>(null);

  // Actually hook up the live data!
  // If trade-routes are passed, we enable AIS. If not, we still show planes as a generic global tracker layer unless user toggles off.
  const enableVessels = layers?.includes('trade-routes') ?? true;
  const enableFlights = layers?.includes('trade-routes') ?? true; // we group flights with trade for now

  const liveFlights = useLiveFlights(mapRef.current, enableFlights);
  const liveVessels = useLiveVessels(mapRef.current, enableVessels);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!liveDataLayerRef.current) {
      liveDataLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }
    const layer = liveDataLayerRef.current;
    layer.clearLayers();

    // Debug tracking
    console.log(`Rendering ${liveFlights.length} flights and ${liveVessels.length} vessels`);

    // Draw Flights
    liveFlights.forEach(flight => {
      const planeSvg = `<svg viewBox="0 0 24 24" style="transform: rotate(${flight.track - 45}deg); fill: #38bdf8; filter: drop-shadow(0 0 6px #38bdf880);" width="18" height="18"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`;
      const icon = L.divIcon({ html: planeSvg, className: 'plane-marker-icon', iconSize: [18, 18], iconAnchor: [9, 9] });
      L.marker([flight.lat, flight.lng], { icon }).addTo(layer)
        .bindTooltip(`
          <div style="font-family:'JetBrains Mono',monospace; font-size:10px; color:#38bdf8; background:rgba(10,11,13,0.9); padding:4px; border:1px solid #38bdf8;">
            <b>FLIGHT ${flight.callsign || flight.id}</b><br/>
            SPD: ${Math.round(flight.velocity * 3.6)} KM/H
          </div>
        `, { className: 'dark-tooltip-bloomberg', direction: 'top' });
    });

    // Draw Vessels with 3D Polygon Faceted Look
    liveVessels.forEach(vessel => {
      const isMock = vessel.id.startsWith('999');
      const heading = (vessel.trueHeading !== 511 ? vessel.trueHeading : vessel.cog) || 0;

      const shipSvg = `
        <svg viewBox="0 0 24 24" style="transform: rotate(${heading}deg); filter: drop-shadow(0 0 6px ${isMock ? '#00f5ff' : '#10b981'});" width="24" height="24">
          <!-- Main Hull Facets -->
          <path d="M12 2L15 12L12 22L9 12Z" fill="${isMock ? '#00f5ff' : '#10b981'}" />
          <path d="M12 2L17 12L12 15Z" fill="white" fill-opacity="0.3" />
          <path d="M12 2L7 12L12 15Z" fill="black" fill-opacity="0.2" />
          <path d="M12 22L17 12L12 15Z" fill="white" fill-opacity="0.1" />
          <circle cx="12" cy="12" r="1.5" fill="white" />
        </svg>
      `;
      const icon = L.divIcon({ html: shipSvg, className: 'vessel-marker-icon', iconSize: [24, 24], iconAnchor: [12, 12] });
      L.marker([vessel.lat, vessel.lng], { icon }).addTo(layer)
        .bindTooltip(`
          <div style="font-family:'JetBrains Mono',monospace; font-size:10px; color:${isMock ? '#00f5ff' : '#10b981'}; background:rgba(10,11,13,0.9); padding:4px; border:1px solid ${isMock ? '#00f5ff' : '#10b981'};">
            <b>${isMock ? 'SIMULATED' : 'LIVE'}</b> ID: ${vessel.id}<br/>
            SOG: ${Math.round(vessel.sog)} KTS
          </div>
        `, { className: 'dark-tooltip-bloomberg', direction: 'top' });
    });

    // Special Route: Mumbai to Sydney
    const indiaPos: [number, number] = [18.9750, 72.8258];
    const australiaPos: [number, number] = [-33.8688, 151.2093];

    L.polyline([indiaPos, [2, 80], [-15, 110], australiaPos], {
      color: '#FFD700',
      weight: 1.5,
      opacity: 0.4,
      dashArray: '8, 8'
    }).addTo(layer);

    // Special Gold Vessel (3D Faceted)
    const specialShipSvg = `
      <svg viewBox="0 0 24 24" style="filter: drop-shadow(0 0 10px #FFD700);" width="32" height="32">
        <path d="M12 2L17 12L12 22L7 12Z" fill="#FFD700" />
        <path d="M12 2L19 12L12 16Z" fill="white" fill-opacity="0.4" />
        <path d="M12 2L5 12L12 16Z" fill="black" fill-opacity="0.3" />
        <circle cx="12" cy="12" r="2.5" fill="white" />
      </svg>
    `;
    const specialIcon = L.divIcon({ html: specialShipSvg, className: 'special-vessel-icon', iconSize: [32, 32], iconAnchor: [16, 16] });
    L.marker([animatedPos.lat, animatedPos.lng], { icon: specialIcon }).addTo(layer)
      .bindTooltip(`
        <div style="font-family:'JetBrains Mono',monospace; font-size:11px; color:#FFD700; background:rgba(0,0,0,0.95); padding:8px; border:2px solid #FFD700; border-radius:4px; box-shadow: 0 0 20px rgba(255,215,0,0.4);">
          <b style="font-size:12px; display:block; margin-bottom:4px; border-bottom:1px solid #FFD700;">PRECIOUS CARGO IN TRANSIT</b>
          <div style="color:#aaa;">LOC: ${animatedPos.lat.toFixed(2)}, ${animatedPos.lng.toFixed(2)}</div>
          <div style="color:#FFD700; font-weight:bold; margin-top:4px;">DEST: SYDNEY [AUS]</div>
        </div>
      `, { className: 'dark-tooltip-bloomberg', direction: 'top', permanent: true });

  }, [liveFlights, liveVessels, animatedPos]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ background: '#0a0b0d' }}
      />

      {/* Inject custom CSS for Leaflet markers and popups */}
      <style>{`
        .financial-marker {
          position: relative;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .marker-core {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          z-index: 2;
          box-shadow: 0 0 10px var(--marker-color);
        }
        .marker-pulse {
          position: absolute;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 1px solid;
          animation: pulse-ring 2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
        .financial-marker-icon {
          background: none !important;
          border: none !important;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .dark-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
          border-radius: 0 !important;
          border: none !important;
        }
        .dark-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        .dark-popup .leaflet-popup-tip {
          background: #1a1a2e !important;
          border: 1px solid #2a2a4a !important;
        }
        .radar-signature {
          position: relative;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sig-square {
          width: 4px;
          height: 4px;
          background: var(--sig-color);
          opacity: var(--sig-opacity);
          box-shadow: 0 0 8px var(--sig-color);
        }
        .sig-scan {
          position: absolute;
          inset: -4px;
          border: 1px solid var(--sig-color);
          opacity: 0.3;
          animation: sig-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .sig-bracket-tl {
          position: absolute;
          top: 0; left: 0;
          width: 6px; height: 6px;
          border-top: 1.5px solid var(--sig-color);
          border-left: 1.5px solid var(--sig-color);
          opacity: 0.6;
        }
        .sig-bracket-br {
          position: absolute;
          bottom: 0; right: 0;
          width: 6px; height: 6px;
          border-bottom: 1.5px solid var(--sig-color);
          border-right: 1.5px solid var(--sig-color);
          opacity: 0.6;
        }
        @keyframes sig-ping {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .tactical-marker {
          width: 12px;
          height: 12px;
          border: 1px solid var(--marker-color);
          transform: rotate(45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 15px var(--marker-color);
        }
        .marker-core {
          width: 4px;
          height: 4px;
          background: var(--marker-color);
        }
        .leaflet-control-zoom {
          border: 1px solid rgba(255,255,255,0.1) !important;
          background: rgba(10,11,13,0.9) !important;
          backdrop-filter: blur(8px);
          border-radius: 0 !important;
        }
        .leaflet-control-zoom a {
          background: transparent !important;
          color: rgba(255,255,255,0.7) !important;
          border-color: rgba(255,255,255,0.1) !important;
          font-size: 16px !important;
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(255,255,255,0.05) !important;
          color: #FFD700 !important;
        }
      `}</style>

      {/* Legend bar — industrial style */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-6 bg-[#0a0b0d]/90 backdrop-blur-md px-6 py-2.5 border border-white/20">
        <span className="font-mono text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] border-r border-white/10 pr-4">LEGEND</span>
        {Object.entries(typeColors).map(([type, colors]) => (
          <div key={type} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5" style={{ backgroundColor: colors.fill, boxShadow: `0 0 8px ${colors.fill}60` }} />
            <span className="font-mono text-[9px] text-white/60 uppercase tracking-tighter">
              {type === 'central-bank' ? 'C-BANK'
                : type === 'exchange' ? 'X-CHANGE'
                  : type === 'financial' ? 'FIN-CENTER'
                    : type === 'cable' ? 'CABLE'
                      : type === 'route' ? 'TRADE-RT'
                        : 'COMMODITY'}
            </span>
          </div>
        ))}
        {layers?.includes('trade-routes') && (
          <div className="flex items-center gap-4 ml-2 border-l border-white/10 pl-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-[#00f5ff] shadow-[0_0_8px_#00f5ff80]" />
              <span className="font-mono text-[9px] text-white/60 uppercase tracking-tighter">VESSEL(AIS)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-[#38bdf8] shadow-[0_0_8px_#38bdf880]" />
              <span className="font-mono text-[9px] text-white/60 uppercase tracking-tighter">AERO(ADS-B)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
