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
  InputAdornment
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

const WebAnalyticsForm: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [visitors, setVisitors] = useState('');
  const [pageViews, setPageViews] = useState('');
  const [bounceRate, setBounceRate] = useState('');
  const [avgSessionDuration, setAvgSessionDuration] = useState('');
  const [conversions, setConversions] = useState('');
  const [topPage1, setTopPage1] = useState('');
  const [topPage2, setTopPage2] = useState('');
  const [topPage3, setTopPage3] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !visitors || !pageViews || !bounceRate || 
        !avgSessionDuration || !conversions || !topPage1 || !topPage2 || !topPage3) {
      setError('Tüm alanları doldurun');
      return;
    }

    const bounceRateNum = parseFloat(bounceRate);
    if (bounceRateNum < 0 || bounceRateNum > 100) {
      setError('Hemen çıkma oranı 0-100 arasında olmalıdır');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const reportData = {
        month: selectedDate.format('YYYY-MM'),
        year: selectedDate.year(),
        visitors: parseInt(visitors),
        pageViews: parseInt(pageViews),
        bounceRate: bounceRateNum,
        avgSessionDuration: parseFloat(avgSessionDuration),
        conversions: parseInt(conversions),
        topPages: [topPage1, topPage2, topPage3],
        userId: currentUser?.uid,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'webAnalyticsReports'), reportData);
      setMessage('Web analitik raporu başarıyla kaydedildi!');
      
      // Form temizle
      setVisitors('');
      setPageViews('');
      setBounceRate('');
      setAvgSessionDuration('');
      setConversions('');
      setTopPage1('');
      setTopPage2('');
      setTopPage3('');
      
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
            Web Sitesi Analitiği
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Web Sitesi Analitik Raporu
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
              label="Ziyaretçi Sayısı"
              type="number"
              value={visitors}
              onChange={(e) => setVisitors(e.target.value)}
              inputProps={{ min: 0 }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Sayfa Görüntüleme"
              type="number"
              value={pageViews}
              onChange={(e) => setPageViews(e.target.value)}
              inputProps={{ min: 0 }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Hemen Çıkma Oranı"
              type="number"
              value={bounceRate}
              onChange={(e) => setBounceRate(e.target.value)}
              inputProps={{ min: 0, max: 100, step: 0.1 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Ortalama Oturum Süresi"
              type="number"
              value={avgSessionDuration}
              onChange={(e) => setAvgSessionDuration(e.target.value)}
              inputProps={{ min: 0, step: 0.1 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">dakika</InputAdornment>,
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Dönüşüm"
              type="number"
              value={conversions}
              onChange={(e) => setConversions(e.target.value)}
              inputProps={{ min: 0 }}
            />

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              En Popüler Sayfalar
            </Typography>

            <TextField
              margin="normal"
              required
              fullWidth
              label="1. En Popüler Sayfa URL'si"
              value={topPage1}
              onChange={(e) => setTopPage1(e.target.value)}
              placeholder="https://..."
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="2. En Popüler Sayfa URL'si"
              value={topPage2}
              onChange={(e) => setTopPage2(e.target.value)}
              placeholder="https://..."
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="3. En Popüler Sayfa URL'si"
              value={topPage3}
              onChange={(e) => setTopPage3(e.target.value)}
              placeholder="https://..."
            />

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

export default WebAnalyticsForm; 