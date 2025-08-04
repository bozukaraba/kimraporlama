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
  MenuItem
} from '@mui/material';
import { FileDownload } from '@mui/icons-material';
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

const WebAnalyticsReports: React.FC = () => {
  const [reports, setReports] = useState<WebAnalyticsReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<WebAnalyticsReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<string>('all');

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
      const q = query(collection(db, 'webAnalyticsReports'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const reportsData = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as WebAnalyticsReport[];

      setReports(reportsData);
    } catch (error) {
      console.error('Error fetching web analytics reports:', error);
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
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(report => ({
        month: report.month,
        websiteVisitors: report.visitors.website,
        portalVisitors: report.visitors.portal,
        websitePageViews: report.pageViews.website,
        portalPageViews: report.pageViews.portal
      }));
  };

  const exportToCSV = () => {
    const csvData = filteredReports.map(report => ({
      'Ay': report.month,
      'Yıl': report.year,
      'Web Sitesi Ziyaretçi': report.visitors.website,
      'Portal Ziyaretçi': report.visitors.portal,
      'Web Sitesi Sayfa Görüntüleme': report.pageViews.website,
      'Portal Sayfa Görüntüleme': report.pageViews.portal,
      'Web Sitesi Popüler Sayfalar': report.topPages.website.join('; '),
      'Portal Popüler Sayfalar': report.topPages.portal.join('; '),
      'Oluşturma Tarihi': report.createdAt?.toLocaleDateString('tr-TR')
    }));

    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `web-analitik-raporlari-${yearFilter}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
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
            onClick={exportToCSV}
            disabled={filteredReports.length === 0}
          >
            CSV İndir
          </Button>
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
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sayfa Görüntüleme Karşılaştırması
              </Typography>
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
                        <Typography variant="body2">Web: {report.visitors.website.toLocaleString('tr-TR')}</Typography>
                        <Typography variant="body2">Portal: {report.visitors.portal.toLocaleString('tr-TR')}</Typography>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          Toplam: {(report.visitors.website + report.visitors.portal).toLocaleString('tr-TR')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="body2">Web: {report.pageViews.website.toLocaleString('tr-TR')}</Typography>
                        <Typography variant="body2">Portal: {report.pageViews.portal.toLocaleString('tr-TR')}</Typography>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          Toplam: {(report.pageViews.website + report.pageViews.portal).toLocaleString('tr-TR')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">Web Sitesi:</Typography>
                        {report.topPages.website.slice(0, 3).map((page, index) => (
                          <Chip 
                            key={index}
                            label={`${index + 1}. ${page.length > 30 ? page.substring(0, 30) + '...' : page}`}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                        <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>Portal:</Typography>
                        {report.topPages.portal.slice(0, 3).map((page, index) => (
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