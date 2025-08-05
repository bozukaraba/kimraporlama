// Tarih yardımcı fonksiyonları

export const monthNames = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export const monthNamesShort = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'
];

// YYYY-MM formatını Türkçe aya çevirme
export const formatMonthToTurkish = (monthString: string): string => {
  if (!monthString || !monthString.includes('-')) return monthString;
  
  const [year, month] = monthString.split('-');
  const monthIndex = parseInt(month) - 1;
  
  if (monthIndex >= 0 && monthIndex < 12) {
    return `${monthNames[monthIndex]} ${year}`;
  }
  
  return monthString;
};

// Türkçe ayı YYYY-MM formatına çevirme
export const formatTurkishToMonth = (turkishMonth: string): string => {
  const parts = turkishMonth.split(' ');
  if (parts.length !== 2) return turkishMonth;
  
  const [monthName, year] = parts;
  const monthIndex = monthNames.indexOf(monthName);
  
  if (monthIndex >= 0) {
    const month = (monthIndex + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }
  
  return turkishMonth;
};

// Ay seçenekleri üretme
export const generateMonthOptions = (startYear: number = 2020, endYear?: number) => {
  const currentYear = endYear || new Date().getFullYear();
  const options: Array<{value: string, label: string, year: number, month: number}> = [];
  
  for (let year = currentYear; year >= startYear; year--) {
    for (let month = 12; month >= 1; month--) {
      const value = `${year}-${month.toString().padStart(2, '0')}`;
      const label = `${monthNames[month - 1]} ${year}`;
      options.push({ value, label, year, month });
    }
  }
  
  return options;
};

// Mevcut ay/yıl alma
export const getCurrentMonthYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

// Ay filtreleme fonksiyonları
export const filterByYear = (data: any[], year: string) => {
  if (year === 'all') return data;
  return data.filter(item => item.month && item.month.startsWith(year));
};

export const filterByMonth = (data: any[], month: string) => {
  if (month === 'all') return data;
  return data.filter(item => item.month === month);
};

// Yıl listesi üretme
export const getAvailableYears = (data: any[]) => {
  const years = new Set<string>();
  data.forEach(item => {
    if (item.month && item.month.includes('-')) {
      years.add(item.month.split('-')[0]);
    }
  });
  return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
};

// Ay listesi üretme (belirli yıl için)
export const getAvailableMonths = (data: any[], year: string) => {
  const months = new Set<string>();
  data.forEach(item => {
    if (item.month && (year === 'all' || item.month.startsWith(year))) {
      months.add(item.month);
    }
  });
  return Array.from(months).sort((a, b) => b.localeCompare(a));
};