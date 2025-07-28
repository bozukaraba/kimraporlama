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
  MenuItem,
  IconButton
} from '@mui/material';
import { ArrowBack, Add, Delete } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/tr';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

dayjs.locale('tr');

const NewsForm: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [status, setStatus] = useState('');
  const [summary, setSummary] = useState('');
  const [link, setLink] = useState('');
  const [sources, setSources] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const statusOptions = [
    { value: 'olumlu', label: 'Olumlu' },
    { value: 'olumsuz', label: 'Olumsuz' },
    { value: 'kritik', label: 'Kritik' }
  ];

  const handleAddSource = () => {
    setSources([...sources, '']);
  };

  const handleRemoveSource = (index: number) => {
    if (sources.length > 1) {
      setSources(sources.filter((_, i) => i !== index));
    }
  };

  const handleSourceChange = (index: number, value: string) => {
    const newSources = [...sources];
    newSources[index] = value;
    setSources(newSources);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !status || !summary || !link) {
      setError('Tüm gerekli alanları doldurun');
      return;
    }

    const validSources = sources.filter(source => source.trim() !== '');
    if (validSources.length === 0) {
      setError('En az bir haber kaynağı ekleyin');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const reportData = {
        month: selectedDate.format('YYYY-MM'),
        year: selectedDate.year(),
        status,
        summary,
        link,
        sources: validSources,
        userId: currentUser?.uid,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'newsReports'), reportData);
      setMessage('Haber raporu başarıyla kaydedildi!');
      
      // Form temizle
      setStatus('');
      setSummary('');
      setLink('');
      setSources(['']);
      
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
            Basın Haberleri Raporu
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Basında Çıkan Haberler
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
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="tr">
              <DatePicker
                label="Rapor Ayı"
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                views={['year', 'month']}
                format="MMMM YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: 'normal',
                    required: true
                  }
                }}
              />
            </LocalizationProvider>

            <TextField
              margin="normal"
              required
              fullWidth
              select
              label="Durum"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              margin="normal"
              required
              fullWidth
              multiline
              rows={4}
              label="Haber Bahsi (Kısa Özet)"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Haber Linki"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
            />

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Haber Kaynakları
            </Typography>
            
            {sources.map((source, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TextField
                  fullWidth
                  label={`Kaynak ${index + 1}`}
                  value={source}
                  onChange={(e) => handleSourceChange(index, e.target.value)}
                  sx={{ mr: 1 }}
                />
                {sources.length > 1 && (
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveSource(index)}
                  >
                    <Delete />
                  </IconButton>
                )}
              </Box>
            ))}

            <Button
              startIcon={<Add />}
              onClick={handleAddSource}
              sx={{ mb: 3 }}
            >
              Kaynak Ekle
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

export default NewsForm; 