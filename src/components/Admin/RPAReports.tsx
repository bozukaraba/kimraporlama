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
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { RPAReport } from '../../types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const RPAReports: React.FC = () => {
  const [reports, setReports] = useState<RPAReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<RPAReport[]>([]);
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
      const q = query(collection(db, 'rpaReports'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const reportsData = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as RPAReport[];

      setReports(reportsData);
    } catch (error) {
      console.error('Error fetching RPA reports:', error);
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
        totalEmails: report.totalEmails,
        distributedEmails: report.distributedEmails,
        efficiency: ((report.distributedEmails / report.totalEmails) * 100).toFixed(1)
      }));
  };

  const getDepartmentData = () => {
    const departmentCount: Record<string, number> = {};
    
    filteredReports.forEach(report => {
      report.topDepartments.forEach(dept => {
        departmentCount[dept] = (departmentCount[dept] || 0) + 1;
      });
    });

    return Object.entries(departmentCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // En çok görünen 10 birim
  };

  const exportToCSV = () => {
    const csvData = filteredReports.map(report => ({
      'Ay': report.month,
      'Yıl': report.year,
      'Toplam Mail': report.totalEmails,
      'Dağıtılan Mail': report.distributedEmails,
      'Verimlilik (%)': ((report.distributedEmails / report.totalEmails) * 100).toFixed(1),
      'En Çok Dağıtılan Birimler': report.topDepartments.join('; '),
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
    a.download = `rpa-raporlari-${yearFilter}.csv`;
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
  const departmentData = getDepartmentData();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          RPA Mail Dağıtım Raporları
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
                  Mail Dağıtım Trendi
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="totalEmails" 
                      fill="#8884d8" 
                      name="Toplam Mail"
                    />
                    <Bar 
                      dataKey="distributedEmails" 
                      fill="#82ca9d" 
                      name="Dağıtılan Mail"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Dağıtım Verimliliği (%)
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
                      dataKey="efficiency" 
                      stroke="#ff7300" 
                      name="Verimlilik (%)"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>

          {departmentData.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  En Çok Mail Alan Birimler
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Tablo Görünümü */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Detaylı RPA Rapor Listesi ({filteredReports.length} kayıt)
          </Typography>
          
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Ay/Yıl</strong></TableCell>
                  <TableCell align="right"><strong>Toplam Mail</strong></TableCell>
                  <TableCell align="right"><strong>Dağıtılan Mail</strong></TableCell>
                  <TableCell align="right"><strong>Verimlilik</strong></TableCell>
                  <TableCell><strong>En Çok Dağıtılan Birimler</strong></TableCell>
                  <TableCell><strong>Tarih</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports.map((report) => {
                  const efficiency = ((report.distributedEmails / report.totalEmails) * 100);
                  return (
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
                          {report.totalEmails.toLocaleString('tr-TR')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          {report.distributedEmails.toLocaleString('tr-TR')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={`${efficiency.toFixed(1)}%`}
                          color={efficiency >= 90 ? 'success' : efficiency >= 70 ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {report.topDepartments.map((dept, index) => (
                          <Chip 
                            key={index}
                            label={`${index + 1}. ${dept}`}
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
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredReports.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                {yearFilter === 'all' 
                  ? 'Henüz RPA raporu bulunmuyor.' 
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

export default RPAReports; 