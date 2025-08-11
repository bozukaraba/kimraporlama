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

// Tüm Raporları Export Etme Fonksiyonu
export const exportAllReports = async (
  format: 'csv' | 'pdf',
  yearFilter: string = 'all',
  monthFilter: string = 'all'
): Promise<void> => {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const { db } = await import('../firebase/config');
    
    // Tüm raporları fetch et
    const [cimerSnapshot, webSnapshot, socialSnapshot, rpaSnapshot, newsSnapshot] = await Promise.all([
      getDocs(collection(db, 'cimerReports')),
      getDocs(collection(db, 'webAnalyticsReports')),
      getDocs(collection(db, 'socialMediaReports')),
      getDocs(collection(db, 'rpaReports')),
      getDocs(collection(db, 'newsReports'))
    ]);

    // Filtreleme fonksiyonu
    const filterReport = (doc: any) => {
      const data = doc.data();
      let matches = true;
      
      if (yearFilter !== 'all' && data.year?.toString() !== yearFilter) {
        matches = false;
      }
      
      if (monthFilter !== 'all' && data.month !== monthFilter) {
        matches = false;
      }
      
      return matches;
    };

    // Filtrelenmiş veriler
    const cimerReports = cimerSnapshot.docs.filter(filterReport).map(doc => doc.data());
    const webReports = webSnapshot.docs.filter(filterReport).map(doc => doc.data());
    const socialReports = socialSnapshot.docs.filter(filterReport).map(doc => doc.data());
    const rpaReports = rpaSnapshot.docs.filter(filterReport).map(doc => doc.data());
    const newsReports = newsSnapshot.docs.filter(filterReport).map(doc => doc.data());

    const title = `Tüm_Raporlar_${yearFilter !== 'all' ? yearFilter : 'Tüm_Yıllar'}_${monthFilter !== 'all' ? monthFilter : 'Tüm_Aylar'}`;
    
    if (format === 'csv') {
      // Her rapor türü için ayrı CSV sayfası oluştur
      let csvContent = '';
      
      // CİMER Raporları
      if (cimerReports.length > 0) {
        csvContent += 'CİMER RAPORLARI\n';
        csvContent += 'Ay,Başvuru Sayısı,İşlenen Başvuru,Başarı Oranı,En Çok Başvuru Alan Birim,En Sık Konu\n';
        cimerReports.forEach(report => {
          csvContent += `"${formatMonthToTurkish(report.month)}","${report.applications || 0}","${report.processedApplications || 0}","${(((report.processedApplications || 0) / (report.applications || 1)) * 100).toFixed(1)}%","${report.topDepartments?.[0]?.name || 'Belirtilmemiş'}","${report.applicationTopics?.[0]?.topic || 'Belirtilmemiş'}"\n`;
        });
        csvContent += '\n';
      }

      // Web Analitik Raporları
      if (webReports.length > 0) {
        csvContent += 'WEB ANALİTİK RAPORLARI\n';
        csvContent += 'Ay,Web Sitesi Ziyaretçi,Portal Ziyaretçi,Web Sitesi Sayfa Görüntüleme,Portal Sayfa Görüntüleme\n';
        webReports.forEach(report => {
          csvContent += `"${formatMonthToTurkish(report.month)}","${report.visitors?.website || 0}","${report.visitors?.portal || 0}","${report.pageViews?.website || 0}","${report.pageViews?.portal || 0}"\n`;
        });
        csvContent += '\n';
      }

      // Sosyal Medya Raporları
      if (socialReports.length > 0) {
        csvContent += 'SOSYAL MEDYA RAPORLARI\n';
        csvContent += 'Ay,Platform,Takipçi,İleti,Beğeni,Yorum,Görüntülenme,Yeni Takipçi\n';
        socialReports.forEach(report => {
          csvContent += `"${formatMonthToTurkish(report.month)}","${report.platform}","${report.followers || 0}","${report.posts || 0}","${report.likes || 0}","${report.comments || 0}","${report.views || 0}","${report.newFollowers || 0}"\n`;
        });
        csvContent += '\n';
      }

      // RPA Raporları
      if (rpaReports.length > 0) {
        csvContent += 'RPA RAPORLARI\n';
        csvContent += 'Ay,Gelen Mail,İletilen Mail,En Çok Mail Alan Adres\n';
        rpaReports.forEach(report => {
          csvContent += `"${formatMonthToTurkish(report.month)}","${report.incomingEmails || 0}","${report.sentEmails || 0}","${report.topEmailRecipients?.[0]?.email || 'Belirtilmemiş'}"\n`;
        });
        csvContent += '\n';
      }

      // Haber Raporları
      if (newsReports.length > 0) {
        csvContent += 'HABER RAPORLARI\n';
        csvContent += 'Ay,İçerik,Basın Haber,TV Haber,İnternet Haber,Toplam Reklam Eşdeğeri,Toplam Erişim\n';
        newsReports.forEach(report => {
          const totalAdEquivalent = (report.adEquivalent?.print || 0) + (report.adEquivalent?.tv || 0) + (report.adEquivalent?.internet || 0);
          const totalReach = (report.totalReach?.print || 0) + (report.totalReach?.tv || 0) + (report.totalReach?.internet || 0);
          csvContent += `"${formatMonthToTurkish(report.month)}","${report.period === 'ahmet-hamdi-atalay' ? 'Ahmet Hamdi Atalay' : 'Türksat'}","${report.newsCount?.print || 0}","${report.newsCount?.tv || 0}","${report.newsCount?.internet || 0}","${totalAdEquivalent}","${totalReach}"\n`;
        });
      }

      // CSV dosyasını indir
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${title}.csv`;
      link.click();
      return;
    }

    if (format === 'pdf') {
      // PDF için özet istatistik tablosu oluştur
      const summaryData = [
        {
          'Rapor Türü': 'CİMER',
          'Toplam Kayıt': cimerReports.length,
          'Toplam Başvuru': cimerReports.reduce((sum, report) => sum + (report.applications || 0), 0).toLocaleString('tr-TR'),
          'Toplam İşlenen': cimerReports.reduce((sum, report) => sum + (report.processedApplications || 0), 0).toLocaleString('tr-TR')
        },
        {
          'Rapor Türü': 'Web Analitik',
          'Toplam Kayıt': webReports.length,
          'Toplam Web Ziyaretçi': webReports.reduce((sum, report) => sum + (report.visitors?.website || 0), 0).toLocaleString('tr-TR'),
          'Toplam Portal Ziyaretçi': webReports.reduce((sum, report) => sum + (report.visitors?.portal || 0), 0).toLocaleString('tr-TR')
        },
        {
          'Rapor Türü': 'Sosyal Medya',
          'Toplam Kayıt': socialReports.length,
          'Toplam Takipçi': socialReports.reduce((sum, report) => sum + (report.followers || 0), 0).toLocaleString('tr-TR'),
          'Toplam Beğeni': socialReports.reduce((sum, report) => sum + (report.likes || 0), 0).toLocaleString('tr-TR')
        },
        {
          'Rapor Türü': 'RPA',
          'Toplam Kayıt': rpaReports.length,
          'Toplam Gelen Mail': rpaReports.reduce((sum, report) => sum + (report.incomingEmails || 0), 0).toLocaleString('tr-TR'),
          'Toplam İletilen Mail': rpaReports.reduce((sum, report) => sum + (report.sentEmails || 0), 0).toLocaleString('tr-TR')
        },
        {
          'Rapor Türü': 'Haber',
          'Toplam Kayıt': newsReports.length,
          'Toplam Haber': newsReports.reduce((sum, report) => sum + (report.newsCount?.print || 0) + (report.newsCount?.tv || 0) + (report.newsCount?.internet || 0), 0).toLocaleString('tr-TR'),
          'Toplam Erişim': newsReports.reduce((sum, report) => sum + (report.totalReach?.print || 0) + (report.totalReach?.tv || 0) + (report.totalReach?.internet || 0), 0).toLocaleString('tr-TR')
        }
      ];

      await printToPDF(title, summaryData, []);
      return;
    }
  } catch (error) {
    console.error('Export all reports error:', error);
    throw new Error('Tüm raporları export ederken hata oluştu.');
  }
};