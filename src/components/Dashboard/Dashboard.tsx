import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Box
} from '@mui/material';
import {
  Assessment,
  Article,
  Analytics,
  AutoAwesome,
  AdminPanelSettings,
  Logout
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const reportCards = [
    {
      title: 'Sosyal Medya Raporu',
      description: 'Aylık sosyal medya hesapları gelişimi',
      icon: <Assessment sx={{ fontSize: 40 }} />,
      path: '/sosyal-medya',
      color: '#1976d2'
    },
    {
      title: 'Basın Haberleri',
      description: 'Kurum ile ilgili basında çıkan haberler',
      icon: <Article sx={{ fontSize: 40 }} />,
      path: '/haberler',
      color: '#388e3c'
    },
    {
      title: 'Web Sitesi Analitiği',
      description: 'Kurum web sitesi raporu',
      icon: <Analytics sx={{ fontSize: 40 }} />,
      path: '/web-analitik',
      color: '#f57c00'
    },
    {
      title: 'RPA Rapor',
      description: 'Mail dağıtım ve birim raporları',
      icon: <AutoAwesome sx={{ fontSize: 40 }} />,
      path: '/rpa-rapor',
      color: '#7b1fa2'
    }
  ];

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Kurum Raporlama Sistemi
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {currentUser?.email} ({currentUser?.role})
          </Typography>
          {currentUser?.role === 'admin' && (
            <Button
              color="inherit"
              startIcon={<AdminPanelSettings />}
              onClick={() => navigate('/admin')}
              sx={{ mr: 1 }}
            >
              Admin Panel
            </Button>
          )}
          <Button
            color="inherit"
            startIcon={<Logout />}
            onClick={handleLogout}
          >
            Çıkış
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Rapor Paneli
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Hoş geldiniz! Aşağıdaki raporlardan birini seçerek veri girişi yapabilirsiniz.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 3 }}>
          {reportCards.map((card) => (
            <Card 
              key={card.title}
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ color: card.color, mb: 2 }}>
                  {card.icon}
                </Box>
                <Typography variant="h6" component="h2" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => navigate(card.path)}
                  sx={{ backgroundColor: card.color }}
                >
                  Rapor Gir
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      </Container>
    </>
  );
};

export default Dashboard; 