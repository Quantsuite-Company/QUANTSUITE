import React from 'react';
import type { PropagationNode } from '@/lib/pulseEventEngine';

interface Props {
  chain: PropagationNode[];
  compact?: boolean;
}

function NodeBadge({ node, depth }: { node: PropagationNode; depth: number }) {
  const color = node.direction === 'up' ? '#00ff88' : node.direction === 'down' ? '#ff4444' : '#ffaa00';
  const arrow = node.direction === 'up' ? '↑' : node.direction === 'down' ? '↓' : '→';
  const mag = Math.round(node.magnitude * 100);
  
  return (
    <div className="flex flex-col items-start" style={{ paddingLeft: depth * 16 }}>
      <div className="flex items-center gap-1 group">
        {/* Connecting line */}
        {depth > 0 && (
          <div className="flex items-center mr-1">
            <div className="w-3 h-[1px]" style={{ backgroundColor: `${color}40` }} />
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
          </div>
        )}
        {/* Node */}
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all hover:scale-105 cursor-default"
          style={{ borderColor: `${color}30`, backgroundColor: `${color}08` }}
        >
          <span className="text-[10px] font-mono font-bold" style={{ color }}>{arrow}</span>
          <span className="text-[10px] font-mono text-white/70">{node.system}</span>
          <span className="text-[8px] font-mono px-1 rounded" style={{ color, backgroundColor: `${color}15` }}>{mag}%</span>
        </div>
      </div>
      {/* Children */}
      {node.children && node.children.length > 0 && (
        <div className="mt-0.5 relative">
          <div className="absolute left-0 top-0 bottom-0 w-[1px]" style={{ backgroundColor: `${color}15`, marginLeft: depth * 16 + 4 }} />
          {node.children.map((child, i) => (
            <NodeBadge key={`${child.system}-${i}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PropagationGraph({ chain, compact }: Props) {
  if (!chain || chain.length === 0) return null;
  
  return (
    <div className={`${compact ? 'space-y-0.5' : 'space-y-1'}`}>
      <div className="flex items-center gap-1 mb-1.5">
        <div className="w-1.5 h-1.5 bg-[#00d5ff] rounded-full animate-pulse shadow-[0_0_6px_#00d5ff]" />
        <span className="text-[8px] uppercase tracking-widest text-[#00d5ff]/60 font-mono">Propagation Chain</span>
      </div>
      {chain.map((node, i) => (
        <NodeBadge key={`${node.system}-${i}`} node={node} depth={0} />
      ))}
    </div>
  );
}
