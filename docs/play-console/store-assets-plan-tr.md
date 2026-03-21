# Google Play Store Assets Plan (TR)

Son guncelleme: 2026-03-07

Bu dosya mevcut ekran goruntulerinin envanterini ve final Play Store gorsel paketini nasil tamamlayacagini listeler.

## 1) Mevcut ekran goruntusu envanteri

| Dosya | Boyut | Durum | Onerilen kullanim |
|---|---:|---|---|
| `ss_home.png` | 1410x2782 | En uygun mevcut gorsel | 1. screenshot / hero ekran |
| `ss_home2.png` | 1400x1504 | Kullanilabilir referans | Ozet / kart alanlari icin referans |
| `ss_home_data.png` | 1400x1478 | Kullanilabilir referans | Ozet veri gorunumu |
| `ss_tx.png` | 1411x900 | Yatay, final icin zayif | Islem listesi referansi |
| `ss_tx_data.png` | 1400x900 | Yatay, final icin zayif | Islem detay referansi |
| `ss_assets.png` | 1412x900 | Yatay, final icin zayif | Varliklar sayfasi referansi |
| `ss_assets2.png` | 1400x900 | Yatay, final icin zayif | Varliklar alternatif referansi |
| `ss_assets_data.png` | 1400x900 | Yatay, final icin zayif | Varlik verisi referansi |
| `ss_analytics.png` | 1412x900 | Yatay, final icin zayif | Analitik ekran referansi |
| `ss_analytics2.png` | 1400x1183 | Orta uygunluk | Analitik alternatif referansi |
| `ss_settings.png` | 1411x900 | Yatay, final icin zayif | Ayarlar referansi |
| `ss_settings2.png` | 1400x1248 | Orta uygunluk | Ayarlar alternatif referansi |
| `ss_after_wallet.png` | 1400x900 | Yatay, final icin zayif | Varlik eklendikten sonraki durum |

## 2) Bugun eldeki dosyalarla en mantikli siralama

Eger hemen gecici bir siralama yapmak gerekirse:

1. `ss_home.png`
2. `ss_home2.png`
3. `ss_analytics2.png`
4. `ss_assets2.png`
5. `ss_settings2.png`

Bu set gecici kullanima uygundur ama production sayfasi icin ideal degildir.

## 3) Final Play Store icin dogru hedef set

Google Play phone screenshots icin en iyi sonuc:

- Tek cihaz tipi gorunumu
- Tutarli oran
- Tercihen portrait / dikey ekranlar
- Browser chrome veya masaustu cercevesi olmadan, dogrudan uygulama ekranlari

Final sete alinmasi gereken ekran sirası:

1. Ana sayfa / genel bakiye ve ozet
2. Islemler / gelir-gider-transfer listesi
3. Varliklar / hesap-cuzdan dagilimi
4. Analitik / grafik ve kategori dagilimi
5. Sabit giderler veya takvim gorunumu
6. Ayarlar / ozellestirme ve veri yonetimi

## 4) Yeniden cekilmesi onerilen ekranlar

Su ekranlari Android uygulama icinden yeniden cek:

- Home
- Transactions
- Assets
- Analytics
- Expenses veya Calendar
- Settings

Onerilen teknik hedef:

- 1080x1920 veya benzeri portrait capture
- Tam ekran uygulama gorunumu
- Bildirim cubugu kalabilir, tarayici cubugu olmamali
- Gercek veriye benzeyen dolu ekranlar tercih edilmeli

## 5) Feature graphic brief (1024x500)

Hazirlanacak feature graphic icin yon:

- Baslik: `Finansini tek yerde yonet`
- Alt metin: `Gelir, gider, varlik ve sabit harcamalar icin sade takip`
- Gorsel dil: koyu arka plan + indigo vurgu + 2 veya 3 cihaz ekran kirpmasi
- Ekran secimi: Home + Analytics + Assets

## 6) Final asset checklist

- [ ] 512x512 icon export
- [ ] 1024x500 feature graphic export
- [ ] En az 4 portrait phone screenshot export
- [ ] Dosya isimleri duzenlendi
- [ ] Play Console'a yukleme sirası netlestirildi
