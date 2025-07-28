# Netlify Deployment Kılavuzu

## Netlify Environment Variables

Netlify Dashboard → Site Settings → Environment Variables → Add Variable

```
REACT_APP_FIREBASE_API_KEY=AIzaSyA0kJj_OXa9Qrzi9VHjZ99mk5jloKvnqIE
REACT_APP_FIREBASE_AUTH_DOMAIN=kimraporlama.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=kimraporlama
REACT_APP_FIREBASE_STORAGE_BUCKET=kimraporlama.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=311661651825
REACT_APP_FIREBASE_APP_ID=1:311661651825:web:cd73e51a812a09cebdf8d0
```

## Deploy Adımları

1. **Netlify'a Git**: https://app.netlify.com
2. **New site from Git** → **GitHub**
3. **bozukaraba/kimraporlama** repo'sunu seç
4. **Deploy settings**:
   - Build command: `npm run build`
   - Publish directory: `build`
5. **Environment variables** ekle (yukarıdaki değerler)
6. **Deploy site** butonuna bas

## Firebase Ayarları

### 1. Domain Whitelist
Firebase Console → Authentication → Settings → Authorized domains
- `your-site-name.netlify.app` ekle

### 2. Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## İlk Admin Kullanıcısı

Deploy sonrası:
1. Site açıldıktan sonra kayıt ol
2. Firebase Console → Firestore → users koleksiyonu
3. Kullanıcının `role: "admin"` ve `isApproved: true` yap

## Build Komutu Test

Local'de test için:
```bash
npm run build
npm install -g serve
serve -s build
``` 