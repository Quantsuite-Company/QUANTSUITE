import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, Shield, Target, Sparkles, Users, MessageSquare } from 'lucide-react';
import quantsuiteLogo from '@/assets/quantsuite-logo.png';

// Floating Particles Component
const FloatingParticles = () => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <group ref={meshRef}>
      {Array.from({ length: 50 }).map((_, i) => (
        <Float
          key={i}
          speed={1 + Math.random() * 2}
          rotationIntensity={0.5}
          floatIntensity={0.5}
        >
          <mesh position={[
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20
          ]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshStandardMaterial
              color={Math.random() > 0.5 ? "#00f5ff" : "#ffd700"}
              emissive={Math.random() > 0.5 ? "#00f5ff" : "#ffd700"}
              emissiveIntensity={0.2}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
};

// 3D Holographic Dashboard
const HolographicDashboard = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial
          color="#00f5ff"
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* Orbiting elements */}
      {Array.from({ length: 8 }).map((_, i) => (
        <Float key={i} speed={2} rotationIntensity={1}>
          <mesh position={[
            Math.cos((i / 8) * Math.PI * 2) * 4,
            Math.sin(i * 0.5) * 0.5,
            Math.sin((i / 8) * Math.PI * 2) * 4
          ]}>
            <boxGeometry args={[0.2, 0.8, 0.1]} />
            <meshStandardMaterial
              color="#ffd700"
              emissive="#ffd700"
              emissiveIntensity={0.3}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
};

// Glassmorphic Navigation
const GlassmorphicNav = ({ navigate }: { navigate: (path: string) => void }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-black/20 backdrop-blur-md border-b border-white/10' : ''
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img src={quantsuiteLogo} alt="QuantSuite" className="h-8 w-auto" />
          </button>
          
          <div className="hidden md:flex items-center space-x-8">
            {[
              { name: 'Products', path: '/products' },
              { name: 'Toolkit', path: '/toolkit' },
              { name: 'Pricing', path: '/pricing' },
              { name: 'Insights', path: '/insights' }
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className="text-white/80 hover:text-white transition-all duration-300 relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-yellow-400 transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
            <Button 
              variant="ghost" 
              className="text-white/80 hover:text-white"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
            <Button 
              className="bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white px-6 py-2 rounded-full glow-green"
              onClick={() => navigate('/app')}
            >
              Start Free
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Main Landing Component
export default function Landing() {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D0F] via-[#1A1A1E] to-[#0D0D0F] relative overflow-hidden cursor-crosshair">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDBmNWZmIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] animate-pulse" />
      </div>

      {/* Floating ticker tape */}
      <div className="absolute bottom-0 w-full h-12 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent overflow-hidden">
        <div className="animate-scroll-x whitespace-nowrap py-3 text-cyan-400 text-sm font-mono">
          TSLA +2.5% • AAPL -0.8% • NVDA +5.2% • SPY +1.1% • QQQ +0.9% • BTC +3.4% • ETH +2.1%
        </div>
      </div>

      <GlassmorphicNav navigate={navigate} />

      {/* Main Hero Section */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-6xl lg:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-white via-cyan-200 to-white bg-clip-text text-transparent animate-pulse">
                  Trade Beyond
                </span>
                <br />
                <span className="bg-gradient-to-r from-cyan-400 to-yellow-400 bg-clip-text text-transparent glow-text">
                  Human Limits.
                </span>
              </h1>
              
              <p className="text-xl text-white/80 max-w-lg">
                QuantSuite is your AI-powered edge in the markets — built for quants, traders, and visionaries.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">
                Simulate. Stress-Test. Execute. Dominate.
              </h2>
              <p className="text-white/70 max-w-lg">
                QuantSuite fuses quant logic, AI foresight, and market timing intelligence into one adaptive toolkit.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold px-8 py-4 rounded-full glow-gold group"
              >
                Launch QuantSuite
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/toolkit')}
                className="border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10 px-8 py-4 rounded-full backdrop-blur-sm"
              >
                View Live Demo
              </Button>
            </div>
          </div>

          {/* Right Side - Holographic Dashboard */}
          <div className="relative h-[600px]">
            <Canvas camera={{ position: [0, 0, 10] }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} color="#00f5ff" />
              <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ffd700" />
              
              <HolographicDashboard />
              <FloatingParticles />
              
              <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>

            {/* Performance Cards */}
            <div className="absolute top-4 right-4 space-y-3">
              <div className="bg-black/40 backdrop-blur-md border border-cyan-400/30 rounded-lg p-4 glow-card">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-semibold">+1,247% ROI</span>
                </div>
                <p className="text-white/70 text-sm">Portfolio Growth</p>
              </div>
              
              <div className="bg-black/40 backdrop-blur-md border border-yellow-400/30 rounded-lg p-4 glow-card">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">99.7%</span>
                </div>
                <p className="text-white/70 text-sm">Risk Confidence</p>
              </div>
              
              <div className="bg-black/40 backdrop-blur-md border border-cyan-400/30 rounded-lg p-4 glow-card">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-cyan-400" />
                  <span className="text-cyan-400 font-semibold">+12% Edge</span>
                </div>
                <p className="text-white/70 text-sm">Next Signal</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Feature Showcase */}
      <div className="relative z-10 py-24 bg-black/30 border-t border-b border-white/5">
        <style>{`
          .scrollbar-none::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-none {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <span className="text-cyan-400 font-mono text-sm tracking-widest uppercase">Institutional Suite</span>
              <h2 className="text-4xl md:text-5xl font-bold text-white">The QuantSuite Ecosystem</h2>
            </div>
            <p className="text-white/60 max-w-md">
              Scroll through our specialized modules designed for extreme market environments.
            </p>
          </div>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="flex overflow-x-auto gap-6 px-6 md:px-[calc((100vw-1200px)/2)] pb-8 snap-x snap-mandatory scrollbar-none">
          {[
            {
              title: "SwarmEngine AI",
              desc: "Deploy autonomous agent swarms to analyze alternative data, detect information asymmetry, and synthesize multi-model alpha signals.",
              icon: Sparkles,
              color: "from-cyan-500/20 to-blue-500/20",
              border: "border-cyan-500/30",
              tag: "Intelligence"
            },
            {
              title: "Factor Zoo Pipeline",
              desc: "Access 93+ pre-built alpha factors. Test momentum, value, and quality metrics with instant cross-sectional ranking.",
              icon: TrendingUp,
              color: "from-purple-500/20 to-pink-500/20",
              border: "border-purple-500/30",
              tag: "Analytics"
            },
            {
              title: "Walk-Forward Backtester",
              desc: "Prevent overfitting. Our walk-forward engine optimizes parameters dynamically across shifting market regimes.",
              icon: Target,
              color: "from-yellow-500/20 to-orange-500/20",
              border: "border-yellow-500/30",
              tag: "Validation"
            },
            {
              title: "Portfolio Terminal",
              desc: "Institutional allocation with Black-Litterman optimization, risk parity, and real-time VaR (Value at Risk) tracking.",
              icon: Shield,
              color: "from-emerald-500/20 to-teal-500/20",
              border: "border-emerald-500/30",
              tag: "Risk Management"
            }
          ].map((item, index) => (
            <div 
              key={index}
              className={`flex-shrink-0 w-[350px] md:w-[400px] bg-gradient-to-br ${item.color} backdrop-blur-xl border ${item.border} rounded-2xl p-8 snap-center flex flex-col justify-between h-[300px] hover:translate-y-[-8px] transition-all duration-300 glow-card`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono px-3 py-1 bg-white/10 rounded-full text-white/80">
                    {item.tag}
                  </span>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{item.desc}</p>
              </div>
              <button className="flex items-center text-sm font-medium text-white hover:opacity-80 transition-opacity">
                Explore Module <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="relative z-10 py-24 bg-gradient-to-b from-transparent to-[#0D0D0F]">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16 space-y-4">
          <span className="text-yellow-400 font-mono text-sm tracking-widest uppercase">Trusted by the Best</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white">Institutional Endorsements</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
          {[
            {
              quote: "QuantSuite's SwarmEngine detected the oil supply squeeze 48 hours before the headlines hit. It's an indispensable edge.",
              author: "Sarah Chen",
              role: "Director of Alpha Capture",
              company: "Aegis Capital",
              avatar: "SC"
            },
            {
              quote: "The Walk-Forward engine saved us from a disastrous overfitting loop in our volatility strategies. Pure institutional grade.",
              author: "Marcus Vance",
              role: "Head of Quantitative Research",
              company: "Vertex Funds",
              avatar: "MV"
            },
            {
              quote: "A masterclass in UI and data density. Having Black-Scholes and Heston models side-by-side with AI signals is a game-changer.",
              author: "David Kross",
              role: "Senior Portfolio Manager",
              company: "Nexus Trading",
              avatar: "DK"
            }
          ].map((t, index) => (
            <div 
              key={index}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 flex flex-col justify-between space-y-6 hover:border-white/20 transition-all duration-300"
            >
              <div className="space-y-4">
                <MessageSquare className="w-8 h-8 text-cyan-400 opacity-50" />
                <p className="text-white/80 italic text-sm leading-relaxed">"{t.quote}"</p>
              </div>
              <div className="flex items-center space-x-4 pt-4 border-t border-white/5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-yellow-400 flex items-center justify-center font-bold text-black text-sm">
                  {t.avatar}
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">{t.author}</h4>
                  <p className="text-white/50 text-xs">{t.role} • {t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Row */}
      <div className="relative z-10 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-6">
            <p className="text-white/60 text-sm uppercase tracking-wide">Built for Institutional Performance</p>
            <div className="flex flex-wrap justify-center items-center gap-8 text-white/40">
              <div className="hover:text-white/80 transition-colors cursor-pointer flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                Open Source Architecture
              </div>
              <div className="hover:text-white/80 transition-colors cursor-pointer flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                Real-Time Execution
              </div>
              <div className="hover:text-white/80 transition-colors cursor-pointer flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Enterprise Grade Security
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
