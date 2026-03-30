import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chartColors, formatters, getValueColor } from '../charts/chartTheme';

// Types
export interface ColumnDef<T = any> {
  key: string;
  header: string;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  format?: 'number' | 'currency' | 'percent' | 'percentChange' | 'text';
  colorByValue?: boolean;
}

export interface TerminalTableProps<T = any> {
  data: T[];
  columns: ColumnDef<T>[];
  className?: string;
  maxHeight?: string | number;
  showPagination?: boolean;
  pageSize?: number;
  stickyHeader?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: (row: T, index: number) => string;
  getRowId?: (row: T) => string | number;
}

type SortDirection = 'asc' | 'desc' | null;

/**
 * Premium terminal-style data table with sorting, pagination, and animations
 */
export function TerminalTable<T extends object = any>({
  data,
  columns,
  className,
  maxHeight = 'auto',
  showPagination = false,
  pageSize = 10,
  stickyHeader = true,
  striped = true,
  hoverable = true,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  rowClassName,
  getRowId,
}: TerminalTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Handle sorting
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Sort and paginate data
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply sorting
    if (sortKey && sortDirection) {
      result.sort((a, b) => {
        const aVal = (a as any)[sortKey];
        const bVal = (b as any)[sortKey];
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        let comparison = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    // Apply pagination
    if (showPagination) {
      const start = currentPage * pageSize;
      result = result.slice(start, start + pageSize);
    }

    return result;
  }, [data, sortKey, sortDirection, showPagination, currentPage, pageSize]);

  const totalPages = Math.ceil(data.length / pageSize);

  // Format cell value
  const formatCellValue = (value: unknown, column: ColumnDef<T>): string => {
    if (value === null || value === undefined) return '—';
    
    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
    
    switch (column.format) {
      case 'currency':
        return isNaN(numValue) ? String(value) : formatters.currency(numValue);
      case 'percent':
        return isNaN(numValue) ? String(value) : formatters.percentSimple(numValue);
      case 'percentChange':
        return isNaN(numValue) ? String(value) : `${numValue >= 0 ? '+' : ''}${formatters.percentSimple(numValue)}`;
      case 'number':
        return isNaN(numValue) ? String(value) : formatters.number(numValue);
      default:
        return String(value);
    }
  };

  // Get cell color
  const getCellColor = (value: unknown, column: ColumnDef<T>): string | undefined => {
    if (!column.colorByValue) return undefined;
    
    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(numValue)) return undefined;
    
    return getValueColor(numValue);
  };

  // Render sort icon
  const renderSortIcon = (key: string) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/50" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-3.5 h-3.5 text-primary" />;
    }
    return <ArrowDown className="w-3.5 h-3.5 text-primary" />;
  };

  return (
    <div 
      className={cn(
        'rounded-xl overflow-hidden',
        'bg-gradient-to-b from-[hsl(220_20%_8%)] to-[hsl(220_26%_4%)]',
        'border border-border/30',
        'shadow-[0_0_30px_hsl(198_93%_60%/0.08)]',
        className
      )}
    >
      {/* Subtle top accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      {/* Table container */}
      <div 
        className="overflow-auto"
        style={{ maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }}
      >
        <table className="w-full border-collapse">
          {/* Header */}
          <thead className={cn(stickyHeader && 'sticky top-0 z-10')}>
            <tr 
              className="border-b border-border/30"
              style={{ 
                background: 'hsl(220 20% 8% / 0.95)',
                backdropFilter: stickyHeader ? 'blur(8px)' : undefined,
              }}
            >
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold tracking-wide uppercase',
                    'text-muted-foreground',
                    column.sortable && 'cursor-pointer select-none hover:text-foreground transition-colors',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className={cn(
                    'flex items-center gap-2',
                    column.align === 'center' && 'justify-center',
                    column.align === 'right' && 'justify-end',
                  )}>
                    <span>{column.header}</span>
                    {column.sortable && renderSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            <AnimatePresence mode="popLayout">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="border-b border-border/20">
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3">
                        <div 
                          className="h-4 rounded animate-pulse"
                          style={{ 
                            background: 'hsl(220 20% 15%)',
                            width: `${60 + Math.random() * 40}%`,
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : processedData.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <p className="text-muted-foreground text-sm">{emptyMessage}</p>
                  </td>
                </tr>
              ) : (
                // Data rows
                processedData.map((row, rowIndex) => {
                  const rowId = getRowId ? getRowId(row) : rowIndex;
                  
                  return (
                    <motion.tr
                      key={rowId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: rowIndex * 0.02 }}
                      className={cn(
                        'border-b border-border/20 transition-colors duration-150',
                        striped && rowIndex % 2 === 1 && 'bg-[hsl(220_20%_6%)]',
                        hoverable && 'hover:bg-[hsl(220_20%_10%)]',
                        onRowClick && 'cursor-pointer',
                        rowClassName?.(row, rowIndex),
                      )}
                      onClick={() => onRowClick?.(row, rowIndex)}
                    >
                      {columns.map((column) => {
                        const value = (row as any)[column.key];
                        const cellColor = getCellColor(value, column);
                        
                        return (
                          <td
                            key={column.key}
                            className={cn(
                              'px-4 py-3 text-sm font-mono',
                              column.align === 'center' && 'text-center',
                              column.align === 'right' && 'text-right',
                            )}
                            style={{ 
                              color: cellColor || undefined,
                              textShadow: cellColor ? `0 0 8px ${cellColor}` : undefined,
                            }}
                          >
                            {column.render 
                              ? column.render(value, row, rowIndex)
                              : formatCellValue(value, column)
                            }
                          </td>
                        );
                      })}
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div 
          className="flex items-center justify-between px-4 py-3 border-t border-border/30"
          style={{ background: 'hsl(220 20% 6%)' }}
        >
          <span className="text-xs text-muted-foreground">
            Page {currentPage + 1} of {totalPages} ({data.length} items)
          </span>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                currentPage === 0 
                  ? 'text-muted-foreground/30 cursor-not-allowed' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-[hsl(220_20%_12%)]'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i;
              } else if (currentPage < 3) {
                pageNum = i;
              } else if (currentPage > totalPages - 4) {
                pageNum = totalPages - 5 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    'w-8 h-8 rounded-md text-xs font-medium transition-colors',
                    currentPage === pageNum
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-[hsl(220_20%_12%)]'
                  )}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                currentPage === totalPages - 1 
                  ? 'text-muted-foreground/30 cursor-not-allowed' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-[hsl(220_20%_12%)]'
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TerminalTable;
