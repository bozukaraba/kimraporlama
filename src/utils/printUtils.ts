// Browser-compatible PDF Export Utils

export const generatePrintableHTML = (
  reportTitle: string,
  data: any[],
  chartIds: string[] = []
): string => {
  const currentDate = new Date().toLocaleDateString('tr-TR');
  
  // Chart'ları capture et
  const chartElements = chartIds.map(id => {
    const element = document.getElementById(id);
    return element ? element.outerHTML : '';
  }).filter(html => html !== '');
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${reportTitle}</title>
        <style>
          @page {
            size: A4;
            margin: 2cm;
          }
          @media print {
            body { font-family: Arial, sans-serif; font-size: 12px; color: #000; }
            .no-print { display: none !important; }
            .chart-container { page-break-inside: avoid; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            h1 { color: #000; font-size: 24px; margin-bottom: 10px; }
            h2 { color: #000; font-size: 18px; margin: 20px 0 10px 0; }
            .header { text-align: center; margin-bottom: 30px; }
            .date { font-size: 14px; color: #666; }
          }
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .chart-container { margin: 30px 0; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f8f9fa; font-weight: bold; }
          h1 { color: #333; margin-bottom: 10px; }
          h2 { color: #555; margin: 30px 0 15px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reportTitle}</h1>
          <p class="date">Rapor Tarihi: ${currentDate}</p>
        </div>
        
        ${chartElements.length > 0 ? `
          <h2>Grafik Analizleri</h2>
          ${chartElements.map((chart, index) => `
            <div class="chart-container">
              ${chart}
            </div>
          `).join('')}
        ` : ''}
        
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `;
};

export const printToPDF = async (
  reportTitle: string,
  data: any[],
  chartIds: string[] = []
): Promise<void> => {
  try {
    // Yeni pencere aç
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      throw new Error('Pop-up engellenmiş. Lütfen pop-up\'ları açın.');
    }
    
    // HTML içeriği oluştur
    const htmlContent = generatePrintableHTML(reportTitle, data, chartIds);
    
    // İçeriği yaz
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Yazdırma işlemini bekle
    printWindow.focus();
    
  } catch (error) {
    console.error('Print PDF error:', error);
    throw new Error('PDF oluşturma hatası: ' + (error as Error).message);
  }
};

// Chart'ları print için optimize et
export const optimizeChartsForPrint = () => {
  const chartElements = document.querySelectorAll('[id$="-chart"]');
  
  chartElements.forEach(chart => {
    const element = chart as HTMLElement;
    
    // Print media query için stil ekle
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        #${element.id} {
          max-width: 100% !important;
          height: 400px !important;
          page-break-inside: avoid;
        }
        #${element.id} svg {
          max-width: 100% !important;
          height: auto !important;
        }
      }
    `;
    
    if (!document.head.querySelector(`style[data-chart="${element.id}"]`)) {
      style.setAttribute('data-chart', element.id);
      document.head.appendChild(style);
    }
  });
};