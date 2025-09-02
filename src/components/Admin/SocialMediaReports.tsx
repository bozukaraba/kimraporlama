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
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import { FileDownload, PictureAsPdf, Edit } from '@mui/icons-material';
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
import { formatMonthToTurkish } from '../../utils/dateUtils';

const SocialMediaReports: React.FC = () => {
  const [reports, setReports] = useState<SocialMediaReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<SocialMediaReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [exportLoading, setExportLoading] = useState<string>('');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    platform: '',
    followers: '',
    posts: '',
    likes: '',
    comments: '',
    shares: '',
    retweets: '',
    views: '',
    newFollowers: '',
    mostEngagedPost: ''
  });

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, yearFilter, monthFilter, platformFilter]);

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
    
    if (monthFilter !== 'all') {
      filtered = filtered.filter(report => report.month === monthFilter);
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

  const getAvailableMonths = () => {
    let reportsToCheck = reports;
    
    if (yearFilter !== 'all') {
      reportsToCheck = reports.filter(report => report.year.toString() === yearFilter);
    }
    
    const months = Array.from(new Set(reportsToCheck.map(report => report.month)));
    
    const monthOrder = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    
    return months.sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
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
        month: formatMonthToTurkish(report.month),
        monthOriginal: report.month,
        platform: report.platform || '',
        followers: report.followers || 0,
        posts: report.posts || 0,
        likes: report.likes || 0,
        comments: report.comments || 0,
        shares: report.shares || 0,
        retweets: report.retweets || 0,
        views: report.views || 0,
        newFollowers: report.newFollowers || 0
      }));
  };

  const getEngagementData = () => {
    return filteredReports
      .filter(report => report && report.month)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(report => ({
        month: formatMonthToTurkish(report.month),
        monthOriginal: report.month,
        platform: report.platform || '',
        totalEngagement: (report.likes || 0) + (report.comments || 0) + (report.shares || 0) + (report.retweets || 0)
      }));
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setExportLoading(format);
      setExportMenuAnchor(null);
      
      await exportSocialMediaReport(filteredReports, format, yearFilter, monthFilter);
      
    } catch (error) {
      console.error('Export error:', error);
      setError(`${format.toUpperCase()} oluşturma hatası: ${(error as Error).message}`);
    } finally {
      setExportLoading('');
    }
  };

  // Edit Functions
  const handleEditReport = (report: any) => {
    setEditingReport(report);
    setEditFormData({
      platform: report.platform || '',
      followers: String(report.followers || 0),
      posts: String(report.posts || 0),
      likes: String(report.likes || 0),
      comments: String(report.comments || 0),
      shares: String(report.shares || 0),
      retweets: String(report.retweets || 0),
      views: String(report.views || 0),
      newFollowers: String(report.newFollowers || 0),
      mostEngagedPost: report.mostEngagedPost || ''
    });
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingReport(null);
    setEditFormData({
      platform: '',
      followers: '',
      posts: '',
      likes: '',
      comments: '',
      shares: '',
      retweets: '',
      views: '',
      newFollowers: '',
      mostEngagedPost: ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingReport) return;

    try {
      setLoading(true);
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../../firebase/config');

      const reportRef = doc(db, 'socialMediaReports', editingReport.id!);
      await updateDoc(reportRef, {
        platform: editFormData.platform,
        followers: parseInt(editFormData.followers) || 0,
        posts: parseInt(editFormData.posts) || 0,
        likes: parseInt(editFormData.likes) || 0,
        comments: parseInt(editFormData.comments) || 0,
        shares: parseInt(editFormData.shares) || 0,
        retweets: parseInt(editFormData.retweets) || 0,
        views: parseInt(editFormData.views) || 0,
        newFollowers: parseInt(editFormData.newFollowers) || 0,
        mostEngagedPost: editFormData.mostEngagedPost,
        updatedAt: new Date()
      });

      // Refresh reports
      await fetchReports();
      handleCloseEditModal();
      alert('Rapor başarıyla güncellendi!');
    } catch (error) {
      console.error('Update error:', error);
      alert('Rapor güncellenirken hata oluştu!');
    } finally {
      setLoading(false);
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
            onChange={(e) => {
              setYearFilter(e.target.value);
              setMonthFilter('all');
            }}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">Tümü</MenuItem>
            {getAvailableYears().map(year => (
              <MenuItem key={year} value={year.toString()}>{year}</MenuItem>
            ))}
          </TextField>
          
          <TextField
            select
            label="Ay Filtresi"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 120 }}
            disabled={getAvailableMonths().length === 0}
          >
            <MenuItem value="all">Tümü</MenuItem>
            {getAvailableMonths().map(month => (
              <MenuItem key={month} value={month}>{month}</MenuItem>
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
                  <TableCell align="right"><strong>Paylaşım/RT</strong></TableCell>
                  <TableCell align="right"><strong>Görüntülenme</strong></TableCell>
                  <TableCell align="right"><strong>Yeni Takipçi</strong></TableCell>
                  <TableCell><strong>En Çok Etkileşim</strong></TableCell>
                  <TableCell><strong>Tarih</strong></TableCell>
                  <TableCell align="center"><strong>Aksiyonlar</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>
                      <Chip 
                        label={formatMonthToTurkish(report.month)}
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
                      <Typography variant="body2" color="info.main">
                        {report.platform === 'X' 
                          ? (report.retweets || 0).toLocaleString('tr-TR')
                          : (report.shares || 0).toLocaleString('tr-TR')
                        }
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
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleEditReport(report)}
                        size="small"
                        title="Raporu Düzenle"
                      >
                        <Edit />
                      </IconButton>
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

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onClose={handleCloseEditModal} maxWidth="md" fullWidth>
        <DialogTitle>Sosyal Medya Raporu Düzenle</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              label="Platform"
              value={editFormData.platform}
              onChange={(e) => setEditFormData({...editFormData, platform: e.target.value})}
              fullWidth
            />
            <TextField
              label="Takipçi Sayısı"
              type="number"
              value={editFormData.followers}
              onChange={(e) => setEditFormData({...editFormData, followers: e.target.value})}
              fullWidth
            />
            <TextField
              label="İleti/Gönderi Sayısı"
              type="number"
              value={editFormData.posts}
              onChange={(e) => setEditFormData({...editFormData, posts: e.target.value})}
              fullWidth
            />
            <TextField
              label="Beğeni Sayısı"
              type="number"
              value={editFormData.likes}
              onChange={(e) => setEditFormData({...editFormData, likes: e.target.value})}
              fullWidth
            />
            <TextField
              label="Yorum Sayısı"
              type="number"
              value={editFormData.comments}
              onChange={(e) => setEditFormData({...editFormData, comments: e.target.value})}
              fullWidth
            />
            {editFormData.platform === 'X' ? (
              <TextField
                label="Retweet Sayısı"
                type="number"
                value={editFormData.retweets}
                onChange={(e) => setEditFormData({...editFormData, retweets: e.target.value})}
                fullWidth
              />
            ) : (editFormData.platform === 'LinkedIn' || editFormData.platform === 'Facebook') ? (
              <TextField
                label="Paylaşım Sayısı"
                type="number"
                value={editFormData.shares}
                onChange={(e) => setEditFormData({...editFormData, shares: e.target.value})}
                fullWidth
              />
            ) : null}
            <TextField
              label="Görüntülenme Sayısı"
              type="number"
              value={editFormData.views}
              onChange={(e) => setEditFormData({...editFormData, views: e.target.value})}
              fullWidth
            />
            <TextField
              label="Yeni Takipçi"
              type="number"
              value={editFormData.newFollowers}
              onChange={(e) => setEditFormData({...editFormData, newFollowers: e.target.value})}
              fullWidth
            />
            <TextField
              label="En Çok Etkileşim Alan Post (Link)"
              value={editFormData.mostEngagedPost}
              onChange={(e) => setEditFormData({...editFormData, mostEngagedPost: e.target.value})}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal}>İptal</Button>
          <Button onClick={handleSaveEdit} variant="contained" color="primary">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SocialMediaReports;