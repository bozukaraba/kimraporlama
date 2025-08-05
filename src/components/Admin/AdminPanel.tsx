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
  Chip,
  Box,
  Tabs,
  Tab
} from '@mui/material';
import { ArrowBack, Check, Close, Assessment, People, BarChart } from '@mui/icons-material';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { User } from '../../types';
import ReportsOverview from './ReportsOverview';
import SocialMediaReports from './SocialMediaReports';
import NewsReports from './NewsReports';
import WebAnalyticsReports from './WebAnalyticsReports';
import CimerReports from './CimerReports';
import RPAReports from './RPAReports';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </Box>
      )}
    </div>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Admin panel error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="400px" flexDirection="column">
          <Typography variant="h6" color="error" gutterBottom>
            Bu sekmede bir hata oluştu
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {this.state.error?.message || 'Bilinmeyen hata'}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Sayfayı Yenile
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [tabValue, setTabValue] = useState(0);
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
            Admin Panel
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin panel tabs">
            <Tab 
              icon={<Assessment />} 
              label="Genel Rapor" 
              id="admin-tab-0"
              aria-controls="admin-tabpanel-0"
            />
            <Tab 
              icon={<BarChart />} 
              label="Sosyal Medya" 
              id="admin-tab-1"
              aria-controls="admin-tabpanel-1"
            />
            <Tab 
              icon={<BarChart />} 
              label="Haberler" 
              id="admin-tab-2"
              aria-controls="admin-tabpanel-2"
            />
            <Tab 
              icon={<BarChart />} 
              label="Web Analitik" 
              id="admin-tab-3"
              aria-controls="admin-tabpanel-3"
            />
            <Tab 
              icon={<BarChart />} 
              label="CİMER" 
              id="admin-tab-4"
              aria-controls="admin-tabpanel-4"
            />
            <Tab 
              icon={<BarChart />} 
              label="RPA Rapor" 
              id="admin-tab-5"
              aria-controls="admin-tabpanel-5"
            />
            <Tab 
              icon={<People />} 
              label="Kullanıcı Yönetimi" 
              id="admin-tab-6"
              aria-controls="admin-tabpanel-6"
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <ReportsOverview />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <SocialMediaReports />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <NewsReports />
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <WebAnalyticsReports />
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          <CimerReports />
        </TabPanel>
        
        <TabPanel value={tabValue} index={5}>
          <RPAReports />
        </TabPanel>

        <TabPanel value={tabValue} index={6}>
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
        </TabPanel>
      </Container>
    </>
  );
};

export default AdminPanel; 