import { useState } from 'react';
import { motion } from 'framer-motion';

interface AllocationTreeProps {
  data: { ticker: string; weight: number; score: number }[];
}

function getTreeColor(score: number): string {
  if (score > 1.5) return '#059669'; // strong buy
  if (score > 0.5) return '#10b981';
  if (score > -0.5) return '#6b7280'; // neutral
  if (score > -1.5) return '#e11d48';
  return '#be123c'; // short
}

function getTreeBg(score: number): string {
  if (score > 1.5) return 'rgba(5,150,105,0.25)';
  if (score > 0.5) return 'rgba(16,185,129,0.15)';
  if (score > -0.5) return 'rgba(107,114,128,0.12)';
  if (score > -1.5) return 'rgba(225,29,72,0.15)';
  return 'rgba(190,18,60,0.25)';
}

interface TreeNode {
  ticker: string;
  weight: number;
  score: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

function buildTreemap(data: { ticker: string; weight: number; score: number }[], width: number, height: number): TreeNode[] {
  // Ensure ALL tickers appear — give zero-weight ones a minimum visible slice
  const minWeight = 0.005;
  const withMinWeight = data.map(d => ({
    ...d,
    effectiveWeight: Math.max(Math.abs(d.weight), minWeight),
  }));
  const sorted = [...withMinWeight].sort((a, b) => b.effectiveWeight - a.effectiveWeight);
  const total = sorted.reduce((s, d) => s + d.effectiveWeight, 0);
  if (total === 0 || sorted.length === 0) return [];

  const nodes: TreeNode[] = [];
  let x = 0, y = 0, w = width, h = height;

  // Simple squarified treemap algorithm
  const items = sorted.map(d => ({ ...d, area: (d.effectiveWeight / total) * width * height }));
  let remaining = [...items];
  let currentRect = { x, y, w, h };

  while (remaining.length > 0) {
    const isHorizontal = currentRect.w >= currentRect.h;
    const side = isHorizontal ? currentRect.h : currentRect.w;

    // Find best row
    let row: typeof items = [];
    let rowArea = 0;
    let bestAspect = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const testRow = [...row, remaining[i]];
      const testArea = rowArea + remaining[i].area;
      const rowLength = testArea / side;

      let worstAspect = 0;
      for (const item of testRow) {
        const itemSide = item.area / rowLength;
        const aspect = Math.max(rowLength / itemSide, itemSide / rowLength);
        if (aspect > worstAspect) worstAspect = aspect;
      }

      if (worstAspect <= bestAspect || row.length === 0) {
        row = testRow;
        rowArea = testArea;
        bestAspect = worstAspect;
      } else {
        break;
      }
    }

    // Layout the row
    const rowLength = rowArea / side;
    let offset = 0;

    for (const item of row) {
      const itemSide = item.area / rowLength;

      if (isHorizontal) {
        nodes.push({
          ticker: item.ticker,
          weight: item.weight,
          score: item.score,
          x: currentRect.x,
          y: currentRect.y + offset,
          w: rowLength,
          h: itemSide,
        });
      } else {
        nodes.push({
          ticker: item.ticker,
          weight: item.weight,
          score: item.score,
          x: currentRect.x + offset,
          y: currentRect.y,
          w: itemSide,
          h: rowLength,
        });
      }
      offset += itemSide;
    }

    // Update remaining
    const rowSet = new Set(row.map(r => r.ticker));
    remaining = remaining.filter(r => !rowSet.has(r.ticker));

    // Shrink rect
    if (isHorizontal) {
      currentRect = {
        x: currentRect.x + rowLength,
        y: currentRect.y,
        w: currentRect.w - rowLength,
        h: currentRect.h,
      };
    } else {
      currentRect = {
        x: currentRect.x,
        y: currentRect.y + rowLength,
        w: currentRect.w,
        h: currentRect.h - rowLength,
      };
    }
  }

  return nodes;
}

export function AllocationTree({ data }: AllocationTreeProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const containerWidth = 400;
  const containerHeight = 250;
  const nodes = buildTreemap(data, containerWidth, containerHeight);

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4 flex flex-col">
      <div className="text-[10px] text-white/40 tracking-widest uppercase mb-3 font-semibold">
        Capital Allocation Map
      </div>

      <div className="flex-1 flex items-center justify-center">
        <svg viewBox={`0 0 ${containerWidth} ${containerHeight}`} className="w-full rounded-md overflow-hidden">
          {nodes.map((node, i) => {
            const isHovered = hovered === node.ticker;
            const color = getTreeColor(node.score);
            const bg = getTreeBg(node.score);
            const weightPct = Math.abs(node.weight * 100);

            return (
              <motion.g
                key={node.ticker}
                onMouseEnter={() => setHovered(node.ticker)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer"
              >
                <motion.rect
                  x={node.x + 1}
                  y={node.y + 1}
                  width={Math.max(0, node.w - 2)}
                  height={Math.max(0, node.h - 2)}
                  rx={3}
                  fill={bg}
                  stroke={isHovered ? color : 'rgba(255,255,255,0.08)'}
                  strokeWidth={isHovered ? 2 : 0.5}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{
                    opacity: hovered && !isHovered ? 0.4 : 1,
                    scale: isHovered ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  style={isHovered ? { filter: `drop-shadow(0 0 8px ${color}40)` } : undefined}
                />

                {node.w > 40 && node.h > 25 && (
                  <>
                    <text
                      x={node.x + node.w / 2}
                      y={node.y + node.h / 2 - (node.h > 40 ? 6 : 0)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[11px] font-bold font-mono fill-white pointer-events-none"
                      style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                    >
                      {node.ticker}
                    </text>
                    {node.h > 40 && (
                      <text
                        x={node.x + node.w / 2}
                        y={node.y + node.h / 2 + 10}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-[9px] font-mono pointer-events-none"
                        fill={color}
                      >
                        {weightPct.toFixed(1)}%
                      </text>
                    )}
                  </>
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* Hover info */}
      {hovered && (() => {
        const node = nodes.find(n => n.ticker === hovered);
        if (!node) return null;
        return (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center justify-center gap-4 text-xs font-mono"
          >
            <span className="text-white/80 font-bold">{node.ticker}</span>
            <span style={{ color: getTreeColor(node.score) }}>
              {Math.abs(node.weight * 100).toFixed(2)}% • Z: {node.score > 0 ? '+' : ''}{node.score.toFixed(3)}
            </span>
            <span className="text-white/30">
              {node.weight >= 0 ? '↑ LONG' : '↓ SHORT'}
            </span>
          </motion.div>
        );
      })()}
    </div>
  );
}
