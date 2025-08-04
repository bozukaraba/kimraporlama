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
  FormControl,
  InputLabel,
  Select,
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
  const [platform, setPlatform] = useState('');
  const [followers, setFollowers] = useState('');
  const [posts, setPosts] = useState('');
  const [likes, setLikes] = useState('');
  const [comments, setComments] = useState('');
  const [shares, setShares] = useState('');
  const [retweets, setRetweets] = useState('');
  const [views, setViews] = useState('');
  const [newFollowers, setNewFollowers] = useState('');
  const [mostEngagedPost, setMostEngagedPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !platform || !followers || !posts || !likes || !comments || !views || !newFollowers) {
      setError('Tüm gerekli alanları doldurun');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const reportData: any = {
        month: selectedDate.format('YYYY-MM'),
        year: selectedDate.year(),
        platform: platform as 'X' | 'Instagram' | 'LinkedIn' | 'Facebook' | 'YouTube' | 'NextSosyal',
        followers: parseInt(followers),
        posts: parseInt(posts),
        likes: parseInt(likes),
        comments: parseInt(comments),
        views: parseInt(views),
        newFollowers: parseInt(newFollowers),
        userId: currentUser?.uid,
        createdAt: new Date()
      };

      // Platform-specific fields
      if (platform === 'X') {
        reportData.retweets = parseInt(retweets);
      } else if (platform === 'LinkedIn' || platform === 'Facebook') {
        reportData.shares = parseInt(shares);
      }

      if (mostEngagedPost) {
        reportData.mostEngagedPost = mostEngagedPost;
      }

      await addDoc(collection(db, 'socialMediaReports'), reportData);
      setMessage('Sosyal medya raporu başarıyla kaydedildi!');
      
      // Form temizle
      setPlatform('');
      setFollowers('');
      setPosts('');
      setLikes('');
      setComments('');
      setShares('');
      setRetweets('');
      setViews('');
      setNewFollowers('');
      setMostEngagedPost('');
      
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

            <FormControl margin="normal" required fullWidth>
              <InputLabel>Sosyal Medya Platformu</InputLabel>
              <Select
                value={platform}
                label="Sosyal Medya Platformu"
                onChange={(e) => setPlatform(e.target.value)}
              >
                <MenuItem value="X">X (Twitter)</MenuItem>
                <MenuItem value="Instagram">Instagram</MenuItem>
                <MenuItem value="LinkedIn">LinkedIn</MenuItem>
                <MenuItem value="Facebook">Facebook</MenuItem>
                <MenuItem value="YouTube">YouTube</MenuItem>
                <MenuItem value="NextSosyal">Next Sosyal</MenuItem>
              </Select>
            </FormControl>

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

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
              <TextField
                required
                fullWidth
                label="İleti Sayısı"
                type="number"
                value={posts}
                onChange={(e) => setPosts(e.target.value)}
                inputProps={{ min: 0 }}
              />
              <TextField
                required
                fullWidth
                label="Beğeni Sayısı"
                type="number"
                value={likes}
                onChange={(e) => setLikes(e.target.value)}
                inputProps={{ min: 0 }}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
              <TextField
                required
                fullWidth
                label="Yorum Sayısı"
                type="number"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                inputProps={{ min: 0 }}
              />
              {platform === 'X' ? (
                <TextField
                  fullWidth
                  label="Retweet Sayısı"
                  type="number"
                  value={retweets}
                  onChange={(e) => setRetweets(e.target.value)}
                  inputProps={{ min: 0 }}
                />
              ) : (platform === 'LinkedIn' || platform === 'Facebook') ? (
                <TextField
                  fullWidth
                  label="Paylaşım Sayısı"
                  type="number"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  inputProps={{ min: 0 }}
                />
              ) : (
                <Box />
              )}
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
              <TextField
                required
                fullWidth
                label="Görüntülenme Sayısı"
                type="number"
                value={views}
                onChange={(e) => setViews(e.target.value)}
                inputProps={{ min: 0 }}
              />
              <TextField
                required
                fullWidth
                label="Yeni Takipçi Sayısı"
                type="number"
                value={newFollowers}
                onChange={(e) => setNewFollowers(e.target.value)}
                inputProps={{ min: 0 }}
              />
            </Box>

            <TextField
              margin="normal"
              fullWidth
              label="En Çok Etkileşim Alan Gönderi Linki (İsteğe Bağlı)"
              value={mostEngagedPost}
              onChange={(e) => setMostEngagedPost(e.target.value)}
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