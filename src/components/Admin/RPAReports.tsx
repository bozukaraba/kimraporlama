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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { RPAReport } from '../../types';
import { exportRPAReport } from '../../utils/exportUtils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const RPAReports: React.FC = () => {
  const [reports, setReports] = useState<RPAReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<RPAReport[]>([]);
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
      const q = query(collection(db, 'rpaReports'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const reportsData = querySnapshot.docs?.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as RPAReport[] || [];

      setReports(reportsData || []);
    } catch (error) {
      console.error('Error fetching RPA reports:', error);
      setError('RPA raporlarını yüklerken hata oluştu.');
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

  const getEmailData = () => {
    return filteredReports
      .filter(report => report && report.month)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(report => ({
        month: report.month,
        incomingEmails: report.incomingEmails || 0,
        sentEmails: report.sentEmails || 0
      }));
  };

  const getTopEmailRecipientsData = () => {
    const emailCount: Record<string, number> = {};
    
    filteredReports.forEach(report => {
      if (report && report.topEmailRecipients && Array.isArray(report.topEmailRecipients)) {
        report.topEmailRecipients.forEach(recipient => {
          if (recipient && recipient.email && typeof recipient.count === 'number') {
            emailCount[recipient.email] = (emailCount[recipient.email] || 0) + recipient.count;
          }
        });
      }
    });

    return Object.entries(emailCount)
      .map(([email, count]) => ({ email, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setExportLoading(format);
      setExportMenuAnchor(null);
      
      await exportRPAReport(filteredReports, format, yearFilter, 'all');
      
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

  const emailData = getEmailData();
  const topEmailRecipientsData = getTopEmailRecipientsData();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          RPA Raporları (info@turksat.com.tr)
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
      {emailData.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 3, mb: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Gelen/İletilen Mailler
                </Typography>
                <div id="rpa-emails-chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={emailData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="incomingEmails" 
                        fill="#8884d8" 
                        name="Gelen Mail"
                      />
                      <Bar 
                        dataKey="sentEmails" 
                        fill="#82ca9d" 
                        name="İletilen Mail"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </Box>

          {topEmailRecipientsData.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  En Çok Başvuru/Talep Alan Mailler
                </Typography>
                <div id="rpa-recipients-chart">
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                    <Pie
                      data={topEmailRecipientsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ email, percent }) => `${email.split('@')[0]} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {topEmailRecipientsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                </div>
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
                  <TableCell align="right"><strong>Gelen Mail</strong></TableCell>
                  <TableCell align="right"><strong>İletilen Mail</strong></TableCell>
                  <TableCell><strong>En Çok Mail Alan Adresler</strong></TableCell>
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
                        {(report.incomingEmails || 0).toLocaleString('tr-TR')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {(report.sentEmails || 0).toLocaleString('tr-TR')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {(report.topEmailRecipients || []).slice(0, 3).map((recipient, index) => (
                        <Chip 
                          key={index}
                          label={`${recipient.email.split('@')[0]} (${recipient.count})`}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                      {(report.topEmailRecipients || []).length > 3 && (
                        <Chip 
                          label={`+${(report.topEmailRecipients || []).length - 3} daha`}
                          size="small"
                          variant="outlined"
                          color="secondary"
                        />
                      )}
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