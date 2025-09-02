export interface User {
  uid: string;
  email: string;
  role: 'personel' | 'admin';
  isApproved: boolean;
  createdAt: Date;
}

// 1. Haber Raporu
export interface NewsReport {
  id?: string;
  month: string;
  year: number;
  period: 'ahmet-hamdi-atalay' | 'turksat'; // Dönem seçimi
  // Medyada Yer Alma (Haber Sayısı)
  newsCount: {
    print: number;        // Basın
    tv: number;          // TV
    internet: number;    // İnternet Haber Sitesi
  };
  // Reklam Eşdeğeri (TL)
  adEquivalent: {
    print: number;
    tv: number;
    internet: number;
  };
  // Toplam Erişim (Kişi)
  totalReach: {
    print: number;
    tv: number;
    internet: number;
  };
  userId: string;
  createdAt: Date;
  updatedAt?: Date;
}

// 2. Sosyal Medya Raporu
export interface SocialMediaReport {
  id?: string;
  month: string;
  year: number;
  platform: 'X' | 'Instagram' | 'LinkedIn' | 'Facebook' | 'YouTube' | 'NextSosyal';
  followers: number;
  posts: number;
  likes: number;
  comments: number;
  shares?: number;      // LinkedIn, Facebook için
  retweets?: number;    // X için
  reshares?: number;    // NextSosyal için
  views: number;
  newFollowers: number;
  mostEngagedPost?: string;
  // Ek Metrikler
  topPost?: {
    engagement: number;
    link?: string;
  };
  userId: string;
  createdAt: Date;
  updatedAt?: Date;
}

// 3. Web Sitesi ve İç İletişim Portalı
export interface WebAnalyticsReport {
  id?: string;
  month: string;
  year: number;
  // Ziyaretçi Sayısı
  visitors: {
    website: number;
    portal: number;
  };
  // Sayfa Görüntüleme
  pageViews: {
    website: number;
    portal: number;
  };
  // En Popüler Sayfalar
  topPages: {
    website: string[];
    portal: string[];
  };
  // Ek Metrikler
  avgSessionDuration?: number; // dakika
  bounceRate?: number; // yüzde
  userId: string;
  createdAt: Date;
  updatedAt?: Date;
}

// 4. CİMER Raporu
export interface CimerReport {
  id?: string;
  month: string;
  year: number;
  // Başvuru / Cevaplama Oranları
  applications: number;
  processedApplications: number;
  // Ortalama İşlem Süresi (Gün)
  averageProcessingTime?: number;
  // En Çok Başvuru Alan Birimler
  topDepartments: Array<{
    name: string;
    rate: number;
  }>;
  // Başvuru Konusu
  applicationTopics: Array<{
    topic: string;
    count: number;
  }>;
  userId: string;
  createdAt: Date;
  updatedAt?: Date;
}

// 5. RPA Raporu
export interface RPAReport {
  id?: string;
  month: string;
  year: number;
  // Gelen/İletilen Mailler
  incomingEmails: number;
  sentEmails: number;
  // En Çok Başvuru/Talep Alan Mailler
  topEmailRecipients: Array<{
    email: string;
    count: number;
  }>;
  // Ek Metrikler
  avgResponseTime?: number; // saat
  automationRate?: number; // yüzde
  userId: string;
  createdAt: Date;
  updatedAt?: Date;
} 