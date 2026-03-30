import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Subscription {
  symbols: Set<string>;
}

const subscriptions = new Map<WebSocket, Subscription>();

// Simulated market data generator (replace with real market data API)
function generateMarketQuote(symbol: string) {
  const basePrice = 100 + Math.random() * 900;
  const change = (Math.random() - 0.5) * 10;
  const changePercent = (change / basePrice) * 100;

  return {
    type: 'quote',
    symbol,
    price: parseFloat(basePrice.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    volume: Math.floor(Math.random() * 10000000),
    bid: parseFloat((basePrice - 0.01).toFixed(2)),
    ask: parseFloat((basePrice + 0.01).toFixed(2)),
    timestamp: Date.now(),
  };
}

// Broadcast market updates
function broadcastMarketUpdates() {
  subscriptions.forEach((sub, socket) => {
    if (socket.readyState === WebSocket.OPEN) {
      sub.symbols.forEach(symbol => {
        const quote = generateMarketQuote(symbol);
        socket.send(JSON.stringify(quote));
      });
    }
  });
}

// Start market data stream (every 1 second)
let marketInterval: number | null = null;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const upgrade = req.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    console.log("[QuantSuite] WebSocket client connected to realtime-market");
    subscriptions.set(socket, { symbols: new Set() });

    // Start market data broadcast if not already running
    if (marketInterval === null) {
      marketInterval = setInterval(broadcastMarketUpdates, 1000) as unknown as number;
      console.log("[QuantSuite] Market data stream started");
    }
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const sub = subscriptions.get(socket);

      if (!sub) return;

      if (data.action === 'subscribe' && Array.isArray(data.symbols)) {
        data.symbols.forEach((symbol: string) => {
          sub.symbols.add(symbol.toUpperCase());
          console.log(`[QuantSuite] Subscribed to ${symbol}`);
        });

        // Send immediate quote for newly subscribed symbols
        data.symbols.forEach((symbol: string) => {
          const quote = generateMarketQuote(symbol.toUpperCase());
          socket.send(JSON.stringify(quote));
        });
      } else if (data.action === 'unsubscribe' && Array.isArray(data.symbols)) {
        data.symbols.forEach((symbol: string) => {
          sub.symbols.delete(symbol.toUpperCase());
          console.log(`[QuantSuite] Unsubscribed from ${symbol}`);
        });
      }
    } catch (error) {
      console.error("[QuantSuite] Error processing message:", error);
      socket.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid message format' 
      }));
    }
  };

  socket.onerror = (error) => {
    console.error("[QuantSuite] WebSocket error:", error);
  };

  socket.onclose = () => {
    console.log("[QuantSuite] WebSocket client disconnected");
    subscriptions.delete(socket);

    // Stop market data stream if no clients
    if (subscriptions.size === 0 && marketInterval !== null) {
      clearInterval(marketInterval);
      marketInterval = null;
      console.log("[QuantSuite] Market data stream stopped");
    }
  };

  return response;
});
