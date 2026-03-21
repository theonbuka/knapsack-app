# Google Play Internal Testing Status (TR)

Son guncelleme: 2026-03-07

## 1) Yayin paketi durumu

- [x] `npm run android:aab` basarili calisti.
- [x] Cikti dosyasi mevcut: `android/app/build/outputs/bundle/release/app-release.aab`
- [x] Mevcut `package.json` surumu: `1.0.0`
- [x] Android `versionCode` otomatik uretim mantigi aktif (`1.0.0` -> `10000`)

Ek bilgi:

- AAB dosya boyutu: `3,289,435` byte
- Son olusma zamani: `2026-03-07 05:00`

## 2) Google Play Console - Uygulama olusturma

- [ ] Play Console'da yeni app acildi
- [ ] App name / dil / app-game / free-paid secimleri yapildi
- [x] Package name dogru: `com.theonbuka.knapsack`

## 3) Internal testing release

- [ ] `Testing > Internal testing` acildi
- [ ] `.aab` yuklendi
- [x] Release notes hazir: `docs/play-console/release-notes-1.0.0-tr.md`
- [ ] Testers listesi eklendi
- [ ] `Review release` ve `Start rollout to internal testing` tamamlandi

## 4) Store listing minimumlari

- [x] Kisa aciklama hazir: `docs/play-console/store-listing-final-tr.md`
- [x] Tam aciklama hazir: `docs/play-console/store-listing-final-tr.md`
- [ ] App icon (512x512) final export hazir degil
- [ ] Feature graphic (1024x500) final export hazir degil
- [ ] Telefon ekran goruntusu seti final export hazir degil

Not:

- Ekran goruntusu siralama ve yeniden cekim plani hazir: `docs/play-console/store-assets-plan-tr.md`

## 5) Policy ve beyan alanlari

- [ ] App content zorunlu adimlari tamamlanmadi
- [ ] Data safety formu doldurulmadi
- [ ] Privacy Policy URL canli domaine deploy edilip Console'a girilmedi
- [ ] Content rating formu doldurulmadi
- [ ] Target audience secilmedi

Hazir olanlar:

- [x] Gizlilik politikasi sayfasi var: `public/privacy-policy.html`
- [x] Hesap silme bilgilendirme sayfasi var: `public/account-deletion.html`
- [x] Uygulama icinde veri silme akisi mevcut: `Ayarlar > Veri Yonetimi > Tum Verileri Sil`

## 6) Teknik dogrulama

- [ ] Test kullanicisi davet linkiyle surumu gormedi
- [ ] AAB store uzerinden kurulup dogrulanmadi
- [x] Temel login / ana akislar smoke testte calisti
- [x] Smoke testte fatal crash / ANR gozlenmedi

## 7) Bir sonraki kesin adimlar

1. Play Console'da app olustur
2. `store-listing-final-tr.md` icindeki metinleri yapistir
3. Support e-postasi ve canli privacy URL ekle
4. Icon / feature graphic / screenshot setini tamamla
5. `app-release.aab` yukle ve Internal testing rollout baslat
