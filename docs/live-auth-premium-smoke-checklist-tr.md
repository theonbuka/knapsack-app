# Canlı Auth ve Premium Smoke Checklist

Bu liste, production deploy sonrası canlı sitede hızlı ama güvenilir bir duman testi yapmak için hazırlanmıştır.

## 1. Güncel Production Notları

- Canlı alias: `https://knapsack-gamma.vercel.app`
- Production deploy, redirect env güncellemesinden sonra yeniden alındı.
- Production env: `VITE_SUPABASE_AUTH_REDIRECT_TO=https://knapsack-gamma.vercel.app/landing`
- Auth redirect helper environment değerini `trim()` ile okur.
- Eğer yanlışlıkla localhost redirect değeri production build'e taşınırsa helper aktif origin'e düşer.

## 2. Smoke Test Öncesi Hazırlık

- Ücretsiz test hesabı hazır olsun.
- Premium test hesabı hazır olsun.
- Google ile giriş yapılacak hesap hazır olsun.
- Gizli sekme veya Brave ile en az bir redirect testi yapılacak şekilde planla.
- Eğer premium kaydı Supabase tablosundan geliyorsa ilgili kullanıcının `knapsack_user_subscriptions` kaydı önceden doğrulanmış olsun.

## 3. Landing ve Giriş Kontrolleri

- Landing sayfası açılıyor mu.
- Mail/şifre giriş alanları görünüyor mu.
- Google ile giriş butonu görünüyor mu.
- Demo ile dene butonu çalışıyor mu.
- Kayıt ol akışı hata vermeden açılıyor mu.
- Privacy veya account deletion gibi yasal sayfa linkleri erişilebilir mi.

Beklenen sonuç:

- Sayfa boş beyaz ekran vermeden yüklenmeli.
- Google CTA görünmeli.
- Form submit akışları kullanıcıyı kilitlememeli.

## 4. Yerel Hesap Smoke Testi

- Yerel hesap ile giriş yap.
- Girişten sonra ana sayfaya yönlenildiğini doğrula.
- Çıkış yap ve tekrar landing'e dönüldüğünü doğrula.
- Aynı hesapla tekrar giriş yapıp verinin korunduğunu doğrula.

Beklenen sonuç:

- Session sonrası kullanıcı ana ekrana gelmeli.
- Çıkış akışı local state'i temizlemeli.

## 5. Google Redirect Smoke Testi

- Landing'de Google ile giriş yap butonuna bas.
- Google hesap seçici ekranına yönlenildiğini doğrula.
- Giriş tamamlanınca uygulamanın `/landing` üzerinden session'ı alıp ana akışa geçtiğini doğrula.
- Gizli sekmede veya popup engelli tarayıcıda aynı akışı tekrar et.

Beklenen sonuç:

- Popup yerine tam sayfa yönlendirme çalışmalı.
- Redirect sonrası kullanıcı oturumu uygulamaya geri bağlanmalı.
- Production origin yanlışlıkla localhost'a dönmemeli.

## 6. Ücretsiz Plan Smoke Testi

- Ücretsiz kullanıcı ile Home ekranını aç.
- Analytics ekranını aç.
- Settings ekranını aç.
- Premium kartlarının kilitli veya teaser modunda kaldığını doğrula.
- JSON export butonunun premium gerektiren uyarı verdiğini doğrula.
- Premium monthly brief indirme butonunun premium gerektiren uyarı verdiğini doğrula.

Beklenen sonuç:

- Free kullanıcı çekirdek akışları kullanabilir olmalı.
- Premium modüller yanlışlıkla açılmamalı.

## 7. Premium Plan Smoke Testi

- Premium kullanıcı ile giriş yap.
- Home ekranında premium özet kartlarını doğrula.
- Analytics ekranında premium tahmin masası, renewal radar ve anomaly watch kartlarını doğrula.
- Settings ekranında plan etiketinin Premium olduğunu doğrula.
- JSON export indirildi mi kontrol et.
- Aylık brief dosyası indirildi mi kontrol et.

Beklenen sonuç:

- Premium kullanıcı Home, Analytics ve Settings üzerinde premium davranış görmeli.
- İndirme butonları gerçek dosya üretmeli.

## 8. Veri ve Yasal Akışlar

- Privacy policy sayfası yeni sekmede açılıyor mu.
- Account deletion bilgilendirme sayfası açılıyor mu.
- Tüm verileri sil akışında onay kutusu ve son temizleme adımı doğru çalışıyor mu.
- Bulut senkron aktif hesapta veri silme sonrası tekrar girişte eski snapshot geri gelmiyor mu.

## 9. Finans Ekranı Hızlı Kontrol Listesi

- İşlem ekleme çalışıyor mu.
- İşlem düzenleme ve silme çalışıyor mu.
- Harcamalar ekranında fatura/abonelik eklenebiliyor mu.
- Assets ekranında varlık veya borç kaydı eklenebiliyor mu.
- Calendar ekranında gün detay modalı açılıyor mu.
- Kur sembolü değiştiğinde ana metrikler yeniden formatlanıyor mu.

## 10. Deploy Sonrası Teknik Doğrulama

- Vercel alias yeni deploy'a bağlı mı.
- Production env listesinde `VITE_SUPABASE_AUTH_REDIRECT_TO` görünüyor mu.
- Redirect helper mantığı gereği env değeri `trim()` ile okunuyor mu.
- Gerekirse Supabase authorize endpoint'i `redirect_to=https://knapsack-gamma.vercel.app/landing` ile tekrar kontrol et.

## 11. Hızlı Kabul Kriteri

- Landing açılıyor.
- Local login çalışıyor.
- Google redirect login çalışıyor.
- Free ve premium davranışları doğru ayrışıyor.
- JSON export ve premium brief sadece premium hesapta açılıyor.
- Yasal sayfalar erişilebilir.
- Veri silme akışı bozuk değil.