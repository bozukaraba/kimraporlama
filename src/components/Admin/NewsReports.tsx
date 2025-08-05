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
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { NewsReport } from '../../types';

const NewsReports: React.FC = () => {
  const [reports, setReports] = useState<NewsReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<NewsReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
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
      setError('');
      const q = query(collection(db, 'newsReports'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const reportsData = querySnapshot.docs?.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as NewsReport[] || [];

      setReports(reportsData || []);
    } catch (error) {
      console.error('Error fetching news reports:', error);
      setError('Haber raporlarını yüklerken hata oluştu.');
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

  const getNewsCountData = () => {
    const periodData: { [key: string]: any } = {};
    
    filteredReports.forEach(report => {
      if (report && report.month && report.newsCount) {
        const periodLabel = report.period === 'ahmet-hamdi-atalay' ? 'Ahmet Hamdi Atalay' : 'Türksat';
        const key = `${report.month}-${periodLabel}`;
        
        periodData[key] = {
          month: report.month,
          period: periodLabel,
          print: report.newsCount?.print || 0,
          tv: report.newsCount?.tv || 0,
          internet: report.newsCount?.internet || 0,
          total: (report.newsCount?.print || 0) + (report.newsCount?.tv || 0) + (report.newsCount?.internet || 0)
        };
      }
    });
    
    return Object.values(periodData).sort((a: any, b: any) => a.month.localeCompare(b.month));
  };

  const getAdEquivalentData = () => {
    return filteredReports.filter(report => report && report.month && report.adEquivalent).map(report => ({
      month: report.month,
      print: report.adEquivalent?.print || 0,
      tv: report.adEquivalent?.tv || 0,
      internet: report.adEquivalent?.internet || 0,
      total: (report.adEquivalent?.print || 0) + (report.adEquivalent?.tv || 0) + (report.adEquivalent?.internet || 0)
    })).sort((a, b) => a.month.localeCompare(b.month));
  };

  const getTotalReachData = () => {
    return filteredReports.filter(report => report && report.month && report.totalReach).map(report => ({
      month: report.month,
      print: report.totalReach?.print || 0,
      tv: report.totalReach?.tv || 0,
      internet: report.totalReach?.internet || 0,
      total: (report.totalReach?.print || 0) + (report.totalReach?.tv || 0) + (report.totalReach?.internet || 0)
    })).sort((a, b) => a.month.localeCompare(b.month));
  };

  const exportToCSV = () => {
    const csvData = filteredReports.map(report => ({
      'Ay': report.month,
      'Yıl': report.year,
      'İçerik': report.period === 'ahmet-hamdi-atalay' ? 'Ahmet Hamdi Atalay' : 'Türksat',
      'Basın Haber Sayısı': report.newsCount?.print || 0,
      'TV Haber Sayısı': report.newsCount?.tv || 0,
      'İnternet Haber Sayısı': report.newsCount?.internet || 0,
      'Basın Reklam Eşdeğeri (TL)': report.adEquivalent?.print || 0,
      'TV Reklam Eşdeğeri (TL)': report.adEquivalent?.tv || 0,
      'İnternet Reklam Eşdeğeri (TL)': report.adEquivalent?.internet || 0,
      'Basın Toplam Erişim': report.totalReach?.print || 0,
      'TV Toplam Erişim': report.totalReach?.tv || 0,
      'İnternet Toplam Erişim': report.totalReach?.internet || 0,
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
    a.download = `haber-raporlari-${yearFilter}.csv`;
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

  const newsCountData = getNewsCountData();
  const adEquivalentData = getAdEquivalentData();
  const totalReachData = getTotalReachData();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Haber Raporları
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
      {filteredReports.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3, mb: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Medyada Yer Alma (Haber Sayısı)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={newsCountData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="print" fill="#8884d8" name="Basın" />
                  <Bar dataKey="tv" fill="#82ca9d" name="TV" />
                  <Bar dataKey="internet" fill="#ffc658" name="İnternet" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Reklam Eşdeğeri (TL)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={adEquivalentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [Number(value).toLocaleString('tr-TR'), '']} />
                  <Line type="monotone" dataKey="print" stroke="#8884d8" name="Basın" />
                  <Line type="monotone" dataKey="tv" stroke="#82ca9d" name="TV" />
                  <Line type="monotone" dataKey="internet" stroke="#ffc658" name="İnternet" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Toplam Erişim (Kişi)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={totalReachData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [Number(value).toLocaleString('tr-TR'), '']} />
                  <Line type="monotone" dataKey="print" stroke="#8884d8" name="Basın" />
                  <Line type="monotone" dataKey="tv" stroke="#82ca9d" name="TV" />
                  <Line type="monotone" dataKey="internet" stroke="#ffc658" name="İnternet" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tablo Görünümü */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Detaylı Haber Listesi ({filteredReports.length} kayıt)
          </Typography>
          
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Ay/Yıl</strong></TableCell>
                  <TableCell><strong>İçerik</strong></TableCell>
                  <TableCell><strong>Haber Sayısı</strong></TableCell>
                  <TableCell><strong>Reklam Eşdeğeri (TL)</strong></TableCell>
                  <TableCell><strong>Toplam Erişim</strong></TableCell>
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
                    <TableCell>
                      <Chip 
                        label={report.period === 'ahmet-hamdi-atalay' ? 'Ahmet Hamdi Atalay' : 'Türksat'}
                        color={report.period === 'ahmet-hamdi-atalay' ? 'secondary' : 'success'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">Basın: {report.newsCount?.print || 0}</Typography>
                        <Typography variant="body2">TV: {report.newsCount?.tv || 0}</Typography>
                        <Typography variant="body2">İnternet: {report.newsCount?.internet || 0}</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          Toplam: {(report.newsCount?.print || 0) + (report.newsCount?.tv || 0) + (report.newsCount?.internet || 0)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">Basın: {(report.adEquivalent?.print || 0).toLocaleString('tr-TR')}</Typography>
                        <Typography variant="body2">TV: {(report.adEquivalent?.tv || 0).toLocaleString('tr-TR')}</Typography>
                        <Typography variant="body2">İnternet: {(report.adEquivalent?.internet || 0).toLocaleString('tr-TR')}</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          Toplam: {((report.adEquivalent?.print || 0) + (report.adEquivalent?.tv || 0) + (report.adEquivalent?.internet || 0)).toLocaleString('tr-TR')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">Basın: {(report.totalReach?.print || 0).toLocaleString('tr-TR')}</Typography>
                        <Typography variant="body2">TV: {(report.totalReach?.tv || 0).toLocaleString('tr-TR')}</Typography>
                        <Typography variant="body2">İnternet: {(report.totalReach?.internet || 0).toLocaleString('tr-TR')}</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          Toplam: {((report.totalReach?.print || 0) + (report.totalReach?.tv || 0) + (report.totalReach?.internet || 0)).toLocaleString('tr-TR')}
                        </Typography>
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
                  ? 'Henüz haber raporu bulunmuyor.' 
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

export default NewsReports;