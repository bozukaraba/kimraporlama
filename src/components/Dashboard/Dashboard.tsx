import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Box,

  Paper,
  Chip,
  TextField,
  MenuItem,
  CircularProgress,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Assessment,
  Article,
  Analytics,
  AutoAwesome,
  AdminPanelSettings,
  Logout,
  TrendingUp,
  People,
  Email,
  Visibility,
  FileDownload,
  PictureAsPdf
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

const Dashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCimerApplications: 0,
    totalWebVisitors: 0,
    totalSocialFollowers: 0,
    totalEmails: 0,
    totalNewsCount: 0
  });
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [exportLoading, setExportLoading] = useState<string>('');

  useEffect(() => {
    fetchDashboardStats();
  }, [selectedMonth, selectedYear]);

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      
      // Fetch all reports
      const [cimerSnapshot, webSnapshot, socialSnapshot, rpaSnapshot, newsSnapshot] = await Promise.all([
        getDocs(collection(db, 'cimerReports')),
        getDocs(collection(db, 'webAnalyticsReports')),
        getDocs(collection(db, 'socialMediaReports')),
        getDocs(collection(db, 'rpaReports')),
        getDocs(collection(db, 'newsReports'))
      ]);

      // Filter by month and year
      const filterReport = (doc: any) => {
        const data = doc.data();
        let matches = true;
        
        if (selectedYear !== 'all' && data.year?.toString() !== selectedYear) {
          matches = false;
        }
        
        if (selectedMonth !== 'all' && data.month !== selectedMonth) {
          matches = false;
        }
        
        // Debug için log ekle
        if (selectedMonth !== 'all') {
          console.log('Filter:', { selectedMonth, dataMonth: data.month, matches });
        }
        
        return matches;
      };

      // Calculate totals
      const cimerData = cimerSnapshot.docs.filter(filterReport).map(doc => doc.data());
      const webData = webSnapshot.docs.filter(filterReport).map(doc => doc.data());
      const socialData = socialSnapshot.docs.filter(filterReport).map(doc => doc.data());
      const rpaData = rpaSnapshot.docs.filter(filterReport).map(doc => doc.data());
      const newsData = newsSnapshot.docs.filter(filterReport).map(doc => doc.data());

      // Debug için tüm dataları log et
      console.log('Dashboard filter results:', {
        selectedYear,
        selectedMonth,
        cimerData: cimerData.length,
        webData: webData.length,
        socialData: socialData.length,
        rpaData: rpaData.length,
        newsData: newsData.length,
        allData: {
          cimer: cimerData,
          web: webData,
          social: socialData,
          rpa: rpaData,
          news: newsData
        }
      });

      const totalCimerApplications = cimerData.reduce((sum, report) => sum + (report.applications || 0), 0);
      const totalWebVisitors = webData.reduce((sum, report) => 
        sum + (report.visitors?.website || 0) + (report.visitors?.portal || 0), 0);
      const totalSocialFollowers = socialData.reduce((sum, report) => sum + (report.followers || 0), 0);
      const totalEmails = rpaData.reduce((sum, report) => 
        sum + (report.incomingEmails || 0) + (report.sentEmails || 0), 0);
      const totalNewsCount = newsData.reduce((sum, report) => 
        sum + (report.newsCount?.print || 0) + (report.newsCount?.tv || 0) + (report.newsCount?.internet || 0), 0);

      setStats({
        totalCimerApplications,
        totalWebVisitors,
        totalSocialFollowers,
        totalEmails,
        totalNewsCount
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleExportAllReports = async (format: 'csv' | 'pdf') => {
    try {
      setExportLoading(format);
      setExportMenuAnchor(null);
      
      // Import export utils dynamically
      const { exportAllReports } = await import('../../utils/exportUtils');
      await exportAllReports(format, selectedYear, selectedMonth);
      
    } catch (error) {
      console.error('Export error:', error);
      alert(`${format.toUpperCase()} oluşturma hatası!`);
    } finally {
      setExportLoading('');
    }
  };

  const getAvailableMonths = () => {
    return [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
  };

  const reportCards = [
    {
      title: 'Haber Raporu',
      description: 'Medyada yer alma, reklam eşdeğeri, toplam erişim',
      icon: <Article sx={{ fontSize: 40 }} />,
      path: '/haberler',
      color: '#388e3c'
    },
    {
      title: 'Sosyal Medya Raporu',
      description: 'X, Instagram, LinkedIn, Facebook, YouTube, Next Sosyal',
      icon: <Assessment sx={{ fontSize: 40 }} />,
      path: '/sosyal-medya',
      color: '#1976d2'
    },
    {
      title: 'Web Sitesi ve İç İletişim Portalı',
      description: 'Ziyaretçi sayısı, sayfa görüntüleme, popüler sayfalar',
      icon: <Analytics sx={{ fontSize: 40 }} />,
      path: '/web-analitik',
      color: '#f57c00'
    },
    {
      title: 'CİMER',
      description: 'Başvuru/cevaplama oranları, birimler, konular',
      icon: <AutoAwesome sx={{ fontSize: 40 }} />,
      path: '/cimer',
      color: '#9c27b0'
    },
    {
      title: 'RPA (info@turksat.com.tr)',
      description: 'Gelen/iletilen mailler, en çok başvuru alan mailler',
      icon: <AutoAwesome sx={{ fontSize: 40 }} />,
      path: '/rpa-rapor',
      color: '#7b1fa2'
    }
  ];

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Kurum Raporlama Sistemi
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {currentUser?.email} ({currentUser?.role})
          </Typography>
          {currentUser?.role === 'admin' && (
            <Button
              color="inherit"
              startIcon={<AdminPanelSettings />}
              onClick={() => navigate('/admin')}
              sx={{ mr: 1 }}
            >
              Admin Panel
            </Button>
          )}
          <Button
            color="inherit"
            startIcon={<Logout />}
            onClick={handleLogout}
          >
            Çıkış
          </Button>
        </Toolbar>
      </AppBar>

              <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Türksat Kurumsal İletişim Müdürlüğü
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Aylık Faaliyet Raporları - Aşağıdaki raporlardan birini seçerek veri girişi yapabilirsiniz.
        </Typography>

        {/* Filter ve Export Kontrolleri */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <TextField
            select
            label="Yıl"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">Tüm Yıllar</MenuItem>
            <MenuItem value="2024">2024</MenuItem>
            <MenuItem value="2025">2025</MenuItem>
          </TextField>
          
          <TextField
            select
            label="Ay"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">Tüm Aylar</MenuItem>
            {getAvailableMonths().map(month => (
              <MenuItem key={month} value={month}>{month}</MenuItem>
            ))}
          </TextField>

          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
            disabled={exportLoading !== ''}
          >
            {exportLoading ? `${exportLoading.toUpperCase()} Hazırlanıyor...` : 'Tüm Raporları İndir'}
          </Button>
          
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={() => setExportMenuAnchor(null)}
          >
            <MenuItem onClick={() => handleExportAllReports('csv')}>
              <ListItemIcon>
                <FileDownload fontSize="small" />
              </ListItemIcon>
              <ListItemText>CSV İndir</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleExportAllReports('pdf')}>
              <ListItemIcon>
                <PictureAsPdf fontSize="small" />
              </ListItemIcon>
              <ListItemText>PDF İndir</ListItemText>
            </MenuItem>
          </Menu>
        </Box>

        {/* Özet İstatistikler */}
        <Typography variant="h5" component="h2" gutterBottom align="center" sx={{ mb: 3 }}>
          Özet İstatistikler
        </Typography>
        
        {statsLoading ? (
          <Box display="flex" justifyContent="center" mb={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3, mb: 4 }}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
              <Assessment sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
              <Typography variant="h6" component="div">
                {stats.totalCimerApplications.toLocaleString('tr-TR')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                CİMER Başvuru
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fff3e0' }}>
              <Visibility sx={{ fontSize: 40, color: '#f57c00', mb: 1 }} />
              <Typography variant="h6" component="div">
                {stats.totalWebVisitors.toLocaleString('tr-TR')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Web Ziyaretçi
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e8' }}>
              <People sx={{ fontSize: 40, color: '#388e3c', mb: 1 }} />
              <Typography variant="h6" component="div">
                {stats.totalSocialFollowers.toLocaleString('tr-TR')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sosyal Takipçi
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fce4ec' }}>
              <Email sx={{ fontSize: 40, color: '#e91e63', mb: 1 }} />
              <Typography variant="h6" component="div">
                {stats.totalEmails.toLocaleString('tr-TR')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                RPA E-posta
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f3e5f5' }}>
              <TrendingUp sx={{ fontSize: 40, color: '#9c27b0', mb: 1 }} />
              <Typography variant="h6" component="div">
                {stats.totalNewsCount.toLocaleString('tr-TR')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Haber Sayısı
              </Typography>
            </Paper>
          </Box>
        )}

        <Typography variant="h5" component="h2" gutterBottom align="center" sx={{ mb: 3 }}>
          Rapor Giriş Paneli
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 3 }}>
          {reportCards.map((card) => (
            <Card 
              key={card.title}
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ color: card.color, mb: 2 }}>
                  {card.icon}
                </Box>
                <Typography variant="h6" component="h2" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => navigate(card.path)}
                  sx={{ backgroundColor: card.color }}
                >
                  Rapor Gir
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      </Container>
    </>
  );
};

export default Dashboard; 