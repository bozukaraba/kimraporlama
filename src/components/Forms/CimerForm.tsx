import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  AppBar,
  Toolbar,
  Alert,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider
} from '@mui/material';
import { ArrowBack, Add, Delete, Edit, Save, Cancel } from '@mui/icons-material';
import dayjs from 'dayjs';
import { generateMonthOptions, getCurrentMonthYear } from '../../utils/dateUtils';
import 'dayjs/locale/tr';
import { collection, addDoc, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { formatMonthToTurkish } from '../../utils/dateUtils';
import { useEffect } from 'react';

dayjs.locale('tr');

const CimerForm: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthYear());
  // Başvuru / Cevaplama Oranları
  const [applications, setApplications] = useState('');
  const [processedApplications, setProcessedApplications] = useState('');
  // En Çok Başvuru Alan Birimler
  const [topDepartments, setTopDepartments] = useState<Array<{name: string, rate: string}>>([{name: '', rate: ''}]);
  // Başvuru Konusu
  const [applicationTopics, setApplicationTopics] = useState<Array<{topic: string, count: string}>>([{topic: '', count: ''}]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Edit Mode States
  const [editingReport, setEditingReport] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [myReports, setMyReports] = useState<any[]>([]);
  
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchMyReports();
  }, [currentUser]);

  const fetchMyReports = async () => {
    if (!currentUser) return;
    
    try {
      const q = query(
        collection(db, 'cimerReports'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMyReports(reports);
    } catch (error) {
      console.error('Raporlar yüklenirken hata:', error);
    }
  };

  const handleAddDepartment = () => {
    setTopDepartments([...topDepartments, {name: '', rate: ''}]);
  };

  const handleRemoveDepartment = (index: number) => {
    if (topDepartments.length > 1) {
      setTopDepartments(topDepartments.filter((_, i) => i !== index));
    }
  };

  const handleDepartmentChange = (index: number, field: 'name' | 'rate', value: string) => {
    const newDepartments = [...topDepartments];
    newDepartments[index][field] = value;
    setTopDepartments(newDepartments);
  };

  const handleAddTopic = () => {
    setApplicationTopics([...applicationTopics, {topic: '', count: ''}]);
  };

  const handleRemoveTopic = (index: number) => {
    if (applicationTopics.length > 1) {
      setApplicationTopics(applicationTopics.filter((_, i) => i !== index));
    }
  };

  const handleTopicChange = (index: number, field: 'topic' | 'count', value: string) => {
    const newTopics = [...applicationTopics];
    newTopics[index][field] = value;
    setApplicationTopics(newTopics);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMonth || !applications || !processedApplications) {
      setError('Tüm gerekli alanları doldurun');
      return;
    }

    const validDepartments = topDepartments.filter(dept => dept.name.trim() !== '' && dept.rate.trim() !== '');
    const validTopics = applicationTopics.filter(topic => topic.topic.trim() !== '' && topic.count.trim() !== '');

    try {
      setLoading(true);
      setError('');
      
      const reportData = {
        month: selectedMonth,
        year: parseInt(selectedMonth.split('-')[0]),
        applications: parseInt(applications),
        processedApplications: parseInt(processedApplications),
        topDepartments: validDepartments.map(dept => ({
          name: dept.name,
          rate: parseFloat(dept.rate)
        })),
        applicationTopics: validTopics.map(topic => ({
          topic: topic.topic,
          count: parseInt(topic.count)
        })),
        userId: currentUser?.uid,
        createdAt: new Date()
      };

      if (isEditMode && editingReport) {
        // Güncelleme işlemi
        const reportRef = doc(db, 'cimerReports', editingReport.id);
        await updateDoc(reportRef, { ...reportData, updatedAt: new Date() });
        setMessage('CİMER raporu başarıyla güncellendi!');
      } else {
        // Yeni rapor ekleme
        await addDoc(collection(db, 'cimerReports'), reportData);
        setMessage('CİMER raporu başarıyla kaydedildi!');
      }
      
      // Form temizle ve raporları yenile
      clearForm();
      await fetchMyReports();
      
    } catch (err) {
      setError('Rapor kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setSelectedMonth(getCurrentMonthYear());
    setApplications('');
    setProcessedApplications('');
    setTopDepartments([{name: '', rate: ''}]);
    setApplicationTopics([{topic: '', count: ''}]);
    setIsEditMode(false);
    setEditingReport(null);
  };

  const handleEditReport = (report: any) => {
    setEditingReport(report);
    setIsEditMode(true);
    setSelectedMonth(report.month);
    setApplications(String(report.applications || 0));
    setProcessedApplications(String(report.processedApplications || 0));
    setTopDepartments(
      (report.topDepartments || []).map((dept: any) => ({
        name: dept.name || '',
        rate: String(dept.rate || 0)
      }))
    );
    setApplicationTopics(
      (report.applicationTopics || []).map((topic: any) => ({
        topic: topic.topic || '',
        count: String(topic.count || 0)
      }))
    );
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm('Bu raporu silmek istediğinizden emin misiniz?')) return;
    
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'cimerReports', reportId));
      setMessage('Rapor başarıyla silindi!');
      await fetchMyReports();
    } catch (error) {
      setError('Rapor silinirken hata oluştu');
      console.error('Error deleting report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Button
            color="inherit"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            Geri
          </Button>
          <Typography variant="h6">
            CİMER Raporu
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            CİMER Raporu
          </Typography>
          
          {message && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              select
              required
              fullWidth
              label="Rapor Ayı"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              margin="normal"
              helperText="Raporlamak istediğiniz ayı seçin"
            >
              {generateMonthOptions(2020).map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              4.1. Başvuru / Cevaplama Oranları
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 3 }}>
              <TextField
                required
                label="Başvuru Sayısı"
                type="number"
                value={applications}
                onChange={(e) => setApplications(e.target.value)}
                inputProps={{ min: 0 }}
              />
              <TextField
                required
                label="İşlem Yapılan Başvurular"
                type="number"
                value={processedApplications}
                onChange={(e) => setProcessedApplications(e.target.value)}
                inputProps={{ min: 0 }}
              />
            </Box>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              4.2. En Çok Başvuru Alan Birimler
            </Typography>
            
            {topDepartments.map((dept, index) => (
              <Box key={`dept-${index}`} sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                <TextField
                  fullWidth
                  label={`Birim Adı ${index + 1}`}
                  value={dept.name}
                  onChange={(e) => handleDepartmentChange(index, 'name', e.target.value)}
                />
                <TextField
                  label="Başvuru Oranı (%)"
                  type="number"
                  value={dept.rate}
                  onChange={(e) => handleDepartmentChange(index, 'rate', e.target.value)}
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  sx={{ width: '150px' }}
                />
                {topDepartments.length > 1 && (
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveDepartment(index)}
                  >
                    <Delete />
                  </IconButton>
                )}
              </Box>
            ))}

            <Button
              startIcon={<Add />}
              onClick={handleAddDepartment}
              sx={{ mb: 3 }}
            >
              Birim Ekle
            </Button>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              4.3. Başvuru Konusu
            </Typography>
            
            {applicationTopics.map((topic, index) => (
              <Box key={`topic-${index}`} sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                <TextField
                  fullWidth
                  label={`Konu ${index + 1}`}
                  value={topic.topic}
                  onChange={(e) => handleTopicChange(index, 'topic', e.target.value)}
                />
                <TextField
                  label="Sayı"
                  type="number"
                  value={topic.count}
                  onChange={(e) => handleTopicChange(index, 'count', e.target.value)}
                  inputProps={{ min: 0 }}
                  sx={{ width: '100px' }}
                />
                {applicationTopics.length > 1 && (
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveTopic(index)}
                  >
                    <Delete />
                  </IconButton>
                )}
              </Box>
            ))}

            <Button
              startIcon={<Add />}
              onClick={handleAddTopic}
              sx={{ mb: 3 }}
            >
              Konu Ekle
            </Button>

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={isEditMode ? <Save /> : <Add />}
              >
                {loading 
                  ? (isEditMode ? 'Güncelleniyor...' : 'Kaydediliyor...') 
                  : (isEditMode ? 'Güncelle' : 'Kaydet')
                }
              </Button>
              {isEditMode && (
                <Button
                  type="button"
                  variant="outlined"
                  size="large"
                  onClick={clearForm}
                  startIcon={<Cancel />}
                >
                  İptal
                </Button>
              )}
            </Box>
          </Box>

          {/* Mevcut Raporlarım */}
          {myReports.length > 0 && (
            <>
              <Divider sx={{ my: 4 }} />
              <Typography variant="h5" gutterBottom>
                Kaydettiğim Raporlar ({myReports.length})
              </Typography>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Ay/Yıl</strong></TableCell>
                      <TableCell align="right"><strong>Başvuru</strong></TableCell>
                      <TableCell align="right"><strong>İşlenen</strong></TableCell>
                      <TableCell align="right"><strong>Başarı Oranı</strong></TableCell>
                      <TableCell align="center"><strong>Aksiyonlar</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myReports.map((report) => {
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
                            {(report.applications || 0).toLocaleString('tr-TR')}
                          </TableCell>
                          <TableCell align="right">
                            {(report.processedApplications || 0).toLocaleString('tr-TR')}
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={`${successRate.toFixed(1)}%`}
                              color={successRate > 80 ? 'success' : successRate > 60 ? 'warning' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              color="primary"
                              onClick={() => handleEditReport(report)}
                              size="small"
                              title="Düzenle"
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteReport(report.id)}
                              size="small"
                              title="Sil"
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Paper>
      </Container>
    </>
  );
};

export default CimerForm;