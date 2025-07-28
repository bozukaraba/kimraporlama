export interface User {
  uid: string;
  email: string;
  role: 'personel' | 'admin';
  isApproved: boolean;
  createdAt: Date;
}

export interface SocialMediaReport {
  id?: string;
  month: string;
  year: number;
  platform: 'Instagram' | 'Youtube' | 'Facebook' | 'LinkedIn' | 'X';
  followers: number;
  posts: number;
  mostEngagedPost: string;
  leastEngagedPost: string;
  userId: string;
  createdAt: Date;
}

export interface NewsReport {
  id?: string;
  month: string;
  year: number;
  status: 'olumlu' | 'olumsuz' | 'kritik';
  summary: string;
  link: string;
  sources: string[];
  userId: string;
  createdAt: Date;
}

export interface WebAnalyticsReport {
  id?: string;
  month: string;
  year: number;
  visitors: number;
  pageViews: number;
  bounceRate: number;
  avgSessionDuration: number;
  conversions: number;
  topPages: string[];
  userId: string;
  createdAt: Date;
}

export interface RPAReport {
  id?: string;
  month: string;
  year: number;
  totalEmails: number;
  distributedEmails: number;
  topDepartments: string[];
  userId: string;
  createdAt: Date;
} 