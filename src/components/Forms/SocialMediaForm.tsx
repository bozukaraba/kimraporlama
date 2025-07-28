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
  MenuItem
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

const SocialMediaForm: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [followers, setFollowers] = useState('');
  const [posts, setPosts] = useState('');
  const [mostEngagedPost, setMostEngagedPost] = useState('');
  const [leastEngagedPost, setLeastEngagedPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !followers || !posts || !mostEngagedPost || !leastEngagedPost) {
      setError('Tüm alanları doldurun');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const reportData = {
        month: selectedDate.format('YYYY-MM'),
        year: selectedDate.year(),
        followers: parseInt(followers),
        posts: parseInt(posts),
        mostEngagedPost,
        leastEngagedPost,
        userId: currentUser?.uid,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'socialMediaReports'), reportData);
      setMessage('Sosyal medya raporu başarıyla kaydedildi!');
      
      // Form temizle
      setFollowers('');
      setPosts('');
      setMostEngagedPost('');
      setLeastEngagedPost('');
      
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
            Sosyal Medya Raporu
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Aylık Sosyal Medya Raporu
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
              label="Takipçi Sayısı"
              type="number"
              value={followers}
              onChange={(e) => setFollowers(e.target.value)}
              inputProps={{ min: 0 }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Gönderi Sayısı"
              type="number"
              value={posts}
              onChange={(e) => setPosts(e.target.value)}
              inputProps={{ min: 0 }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="En Çok Etkileşim Alan Gönderi Linki"
              value={mostEngagedPost}
              onChange={(e) => setMostEngagedPost(e.target.value)}
              placeholder="https://..."
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="En Az Etkileşim Alan Gönderi Linki"
              value={leastEngagedPost}
              onChange={(e) => setLeastEngagedPost(e.target.value)}
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

export default SocialMediaForm; 