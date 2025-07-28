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
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
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
        visitors: report.visitors,
        pageViews: report.pageViews,
        bounceRate: report.bounceRate,
        avgSessionDuration: report.avgSessionDuration,
        conversions: report.conversions
      }));
  };

  const exportToCSV = () => {
    const csvData = filteredReports.map(report => ({
      'Ay': report.month,
      'Yıl': report.year,
      'Ziyaretçi Sayısı': report.visitors,
      'Sayfa Görüntüleme': report.pageViews,
      'Hemen Çıkma Oranı (%)': report.bounceRate,
      'Ortalama Oturum Süresi (dakika)': report.avgSessionDuration,
      'Dönüşüm': report.conversions,
      'En Popüler Sayfalar': report.topPages.join('; '),
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
          Web Sitesi Analitik Raporları
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
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 3, mb: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ziyaretçi ve Sayfa Görüntüleme Trendi
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="visitors" 
                      stackId="1"
                      stroke="#8884d8" 
                      fill="#8884d8"
                      name="Ziyaretçi Sayısı"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="pageViews" 
                      stackId="2"
                      stroke="#82ca9d" 
                      fill="#82ca9d"
                      name="Sayfa Görüntüleme"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Hemen Çıkma Oranı (%)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="bounceRate" 
                      stroke="#ff7300" 
                      name="Hemen Çıkma Oranı (%)"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Dönüşüm ve Oturum Süresi
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    yAxisId="left"
                    dataKey="conversions" 
                    fill="#8884d8" 
                    name="Dönüşüm"
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="avgSessionDuration" 
                    fill="#82ca9d" 
                    name="Ortalama Oturum Süresi (dk)"
                  />
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
            Detaylı Analitik Listesi ({filteredReports.length} kayıt)
          </Typography>
          
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Ay/Yıl</strong></TableCell>
                  <TableCell align="right"><strong>Ziyaretçi</strong></TableCell>
                  <TableCell align="right"><strong>Sayfa Görüntüleme</strong></TableCell>
                  <TableCell align="right"><strong>Çıkma Oranı (%)</strong></TableCell>
                  <TableCell align="right"><strong>Oturum Süresi (dk)</strong></TableCell>
                  <TableCell align="right"><strong>Dönüşüm</strong></TableCell>
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
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {report.visitors.toLocaleString('tr-TR')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {report.pageViews.toLocaleString('tr-TR')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`${report.bounceRate}%`}
                        color={report.bounceRate > 70 ? 'error' : report.bounceRate > 50 ? 'warning' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {report.avgSessionDuration} dk
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" color="secondary">
                        {report.conversions}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {report.topPages.map((page, index) => (
                        <Box key={index} sx={{ mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {index + 1}. {page}
                          </Typography>
                        </Box>
                      ))}
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