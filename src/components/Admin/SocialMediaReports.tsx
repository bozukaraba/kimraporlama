import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Button,
  TextField,
  MenuItem,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { FileDownload, PictureAsPdf } from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { SocialMediaReport } from '../../types';
import { exportSocialMediaReport } from '../../utils/exportUtils';

const SocialMediaReports: React.FC = () => {
  const [reports, setReports] = useState<SocialMediaReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<SocialMediaReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [exportLoading, setExportLoading] = useState<string>('');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, yearFilter, platformFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const q = query(collection(db, 'socialMediaReports'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const reportsData = querySnapshot.docs?.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as SocialMediaReport[] || [];

      setReports(reportsData || []);
    } catch (error) {
      console.error('Error fetching social media reports:', error);
      setError('Sosyal medya raporlarını yüklerken hata oluştu.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = reports;
    
    if (yearFilter !== 'all') {
      filtered = filtered.filter(report => report.year.toString() === yearFilter);
    }
    
    if (platformFilter !== 'all') {
      filtered = filtered.filter(report => report.platform === platformFilter);
    }
    
    setFilteredReports(filtered);
  };

  const getAvailableYears = () => {
    const years = Array.from(new Set(reports.map(report => report.year)));
    return years.sort((a, b) => b - a);
  };

  const getAvailablePlatforms = () => {
    const platforms = Array.from(new Set(reports.map(report => report.platform)));
    return platforms.sort();
  };

  const getChartData = () => {
    return filteredReports
      .filter(report => report && report.month)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(report => ({
        month: report.month,
        platform: report.platform || '',
        followers: report.followers || 0,
        posts: report.posts || 0,
        likes: report.likes || 0,
        comments: report.comments || 0,
        views: report.views || 0,
        newFollowers: report.newFollowers || 0
      }));
  };

  const getEngagementData = () => {
    return filteredReports
      .filter(report => report && report.month)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(report => ({
        month: report.month,
        platform: report.platform || '',
        totalEngagement: (report.likes || 0) + (report.comments || 0) + (report.shares || 0) + (report.retweets || 0)
      }));
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setExportLoading(format);
      setExportMenuAnchor(null);
      
      await exportSocialMediaReport(filteredReports, format, yearFilter, platformFilter);
      
    } catch (error) {
      console.error('Export error:', error);
      setError(`${format.toUpperCase()} oluşturma hatası: ${(error as Error).message}`);
    } finally {
      setExportLoading('');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px" flexDirection="column">
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Sayfayı Yenile
        </Button>
      </Box>
    );
  }

  const chartData = getChartData();
  const engagementData = getEngagementData();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Sosyal Medya Raporları
        </Typography>
        
        <Box display="flex" gap={2}>
          <TextField
            select
            label="Platform Filtresi"
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">Tüm Platformlar</MenuItem>
            {getAvailablePlatforms().map(platform => (
              <MenuItem key={platform} value={platform}>{platform}</MenuItem>
            ))}
          </TextField>
          
          <TextField
            select
            label="Yıl Filtresi"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">Tümü</MenuItem>
            {getAvailableYears().map(year => (
              <MenuItem key={year} value={year.toString()}>{year}</MenuItem>
            ))}
          </TextField>
          
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
            disabled={filteredReports.length === 0 || exportLoading !== ''}
          >
            {exportLoading ? `${exportLoading.toUpperCase()} Hazırlanıyor...` : 'Rapor İndir'}
          </Button>
          
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={() => setExportMenuAnchor(null)}
          >
            <MenuItem onClick={() => handleExport('csv')}>
              <ListItemIcon>
                <FileDownload fontSize="small" />
              </ListItemIcon>
              <ListItemText>CSV İndir</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleExport('pdf')}>
              <ListItemIcon>
                <PictureAsPdf fontSize="small" />
              </ListItemIcon>
              <ListItemText>PDF İndir (Print)</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Grafik Görünümü */}
      {chartData.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 3, mb: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Takipçi Sayısı Trendi
                </Typography>
                <div id="social-followers-chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [Number(value).toLocaleString('tr-TR'), '']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="followers" 
                      stroke="#8884d8" 
                      name="Takipçi Sayısı"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Görüntülenme ve Beğeni
                </Typography>
                <div id="social-engagement-chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [Number(value).toLocaleString('tr-TR'), '']} />
                      <Legend />
                      <Bar dataKey="views" fill="#8884d8" name="Görüntülenme" />
                      <Bar dataKey="likes" fill="#82ca9d" name="Beğeni" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </Box>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Toplam Etkileşim Trendi
              </Typography>
              <div id="social-interaction-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [Number(value).toLocaleString('tr-TR'), '']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="totalEngagement" 
                      stroke="#ff7300" 
                      name="Toplam Etkileşim"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tablo Görünümü */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Detaylı Rapor Listesi ({filteredReports.length} kayıt)
          </Typography>
          
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Ay/Yıl</strong></TableCell>
                  <TableCell><strong>Platform</strong></TableCell>
                  <TableCell align="right"><strong>Takipçi</strong></TableCell>
                  <TableCell align="right"><strong>İleti</strong></TableCell>
                  <TableCell align="right"><strong>Beğeni</strong></TableCell>
                  <TableCell align="right"><strong>Yorum</strong></TableCell>
                  <TableCell align="right"><strong>Görüntülenme</strong></TableCell>
                  <TableCell align="right"><strong>Yeni Takipçi</strong></TableCell>
                  <TableCell><strong>En Çok Etkileşim</strong></TableCell>
                  <TableCell><strong>Tarih</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>
                      <Chip 
                        label={`${report.month}`}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={report.platform}
                        color="secondary"
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {(report.followers || 0).toLocaleString('tr-TR')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {report.posts || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="success.main">
                        {(report.likes || 0).toLocaleString('tr-TR')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {(report.comments || 0).toLocaleString('tr-TR')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {(report.views || 0).toLocaleString('tr-TR')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="secondary">
                        +{(report.newFollowers || 0).toLocaleString('tr-TR')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {report.mostEngagedPost ? (
                        <a 
                          href={report.mostEngagedPost} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: '#1976d2', textDecoration: 'none' }}
                        >
                          Link görüntüle
                        </a>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {report.createdAt?.toLocaleDateString('tr-TR')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredReports.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                {yearFilter === 'all' 
                  ? 'Henüz sosyal medya raporu bulunmuyor.' 
                  : `${yearFilter} yılı için rapor bulunamadı.`
                }
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SocialMediaReports;