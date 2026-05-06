import { Calculator, Layer, Cpu, MagicStar, Activity, DocumentText, Book, TaskSquare, TrendUp, ChartSquare, Speedometer, Warning2, Chart1, Diagram, Home2, SearchNormal1 } from "iconsax-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import quantsuiteLogo from "@/assets/quantsuite-logo.png";
import { LogOut, User, BrainCircuit, Briefcase } from "lucide-react";
import { useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { ChevronDown } from "lucide-react";
import { useQuantSuiteStore } from "@/stores/quantsuiteStore";
import { GlassCard } from "@/components/ui/glass-card";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/components/ui/motion";

const topLevelItems = [
  { title: "Command Center", url: "/command-center", icon: Home2 },
  { title: "Pulse", url: "/pulse", icon: Activity },
];

const sidebarSections = [
  {
    label: "AI-Native Hedge Fund",
    items: [
      { title: "Agent Orchestrator", url: "/agent-orchestrator", icon: BrainCircuit },
      { title: "Live Trading", url: "/live-trading", icon: Activity },
      { title: "Portfolio Terminal", url: "/portfolio-terminal", icon: Briefcase },
    ],
  },
  {
    label: "Market & Trading",
    items: [
      { title: "Stock Report", url: "/stock-report", icon: ChartSquare },
      { title: "Market Terminal", url: "/market-terminal", icon: Activity },
      { title: "Stock Screener", url: "/screener", icon: SearchNormal1 },
    ],
  },
  {
    label: "Portfolio Management",
    items: [
      { title: "My Portfolios", url: "/portfolios", icon: Layer },
      { title: "Portfolio Builder", url: "/portfolio-builder", icon: Diagram },
      { title: "Portfolio Optimizer", url: "/portfolio-optimizer", icon: Calculator },
      { title: "Alpha Signals", url: "/alpha-signals", icon: TrendUp },
      { title: "Backtest History", url: "/backtest-history", icon: DocumentText },
      { title: "Risk Analysis", url: "/risk-analysis", icon: Warning2 },
      { title: "CSV Visualizer", url: "/csv-visualizer", icon: DocumentText },
    ],
  },
  {
    label: "Pricing Models",
    items: [
      { title: "Calculator", url: "/app", icon: Calculator },
      { title: "Advanced Greeks", url: "/advanced-greeks", icon: Activity },
      { title: "Binomial Tree", url: "/binomial-tree", icon: Diagram },
      { title: "Monte Carlo", url: "/monte-carlo", icon: ChartSquare },
      { title: "SVI Model", url: "/svi", icon: Chart1 },
      { title: "Heston Model", url: "/heston-model", icon: TrendUp },
      { title: "Jump Diffusion", url: "/jump-diffusion", icon: Warning2 },
    ],
  },
  {
    label: "Analysis Tools",
    items: [
      { title: "Technical Indicators", url: "/technical-indicators", icon: Speedometer },
      { title: "Volatility Solver", url: "/volatility-solver", icon: TrendUp },
      { title: "Credit Risk Models", url: "/credit-risk", icon: Warning2 },
      { title: "Arbitrage Detector", url: "/arbitrage-detector", icon: Warning2 },
      { title: "Scenario Analysis", url: "/scenario-analysis", icon: TaskSquare },
      { title: "Earnings Calendar", url: "/earnings-calendar", icon: ChartSquare },
    ],
  },
  {
    label: "Strategy & Tools",
    items: [
      { title: "Strategy Builder", url: "/strategy-builder", icon: Layer },
    ],
  },
  {
    label: "Learning",
    items: [
      { title: "Educational Insight", url: "/educational-insight", icon: Book },
    ],
  },
  {
    label: "Insider Street",
    items: [
      { title: "Insider Street", url: "/insider-street", icon: TrendUp },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isCollapsed = state === "collapsed";

  // Use Zustand store for sidebar state
  const { sidebarCollapsed, toggleSidebar } = useQuantSuiteStore();
  const openSections = useQuantSuiteStore((state) => state.sidebarSections || {});
  const setSidebarSections = useQuantSuiteStore((state) => state.setSidebarSections);

  // Removed neon glow shadows for cleaner professional look
  const getNavClass = (isActive: boolean) =>
    isActive 
      ? "bg-primary/10 text-primary font-medium border-l-2 border-primary" 
      : "hover:bg-muted/30 text-sidebar-foreground hover:text-primary transition-all duration-200";

  // Check if current path is in a section to auto-expand it
  const isSectionActive = (section: typeof sidebarSections[0]) =>
    section.items.some((item) => location.pathname === item.url);

  // Initialize open sections based on active route
  useEffect(() => {
    const initialState: Record<string, boolean> = {};
    sidebarSections.forEach((section) => {
      initialState[section.label] = isSectionActive(section);
    });
    setSidebarSections(initialState);
  }, [location.pathname]);

  const toggleSection = (label: string) => {
    setSidebarSections({
      ...openSections,
      [label]: !openSections[label],
    });
  };

  return (
    <Sidebar
      className={`${isCollapsed ? "w-14" : "w-60"} bg-background/95 backdrop-blur-xl border-r border-border/30`}
      collapsible="icon"
    >
      <SidebarContent className="overflow-y-auto">
        <motion.div 
          className="px-3 py-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button 
            onClick={() => navigate('/')}
            className="cursor-pointer hover:opacity-80 transition-all duration-200 flex items-center justify-center w-full hover:scale-105"
          >
            <img 
              src={quantsuiteLogo} 
              alt="QuantSuite" 
              className={`${isCollapsed ? 'h-8' : 'h-12'} w-auto transition-all duration-300`} 
            />
          </button>
        </motion.div>

        {/* Top Level Items */}
        <SidebarGroup>
          <SidebarGroupContent>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              <SidebarMenu className="space-y-1">
                {topLevelItems.map((item, index) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <motion.div key={item.title} variants={staggerItem}>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <NavLink 
                            to={item.url} 
                            className={`${getNavClass(isActive)} transition-all duration-200 flex items-center rounded-lg`}
                          >
                            <item.icon size={20} variant={isActive ? "Bold" : "Linear"} className="mr-3 flex-shrink-0" />
                            {!isCollapsed && <span className="truncate">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </motion.div>
                  );
                })}
              </SidebarMenu>
            </motion.div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Collapsible Sections */}
        <AnimatePresence>
          {sidebarSections.map((section, sectionIndex) => (
            <Collapsible
              key={section.label}
              open={!!openSections[section.label]}
              onOpenChange={() => toggleSection(section.label)}
            >
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-qs-brand-400 transition-all duration-200 flex items-center justify-between group">
                    {!isCollapsed && (
                      <>
                        <span>{section.label}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${openSections[section.label] ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="show"
                    >
                      <SidebarMenu className="space-y-1">
                        {section.items.map((item, itemIndex) => {
                          const isActive = location.pathname === item.url;
                          return (
                            <motion.div key={item.title} variants={staggerItem}>
                              <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                  <NavLink 
                                    to={item.url} 
                                    className={`${getNavClass(isActive)} transition-all duration-200 flex items-center rounded-lg`}
                                  >
                                    <item.icon size={20} variant={isActive ? "Bold" : "Linear"} className="mr-3 flex-shrink-0" />
                                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                                  </NavLink>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            </motion.div>
                          );
                        })}
                      </SidebarMenu>
                    </motion.div>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          ))}
        </AnimatePresence>
      </SidebarContent>
      
      {user && (
        <SidebarFooter className="border-t border-border/20 p-3">
          {!isCollapsed ? (
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {/* Profile section - removed neon borders */}
              <div className="p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
              <Separator className="bg-border/30" />
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-foreground hover:bg-muted/30 hover:text-primary transition-all duration-200"
                onClick={() => signOut()}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="w-full text-foreground hover:bg-muted/30 hover:text-primary transition-all duration-200"
                onClick={() => signOut()}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </SidebarFooter>
      )}
    </Sidebar>
  );
}