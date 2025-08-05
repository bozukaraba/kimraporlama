import { formatMonthToTurkish } from './dateUtils';

// Chart'ı canvas'a çevirme (Dynamic Import)
export const captureChart = async (elementId: string): Promise<string | null> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) return null;
    
    // Dynamic import html2canvas
    const html2canvas = (await import('html2canvas')).default;
    
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true
    });
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Chart capture error:', error);
    return null;
  }
};

// PDF Export İçin Chart Listesi
interface ChartData {
  id: string;
  title: string;
  dataUrl?: string;
}

// PDF Export Fonksiyonu (Dynamic Import)
export const exportToPDF = async (
  reportTitle: string,
  data: any[],
  charts: ChartData[] = []
): Promise<void> => {
  try {
    // Dynamic import jsPDF
    const jsPDF = (await import('jspdf')).default;
    const pdf = new jsPDF('p', 'mm', 'a4');
    let yPosition = 20;
    
    // Başlık
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(reportTitle, 20, yPosition);
    yPosition += 15;
    
    // Tarih
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 20, yPosition);
    yPosition += 20;
    
    // Chart'ları PDF'e ekleme
    for (const chart of charts) {
      if (chart.dataUrl) {
        // Sayfa kontrolü
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(chart.title, 20, yPosition);
        yPosition += 10;
        
        // Chart resmi ekleme
        try {
          pdf.addImage(chart.dataUrl, 'PNG', 20, yPosition, 170, 100);
          yPosition += 110;
        } catch (error) {
          console.error('Chart image error:', error);
          yPosition += 20;
        }
      }
    }
    
    // Veri tablosu ekleme
    if (data.length > 0) {
      if (yPosition > 200) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Detaylı Veriler', 20, yPosition);
      yPosition += 15;
      
      // Basit tablo ekleme
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      
      data.slice(0, 10).forEach((item, index) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        
        const text = Object.values(item).join(' | ');
        pdf.text(text.substring(0, 80), 20, yPosition);
        yPosition += 6;
      });
    }
    
    // PDF'i indir
    pdf.save(`${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error('PDF oluşturma hatası');
  }
};

// PowerPoint Export Fonksiyonu (Dynamic Import)
export const exportToPPT = async (
  reportTitle: string,
  data: any[],
  charts: ChartData[] = []
): Promise<void> => {
  try {
    // Dynamic import PptxGenJS
    const PptxGenJS = (await import('pptxgenjs')).default;
    const pptx = new PptxGenJS();
    
    // Başlık Slide'ı
    const titleSlide = pptx.addSlide();
    titleSlide.addText(reportTitle, {
      x: 1,
      y: 2,
      w: 8,
      h: 1,
      fontSize: 32,
      bold: true,
      color: '363636',
      align: 'center'
    });
    
    titleSlide.addText(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, {
      x: 1,
      y: 4,
      w: 8,
      h: 0.5,
      fontSize: 16,
      color: '666666',
      align: 'center'
    });
    
    // Chart Slide'ları
    for (const chart of charts) {
      if (chart.dataUrl) {
        const chartSlide = pptx.addSlide();
        
        chartSlide.addText(chart.title, {
          x: 0.5,
          y: 0.3,
          w: 9,
          h: 0.8,
          fontSize: 24,
          bold: true,
          color: '363636',
          align: 'center'
        });
        
        try {
          chartSlide.addImage({
            data: chart.dataUrl,
            x: 1,
            y: 1.5,
            w: 8,
            h: 5
          });
        } catch (error) {
          console.error('Chart image error in PPT:', error);
        }
      }
    }
    
    // Veri Tablosu Slide'ı
    if (data.length > 0) {
      const dataSlide = pptx.addSlide();
      
      dataSlide.addText('Detaylı Veriler', {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.8,
        fontSize: 24,
        bold: true,
        color: '363636',
        align: 'center'
      });
      
      // Basit tablo oluşturma
      const tableData = data.slice(0, 8).map(item => Object.values(item));
      if (tableData.length > 0) {
        const headers = Object.keys(data[0]).map(key => key.charAt(0).toUpperCase() + key.slice(1));
        
        dataSlide.addTable([headers, ...tableData], {
          x: 0.5,
          y: 1.5,
          w: 9,
          h: 5,
          fontSize: 10,
          border: {pt: 1, color: 'CCCCCC'}
        });
      }
    }
    
    // PowerPoint'i indir
    await pptx.writeFile(`${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pptx`);
    
  } catch (error) {
    console.error('PowerPoint export error:', error);
    throw new Error('PowerPoint oluşturma hatası');
  }
};

// CIMER Özel Export Fonksiyonu
export const exportCimerReport = async (
  reports: any[],
  format: 'csv' | 'pdf' | 'ppt',
  yearFilter: string = 'all',
  monthFilter: string = 'all'
): Promise<void> => {
  const title = `CIMER Raporları ${yearFilter !== 'all' ? yearFilter : ''} ${monthFilter !== 'all' ? formatMonthToTurkish(monthFilter) : ''}`.trim();
  
  if (format === 'csv') {
    // Mevcut CSV export
    const csvData = reports.map(report => ({
      Ay: formatMonthToTurkish(report.month),
      'Başvuru Sayısı': report.applications || 0,
      'İşlenen Başvuru': report.processedApplications || 0,
      'Başarı Oranı': `${((report.processedApplications / report.applications) * 100).toFixed(1)}%`,
      'En Çok Başvuru Alan Birimler': (report.topDepartments || []).map(dept => `${dept.name}: %${dept.rate}`).join('; '),
      'En Sık Başvuru Konuları': (report.applicationTopics || []).map(topic => `${topic.topic}: ${topic.count}`).join('; ')
    }));
    
    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/\s+/g, '_')}.csv`;
    link.click();
    return;
  }
  
  // Chart'ları capture et
  const charts: ChartData[] = [
    { id: 'applications-chart', title: 'Aylık Başvuru Trendleri' },
    { id: 'departments-chart', title: 'En Çok Başvuru Alan Birimler' },
    { id: 'topics-chart', title: 'En Sık Başvuru Konuları' }
  ];
  
  // Chart'ları yakalama
  for (const chart of charts) {
    chart.dataUrl = await captureChart(chart.id);
  }
  
  // Format'a göre export
  if (format === 'pdf') {
    await exportToPDF(title, reports, charts);
  } else if (format === 'ppt') {
    await exportToPPT(title, reports, charts);
  }
};