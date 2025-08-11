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
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { NewsReport } from '../../types';
import { exportNewsReport } from '../../utils/exportUtils';

const NewsReports: React.FC = () => {
  const [reports, setReports] = useState<NewsReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<NewsReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [exportLoading, setExportLoading] = useState<string>('');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, yearFilter, monthFilter]);

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
    let filtered = reports;
    
    if (yearFilter !== 'all') {
      filtered = filtered.filter(report => report.year.toString() === yearFilter);
    }
    
    if (monthFilter !== 'all') {
      filtered = filtered.filter(report => report.month === monthFilter);
    }
    
    setFilteredReports(filtered);
  };

  const getAvailableYears = () => {
    const years = Array.from(new Set(reports.map(report => report.year)));
    return years.sort((a, b) => b - a);
  };

  const getAvailableMonths = () => {
    let reportsToCheck = reports;
    
    if (yearFilter !== 'all') {
      reportsToCheck = reports.filter(report => report.year.toString() === yearFilter);
    }
    
    const months = Array.from(new Set(reportsToCheck.map(report => report.month)));
    
    const monthOrder = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    
    return months.sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
  };

  const getNewsCountData = () => {
    const monthData: { [key: string]: any } = {};
    
    filteredReports.forEach(report => {
      if (report && report.month && report.newsCount) {
        if (!monthData[report.month]) {
          monthData[report.month] = {
            month: report.month,
            print: 0,
            tv: 0,
            internet: 0,
            total: 0
          };
        }
        
        // Aynı ay için değerleri topla
        monthData[report.month].print += report.newsCount?.print || 0;
        monthData[report.month].tv += report.newsCount?.tv || 0;
        monthData[report.month].internet += report.newsCount?.internet || 0;
        monthData[report.month].total += (report.newsCount?.print || 0) + (report.newsCount?.tv || 0) + (report.newsCount?.internet || 0);
      }
    });
    
    return Object.values(monthData).sort((a: any, b: any) => a.month.localeCompare(b.month));
  };

  const getAdEquivalentData = () => {
    const monthData: { [key: string]: any } = {};
    
    filteredReports.forEach(report => {
      if (report && report.month && report.adEquivalent) {
        if (!monthData[report.month]) {
          monthData[report.month] = {
            month: report.month,
            print: 0,
            tv: 0,
            internet: 0,
            total: 0
          };
        }
        
        monthData[report.month].print += report.adEquivalent?.print || 0;
        monthData[report.month].tv += report.adEquivalent?.tv || 0;
        monthData[report.month].internet += report.adEquivalent?.internet || 0;
        monthData[report.month].total += (report.adEquivalent?.print || 0) + (report.adEquivalent?.tv || 0) + (report.adEquivalent?.internet || 0);
      }
    });
    
    return Object.values(monthData).sort((a: any, b: any) => a.month.localeCompare(b.month));
  };

  const getTotalReachData = () => {
    const monthData: { [key: string]: any } = {};
    
    filteredReports.forEach(report => {
      if (report && report.month && report.totalReach) {
        if (!monthData[report.month]) {
          monthData[report.month] = {
            month: report.month,
            print: 0,
            tv: 0,
            internet: 0,
            total: 0
          };
        }
        
        monthData[report.month].print += report.totalReach?.print || 0;
        monthData[report.month].tv += report.totalReach?.tv || 0;
        monthData[report.month].internet += report.totalReach?.internet || 0;
        monthData[report.month].total += (report.totalReach?.print || 0) + (report.totalReach?.tv || 0) + (report.totalReach?.internet || 0);
      }
    });
    
    return Object.values(monthData).sort((a: any, b: any) => a.month.localeCompare(b.month));
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setExportLoading(format);
      setExportMenuAnchor(null);
      
      await exportNewsReport(filteredReports, format, yearFilter, monthFilter);
      
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
            onChange={(e) => {
              setYearFilter(e.target.value);
              setMonthFilter('all');
            }}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">Tümü</MenuItem>
            {getAvailableYears().map(year => (
              <MenuItem key={year} value={year.toString()}>{year}</MenuItem>
            ))}
          </TextField>
          
          <TextField
            select
            label="Ay Filtresi"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 120 }}
            disabled={getAvailableMonths().length === 0}
          >
            <MenuItem value="all">Tümü</MenuItem>
            {getAvailableMonths().map(month => (
              <MenuItem key={month} value={month}>{month}</MenuItem>
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
      {filteredReports.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3, mb: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Medyada Yer Alma (Haber Sayısı)
              </Typography>
              <div id="news-count-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={newsCountData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="print" fill="#8884d8" name="Basın" />
                  <Bar dataKey="tv" fill="#82ca9d" name="TV" />
                  <Bar dataKey="internet" fill="#ffc658" name="İnternet" />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Reklam Eşdeğeri (TL)
              </Typography>
              <div id="news-equivalent-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={adEquivalentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [Number(value).toLocaleString('tr-TR'), '']} />
                    <Legend />
                    <Line type="monotone" dataKey="print" stroke="#8884d8" name="Basın" strokeWidth={2} />
                    <Line type="monotone" dataKey="tv" stroke="#82ca9d" name="TV" strokeWidth={2} />
                    <Line type="monotone" dataKey="internet" stroke="#ffc658" name="İnternet" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Toplam Erişim (Kişi)
              </Typography>
              <div id="news-reach-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={totalReachData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [Number(value).toLocaleString('tr-TR'), '']} />
                  <Legend />
                  <Line type="monotone" dataKey="print" stroke="#8884d8" name="Basın" strokeWidth={2} />
                  <Line type="monotone" dataKey="tv" stroke="#82ca9d" name="TV" strokeWidth={2} />
                  <Line type="monotone" dataKey="internet" stroke="#ffc658" name="İnternet" strokeWidth={2} />
                </LineChart>
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