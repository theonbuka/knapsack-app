# Knapsack (Payonar) — Ürün Roadmap

> Son güncelleme: Mart 2026 · Platform: Web + Android (Capacitor) · Hedef: App Store yayını

---

## ✅ Tamamlananlar

### Kimlik & Erişim
- [x] E-posta / şifre ile yerel hesap oluşturma ve giriş
- [x] Google OAuth (Supabase redirect tabanlı)
- [x] Demo mod (hesap açmadan uygulama turu)
- [x] Şifre sıfırlama akışı
- [x] E-posta doğrulama akışı
- [x] Çıkış yapma ve oturum temizleme
- [x] İstemci taraflı auth rate-limiting (8 deneme → 15 dk bekleme)
- [x] Çok hesap desteği (account-scoped storage)

### Veri & Senkronizasyon
- [x] Local-first mimari (internet olmadan tam çalışma)
- [x] Supabase bulut senkronu (opsiyonel)
- [x] Entity tabanlı tablo yapısı (transactions, wallets, expenses, prefs, categories)
- [x] Anonim → giriş sonrası veri birleştirme
- [x] AES-256 şifreli local storage
- [x] Canlı TRY/USD/EUR/Altın kur çekme (Frankfurter API, 1 saatlik cache)

### Ana Sayfa & Dashboard
- [x] Net değer kartı (varlık − borç)
- [x] Varlık dağılım halkası (Nakit / Döviz / Altın)
- [x] Aylık tahmini gider projeksiyonu
- [x] Canlı kur ticker (USD, EUR, Altın)
- [x] Tasarruf hedefi ilerleme çubuğu
- [x] Premium: günlük harcama hızı, odak kategori, renewal radar, anomaly watch

### İşlem Yönetimi
- [x] Gelir / gider ekleme, düzenleme, silme
- [x] Hızlı ekleme (FAB bottom sheet)
- [x] Arama, tür/ay/yıl bazlı filtreleme
- [x] Kategori eşleme, cüzdan seçimi, not alanı
- [x] Çoklu para birimi desteği (TRY, USD, EUR, Altın)

### Varlıklar & Borçlar
- [x] Nakit, banka, kredi kartı, altın, dolar hesabı
- [x] Kredi kartı borcu ve limit takibi (KMH dahil)
- [x] Taksitli kredi modeli (PMT hesaplama)
- [x] Varlık kartlarında TRY eşdeğeri gösterimi

### Sabit Giderler
- [x] Kira, fatura, abonelik kategorileri
- [x] 27+ servis preset (Netflix, Spotify, YouTube vb.)
- [x] Aylık ödendi/ödenmedi takibi
- [x] Son ödeme günü takibi

### Analitik
- [x] Gelir / Gider / Birikim KPI'ları
- [x] Son 7 gün harcama grafiği
- [x] Kategori bazlı gider dağılımı
- [x] En yoğun harcama günü, hafta sonu payı
- [x] Premium: tahmin masası, executive brief, spending anomaly

### Takvim
- [x] Aylık grid görünümü
- [x] Gün bazlı harcama yoğunluğu
- [x] Gün detay modalı

### Ayarlar & Özelleştirme
- [x] Tema rengi (5 seçenek) ve karanlık/aydınlık mod
- [x] Para birimi seçimi (TRY / USD / EUR)
- [x] Aylık tasarruf hedefi
- [x] Kategori yönetimi (ekle / düzenle / sil / emoji / renk / limit)
- [x] Dil değiştirme (TR / EN)
- [x] JSON veri dışa aktarma (Premium)
- [x] Hesap silme akışı

### Platform & Altyapı
- [x] Web deploy (Vercel)
- [x] Android paketleme (Capacitor 8)
- [x] Google Play release dokümanları
- [x] i18n (Türkçe + İngilizce)
- [x] Zod tabanlı form validasyonu
- [x] React Error Boundary
- [x] Unit testler (Vitest, 12 test suite)
- [x] RLS politikaları (Supabase)

---

## 🚧 Eksik / Yarım Kalanlar

### Kritik (App Store öncesi)
- [ ] **iOS dizini ve Xcode projesi** — `npx cap add ios` henüz çalıştırılmadı
- [ ] **Apple Privacy Manifest** — iOS 17+ zorunluluğu (`PrivacyInfo.xcprivacy`)
- [ ] **iOS push entitlement** — bildirimler için gerekli
- [ ] **App Store Connect kurulumu** — bundle ID, sertifika, provisioning profile
- [ ] **App Store ekran görüntüleri** — 6.7" ve 5.5" iPhone boyutları zorunlu
- [ ] **TestFlight dağıtımı** — internal test hattı kurulmamış
- [ ] **Kategori limit uygulaması** — limit tanımlanıyor ama işlem eklerken kontrol edilmiyor
- [ ] **Ödeme entegrasyonu** — Stripe/Iyzico yok; premium manuel aktifleştiriliyor

### Önemli
- [ ] **Tekrarlayan gelir kaydı** — maaş her ay elle giriliyor
- [ ] **Push / yerel bildirimler** — ödeme günü hatırlatmaları yok (Capacitor hazır ama entegre değil)
- [ ] **CSV/Excel içe aktarma** — banka ekstresini içe alma yok
- [ ] **PDF/CSV dışa aktarma** — JSON var, formatlanmış rapor yok
- [ ] **Transfer işlemi** — cüzdanlar arası para transferi modeli yok
- [ ] **Kural motoru** — otomatik kategorileme yok
- [ ] **Yinelenen işlem tespiti** — aynı işlem birden fazla girilebiliyor
- [ ] **E2E test otomasyonu** — Playwright scriptleri CI'ye bağlı değil
- [ ] **Hata izleme servisi** — Sentry veya benzeri entegrasyon yok

### İyileştirme
- [ ] **Birikim kasaları** — çoklu hedef ve para ayırma
- [ ] **Net değer tarihçesi** — geçmişe dönük grafik
- [ ] **Abonelik anomali tespiti** — unused subscription uyarısı
- [ ] **Erişilebilirlik (a11y)** — bazı butonlarda aria-label eksik
- [ ] **Onboarding akışı** — yeni kullanıcı için boş durum rehberi
- [ ] **Şifre değiştirme** — ayarlarda şifre güncelleme ekranı yok
- [ ] **2FA** — iki aşamalı doğrulama

---

## 💡 İyileştirme Alanları

| Alan | Mevcut Durum | Öneri |
|------|-------------|-------|
| Kategori limiti | Tanımlanıyor, UI'da gösterilmiyor | İşlem eklerken limit doluysa uyarı göster |
| Renewal radar | Hesaplanıyor, dashboard'da küçük kart | Tam ekran yaklaşan ödemeler takvimi |
| Anomaly detection | Premium hesaplıyor | Bildirim + vurgulu kart ile öne çıkar |
| Hata logu | `console.error` | Sentry veya Supabase Edge Log entegrasyonu |
| Performans | 516 KB ana bundle | Daha agresif code splitting |
| StyleLab sayfaları | Demo/test amaçlı, route'da var | Production'dan çıkar veya settings altına al |
| Demo seed verisi | Statik | Gerçekçi ve dinamik demo verisi |

---

## 📱 App Store Yayın Kontrol Listesi

### Android (Google Play) ✅ Neredeyse Hazır
- [x] Capacitor Android projesi
- [x] Keystore yapısı (örnek dahil)
- [x] AAB üretim scripti
- [x] Play Console dokümanları
- [ ] Son sürüm için release notes güncelleme
- [ ] Production signing keystore kurulumu

### iOS (App Store) 🔴 Başlanmadı
- [ ] `npx cap add ios` → Xcode projesi oluştur
- [ ] Apple Developer Program üyeliği ($99/yıl)
- [ ] App Store Connect'te uygulama kaydı
- [ ] Bundle ID: `com.theonbuka.knapsack`
- [ ] iOS uygulama ikonları (1024x1024 + tüm boyutlar)
- [ ] Launch Screen (Splash screen)
- [ ] `PrivacyInfo.xcprivacy` dosyası
- [ ] Supabase OAuth için URL scheme: `com.theonbuka.knapsack://auth`
- [ ] Info.plist kamera/bildirim izinleri (gerekiyorsa)
- [ ] Certificates & Provisioning Profiles
- [ ] TestFlight internal test
- [ ] App Store ekran görüntüleri (6.7", 5.5")
- [ ] App Store açıklaması (TR + EN)
- [ ] App Review submission

---

## 🗺️ Öncelik Sırası (Sonraki 3 Ay)

### Faz 1 — App Store Hazırlığı (Nisan 2026)
1. iOS dizini oluştur ve Xcode kurulumu
2. Privacy Manifest dosyasını ekle
3. TestFlight hattı kur
4. Kategori limit uygulamasını aktifleştir
5. Ödeme entegrasyonu (Iyzico veya Stripe) — premium gelir modeli

### Faz 2 — Temel Eksikler (Mayıs 2026)
6. Tekrarlayan gelir kaydı
7. Push / yerel bildirimler (ödeme hatırlatmaları)
8. CSV içe aktarma (banka ekstresi)
9. PDF/CSV dışa aktarma
10. Yinelenen işlem tespiti

### Faz 3 — Derinlik & Büyüme (Haziran 2026)
11. Transfer işlemi (cüzdanlar arası)
12. Kural motoru (otomatik kategorileme)
13. Birikim kasaları (çoklu hedef)
14. Net değer tarihçesi grafiği
15. Sentry / hata izleme entegrasyonu
16. E2E test CI otomasyonu
17. Onboarding akışı

---

## 🐛 Bilinen Hatalar

| # | Sayfa | Hata | Durum |
|---|-------|------|-------|
| 1 | `/daily-expenses` | `t` translation fonksiyonu ile transaction loop değişkeni çakışıyordu → `t is not a function` | ✅ Düzeltildi (Mart 2026) |
| 2 | Tüm uygulama | `knapsack_transactions` entity tabloları DB'de eksikti | ✅ Düzeltildi (Mart 2026) |

---

*Bu roadmap aktif geliştirme sürecinde güncellenmektedir.*
