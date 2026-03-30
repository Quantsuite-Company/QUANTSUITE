import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ParsedPortfolio } from './csvParser';
import { PortfolioMetrics, RiskMetrics, EquityVsOptions } from './portfolioCalculator';

export async function generatePortfolioPDF(
  portfolio: ParsedPortfolio,
  metrics: PortfolioMetrics,
  riskMetrics: RiskMetrics,
  equityVsOptions: EquityVsOptions
) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (2 * margin);
  let currentY = 20;

  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(Math.abs(value));
    return `Rs. ${value < 0 ? '-' : ''}${formatted}`;
  };

  // Helper function to add a metric card
  const addMetricCard = (
    label: string,
    value: string,
    x: number,
    y: number,
    width: number,
    color: [number, number, number],
    isPositive?: boolean
  ) => {
    // Card background
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(x, y, width, 18, 2, 2, 'FD');
    
    // Label
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text(label, x + 3, y + 6);
    
    // Value
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    if (isPositive !== undefined) {
      if (isPositive) {
        pdf.setTextColor(34, 197, 94); // Green
      } else {
        pdf.setTextColor(239, 68, 68); // Red
      }
    } else {
      pdf.setTextColor(color[0], color[1], color[2]);
    }
    pdf.text(value, x + 3, y + 13);
  };

  // ============ HEADER ============
  pdf.setFillColor(99, 102, 241);
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(26);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Portfolio Analysis Report', pageWidth / 2, 16, { align: 'center' });
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.text(dateStr, pageWidth / 2, 28, { align: 'center' });
  
  // Colored accent bar
  pdf.setFillColor(59, 130, 246);
  pdf.rect(0, 40, pageWidth, 2, 'F');
  
  currentY = 52;

  // ============ PORTFOLIO INFO BAR ============
  pdf.setFillColor(241, 245, 249);
  pdf.rect(margin, currentY, contentWidth, 12, 'F');
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(51, 65, 85);
  pdf.text(`${portfolio.broker.toUpperCase()}`, margin + 3, currentY + 5);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text(`|`, margin + 35, currentY + 5);
  pdf.text(`${portfolio.positions.length} Positions`, margin + 40, currentY + 5);
  pdf.text(`|`, margin + 70, currentY + 5);
  pdf.text(`Generated: ${portfolio.parseDate.toLocaleDateString()}`, margin + 75, currentY + 5);
  
  currentY += 18;

  // ============ KEY PERFORMANCE METRICS ============
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 41, 59);
  pdf.text('Key Performance Metrics', margin, currentY);
  
  // Colored underline
  pdf.setDrawColor(99, 102, 241);
  pdf.setLineWidth(1.5);
  pdf.line(margin, currentY + 2, margin + 60, currentY + 2);
  
  currentY += 10;

  // Metrics grid - 3 columns
  const cardWidth = (contentWidth - 6) / 3;
  const cardGap = 3;
  
  // Row 1
  addMetricCard(
    'Total P&L',
    formatCurrency(metrics.totalPnL),
    margin,
    currentY,
    cardWidth,
    [99, 102, 241],
    metrics.totalPnL >= 0
  );
  
  addMetricCard(
    'Win Rate',
    `${metrics.winRate.toFixed(1)}%`,
    margin + cardWidth + cardGap,
    currentY,
    cardWidth,
    [99, 102, 241]
  );
  
  addMetricCard(
    'Total Trades',
    `${metrics.totalTrades}`,
    margin + (cardWidth + cardGap) * 2,
    currentY,
    cardWidth,
    [99, 102, 241]
  );
  
  currentY += 22;
  
  // Row 2
  addMetricCard(
    'Profit Factor',
    `${metrics.profitFactor.toFixed(2)}`,
    margin,
    currentY,
    cardWidth,
    [34, 197, 94],
    metrics.profitFactor >= 1
  );
  
  addMetricCard(
    'Avg Winner',
    formatCurrency(metrics.avgWin),
    margin + cardWidth + cardGap,
    currentY,
    cardWidth,
    [34, 197, 94]
  );
  
  addMetricCard(
    'Avg Loser',
    formatCurrency(Math.abs(metrics.avgLoss)),
    margin + (cardWidth + cardGap) * 2,
    currentY,
    cardWidth,
    [239, 68, 68]
  );
  
  currentY += 28;

  // ============ RISK ANALYSIS ============
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 41, 59);
  pdf.text('Risk Analysis', margin, currentY);
  
  pdf.setDrawColor(245, 158, 11);
  pdf.setLineWidth(1.5);
  pdf.line(margin, currentY + 2, margin + 40, currentY + 2);
  
  currentY += 10;

  // Risk metrics - 3 columns
  addMetricCard(
    'Concentration Index',
    `${riskMetrics.concentrationIndex.toFixed(3)}`,
    margin,
    currentY,
    cardWidth,
    [245, 158, 11]
  );
  
  addMetricCard(
    'Largest Position',
    `${riskMetrics.largestPositionPercent.toFixed(1)}%`,
    margin + cardWidth + cardGap,
    currentY,
    cardWidth,
    [245, 158, 11]
  );
  
  addMetricCard(
    'Top 3 Holdings',
    `${riskMetrics.top3Percent.toFixed(1)}%`,
    margin + (cardWidth + cardGap) * 2,
    currentY,
    cardWidth,
    [245, 158, 11]
  );
  
  currentY += 22;
  
  addMetricCard(
    'Largest Loss',
    formatCurrency(metrics.largestLoss),
    margin,
    currentY,
    cardWidth,
    [239, 68, 68]
  );

  currentY += 28;

  // ============ PORTFOLIO COMPOSITION ============
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 41, 59);
  pdf.text('Portfolio Composition', margin, currentY);
  
  pdf.setDrawColor(107, 114, 128);
  pdf.setLineWidth(1.5);
  pdf.line(margin, currentY + 2, margin + 60, currentY + 2);
  
  currentY += 10;

  // Equity vs Options - 2 large cards
  const halfWidth = (contentWidth - 3) / 2;
  
  addMetricCard(
    `Equity (${equityVsOptions.equity.count} positions)`,
    formatCurrency(equityVsOptions.equity.pnl),
    margin,
    currentY,
    halfWidth,
    [99, 102, 241],
    equityVsOptions.equity.pnl >= 0
  );
  
  addMetricCard(
    `Options (${equityVsOptions.options.count} positions)`,
    formatCurrency(equityVsOptions.options.pnl),
    margin + halfWidth + 3,
    currentY,
    halfWidth,
    [99, 102, 241],
    equityVsOptions.options.pnl >= 0
  );

  // Capture dashboard visualizations
  currentY += 20;
  
  if (currentY > pageHeight - 40) {
    pdf.addPage();
    currentY = 20;
  }

  try {
    // Capture the main dashboard section
    const dashboardElement = document.querySelector('[data-pdf-section="dashboard"]');
    if (dashboardElement) {
      const canvas = await html2canvas(dashboardElement as HTMLElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 30;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      if (currentY + imgHeight > pageHeight - 20) {
        pdf.addPage();
        currentY = 20;
      }
      
      pdf.addImage(imgData, 'PNG', 15, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 10;
    }

    // Capture charts if they exist
    const chartsElement = document.querySelector('[data-pdf-section="charts"]');
    if (chartsElement && currentY < pageHeight - 40) {
      if (currentY + 100 > pageHeight - 20) {
        pdf.addPage();
        currentY = 20;
      }
      
      const canvas = await html2canvas(chartsElement as HTMLElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 30;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // May need multiple pages for charts
      if (imgHeight > pageHeight - 40) {
        // Split into multiple pages if too tall
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 15, 20, imgWidth, imgHeight);
      } else {
        pdf.addImage(imgData, 'PNG', 15, currentY, imgWidth, imgHeight);
      }
    }
  } catch (error) {
    console.error('Error capturing visualizations:', error);
  }

  // Footer on last page
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(107, 114, 128);
    pdf.setFont('helvetica', 'italic');
    pdf.text(
      `Page ${i} of ${totalPages} • Generated by CSV Portfolio Visualizer`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Download the PDF
  const filename = `Portfolio_Analysis_${portfolio.broker}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
}
