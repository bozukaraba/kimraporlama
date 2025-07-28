# Kurum Raporlama Sistemi

React.js ve Firebase tabanlı kurum raporlama uygulaması.

## Özellikler

- **Kullanıcı Yönetimi**: Personel kayıt/giriş, admin onay sistemi
- **4 Farklı Rapor Türü**:
  - Sosyal Medya Raporu
  - Basın Haberleri
  - Web Sitesi Analitiği
  - RPA Rapor
- **Admin Panel**: Personel onay yönetimi
- **Firebase**: Authentication ve Firestore database

## Kurulum

1. **Bağımlılıkları yükleyin:**
```bash
npm install
```

2. **Firebase yapılandırması:**
   - Firebase Console'dan yeni proje oluşturun
   - Authentication ve Firestore'u etkinleştirin
   - `.env` dosyası oluşturun:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

3. **İlk admin kullanıcısı oluşturma:**
   - Uygulama çalıştıktan sonra kayıt olun
   - Firebase Console > Firestore > users koleksiyonunda
   - Kullanıcınızın `role` alanını `admin` ve `isApproved` alanını `true` yapın

4. **Uygulamayı başlatın:**
```bash
npm start
```

## Kullanım

1. **Personel Kaydı**: `/register` sayfasından kayıt olun
2. **Admin Onayı**: Admin panelinden personeli onaylayın
3. **Rapor Girişi**: Dashboard'dan istenen rapor türünü seçin
4. **Aylık Raporlar**: Her ayın 30'unda raporları girin

## Yapı

```
src/
├── components/
│   ├── Auth/          # Giriş/Kayıt bileşenleri
│   ├── Dashboard/     # Ana panel
│   ├── Admin/         # Admin paneli
│   └── Forms/         # Rapor formları
├── contexts/          # React contexts
├── firebase/          # Firebase yapılandırması
└── types/            # TypeScript türleri
```

## Teknolojiler

- React.js (TypeScript)
- Firebase (Auth + Firestore)
- Material-UI
- React Router
- Day.js
