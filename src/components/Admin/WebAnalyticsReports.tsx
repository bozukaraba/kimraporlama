import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Button,
  TextField,
  MenuItem,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { FileDownload, PictureAsPdf } from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { WebAnalyticsReport } from '../../types';
import { exportWebAnalyticsReport } from '../../utils/exportUtils';

const WebAnalyticsReports: React.FC = () => {
  const [reports, setReports] = useState<WebAnalyticsReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<WebAnalyticsReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [exportLoading, setExportLoading] = useState<string>('');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, yearFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const q = query(collection(db, 'webAnalyticsReports'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const reportsData = querySnapshot.docs?.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as WebAnalyticsReport[] || [];

      setReports(reportsData || []);
    } catch (error) {
      console.error('Error fetching web analytics reports:', error);
      setError('Web analitik raporlarını yüklerken hata oluştu.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    if (yearFilter === 'all') {
      setFilteredReports(reports);
    } else {
      setFilteredReports(reports.filter(report => report.year.toString() === yearFilter));
    }
  };

  const getAvailableYears = () => {
    const years = Array.from(new Set(reports.map(report => report.year)));
    return years.sort((a, b) => b - a);
  };

  const getChartData = () => {
    return filteredReports
      .filter(report => report && report.month && report.visitors && report.pageViews)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(report => ({
        month: report.month,
        websiteVisitors: report.visitors?.website || 0,
        portalVisitors: report.visitors?.portal || 0,
        websitePageViews: report.pageViews?.website || 0,
        portalPageViews: report.pageViews?.portal || 0
      }));
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setExportLoading(format);
      setExportMenuAnchor(null);
      
      await exportWebAnalyticsReport(filteredReports, format, yearFilter, 'all');
      
    } catch (error) {
      console.error('Export error:', error);
      setError(`${format.toUpperCase()} oluşturma hatası: ${(error as Error).message}`);
    } finally {
      setExportLoading('');
    }
  };

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

  const chartData = getChartData();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Web Sitesi ve İç İletişim Portalı Raporları
        </Typography>
        
        <Box display="flex" gap={2}>
          <TextField
            select
            label="Yıl Filtresi"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">Tümü</MenuItem>
            {getAvailableYears().map(year => (
              <MenuItem key={year} value={year.toString()}>{year}</MenuItem>
            ))}
          </TextField>
          
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
            disabled={filteredReports.length === 0 || exportLoading !== ''}
          >
            {exportLoading ? `${exportLoading.toUpperCase()} Hazırlanıyor...` : 'Rapor İndir'}
          </Button>
          
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={() => setExportMenuAnchor(null)}
          >
            <MenuItem onClick={() => handleExport('csv')}>
              <ListItemIcon>
                <FileDownload fontSize="small" />
              </ListItemIcon>
              <ListItemText>CSV İndir</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleExport('pdf')}>
              <ListItemIcon>
                <PictureAsPdf fontSize="small" />
              </ListItemIcon>
              <ListItemText>PDF İndir (Print)</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Grafik Görünümü */}
      {chartData.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 3, mb: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ziyaretçi Sayısı Karşılaştırması
              </Typography>
              <div id="web-visitors-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [Number(value).toLocaleString('tr-TR'), '']} />
                    <Legend />
                    <Bar dataKey="websiteVisitors" fill="#8884d8" name="Web Sitesi" />
                    <Bar dataKey="portalVisitors" fill="#82ca9d" name="Portal" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sayfa Görüntüleme Karşılaştırması
              </Typography>
              <div id="web-pageviews-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [Number(value).toLocaleString('tr-TR'), '']} />
                    <Legend />
                    <Bar dataKey="websitePageViews" fill="#ffc658" name="Web Sitesi" />
                    <Bar dataKey="portalPageViews" fill="#ff7300" name="Portal" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tablo Görünümü */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Detaylı Web Analitik Listesi ({filteredReports.length} kayıt)
          </Typography>
          
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Ay/Yıl</strong></TableCell>
                  <TableCell align="right"><strong>Ziyaretçi</strong></TableCell>
                  <TableCell align="right"><strong>Sayfa Görüntüleme</strong></TableCell>
                  <TableCell><strong>En Popüler Sayfalar</strong></TableCell>
                  <TableCell><strong>Tarih</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>
                      <Chip 
                        label={`${report.month}`}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="body2">Web: {(report.visitors?.website || 0).toLocaleString('tr-TR')}</Typography>
                        <Typography variant="body2">Portal: {(report.visitors?.portal || 0).toLocaleString('tr-TR')}</Typography>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          Toplam: {((report.visitors?.website || 0) + (report.visitors?.portal || 0)).toLocaleString('tr-TR')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="body2">Web: {(report.pageViews?.website || 0).toLocaleString('tr-TR')}</Typography>
                        <Typography variant="body2">Portal: {(report.pageViews?.portal || 0).toLocaleString('tr-TR')}</Typography>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          Toplam: {((report.pageViews?.website || 0) + (report.pageViews?.portal || 0)).toLocaleString('tr-TR')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">Web Sitesi:</Typography>
                        {(report.topPages?.website || []).slice(0, 3).map((page, index) => (
                          <Chip 
                            key={index}
                            label={`${index + 1}. ${page.length > 30 ? page.substring(0, 30) + '...' : page}`}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                        <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>Portal:</Typography>
                        {(report.topPages?.portal || []).slice(0, 3).map((page, index) => (
                          <Chip 
                            key={index}
                            label={`${index + 1}. ${page.length > 30 ? page.substring(0, 30) + '...' : page}`}
                            size="small"
                            variant="outlined"
                            color="secondary"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {report.createdAt?.toLocaleDateString('tr-TR')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredReports.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                {yearFilter === 'all' 
                  ? 'Henüz web analitik raporu bulunmuyor.' 
                  : `${yearFilter} yılı için rapor bulunamadı.`
                }
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default WebAnalyticsReports;