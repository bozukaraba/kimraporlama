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
  Alert
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
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
  // Medyada Yer Alma (Haber Sayısı)
  const [printNews, setPrintNews] = useState('');
  const [tvNews, setTvNews] = useState('');
  const [internetNews, setInternetNews] = useState('');
  // Reklam Eşdeğeri (TL)
  const [printAdEquiv, setPrintAdEquiv] = useState('');
  const [tvAdEquiv, setTvAdEquiv] = useState('');
  const [internetAdEquiv, setInternetAdEquiv] = useState('');
  // Toplam Erişim (Kişi)
  const [printReach, setPrintReach] = useState('');
  const [tvReach, setTvReach] = useState('');
  const [internetReach, setInternetReach] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { currentUser } = useAuth();



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !printNews || !tvNews || !internetNews || 
        !printAdEquiv || !tvAdEquiv || !internetAdEquiv ||
        !printReach || !tvReach || !internetReach) {
      setError('Tüm alanları doldurun');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const reportData = {
        month: selectedDate.format('YYYY-MM'),
        year: selectedDate.year(),
        newsCount: {
          print: parseInt(printNews),
          tv: parseInt(tvNews),
          internet: parseInt(internetNews)
        },
        adEquivalent: {
          print: parseFloat(printAdEquiv),
          tv: parseFloat(tvAdEquiv),
          internet: parseFloat(internetAdEquiv)
        },
        totalReach: {
          print: parseInt(printReach),
          tv: parseInt(tvReach),
          internet: parseInt(internetReach)
        },
        userId: currentUser?.uid,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'newsReports'), reportData);
      setMessage('Haber raporu başarıyla kaydedildi!');
      
      // Form temizle
      setPrintNews('');
      setTvNews('');
      setInternetNews('');
      setPrintAdEquiv('');
      setTvAdEquiv('');
      setInternetAdEquiv('');
      setPrintReach('');
      setTvReach('');
      setInternetReach('');
      
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
            Haber Raporu
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

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              1.1. Medyada Yer Alma (Haber Sayısı)
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
              <TextField
                required
                type="number"
                label="Basın"
                value={printNews}
                onChange={(e) => setPrintNews(e.target.value)}
                inputProps={{ min: 0 }}
              />
              <TextField
                required
                type="number"
                label="TV"
                value={tvNews}
                onChange={(e) => setTvNews(e.target.value)}
                inputProps={{ min: 0 }}
              />
              <TextField
                required
                type="number"
                label="İnternet Haber Sitesi"
                value={internetNews}
                onChange={(e) => setInternetNews(e.target.value)}
                inputProps={{ min: 0 }}
              />
            </Box>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              1.2. Reklam Eşdeğeri (TL)
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
              <TextField
                required
                type="number"
                label="Basın"
                value={printAdEquiv}
                onChange={(e) => setPrintAdEquiv(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
              />
              <TextField
                required
                type="number"
                label="TV"
                value={tvAdEquiv}
                onChange={(e) => setTvAdEquiv(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
              />
              <TextField
                required
                type="number"
                label="İnternet Haber Sitesi"
                value={internetAdEquiv}
                onChange={(e) => setInternetAdEquiv(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Box>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              1.3. Toplam Erişim (Kişi)
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
              <TextField
                required
                type="number"
                label="Basın"
                value={printReach}
                onChange={(e) => setPrintReach(e.target.value)}
                inputProps={{ min: 0 }}
              />
              <TextField
                required
                type="number"
                label="TV"
                value={tvReach}
                onChange={(e) => setTvReach(e.target.value)}
                inputProps={{ min: 0 }}
              />
              <TextField
                required
                type="number"
                label="İnternet Haber Sitesi"
                value={internetReach}
                onChange={(e) => setInternetReach(e.target.value)}
                inputProps={{ min: 0 }}
              />
            </Box>

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