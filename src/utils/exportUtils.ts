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
      'Ay': formatMonthToTurkish(report.month),
      'Başvuru Sayısı': (report.applications || 0).toLocaleString('tr-TR'),
      'İşlenen Başvuru': (report.processedApplications || 0).toLocaleString('tr-TR'),
      'Başarı Oranı': `${(((report.processedApplications || 0) / (report.applications || 1)) * 100).toFixed(1)}%`,
      'En Çok Başvuru Departmanı': report.topDepartments?.[0]?.name || 'Belirtilmemiş',
      'En Sık Konu': report.applicationTopics?.[0]?.topic || 'Belirtilmemiş',
      'Ort. İşlem Süresi (Gün)': report.averageProcessingTime || 0,
      'Tarih': new Date(report.createdAt?.toDate ? report.createdAt.toDate() : report.createdAt || Date.now()).toLocaleDateString('tr-TR')
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

// Social Media Export Fonksiyonu
export const exportSocialMediaReport = async (
  reports: any[],
  format: 'csv' | 'pdf',
  yearFilter: string = 'all',
  platformFilter: string = 'all'
): Promise<void> => {
  const title = `Sosyal Medya Raporları ${yearFilter !== 'all' ? yearFilter : ''} ${platformFilter !== 'all' ? platformFilter : ''}`.trim();
  
  if (format === 'csv') {
    const csvData = reports.map(report => ({
      Ay: formatMonthToTurkish(report.month),
      Platform: report.platform || '',
      'Takipçi Sayısı': report.followers || 0,
      'Gönderi Sayısı': report.posts || 0,
      'Beğeni': report.likes || 0,
      'Yorum': report.comments || 0,
      'Görüntülenme': report.views || 0,
      'Yeni Takipçi': report.newFollowers || 0
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
    const printData = reports.map(report => ({
      'Ay/Yıl': formatMonthToTurkish(report.month),
      'Platform': report.platform || '',
      'Takipçi': (report.followers || 0).toLocaleString('tr-TR'),
      'İleti': report.posts || 0,
      'Beğeni': (report.likes || 0).toLocaleString('tr-TR'),
      'Yorum': report.comments || 0,
      'Görüntülenme': (report.views || 0).toLocaleString('tr-TR'),
      'Yeni Takipçi': `+${report.newFollowers || 0}`,
      'En Çok Etkileşim': (report.topPost?.engagement || 0).toLocaleString('tr-TR'),
      'Tarih': new Date(report.createdAt?.toDate ? report.createdAt.toDate() : report.createdAt || Date.now()).toLocaleDateString('tr-TR')
    }));
    
    optimizeChartsForPrint();
    const chartIds = ['social-followers-chart', 'social-engagement-chart', 'social-interaction-chart'];
    await printToPDF(title, printData, chartIds);
    return;
  }
  
  throw new Error('Desteklenmeyen format');
};

// News Export Fonksiyonu
export const exportNewsReport = async (
  reports: any[],
  format: 'csv' | 'pdf',
  yearFilter: string = 'all',
  monthFilter: string = 'all'
): Promise<void> => {
  const title = `Haber Raporları ${yearFilter !== 'all' ? yearFilter : ''} ${monthFilter !== 'all' ? formatMonthToTurkish(monthFilter) : ''}`.trim();
  
  if (format === 'csv') {
    const csvData = reports.map(report => ({
      Ay: formatMonthToTurkish(report.month),
      'Basın Haber': report.newsCount?.print || 0,
      'TV Haber': report.newsCount?.tv || 0,
      'İnternet Haber': report.newsCount?.internet || 0,
      'Toplam Haber': (report.newsCount?.print || 0) + (report.newsCount?.tv || 0) + (report.newsCount?.internet || 0),
      'Toplam Erişim': (report.totalReach?.print || 0) + (report.totalReach?.tv || 0) + (report.totalReach?.internet || 0)
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
    const printData = reports.map(report => ({
      'Ay': formatMonthToTurkish(report.month),
      'Basın Haber': (report.newsCount?.print || 0).toLocaleString('tr-TR'),
      'TV Haber': (report.newsCount?.tv || 0).toLocaleString('tr-TR'),
      'İnternet Haber': (report.newsCount?.internet || 0).toLocaleString('tr-TR'),
      'Toplam Haber': ((report.newsCount?.print || 0) + (report.newsCount?.tv || 0) + (report.newsCount?.internet || 0)).toLocaleString('tr-TR'),
      'Basın Erişim': (report.totalReach?.print || 0).toLocaleString('tr-TR'),
      'TV Erişim': (report.totalReach?.tv || 0).toLocaleString('tr-TR'),
      'İnternet Erişim': (report.totalReach?.internet || 0).toLocaleString('tr-TR'),
      'Toplam Erişim': ((report.totalReach?.print || 0) + (report.totalReach?.tv || 0) + (report.totalReach?.internet || 0)).toLocaleString('tr-TR'),
      'Reklam Eşdeğeri (TL)': ((report.adEquivalent?.print || 0) + (report.adEquivalent?.tv || 0) + (report.adEquivalent?.internet || 0)).toLocaleString('tr-TR'),
      'Tarih': new Date(report.createdAt?.toDate ? report.createdAt.toDate() : report.createdAt || Date.now()).toLocaleDateString('tr-TR')
    }));
    
    optimizeChartsForPrint();
    const chartIds = ['news-count-chart', 'news-equivalent-chart', 'news-reach-chart'];
    await printToPDF(title, printData, chartIds);
    return;
  }
  
  throw new Error('Desteklenmeyen format');
};

// Web Analytics Export Fonksiyonu  
export const exportWebAnalyticsReport = async (
  reports: any[],
  format: 'csv' | 'pdf',
  yearFilter: string = 'all',
  monthFilter: string = 'all'
): Promise<void> => {
  const title = `Web Analytics Raporları ${yearFilter !== 'all' ? yearFilter : ''} ${monthFilter !== 'all' ? formatMonthToTurkish(monthFilter) : ''}`.trim();
  
  if (format === 'csv') {
    const csvData = reports.map(report => ({
      Ay: formatMonthToTurkish(report.month),
      'Web Ziyaretçi': report.visitors?.website || 0,
      'Portal Ziyaretçi': report.visitors?.portal || 0,
      'Toplam Ziyaretçi': (report.visitors?.website || 0) + (report.visitors?.portal || 0),
      'Web Sayfa Görüntüleme': report.pageViews?.website || 0,
      'Portal Sayfa Görüntüleme': report.pageViews?.portal || 0,
      'Toplam Sayfa Görüntüleme': (report.pageViews?.website || 0) + (report.pageViews?.portal || 0)
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
    const printData = reports.map(report => ({
      'Ay': formatMonthToTurkish(report.month),
      'Web Ziyaretçi': (report.visitors?.website || 0).toLocaleString('tr-TR'),
      'Portal Ziyaretçi': (report.visitors?.portal || 0).toLocaleString('tr-TR'),
      'Toplam Ziyaretçi': ((report.visitors?.website || 0) + (report.visitors?.portal || 0)).toLocaleString('tr-TR'),
      'Web Sayfa Görüntüleme': (report.pageViews?.website || 0).toLocaleString('tr-TR'),
      'Portal Sayfa Görüntüleme': (report.pageViews?.portal || 0).toLocaleString('tr-TR'),
      'Toplam Sayfa Görüntüleme': ((report.pageViews?.website || 0) + (report.pageViews?.portal || 0)).toLocaleString('tr-TR'),
      'Ortalama Oturum (dk)': report.avgSessionDuration || 0,
      'Geri Dönüş Oranı (%)': `${report.bounceRate || 0}%`,
      'Tarih': new Date(report.createdAt?.toDate ? report.createdAt.toDate() : report.createdAt || Date.now()).toLocaleDateString('tr-TR')
    }));
    
    optimizeChartsForPrint();
    const chartIds = ['web-visitors-chart', 'web-pageviews-chart'];
    await printToPDF(title, printData, chartIds);
    return;
  }
  
  throw new Error('Desteklenmeyen format');
};

// RPA Export Fonksiyonu
export const exportRPAReport = async (
  reports: any[],
  format: 'csv' | 'pdf',
  yearFilter: string = 'all',
  monthFilter: string = 'all'
): Promise<void> => {
  const title = `RPA Raporları ${yearFilter !== 'all' ? yearFilter : ''} ${monthFilter !== 'all' ? formatMonthToTurkish(monthFilter) : ''}`.trim();
  
  if (format === 'csv') {
    const csvData = reports.map(report => ({
      Ay: formatMonthToTurkish(report.month),
      'Gelen Mail': report.incomingEmails || 0,
      'Gönderilen Mail': report.sentEmails || 0,
      'Toplam Mail': (report.incomingEmails || 0) + (report.sentEmails || 0),
      'En Çok Mail Alıcıları': (report.topEmailRecipients || []).slice(0, 3).map((recipient: any) => `${recipient.email}: ${recipient.count}`).join('; ')
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
    const printData = reports.map(report => ({
      'Ay': formatMonthToTurkish(report.month),
      'Gelen Mail': (report.incomingEmails || 0).toLocaleString('tr-TR'),
      'Gönderilen Mail': (report.sentEmails || 0).toLocaleString('tr-TR'),
      'Toplam Mail': ((report.incomingEmails || 0) + (report.sentEmails || 0)).toLocaleString('tr-TR'),
      'En Çok Mail Alan': (report.topEmailRecipients || [])[0]?.email || 'Belirtilmemiş',
      'Mail Sayısı': (report.topEmailRecipients || [])[0]?.count || 0,
      'Ort. Yanıt Süresi (saat)': report.avgResponseTime || 0,
      'Otomatik İşlem (%)': `${report.automationRate || 0}%`,
      'Tarih': new Date(report.createdAt?.toDate ? report.createdAt.toDate() : report.createdAt || Date.now()).toLocaleDateString('tr-TR')
    }));
    
    optimizeChartsForPrint();
    const chartIds = ['rpa-emails-chart', 'rpa-recipients-chart'];
    await printToPDF(title, printData, chartIds);
    return;
  }
  
  throw new Error('Desteklenmeyen format');
};