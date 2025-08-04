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

const RPAForm: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  // Gelen/İletilen Mailler
  const [incomingEmails, setIncomingEmails] = useState('');
  const [sentEmails, setSentEmails] = useState('');
  // En Çok Başvuru/Talep Alan Mailler
  const [topEmailRecipients, setTopEmailRecipients] = useState<Array<{email: string, count: string}>>([{email: '', count: ''}]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleAddEmailRecipient = () => {
    setTopEmailRecipients([...topEmailRecipients, {email: '', count: ''}]);
  };

  const handleRemoveEmailRecipient = (index: number) => {
    if (topEmailRecipients.length > 1) {
      setTopEmailRecipients(topEmailRecipients.filter((_, i) => i !== index));
    }
  };

  const handleEmailRecipientChange = (index: number, field: 'email' | 'count', value: string) => {
    const newRecipients = [...topEmailRecipients];
    newRecipients[index][field] = value;
    setTopEmailRecipients(newRecipients);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !incomingEmails || !sentEmails) {
      setError('Tüm gerekli alanları doldurun');
      return;
    }

    const validEmailRecipients = topEmailRecipients.filter(recipient => 
      recipient.email.trim() !== '' && recipient.count.trim() !== ''
    );

    try {
      setLoading(true);
      setError('');
      
      const reportData = {
        month: selectedDate.format('YYYY-MM'),
        year: selectedDate.year(),
        incomingEmails: parseInt(incomingEmails),
        sentEmails: parseInt(sentEmails),
        topEmailRecipients: validEmailRecipients.map(recipient => ({
          email: recipient.email,
          count: parseInt(recipient.count)
        })),
        userId: currentUser?.uid,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'rpaReports'), reportData);
      setMessage('RPA raporu başarıyla kaydedildi!');
      
      // Form temizle
      setIncomingEmails('');
      setSentEmails('');
      setTopEmailRecipients([{email: '', count: ''}]);
      
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
            RPA Rapor
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            RPA Raporu (info@turksat.com.tr)
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
              5.1. Gelen/İletilen Mailler
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 3 }}>
              <TextField
                required
                label="Gelen Mail Sayısı"
                type="number"
                value={incomingEmails}
                onChange={(e) => setIncomingEmails(e.target.value)}
                inputProps={{ min: 0 }}
              />
              <TextField
                required
                label="İletilen Mail Sayısı"
                type="number"
                value={sentEmails}
                onChange={(e) => setSentEmails(e.target.value)}
                inputProps={{ min: 0 }}
              />
            </Box>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              5.2. En Çok Başvuru/Talep Alan Mailler
            </Typography>
            
            {topEmailRecipients.map((recipient, index) => (
              <Box key={`email-${index}`} sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                <TextField
                  fullWidth
                  label={`E-mail Adresi ${index + 1}`}
                  value={recipient.email}
                  onChange={(e) => handleEmailRecipientChange(index, 'email', e.target.value)}
                  placeholder="ornek@turksat.com.tr"
                />
                <TextField
                  label="Mail Sayısı"
                  type="number"
                  value={recipient.count}
                  onChange={(e) => handleEmailRecipientChange(index, 'count', e.target.value)}
                  inputProps={{ min: 0 }}
                  sx={{ width: '150px' }}
                />
                {topEmailRecipients.length > 1 && (
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveEmailRecipient(index)}
                  >
                    <Delete />
                  </IconButton>
                )}
              </Box>
            ))}

            <Button
              startIcon={<Add />}
              onClick={handleAddEmailRecipient}
              sx={{ mb: 3 }}
            >
              E-mail Ekle
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

export default RPAForm; 