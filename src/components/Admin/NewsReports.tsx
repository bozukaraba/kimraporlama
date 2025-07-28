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
  PieChart,
  Pie,
  Cell,
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
import { NewsReport } from '../../types';

const COLORS = ['#4CAF50', '#f44336', '#ff9800'];

const NewsReports: React.FC = () => {
  const [reports, setReports] = useState<NewsReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<NewsReport[]>([]);
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
      const q = query(collection(db, 'newsReports'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const reportsData = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as NewsReport[];

      setReports(reportsData);
    } catch (error) {
      console.error('Error fetching news reports:', error);
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

  const getStatusData = () => {
    const statusCount = filteredReports.reduce((acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Olumlu', value: statusCount.olumlu || 0 },
      { name: 'Olumsuz', value: statusCount.olumsuz || 0 },
      { name: 'Kritik', value: statusCount.kritik || 0 }
    ];
  };

  const getMonthlyData = () => {
    const monthlyCount = filteredReports.reduce((acc, report) => {
      acc[report.month] = (acc[report.month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthlyCount)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'olumlu': return 'success';
      case 'olumsuz': return 'error';
      case 'kritik': return 'warning';
      default: return 'default';
    }
  };

  const exportToCSV = () => {
    const csvData = filteredReports.map(report => ({
      'Ay': report.month,
      'Yıl': report.year,
      'Durum': report.status,
      'Özet': report.summary,
      'Link': report.link,
      'Kaynaklar': report.sources.join('; '),
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

  const statusData = getStatusData();
  const monthlyData = getMonthlyData();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Basın Haberleri Raporları
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
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3, mb: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Haber Durumu Dağılımı
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Aylık Haber Sayısı
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" name="Haber Sayısı" />
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
            Detaylı Haber Listesi ({filteredReports.length} kayıt)
          </Typography>
          
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Ay/Yıl</strong></TableCell>
                  <TableCell><strong>Durum</strong></TableCell>
                  <TableCell><strong>Özet</strong></TableCell>
                  <TableCell><strong>Link</strong></TableCell>
                  <TableCell><strong>Kaynaklar</strong></TableCell>
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
                        label={report.status.toUpperCase()}
                        color={getStatusColor(report.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 300 }}>
                        {report.summary}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <a 
                        href={report.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#1976d2', textDecoration: 'none' }}
                      >
                        Haberi Görüntüle
                      </a>
                    </TableCell>
                    <TableCell>
                      {report.sources.map((source, index) => (
                        <Chip 
                          key={index}
                          label={source}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
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