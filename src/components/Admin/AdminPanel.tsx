import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  AppBar,
  Toolbar,
  Alert,
  Chip
} from '@mui/material';
import { ArrowBack, Check, Close } from '@mui/icons-material';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { User } from '../../types';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersQuery = query(collection(db, 'users'), where('role', '==', 'personel'));
      const querySnapshot = await getDocs(usersQuery);
      const usersData = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as User[];
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (userId: string, approve: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isApproved: approve
      });
      
      setUsers(users.map(user => 
        user.uid === userId ? { ...user, isApproved: approve } : user
      ));
      
      setMessage(approve ? 'Kullanıcı onaylandı' : 'Kullanıcı onayı iptal edildi');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage('Hata oluştu');
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography>Yükleniyor...</Typography>
      </Container>
    );
  }

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
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Admin Panel - Kullanıcı Yönetimi
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        <Typography variant="h5" gutterBottom>
          Personel Listesi
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Kayıt Tarihi</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.createdAt?.toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.isApproved ? 'Onaylı' : 'Beklemede'}
                      color={user.isApproved ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {!user.isApproved ? (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<Check />}
                        onClick={() => handleApproval(user.uid, true)}
                        sx={{ mr: 1 }}
                      >
                        Onayla
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Close />}
                        onClick={() => handleApproval(user.uid, false)}
                      >
                        Onayı İptal Et
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {users.length === 0 && (
          <Typography variant="body1" align="center" sx={{ mt: 4 }}>
            Henüz kayıtlı personel bulunmuyor.
          </Typography>
        )}
      </Container>
    </>
  );
};

export default AdminPanel; 