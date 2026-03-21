# 💰 Knapsack - Finansal Yönetim Uygulaması

Knapsack, modern tasarımı ve güçlü özellikleriyle kişisel ve profesyonel mali yönetimi kolaylaştıran açık kaynak kodlu bir web uygulamasıdır.

## 🎯 Özellikler

- 📊 **Gelişmiş Analitik**: Harcamaları grafikleriyle görselleştir
- 💳 **İşlem Yönetimi**: Tüm gelir, gider ve transferlerini takip et
- 🏦 **Varlık Yönetimi**: Bankaları ve cüzdanları organize et
- 📅 **Takvim Görünümü**: Harcamalarını tarih bazında incele
- ⚙️ **Özelleştirme**: Kategoriler, cüzdanlar ve para birimlerini özelleştir
- ☁️ **Hesap Bazlı Senkronizasyon (Opsiyonel)**: Supabase ile cihazlar arası veri senkronu
- ✉️ **Aktivasyon E-postası (Opsiyonel)**: Supabase Auth ile doğrulama + hoş geldiniz içeriği
- 🌙 **Koyu/Açık Mod**: Gözünü yorma, istediğin tema seç
- 📱 **Mobil Uyumlu**: Telefondan, tablettten, masaüstünden erişebilir
- ⚡ **Hızlı & Hafif**: Vite ile optimize edilmiş performans

## 🛠️ Teknoloji Stack

| Kategori | Teknoloji |
|----------|-----------|
| **Framework** | React 19 |
| **Build Tool** | Vite 6 |
| **Styling** | Tailwind CSS 4 |
| **Routing** | React Router v6 |
| **Animasyonlar** | Framer Motion |
| **İkonlar** | Lucide React |
| **Data Storage** | localStorage + opsiyonel Supabase sync |

## 🚀 Kurulum

### Gereksinimler
- Node.js 20.x
- npm veya yarn

Sürüm yöneticisi kullanıyorsan proje kökünde hem `.nvmrc` hem de `.node-version`
dosyası `20` olarak tanımlıdır.

```bash
nvm use
```

Bu komut Node sürümünü proje ile uyumlu hale getirir.

### Adımlar

```bash
# 1. Repoyu clone et
git clone <repo-url>
cd knapsack-app

# 2. Bağımlılıkları yükle
npm install

# 2.5 Supabase sync kullanacaksan ortam değişkenlerini hazırla (PowerShell)
Copy-Item .env.example .env.local

# 3. Geliştirme sunucusunu başlat
npm run dev

# 4. Tarayıcıda aç
# http://localhost:5177
```

## 📖 Kullanım

### Ana Sayfalar

- **🏠 Anasayfa**: Hızlı özet, son işlemler, bakiye
- **💸 İşlemler**: Tüm gelir/gider işlemlerini yönet
- **💎 Varlıklarım**: Banka hesapları ve cüzdanları yönet
- **📊 Analitik**: Premium hesaplar için detaylı raporlar ve istatistikler
- **💸 Harcamalar**: Kategori bazlı harcama analizi
- **📅 Takvim**: Tarih bazında işlem görünümü
- **⚙️ Ayarlar**: Tema, para birimi, kategori ve cüzdan ayarları

### Hızlı İşlem Ekleme

Sağ altta "+" butonu ile hızlı işlem ekle modalını aç:
- Türü seç (Gider/Gelir/Transfer)
- Miktar gir
- Para birimi Ayarlar ekranındaki seçime göre otomatik gelir
- Kategori belirle
- Notu ekle (opsiyonel)

## 🏗️ Proje Yapısı

```
src/
├── pages/           # Sayfa bileşenleri
├── hooks/           # Custom React hooks (useFinance)
├── utils/           # Sabitler ve yardımcı fonksiyonlar
├── App.tsx          # Ana uygulama bileşeni
├── App.css          # Global stiller
└── main.tsx         # Giriş noktası

public/              # Sabit dosyalar
tests/               # E2E testleri
scripts/             # Yardımcı scriptler
supabase/            # Supabase SQL schema dosyaları
```

## 📚 Ürün Dokümanları

- Mevcut özellik envanteri ve kapsamlı aday roadmap: `docs/product-inventory-and-roadmap-tr.md`
- Canlı auth ve premium doğrulama checklist'i: `docs/live-auth-premium-smoke-checklist-tr.md`
- Alıcı gözüyle puanlı değerlendirme: `docs/due-diligence-report-tr.md`
- Teknik sertleştirme ve düzeltme planı: `docs/technical-hardening-plan-tr.md`

## ☁️ Supabase Sync Kurulumu (Opsiyonel)

1. Supabase projesi oluştur.
2. SQL Editor'a `supabase/schema.sql` dosyasındaki scripti yapıştırıp çalıştır.
3. `.env.local` dosyana aşağıdaki alanları gir:

```bash
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
VITE_SUPABASE_SYNC_TABLE=knapsack_user_data
VITE_SUPABASE_PREMIUM_TABLE=knapsack_user_subscriptions
VITE_SUPABASE_AUTH_REDIRECT_TO=https://<app-domain>/landing
```

Bu alanlar tanımlı değilse uygulama otomatik olarak local-first modda çalışmaya devam eder.

Premium plan durumunu da Supabase tarafindan okutacaksan `supabase/schema.sql` icindeki `knapsack_user_subscriptions` tablosunu da olustur. Uygulama login sirasinda bu tabloyu okuyup kullaniciyi `free` veya `premium` olarak etiketler. Odeme webhook'u veya manuel admin paneli bu tabloyu guncelleyebilir.

`VITE_PREMIUM_EMAILS` ve `VITE_PREMIUM_GOOGLE_IDS` artik varsayilan otorite degildir. Bu override listeleri sadece gecici debug/admin fallback icin `VITE_ENABLE_PREMIUM_OVERRIDE=true` oldugunda dikkate alinir; production'da premium yetki kaynagi Supabase subscription kaydi olmalidir.

## ✉️ Aktivasyon Maili + Hos Geldiniz Icerigi

1. Supabase Dashboard -> `Authentication` -> `Providers` -> `Email` aktif olsun.
2. `Confirm email` secenegini ac.
3. `Authentication` -> `URL Configuration` bolumunde `Site URL` ve redirect URL olarak uygulama domainini/`/landing` sayfasini tanimla.
4. `Authentication` -> `Email Templates` -> `Confirm signup` icerigini `supabase/templates/confirm-signup.html` ile degistir.
5. Uygulamada kayit olan kullaniciya aktivasyon emaili gider; bu mailde hos geldiniz metni ve temel ozellikler listesi yer alir.

Not: `@knapsack.local` uzantili test/demo emailleri aktivasyon bypass ile calisir (test ve demo akislarini bozmamak icin).

## 📦 Derleme & Deployment

### Geliştirmede
```bash
npm run dev          # HMR ile dev sunucusu
npm run lint         # ESLint çalıştır
```

### Production
```bash
npm run build        # dist/ klasörüne derle
npm run preview      # Derlenmiş sürümü göz at
```

### Vercel'de Deploy
Bu proje otomatik olarak Vercel'e uyumludur. Repoyu bağla ve otomatik deployment aktif olacaktır.

## 📱 Android Uygulama Olarak Yayınlama (Google Play)

Bu proje Capacitor ile native Android uygulamaya paketlenebilir.

### 1) Bir kereye mahsus kontrol

- `capacitor.config.ts` dosyasında `appId` benzersiz olmalı.
- Bu repoda mevcut değer: `com.theonbuka.knapsack`.
- Play Store'da ilk yayın sonrası `applicationId` değiştirilemez.
- Android release build icin JDK 21 gerekli.

### 2) Android proje dosyalarını güncelle

```bash
npm run android:sync
```

Bu komut:
- web uygulamasını (`dist/`) yeniden build eder,
- Android projesine kopyalar,
- plugin senkronizasyonu yapar.

### 3) Android Studio'da aç

```bash
npm run android:open
```

Android Studio'da:
- Paket kimligi ve imza ayarlarinin dogru oldugunu kontrol et.
- Uygulama surumu `package.json` icindeki `version` alanindan okunur.
- Android `versionCode` bu surumden otomatik uretilir (`1.2.3` -> `10203`).

Surum artirmak icin:

```bash
npm version patch --no-git-tag-version
```

### 3.1) Upload key oluştur (zorunlu)

Play Store'a yüklenecek `release` AAB imzalı olmalıdır.

1. Keystore üret:

```bash
cd android
keytool -genkeypair -v -keystore app/keystore/upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 9125
cd ..
```

2. Örnek dosyayı kopyala ve doldur:

```bash
cp android/keystore.properties.example android/keystore.properties
```

PowerShell alternatifi:

```powershell
Copy-Item android/keystore.properties.example android/keystore.properties
```

3. `android/keystore.properties` dosyasındaki alanları kendi değerlerinle güncelle.

Not:
- `android/keystore.properties` ve `*.jks` dosyaları `.gitignore` ile dışlanır.
- Upload key'i güvenli yedekle; kaybedersen yeni sürüm yayınlayamazsın.

Alternatif (Windows terminal):

```bash
npm run android:aab   # Signed AAB (keystore.properties varsa)
npm run android:apk   # Release APK
```

Not:
- Bu scriptler JDK 21'i otomatik bulup kullanmaya calisir.
- Gerekirse manuel override icin `JAVA_HOME` ile JDK 21 verebilirsin.

Üretilen AAB yolu:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

### 4) Play Console'a yükle

1. Google Play Console'da yeni uygulama oluştur.
2. Üretilen `.aab` dosyasını `Production` veya `Internal testing` track'ine yükle.
3. Store listing alanlarını doldur:
	- Uygulama adı
	- Açıklama
	- Ekran görüntüleri
	- İkon (512x512)
	- Feature Graphic (1024x500)
4. `Data safety` ve `Privacy Policy` alanlarını tamamla.
5. İç testten sonra production yayını başlat.

Hazir dokumanlar:
- `docs/play-console/internal-testing-checklist-tr.md`
- `docs/play-console/internal-testing-status-tr.md`
- `docs/play-console/release-notes-1.0.0-tr.md`
- `docs/play-console/store-listing-final-tr.md`
- `docs/play-console/store-assets-plan-tr.md`
- `docs/play-console/store-listing-template-tr.md`
- `docs/play-console/privacy-policy-template-tr.md`

### 5) Her yeni sürümde

1. Kod değişikliği yap.
2. `npm run android:sync` çalıştır.
3. `versionCode` artır.
4. Yeni AAB üret ve Play Console'a yükle.

### 6) Policy URL'leri (Play Console)

Bu repoda policy sayfalari hazir:

- `public/privacy-policy.html`
- `public/account-deletion.html`

Deploy sonrasi URL ornegi:

- `https://<your-domain>/privacy-policy.html`
- `https://<your-domain>/account-deletion.html`

Play Console'da minimum olarak `Privacy Policy URL` alanina ilk URL'yi gir.
## 🔐 Veri Güvenliği

- Veriler localde şifreli olarak saklanır (local-first)
- Supabase bilgileri tanımlanırsa hesap bazlı snapshot senkronu aktif olur
- Supabase Auth entegrasyonu yoksa table policy seviyesi proje gereksinimine göre ayrıca sertleştirilmelidir

## ⚠️ Üretim Güvenliği (Domain-Agnostic Mitigations)

Henüz özel alan adınız yoksa bile aşağıdaki kontroller maliyeti ve istismarı önler:

### 1️⃣ **Kod Tarafı: Kayıt Kapatma ve Deneme Limiti**
```bash
# .env.local içinde:
VITE_DISABLE_SIGNUP=true        # Yeni kayıtları kapat (istismar mitigation)
VITE_AUTH_MAX_ATTEMPTS=8        # Başarısız 8 denemeden sonra cooldown
VITE_AUTH_RATE_LIMIT_WINDOW_SECONDS=900  # 15 dakikalık cooldown penceresi
```

Test/demo akışı etkilenmez (`@knapsack.local` emails her zaman çalışır).

### 2️⃣ **Supabase Panel: Güvenlik Ayarları**
Aşağıdaki script tüm kontrol listesini gösterir:

```bash
$env:SUPABASE_API_TOKEN = "your_token"
$env:SUPABASE_PROJECT_ID = "your_project_id"
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/supabase-security-check.ps1
```

**Kritik ayarlar (Dashboard > Authentication):**
- ✅ Email > Confirm email: `ON`
- ✅ Email > Bot/CAPTCHA protection: `ON` (eğer mevcut ise)
- ✅ Security > Rate limits: Agresif throttle
- ✅ Billing > Spending controls: Aylık limit + uyarılar

### 3️⃣ **Supabase SQL: RLS Politikaları Sertleştirme**
Şu anda anon erişimin izin veriliyor (dev için):

```sql
-- ❌ Geçerli (UNSAFE PRODUCTION):
CREATE POLICY 'Allow anon read/write' ON knapsack_user_data
USING(true) WITH CHECK(true)

-- ✅ Hedef (AUTHENTICATED ONLY):
CREATE POLICY 'Allow authenticated users own data' ON knapsack_user_data
AS (auth.role() = 'authenticated')
USING (account_id = auth.uid())
WITH CHECK (account_id = auth.uid())
```

Update süreci:
1. SQL Editor'a gidin > `knapsack_user_data` table
2. Eski policy'i sil
3. Yenisini ekle (yukarıdaki kodu kullan)

### 4️⃣ **Emergency Cloud Sync Shutdown**
Eğer saldırı algılarsan:

```bash
# .env.local veya server env'de:
VITE_DISABLE_CLOUD_SYNC=true  # Tüm bulut senkrosu kapatılır
```

App otomatik local-first moda döner; veriler güvenli kalır.

### 5️⃣ **SMTP & Email**
Opsiyonel ama önerilen (custom domain için):

1. Dashboard > Email > Custom SMTP
2. Kendi mail sunucunuzu bağlayın
3. SPF/DKIM/DMARC kayıtlarını ayarlayın
4. Confirm-signup template uygulanmışsa (`supabase/templates/confirm-signup.html` 'e bakınız), hoş geldiniz + özellikler otomatik gider



## 🧪 Test Etme

### Unit Tests (Vitest)

```bash
# Tüm testleri çalıştır
npm test

# Watch mode (dosya değişirken otomatik çalış)
npm test -- --watch

# UI modunda testleri göster
npm test:ui

# Coverage raporu oluştur
npm test:coverage
```

Test dosyaları:
- `src/tests/ErrorBoundary.test.tsx` - Hata yönetimi testleri
- `src/tests/useFinance.test.ts` - Hook mantığı testleri
- `src/tests/utils.test.ts` - Utility fonksiyonları testleri

### E2E Tests (Playwright/Python)

```bash
# Uygulama geliştirme sunucusu açıkken genel smoke testleri çalıştır
./.venv/Scripts/python.exe -m pytest tests/e2e/test_knapsack.py -q

# Yerel hesap cihazda kalır testi
./.venv/Scripts/python.exe -m pytest tests/e2e/test_cloud_sync.py -q -k local_account

# Gerçek cloud sync smoke testi için ek olarak şunları tanımla:
# E2E_SUPABASE_TEST_EMAIL=...
# E2E_SUPABASE_TEST_PASSWORD=...
# ve .env.local içinde gerçek VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY bulunsun
./.venv/Scripts/python.exe -m pytest tests/e2e/test_cloud_sync.py -q
```

## 📝 Lisans

Bu proje açık kaynak kodludur. Detaylar için LICENSE dosyasını kontrol et.

## 🤝 Katkıda Bulunma

Pull request'leri memnuniyetle karşılarız! Önemli değişiklikler için lütfen önce issue açın.

## 💬 İletişim

Sorularınız veya önerileriniz varsa, bir issue açabilirsiniz.

---

**Vercel'de Canlı:** [knapsack-app.vercel.app](https://knapsack-app.vercel.app)
