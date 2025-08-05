import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Button
} from '@mui/material';
import {
  Assessment,
  Article,
  Analytics,
  AutoAwesome,
  TrendingUp
} from '@mui/icons-material';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface ReportSummary {
  socialMedia: number;
  news: number;
  webAnalytics: number;
  cimer: number;
  rpa: number;
}

interface MonthlyData {
  month: string;
  socialMedia: number;
  news: number;
  webAnalytics: number;
  cimer: number;
  rpa: number;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#9c27b0', '#ff7300'];

const ReportsOverview: React.FC = () => {
  const [reportSummary, setReportSummary] = useState<ReportSummary>({
    socialMedia: 0,
    news: 0,
    webAnalytics: 0,
    cimer: 0,
    rpa: 0
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [lastMonth, setLastMonth] = useState<string>('');

  useEffect(() => {
    fetchReportSummary();
  }, []);

  const fetchReportSummary = async () => {
    try {
      setLoading(true);
      
      // Her rapor türü için sayıları al
      const [socialMediaSnapshot, newsSnapshot, webAnalyticsSnapshot, cimerSnapshot, rpaSnapshot] = await Promise.all([
        getDocs(collection(db, 'socialMediaReports')),
        getDocs(collection(db, 'newsReports')),
        getDocs(collection(db, 'webAnalyticsReports')),
        getDocs(collection(db, 'cimerReports')),
        getDocs(collection(db, 'rpaReports'))
      ]);

      const summary = {
        socialMedia: socialMediaSnapshot.size,
        news: newsSnapshot.size,
        webAnalytics: webAnalyticsSnapshot.size,
        cimer: cimerSnapshot.size,
        rpa: rpaSnapshot.size
      };

      setReportSummary(summary);

      // Aylık veri için son 6 ay
      const monthlyStats: { [key: string]: MonthlyData } = {};
      
      socialMediaSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const monthKey = data.month;
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = {
            month: monthKey,
            socialMedia: 0,
            news: 0,
            webAnalytics: 0,
            cimer: 0,
            rpa: 0
          };
        }
        monthlyStats[monthKey].socialMedia++;
      });

      newsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const monthKey = data.month;
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = {
            month: monthKey,
            socialMedia: 0,
            news: 0,
            webAnalytics: 0,
            cimer: 0,
            rpa: 0
          };
        }
        monthlyStats[monthKey].news++;
      });

      webAnalyticsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const monthKey = data.month;
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = {
            month: monthKey,
            socialMedia: 0,
            news: 0,
            webAnalytics: 0,
            cimer: 0,
            rpa: 0
          };
        }
        monthlyStats[monthKey].webAnalytics++;
      });

      rpaSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const monthKey = data.month;
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = {
            month: monthKey,
            socialMedia: 0,
            news: 0,
            webAnalytics: 0,
            cimer: 0,
            rpa: 0
          };
        }
        monthlyStats[monthKey].rpa++;
      });

      cimerSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const monthKey = data.month;
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = {
            month: monthKey,
            socialMedia: 0,
            news: 0,
            webAnalytics: 0,
            cimer: 0,
            rpa: 0
          };
        }
        monthlyStats[monthKey].cimer++;
      });

      const sortedMonthlyData = Object.values(monthlyStats)
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6); // Son 6 ay

      setMonthlyData(sortedMonthlyData);

      // Son ay bilgisi
      if (sortedMonthlyData.length > 0) {
        const lastMonthData = sortedMonthlyData[sortedMonthlyData.length - 1];
        setLastMonth(lastMonthData.month);
      }

    } catch (error) {
      console.error('Error fetching report summary:', error);
      setError('Rapor verilerini yüklerken hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: 'Sosyal Medya', value: reportSummary.socialMedia },
    { name: 'Haberler', value: reportSummary.news },
    { name: 'Web Analitik', value: reportSummary.webAnalytics },
    { name: 'CİMER', value: reportSummary.cimer },
    { name: 'RPA Rapor', value: reportSummary.rpa }
  ];

  const totalReports = reportSummary.socialMedia + reportSummary.news + reportSummary.webAnalytics + reportSummary.cimer + reportSummary.rpa;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px" flexDirection="column">
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Sayfayı Yenile
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Rapor Özeti Dashboard
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Tüm raporların genel durumu ve istatistikleri
      </Typography>

      {/* İstatistik Kartları */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
        <Card sx={{ background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="white" variant="h4">
                  {reportSummary.socialMedia}
                </Typography>
                <Typography color="white" variant="body2">
                  Sosyal Medya Raporu
                </Typography>
              </Box>
              <Assessment sx={{ color: 'white', fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ background: 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="white" variant="h4">
                  {reportSummary.news}
                </Typography>
                <Typography color="white" variant="body2">
                  Haber Raporu
                </Typography>
              </Box>
              <Article sx={{ color: 'white', fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ background: 'linear-gradient(45deg, #FF9800 30%, #FFC107 90%)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="white" variant="h4">
                  {reportSummary.webAnalytics}
                </Typography>
                <Typography color="white" variant="body2">
                  Web Analitik
                </Typography>
              </Box>
              <Analytics sx={{ color: 'white', fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ background: 'linear-gradient(45deg, #9C27B0 30%, #E91E63 90%)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="white" variant="h4">
                  {reportSummary.cimer}
                </Typography>
                <Typography color="white" variant="body2">
                  CİMER Raporu
                </Typography>
              </Box>
              <Assessment sx={{ color: 'white', fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ background: 'linear-gradient(45deg, #FF5722 30%, #FF9800 90%)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="white" variant="h4">
                  {reportSummary.rpa}
                </Typography>
                <Typography color="white" variant="body2">
                  RPA Rapor
                </Typography>
              </Box>
              <AutoAwesome sx={{ color: 'white', fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Toplam Rapor Sayısı */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3, mb: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Toplam Rapor Sayısı
            </Typography>
            <Typography variant="h3" color="primary">
              {totalReports}
            </Typography>
            <Box display="flex" alignItems="center" mt={1}>
              <TrendingUp color="success" />
              <Typography variant="body2" color="success.main" ml={1}>
                Son ay: {lastMonth}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Rapor Türü Dağılımı
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Aylık Trend Grafiği */}
      {monthlyData.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Aylık Rapor Trendi (Son 6 Ay)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="socialMedia" stroke="#2196F3" name="Sosyal Medya" />
                <Line type="monotone" dataKey="news" stroke="#4CAF50" name="Haberler" />
                <Line type="monotone" dataKey="webAnalytics" stroke="#FF9800" name="Web Analitik" />
                <Line type="monotone" dataKey="cimer" stroke="#9C27B0" name="CİMER" />
                <Line type="monotone" dataKey="rpa" stroke="#FF5722" name="RPA" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ReportsOverview; 