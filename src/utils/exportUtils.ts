import { formatMonthToTurkish } from './dateUtils';
import { printToPDF, optimizeChartsForPrint } from './printUtils';

// CIMER Multi-Format Export Fonksiyonu
export const exportCimerReport = async (
  reports: any[],
  format: 'csv' | 'pdf',
  yearFilter: string = 'all',
  monthFilter: string = 'all'
): Promise<void> => {
  const title = `CIMER Raporları ${yearFilter !== 'all' ? yearFilter : ''} ${monthFilter !== 'all' ? formatMonthToTurkish(monthFilter) : ''}`.trim();
  
  if (format === 'csv') {
    // CSV export
    const csvData = reports.map(report => ({
      Ay: formatMonthToTurkish(report.month),
      'Başvuru Sayısı': report.applications || 0,
      'İşlenen Başvuru': report.processedApplications || 0,
      'Başarı Oranı': `${(((report.processedApplications || 0) / (report.applications || 1)) * 100).toFixed(1)}%`,
      'En Çok Başvuru Alan Birimler': (report.topDepartments || []).map((dept: {name: string, rate: number}) => `${dept.name}: %${dept.rate}`).join('; '),
      'En Sık Başvuru Konuları': (report.applicationTopics || []).map((topic: {topic: string, count: number}) => `${topic.topic}: ${topic.count}`).join('; ')
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
  
  if (format === 'pdf') {
    // PDF export via browser print
    const printData = reports.map(report => ({
      Ay: formatMonthToTurkish(report.month),
      'Başvuru Sayısı': report.applications || 0,
      'İşlenen Başvuru': report.processedApplications || 0,
      'Başarı Oranı': `${(((report.processedApplications || 0) / (report.applications || 1)) * 100).toFixed(1)}%`
    }));
    
    // Chart'ları print için optimize et
    optimizeChartsForPrint();
    
    // Chart ID'leri
    const chartIds = [
      'applications-chart',
      'departments-chart', 
      'topics-chart'
    ];
    
    await printToPDF(title, printData, chartIds);
    return;
  }
  
  throw new Error('Desteklenmeyen format');
};