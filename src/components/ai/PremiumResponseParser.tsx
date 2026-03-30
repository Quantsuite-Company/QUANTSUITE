import { ReactNode } from 'react';
import { 
  Target, 
  BarChart3, 
  ListOrdered, 
  ShieldAlert, 
  TrendingUp,
  Search,
  Lightbulb,
  ArrowRightCircle,
  Activity,
  Zap,
  LucideIcon,
  Clock,
  AlertTriangle
} from 'lucide-react';

export type SectionIconType = 
  | 'overview' 
  | 'metrics' 
  | 'steps' 
  | 'risk' 
  | 'outcomes'
  | 'findings'
  | 'recommendations'
  | 'market'
  | 'analysis'
  | 'action'
  | 'warning';

export interface ParsedSection {
  title: string;
  content: string;
  icon: SectionIconType;
  priority: number;
}

export interface ExtractedMetric {
  label: string;
  value: string;
  type: 'risk' | 'return' | 'time' | 'default';
}

// Icon configuration for each section type
export const sectionIconConfig: Record<SectionIconType, { 
  Icon: LucideIcon; 
  gradient: string; 
  bgGlow: string;
  badgeColor: string;
}> = {
  overview: { 
    Icon: Target, 
    gradient: 'from-cyan-400 to-blue-500',
    bgGlow: 'bg-cyan-500/10',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
  },
  metrics: { 
    Icon: BarChart3, 
    gradient: 'from-emerald-400 to-green-500',
    bgGlow: 'bg-emerald-500/10',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  },
  steps: { 
    Icon: ListOrdered, 
    gradient: 'from-violet-400 to-purple-500',
    bgGlow: 'bg-violet-500/10',
    badgeColor: 'bg-violet-500/20 text-violet-400 border-violet-500/30'
  },
  risk: { 
    Icon: ShieldAlert, 
    gradient: 'from-rose-400 to-red-500',
    bgGlow: 'bg-rose-500/10',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
  },
  outcomes: { 
    Icon: TrendingUp, 
    gradient: 'from-amber-400 to-orange-500',
    bgGlow: 'bg-amber-500/10',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  },
  findings: { 
    Icon: Search, 
    gradient: 'from-blue-400 to-indigo-500',
    bgGlow: 'bg-blue-500/10',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  },
  recommendations: { 
    Icon: Lightbulb, 
    gradient: 'from-purple-400 to-fuchsia-500',
    bgGlow: 'bg-purple-500/10',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  },
  market: { 
    Icon: Activity, 
    gradient: 'from-teal-400 to-emerald-500',
    bgGlow: 'bg-teal-500/10',
    badgeColor: 'bg-teal-500/20 text-teal-400 border-teal-500/30'
  },
  analysis: { 
    Icon: Zap, 
    gradient: 'from-yellow-400 to-amber-500',
    bgGlow: 'bg-yellow-500/10',
    badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  },
  action: { 
    Icon: ArrowRightCircle, 
    gradient: 'from-green-400 to-emerald-500',
    bgGlow: 'bg-green-500/10',
    badgeColor: 'bg-green-500/20 text-green-400 border-green-500/30'
  },
  warning: { 
    Icon: AlertTriangle, 
    gradient: 'from-orange-400 to-red-500',
    bgGlow: 'bg-orange-500/10',
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  },
};

// Title to icon mapping with keywords
const titleToIconMap: { keywords: string[]; icon: SectionIconType }[] = [
  { keywords: ['overview', 'summary', 'introduction', 'about'], icon: 'overview' },
  { keywords: ['metric', 'key metric', 'kpi', 'indicator', 'statistics', 'stat'], icon: 'metrics' },
  { keywords: ['step', 'implementation', 'how to', 'action', 'execute', 'process'], icon: 'steps' },
  { keywords: ['risk', 'warning', 'caution', 'danger', 'threat', 'concern'], icon: 'risk' },
  { keywords: ['outcome', 'result', 'expected', 'projection', 'forecast', 'target'], icon: 'outcomes' },
  { keywords: ['finding', 'discover', 'insight', 'observation', 'key finding'], icon: 'findings' },
  { keywords: ['recommend', 'suggest', 'advice', 'proposal', 'strategy'], icon: 'recommendations' },
  { keywords: ['market', 'sentiment', 'condition', 'trend', 'sector'], icon: 'market' },
  { keywords: ['analysis', 'analys', 'assess', 'evaluat', 'review'], icon: 'analysis' },
  { keywords: ['action', 'next step', 'todo', 'task', 'implement'], icon: 'action' },
  { keywords: ['alert', 'warn', 'caution', 'note'], icon: 'warning' },
];

/**
 * Map a section title to an appropriate icon
 */
export function mapTitleToIcon(title: string): SectionIconType {
  const lowerTitle = title.toLowerCase();
  
  for (const mapping of titleToIconMap) {
    if (mapping.keywords.some(keyword => lowerTitle.includes(keyword))) {
      return mapping.icon;
    }
  }
  
  return 'overview'; // Default fallback
}

/**
 * Parse AI response text into structured sections
 * Supports both ### Headers and **Bold Headers:** formats
 */
export function parseAIResponse(responseText: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  
  // Try ### Header format first
  const headerRegex = /###\s*([^\n]+)\n([\s\S]*?)(?=###|$)/gi;
  let match;
  let priority = 0;
  
  while ((match = headerRegex.exec(responseText)) !== null) {
    const title = match[1].trim();
    const content = match[2].trim();
    
    if (content.length > 0) {
      sections.push({
        title,
        content,
        icon: mapTitleToIcon(title),
        priority: priority++
      });
    }
  }
  
  // If no ### headers found, try **Bold:** format
  if (sections.length === 0) {
    const boldRegex = /\*\*([^*:]+):\*\*\s*([\s\S]*?)(?=\*\*[^*:]+:\*\*|$)/gi;
    
    while ((match = boldRegex.exec(responseText)) !== null) {
      const title = match[1].trim();
      const content = match[2].trim();
      
      if (content.length > 0) {
        sections.push({
          title,
          content,
          icon: mapTitleToIcon(title),
          priority: priority++
        });
      }
    }
  }
  
  // If still no sections, try ## Header format
  if (sections.length === 0) {
    const h2Regex = /##\s*([^\n]+)\n([\s\S]*?)(?=##|$)/gi;
    
    while ((match = h2Regex.exec(responseText)) !== null) {
      const title = match[1].trim();
      const content = match[2].trim();
      
      if (content.length > 0) {
        sections.push({
          title,
          content,
          icon: mapTitleToIcon(title),
          priority: priority++
        });
      }
    }
  }
  
  return sections;
}

/**
 * Extract inline metrics from text content
 * Looks for patterns like "Return: 15%", "Risk Level: Low", etc.
 */
export function extractMetrics(text: string): ExtractedMetric[] {
  const metrics: ExtractedMetric[] = [];
  
  // Return patterns
  const returnMatch = text.match(/(?:expected\s+)?return[:\s]+([+-]?\d+(?:\.\d+)?%?(?:\s*-\s*[+-]?\d+(?:\.\d+)?%?)?)/i);
  if (returnMatch) {
    metrics.push({ label: 'Return', value: returnMatch[1].trim(), type: 'return' });
  }
  
  // Risk level patterns
  const riskMatch = text.match(/risk\s+level[:\s]+(\w+(?:\s+\w+)?)/i);
  if (riskMatch) {
    metrics.push({ label: 'Risk', value: riskMatch[1].trim(), type: 'risk' });
  }
  
  // Time horizon patterns
  const timeMatch = text.match(/(?:time\s+)?horizon[:\s]+([^\n,]+)/i);
  if (timeMatch) {
    metrics.push({ label: 'Horizon', value: timeMatch[1].trim(), type: 'time' });
  }
  
  // Position size patterns
  const positionMatch = text.match(/position\s+size[:\s]+([^\n,]+)/i);
  if (positionMatch) {
    metrics.push({ label: 'Position', value: positionMatch[1].trim(), type: 'default' });
  }
  
  // Win rate patterns
  const winRateMatch = text.match(/win\s+rate[:\s]+([^\n,]+)/i);
  if (winRateMatch) {
    metrics.push({ label: 'Win Rate', value: winRateMatch[1].trim(), type: 'return' });
  }
  
  // Sharpe ratio patterns
  const sharpeMatch = text.match(/sharpe(?:\s+ratio)?[:\s]+([^\n,]+)/i);
  if (sharpeMatch) {
    metrics.push({ label: 'Sharpe', value: sharpeMatch[1].trim(), type: 'return' });
  }
  
  // Max drawdown patterns
  const drawdownMatch = text.match(/(?:max\s+)?drawdown[:\s]+([^\n,]+)/i);
  if (drawdownMatch) {
    metrics.push({ label: 'Drawdown', value: drawdownMatch[1].trim(), type: 'risk' });
  }
  
  return metrics;
}

/**
 * Get risk level color based on text
 */
export function getRiskLevelColor(riskLevel: string): string {
  const lower = riskLevel.toLowerCase();
  if (lower.includes('low') || lower.includes('minimal') || lower.includes('conservative')) {
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  }
  if (lower.includes('medium') || lower.includes('moderate') || lower.includes('balanced')) {
    return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  }
  if (lower.includes('high') || lower.includes('aggressive') || lower.includes('extreme')) {
    return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
  }
  return 'bg-muted/50 text-foreground border-border/50';
}

/**
 * Get return color based on value
 */
export function getReturnColor(value: string): string {
  const isPositive = value.includes('+') || (!value.includes('-') && parseFloat(value) > 0);
  return isPositive 
    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
    : 'bg-rose-500/20 text-rose-400 border-rose-500/30';
}

export default { parseAIResponse, extractMetrics, mapTitleToIcon, sectionIconConfig };
