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

const RPAForm: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [totalEmails, setTotalEmails] = useState('');
  const [distributedEmails, setDistributedEmails] = useState('');
  const [department1, setDepartment1] = useState('');
  const [department2, setDepartment2] = useState('');
  const [department3, setDepartment3] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !totalEmails || !distributedEmails || 
        !department1 || !department2 || !department3) {
      setError('Tüm alanları doldurun');
      return;
    }

    const totalEmailsNum = parseInt(totalEmails);
    const distributedEmailsNum = parseInt(distributedEmails);

    if (distributedEmailsNum > totalEmailsNum) {
      setError('Dağıtılan mail sayısı toplam mail sayısından fazla olamaz');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const reportData = {
        month: selectedDate.format('YYYY-MM'),
        year: selectedDate.year(),
        totalEmails: totalEmailsNum,
        distributedEmails: distributedEmailsNum,
        topDepartments: [department1, department2, department3],
        userId: currentUser?.uid,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'rpaReports'), reportData);
      setMessage('RPA raporu başarıyla kaydedildi!');
      
      // Form temizle
      setTotalEmails('');
      setDistributedEmails('');
      setDepartment1('');
      setDepartment2('');
      setDepartment3('');
      
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
            RPA Mail Dağıtım Raporu
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
              label="Gelen Toplam Mail Sayısı"
              type="number"
              value={totalEmails}
              onChange={(e) => setTotalEmails(e.target.value)}
              inputProps={{ min: 0 }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Dağıtılan Mail Sayısı"
              type="number"
              value={distributedEmails}
              onChange={(e) => setDistributedEmails(e.target.value)}
              inputProps={{ min: 0 }}
            />

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              En Çok Dağıtılan İlk 3 Birim
            </Typography>

            <TextField
              margin="normal"
              required
              fullWidth
              label="1. En Çok Dağıtılan Birim"
              value={department1}
              onChange={(e) => setDepartment1(e.target.value)}
              placeholder="Birim adını girin"
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="2. En Çok Dağıtılan Birim"
              value={department2}
              onChange={(e) => setDepartment2(e.target.value)}
              placeholder="Birim adını girin"
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="3. En Çok Dağıtılan Birim"
              value={department3}
              onChange={(e) => setDepartment3(e.target.value)}
              placeholder="Birim adını girin"
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

export default RPAForm; 