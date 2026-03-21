# Google Play Internal Test Checklist (TR)

Bu kontrol listesiyle AAB dosyanizi Internal testing'e guvenli sekilde cikarabilirsiniz.

## 1) Yayin paketini hazirla

- [ ] `npm run android:aab` basarili calisti.
- [ ] Cikti dosyasi mevcut: `android/app/build/outputs/bundle/release/app-release.aab`
- [ ] `package.json` icindeki `version` bir onceki surumden buyuk.
- [ ] Android `versionCode` otomatik uretilen yeni surume karsilik geliyor.

## 2) Google Play Console - Uygulama olusturma

- [ ] Play Console'da yeni app acildi.
- [ ] App name, default dil, app/game ve free/paid secimleri yapildi.
- [ ] Package name: `com.theonbuka.knapsack` ile uyumlu.

## 3) Internal testing surumu

- [ ] `Testing > Internal testing` acildi.
- [ ] `Create new release` ile `.aab` yuklendi.
- [ ] Release notes eklendi.
- [ ] Testers listesi (eposta) eklendi.
- [ ] `Review release` ve `Start rollout to internal testing` tamamlandi.

## 4) Store listing minimumlari

- [ ] Kisa aciklama
- [ ] Tam aciklama
- [ ] Uygulama ikonu (512x512)
- [ ] Feature graphic (1024x500)
- [ ] En az 2 telefon ekran goruntusu

Ipucu: Metin taslaklari icin `store-listing-template-tr.md` dosyasini kullanin.

## 5) Policy ve beyan alanlari

- [ ] App content bolumundeki tum zorunlu adimlar tamamlandi.
- [ ] Data safety formu dolduruldu.
- [ ] Privacy Policy URL eklendi.
- [ ] Content rating formu tamamlandi.
- [ ] Target audience secildi.

## 6) Internal test dogrulama

- [ ] Test kullanicisi davet linkiyle surumu gordu.
- [ ] APK/AAB kurulumu basarili.
- [ ] Login/ana akislar calisiyor.
- [ ] Crash / ANR gozlenmiyor.

## 7) Production'a gecis (testten sonra)

- [ ] Internal feedback duzeltmeleri merge edildi.
- [ ] `package.json` surumu artirildi.
- [ ] Yeni AAB yuklendi.
- [ ] `Production` rollout asamali baslatildi (ornek: %10 -> %50 -> %100).
