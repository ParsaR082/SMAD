import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Flag to prevent multiple simultaneous PNG exports
let isPngExporting = false;

/**
 * Export dashboard charts to PNG format
 */
export const exportToPNG = async (): Promise<void> => {
  // Prevent multiple simultaneous exports
  if (isPngExporting) {
    console.log('PNG export already in progress, skipping...');
    return;
  }
  
  isPngExporting = true;
  console.log('Starting PNG export...');
  
  try {
    // Find all chart containers
    const chartElements = document.querySelectorAll('[data-chart]');
    console.log(`Found ${chartElements.length} charts to export as PNG`);
    
    if (chartElements.length === 0) {
      throw new Error('No charts found to export');
    }

    // Capture each chart individually and combine them
    const canvases: HTMLCanvasElement[] = [];
    
    for (let i = 0; i < chartElements.length; i++) {
      const chartElement = chartElements[i] as HTMLElement;
      console.log(`Capturing chart ${i + 1}/${chartElements.length}`);
      
      try {
        const canvas = await html2canvas(chartElement, {
          backgroundColor: '#0a0a0a',
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          onclone: (clonedDoc) => {
            // Replace problematic color functions in the cloned document
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach(el => {
              const element = el as HTMLElement;
              if (element.style) {
                ['color', 'background-color', 'border-color', 'fill', 'stroke'].forEach(prop => {
                  const value = element.style.getPropertyValue(prop);
                  if (value && (value.includes('oklab') || value.includes('oklch') || value.includes('color-mix'))) {
                    if (prop === 'color' || prop === 'fill') {
                      element.style.setProperty(prop, '#ededed', 'important');
                    } else if (prop === 'background-color') {
                      element.style.setProperty(prop, '#0a0a0a', 'important');
                    } else {
                      element.style.setProperty(prop, '#333333', 'important');
                    }
                  }
                });
              }
            });
          }
        });
        canvases.push(canvas);
      } catch (chartError) {
        console.warn(`Failed to capture chart ${i + 1}:`, chartError);
      }
    }
    
    if (canvases.length === 0) {
      throw new Error('Failed to capture any charts');
    }

    // Create a combined canvas
    const combinedCanvas = document.createElement('canvas');
    const ctx = combinedCanvas.getContext('2d')!;
    
    // Calculate total height and max width
    const maxWidth = Math.max(...canvases.map(c => c.width));
    const totalHeight = canvases.reduce((sum, c) => sum + c.height + 40, 40); // 40px padding between charts
    
    combinedCanvas.width = maxWidth;
    combinedCanvas.height = totalHeight;
    
    // Fill background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, maxWidth, totalHeight);
    
    // Draw each chart
    let currentY = 20;
    canvases.forEach(canvas => {
      const x = (maxWidth - canvas.width) / 2; // Center horizontally
      ctx.drawImage(canvas, x, currentY);
      currentY += canvas.height + 40;
    });

    console.log('Creating download link...');
    
    // Create download link
    const link = document.createElement('a');
    link.download = `dashboard-charts-${new Date().toISOString().split('T')[0]}.png`;
    link.href = combinedCanvas.toDataURL('image/png');
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('PNG export completed successfully');

  } catch (error) {
    console.error('Error exporting to PNG:', error);
    throw new Error('Failed to export charts as PNG');
  } finally {
    // Reset the export flag
    isPngExporting = false;
  }
};

// Flag to prevent multiple simultaneous PDF exports
let isPdfExporting = false;

/**
 * Export dashboard charts to PDF format
 */
export const exportToPDF = async (): Promise<void> => {
  // Prevent multiple simultaneous exports
  if (isPdfExporting) {
    console.log('PDF export already in progress, skipping...');
    return;
  }
  
  isPdfExporting = true;
  
  try {
    console.log('Starting PDF export...');
    
    // Add global CSS override to eliminate oklab colors
    const styleElement = document.createElement('style');
    styleElement.id = 'pdf-export-override';
    styleElement.innerHTML = `
      * {
        color: #333333 !important;
        background-color: white !important;
        border-color: #cccccc !important;
        fill: #333333 !important;
        stroke: #cccccc !important;
      }
      .recharts-text {
        fill: #333333 !important;
      }
      .recharts-cartesian-axis-tick-value {
        fill: #333333 !important;
      }
      .recharts-legend-item-text {
        color: #333333 !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    // Wait for styles to apply
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find all chart containers
    const chartElements = document.querySelectorAll('[data-chart]');
    console.log(`Found ${chartElements.length} charts to export as PDF`);
    
    if (chartElements.length === 0) {
      // Clean up
      const overrideStyle = document.getElementById('pdf-export-override');
      if (overrideStyle) overrideStyle.remove();
      throw new Error('No charts found to export');
    }

    // Create a container for all charts
    const exportContainer = document.createElement('div');
    exportContainer.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: 800px;
      background: white;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    `;
    
    document.body.appendChild(exportContainer);

    // Clone each chart and add to export container
    chartElements.forEach((chartElement, index) => {
      console.log(`Processing chart ${index + 1}/${chartElements.length} for PDF export`);
      const clonedChart = chartElement.cloneNode(true) as HTMLElement;
      clonedChart.style.width = '100%';
      clonedChart.style.minHeight = '400px';
      exportContainer.appendChild(clonedChart);
    });

    // Wait for any dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Comprehensive color function replacement
    const replaceUnsupportedColors = (element: HTMLElement) => {
      // Replace in inline styles
      if (element.style) {
        const styleProps = ['color', 'backgroundColor', 'borderColor', 'fill', 'stroke', 'background'];
        styleProps.forEach(prop => {
          const value = element.style.getPropertyValue(prop);
          if (value && (value.includes('oklab') || value.includes('oklch') || value.includes('color-mix'))) {
            element.style.setProperty(prop, prop === 'color' ? '#333333' : '#cccccc', 'important');
          }
        });
      }
      
      // Replace in computed styles by setting explicit values
      const computedStyle = window.getComputedStyle(element);
      const problematicProps = ['color', 'background-color', 'border-color', 'fill', 'stroke'];
      problematicProps.forEach(prop => {
        const value = computedStyle.getPropertyValue(prop);
        if (value && (value.includes('oklab') || value.includes('oklch') || value.includes('color-mix'))) {
          element.style.setProperty(prop, prop === 'color' ? '#333333' : '#cccccc', 'important');
        }
      });
      
      // Process all child elements
      Array.from(element.children).forEach(child => {
        if (child instanceof HTMLElement) {
          replaceUnsupportedColors(child);
        }
      });
    };
    
    replaceUnsupportedColors(exportContainer);

    console.log('Capturing PDF with html2canvas...');
    
    // Capture the container
    const canvas = await html2canvas(exportContainer, {
      backgroundColor: 'white',
      scale: 2,
      useCORS: true,
      allowTaint: false,
      width: 800,
      height: exportContainer.scrollHeight,
      logging: false,
      onclone: (clonedDoc) => {
        const allElements = clonedDoc.querySelectorAll('*');
        allElements.forEach(el => {
          const style = (el as HTMLElement).style;
          ['color', 'background-color', 'border-color', 'fill', 'stroke'].forEach(prop => {
            const value = style.getPropertyValue(prop);
            if (value && (value.includes('oklab') || value.includes('oklch') || value.includes('color-mix'))) {
              if (prop === 'color') {
                style.setProperty(prop, '#333333', 'important');
              } else if (prop === 'background-color') {
                style.setProperty(prop, 'white', 'important');
              } else {
                style.setProperty(prop, '#cccccc', 'important');
              }
            }
          });
        });
      }
    });

    console.log('PDF capture completed, creating PDF...');

    // Clean up
    document.body.removeChild(exportContainer);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Calculate dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasAspectRatio = canvas.height / canvas.width;
    const pdfAspectRatio = pdfHeight / pdfWidth;

    let imgWidth, imgHeight;
    if (canvasAspectRatio > pdfAspectRatio) {
      // Canvas is taller relative to its width than PDF
      imgHeight = pdfHeight - 20; // 10mm margin on top and bottom
      imgWidth = imgHeight / canvasAspectRatio;
    } else {
      // Canvas is wider relative to its height than PDF
      imgWidth = pdfWidth - 20; // 10mm margin on left and right
      imgHeight = imgWidth * canvasAspectRatio;
    }

    const x = (pdfWidth - imgWidth) / 2;
    const y = (pdfHeight - imgHeight) / 2;

    // Add image to PDF
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, imgWidth, imgHeight);

    // Save PDF
    pdf.save(`dashboard-charts-${new Date().toISOString().split('T')[0]}.pdf`);
    
    console.log('PDF export completed successfully');

  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Failed to export charts as PDF');
  } finally {
    // Clean up global CSS override
    const overrideStyle = document.getElementById('pdf-export-override');
    if (overrideStyle) overrideStyle.remove();
    
    // Reset the export flag
    isPdfExporting = false;
  }
};