# Release Readiness Report (TR)

Son guncelleme: 2026-03-07

## Ozet

- Google Play icin teknik paketleme durumu: buyuk olcude hazir.
- Apple App Store icin durum: hazir degil.

## Google Play - Tamamlananlar

- Capacitor Android projesi mevcut.
- `applicationId`: `com.theonbuka.knapsack`
- Signed release konfigurasyonu mevcut (`android/keystore.properties` ile).
- Release AAB uretimi dogrulandi.
- Gizlilik Politikasi sayfasi hazir: `/privacy-policy.html`
- Hesap silme bilgilendirme sayfasi hazir: `/account-deletion.html`
- Uygulama icinde veri silme akisi mevcut (`Ayarlar > Veri Yonetimi > Tum Verileri Sil`).
- Android manifest finance app icin sertlestirildi:
  - backup kapali
  - cleartext trafik kapali

## Google Play - Hala Manuel Tamamlanacaklar

- Play Console uygulama olusturma
- Store listing metinleri
- 512x512 Play icon yukleme
- 1024x500 feature graphic yukleme
- Telefon ekran goruntulerini Play Console formatinda yukleme
- Data Safety formu doldurma
- Content rating formu doldurma
- Target audience secimi
- Privacy Policy URL olarak deploy edilmis adresi girme
- Internal testing rollout ve tester daveti
- Her yeni surumde `versionCode` artirma

## Dikkat Edilecek Teknik Noktalar

- Release build icin JDK 21 kullanilmali.
- `versionName` artik `package.json` icindeki `version` alanindan okunuyor.
- `versionCode` artik semver tabanli otomatik uretiliyor (`1.2.3` -> `10203`).
- Uygulama ici gorunen surum metinleri ile Android surum numaralari tutarli tutulmali.
- Production ortaminda Google Sign-In kullanilacaksa `VITE_GOOGLE_CLIENT_ID` deploy ortaminda tanimli olmali.
- Bulut senkron kullanilacaksa Supabase env ve policy ayarlari production icin gozden gecirilmeli.

## Apple App Store - Eksikler

- `ios/` projesi yok.
- Xcode signing/provisioning yok.
- App Store Connect kaydi yok.
- iOS screenshot ve privacy nutrition hazirliklari yok.
- iOS build bu Windows ortaminda yapilamaz; macOS + Xcode gerekir.

## Sonuc

- Sadece Google Play hedefleniyorsa: teknik olarak yayin hazirligina cok yakin.
- Hem Google Play hem Apple App Store hedefleniyorsa: iOS tarafi ayri proje asamasi gerektiriyor.