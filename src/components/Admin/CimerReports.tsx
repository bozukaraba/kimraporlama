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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Menu,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { FileDownload, PictureAsPdf, Edit } from '@mui/icons-material';
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
import { CimerReport } from '../../types';
import { 
  formatMonthToTurkish, 
  getAvailableYears, 
  getAvailableMonths,
  filterByYear,
  filterByMonth
} from '../../utils/dateUtils';
import { exportCimerReport } from '../../utils/exportUtils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#A282CA', '#FF6F61', '#6B5B95', '#88B04B', '#F7CAC9'];

const CimerReports: React.FC = () => {
  const [reports, setReports] = useState<CimerReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<CimerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [exportLoading, setExportLoading] = useState<string>('');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<CimerReport | null>(null);
  const [editFormData, setEditFormData] = useState({
    applications: '',
    processedApplications: '',
    averageProcessingTime: '',
    topDepartments: [] as any[],
    applicationTopics: [] as any[]
  });

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
      const q = query(collection(db, 'cimerReports'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const reportsData = querySnapshot.docs?.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as CimerReport[] || [];

      setReports(reportsData || []);
    } catch (error) {
      console.error('Error fetching cimer reports:', error);
      setError('CİMER raporlarını yüklerken hata oluştu.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = reports;
    
    // Yıl filtresi
    if (yearFilter !== 'all') {
      filtered = filterByYear(filtered, yearFilter);
    }
    
    // Ay filtresi  
    if (monthFilter !== 'all') {
      filtered = filterByMonth(filtered, monthFilter);
    }
    
    setFilteredReports(filtered);
  };

  const availableYears = getAvailableYears(reports);
  const availableMonths = getAvailableMonths(reports, yearFilter);

  const getApplicationData = () => {
    return filteredReports
      .filter(report => report && report.month && typeof report.applications === 'number')
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(report => ({
        month: formatMonthToTurkish(report.month),
        monthOriginal: report.month,
        applications: report.applications || 0,
        processedApplications: report.processedApplications || 0,
        successRate: report.applications > 0 ? ((report.processedApplications / report.applications) * 100).toFixed(1) : '0'
      }));
  };

  const getTopDepartmentsData = () => {
    const departmentCount: Record<string, number> = {};
    
    filteredReports.forEach(report => {
      if (report && report.topDepartments && Array.isArray(report.topDepartments)) {
        report.topDepartments.forEach(dept => {
          if (dept && dept.name && typeof dept.rate === 'number') {
            departmentCount[dept.name] = (departmentCount[dept.name] || 0) + dept.rate;
          }
        });
      }
    });

    return Object.entries(departmentCount)
      .map(([name, rate]) => ({ name, rate: filteredReports.length > 0 ? rate / filteredReports.length : 0 }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 10);
  };

  const getTopTopicsData = () => {
    const topicCount: Record<string, number> = {};
    
    filteredReports.forEach(report => {
      if (report && report.applicationTopics && Array.isArray(report.applicationTopics)) {
        report.applicationTopics.forEach(topic => {
          if (topic && topic.topic && typeof topic.count === 'number') {
            topicCount[topic.topic] = (topicCount[topic.topic] || 0) + topic.count;
          }
        });
      }
    });

    return Object.entries(topicCount)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setExportLoading(format);
      setExportMenuAnchor(null);
      
      await exportCimerReport(filteredReports, format, yearFilter, monthFilter);
      
    } catch (error) {
      console.error('Export error:', error);
      setError(`${format.toUpperCase()} oluşturma hatası: ${(error as Error).message}`);
    } finally {
      setExportLoading('');
    }
  };

  // Edit Functions
  const handleEditReport = (report: CimerReport) => {
    setEditingReport(report);
    setEditFormData({
      applications: String(report.applications || 0),
      processedApplications: String(report.processedApplications || 0),
      averageProcessingTime: String(report.averageProcessingTime || 0),
      topDepartments: report.topDepartments || [],
      applicationTopics: report.applicationTopics || []
    });
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingReport(null);
    setEditFormData({
      applications: '',
      processedApplications: '',
      averageProcessingTime: '',
      topDepartments: [],
      applicationTopics: []
    });
  };

  const handleSaveEdit = async () => {
    if (!editingReport) return;

    try {
      setLoading(true);
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../../firebase/config');

      const reportRef = doc(db, 'cimerReports', editingReport.id);
      await updateDoc(reportRef, {
        applications: parseInt(editFormData.applications) || 0,
        processedApplications: parseInt(editFormData.processedApplications) || 0,
        averageProcessingTime: parseFloat(editFormData.averageProcessingTime) || 0,
        topDepartments: editFormData.topDepartments,
        applicationTopics: editFormData.applicationTopics,
        updatedAt: new Date()
      });

      // Refresh reports
      await fetchReports();
      handleCloseEditModal();
      alert('Rapor başarıyla güncellendi!');
    } catch (error) {
      console.error('Update error:', error);
      alert('Rapor güncellenirken hata oluştu!');
    } finally {
      setLoading(false);
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

  const applicationData = getApplicationData();
  const topDepartmentsData = getTopDepartmentsData();
  const topTopicsData = getTopTopicsData();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          CİMER Raporları
        </Typography>
        
        <Box display="flex" gap={2} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Yıl Filtresi</InputLabel>
            <Select
              value={yearFilter}
              label="Yıl Filtresi"
              onChange={(e) => {
                setYearFilter(e.target.value);
                setMonthFilter('all'); // Yıl değiştiğinde ay filtresini sıfırla
              }}
            >
              <MenuItem value="all">Tüm Yıllar</MenuItem>
              {availableYears.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Ay Filtresi</InputLabel>
            <Select
              value={monthFilter}
              label="Ay Filtresi"
              onChange={(e) => setMonthFilter(e.target.value)}
              disabled={yearFilter === 'all' && availableMonths.length === 0}
            >
              <MenuItem value="all">Tüm Aylar</MenuItem>
              {availableMonths.map(month => (
                <MenuItem key={month} value={month}>
                  {formatMonthToTurkish(month)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
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
      {applicationData.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 3, mb: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Başvuru/Cevaplama Oranları
                </Typography>
                <div id="applications-chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={applicationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="applications" fill="#8884d8" name="Başvuru" />
                      <Bar dataKey="processedApplications" fill="#82ca9d" name="İşlem Yapılan" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {topDepartmentsData.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    En Çok Başvuru Alan Birimler
                  </Typography>
                  <div id="departments-chart">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={topDepartmentsData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, rate }) => `${name} ${rate.toFixed(1)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="rate"
                        >
                          {topDepartmentsData.map((entry, index) => (
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

          {topTopicsData.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  En Sık Başvuru Konuları
                </Typography>
                <div id="topics-chart">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={topTopicsData} layout="vertical" margin={{ left: 20, right: 30, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="topic" 
                        type="category" 
                        width={200}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => value.length > 25 ? value.substring(0, 25) + '...' : value}
                      />
                      <Tooltip 
                        formatter={(value, name) => [value, 'Başvuru Sayısı']}
                        labelFormatter={(label) => `Konu: ${label}`}
                      />
                      <Bar dataKey="count" fill="#ffc658" name="Başvuru Sayısı" />
                    </BarChart>
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
            Detaylı CİMER Rapor Listesi ({filteredReports.length} kayıt)
          </Typography>
          
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Ay/Yıl</strong></TableCell>
                  <TableCell align="right"><strong>Başvuru/İşlem</strong></TableCell>
                  <TableCell align="right"><strong>Başarı Oranı</strong></TableCell>
                  <TableCell><strong>En Çok Başvuru Alan Birimler</strong></TableCell>
                  <TableCell><strong>Başvuru Konuları</strong></TableCell>
                  <TableCell><strong>Tarih</strong></TableCell>
                  <TableCell align="center"><strong>Aksiyonlar</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports.map((report) => {
                  const successRate = ((report.processedApplications / report.applications) * 100);
                  return (
                                      <TableRow key={report.id} hover>
                    <TableCell>
                      <Chip 
                        label={formatMonthToTurkish(report.month)}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                      <TableCell align="right">
                        <Box>
                          <Typography variant="body2" color="primary">
                            Başvuru: {(report.applications || 0).toLocaleString('tr-TR')}
                          </Typography>
                          <Typography variant="body2" color="success.main">
                            İşlem: {(report.processedApplications || 0).toLocaleString('tr-TR')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={`${successRate.toFixed(1)}%`}
                          color={successRate >= 90 ? 'success' : successRate >= 70 ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {(report.topDepartments || []).slice(0, 3).map((dept, index) => (
                          <Chip 
                            key={index}
                            label={`${dept.name} (${dept.rate}%)`}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                        {(report.topDepartments || []).length > 3 && (
                          <Chip 
                            label={`+${(report.topDepartments || []).length - 3} daha`}
                            size="small"
                            variant="outlined"
                            color="secondary"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {(report.applicationTopics || []).slice(0, 2).map((topic, index) => (
                          <Chip 
                            key={index}
                            label={`${topic.topic} (${topic.count})`}
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                        {(report.applicationTopics || []).length > 2 && (
                          <Chip 
                            label={`+${(report.applicationTopics || []).length - 2} daha`}
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
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          onClick={() => handleEditReport(report)}
                          size="small"
                          title="Raporu Düzenle"
                        >
                          <Edit />
                        </IconButton>
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
                  ? 'Henüz CİMER raporu bulunmuyor.' 
                  : `${yearFilter} yılı için rapor bulunamadı.`
                }
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onClose={handleCloseEditModal} maxWidth="md" fullWidth>
        <DialogTitle>CIMER Raporu Düzenle</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              label="Başvuru Sayısı"
              type="number"
              value={editFormData.applications}
              onChange={(e) => setEditFormData({...editFormData, applications: e.target.value})}
              fullWidth
            />
            <TextField
              label="İşlenen Başvuru Sayısı"
              type="number"
              value={editFormData.processedApplications}
              onChange={(e) => setEditFormData({...editFormData, processedApplications: e.target.value})}
              fullWidth
            />
            <TextField
              label="Ortalama İşlem Süresi (Gün)"
              type="number"
              value={editFormData.averageProcessingTime}
              onChange={(e) => setEditFormData({...editFormData, averageProcessingTime: e.target.value})}
              fullWidth
            />
            <Typography variant="body2" color="text.secondary">
              Not: Departman ve başvuru konuları detaylı düzenlemesi için formu kullanın.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal}>İptal</Button>
          <Button onClick={handleSaveEdit} variant="contained" color="primary">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CimerReports;