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
  MenuItem
} from '@mui/material';
import { ArrowBack, Add, Delete } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { generateMonthOptions, getCurrentMonthYear } from '../../utils/dateUtils';
import 'dayjs/locale/tr';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

dayjs.locale('tr');

const CimerForm: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
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
  
  const navigate = useNavigate();
  const { currentUser } = useAuth();

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
    
    if (!selectedDate || !applications || !processedApplications) {
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

      await addDoc(collection(db, 'cimerReports'), reportData);
      setMessage('CİMER raporu başarıyla kaydedildi!');
      
      // Form temizle
      setApplications('');
      setProcessedApplications('');
      setTopDepartments([{name: '', rate: ''}]);
      setApplicationTopics([{topic: '', count: ''}]);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err) {
      setError('Rapor kaydedilirken hata oluştu');
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

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Kaydediliyor...' : 'Raporu Kaydet'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default CimerForm;