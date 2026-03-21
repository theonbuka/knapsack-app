# Knapsack Ürün Envanteri ve Roadmap

Bu doküman, uygulamada şu an canlı olan özellikleri ve ürünle uyumlu, uygulanabilir aday özellik havuzunu tek yerde toplar.

Not: "Eklenebilecek bütün özellikler" ifadesi pratikte sonsuz olduğu için burada Knapsack'ın mevcut mimarisi, hedef kullanıcı kitlesi ve premium modeliyle uyumlu en geniş mantıklı aday havuzu listelenmiştir.

## 1. Canlı Özellikler

### 1.1 Hesap, kimlik ve erişim

- Yerel hesap oluşturma ve giriş: ad, soyad, e-posta ve şifre ile cihaz bazlı hesap akışı.
- Google ile giriş: Supabase redirect tabanlı OAuth akışı.
- Google fallback akışı: popup engeline düşmeyen tam sayfa Google OIDC yönlendirmesi.
- Demo ile dene akışı: uygulamayı hesap oluşturmadan görmek için hazır deneme girişi.
- Çıkış yap akışı: yerel oturumu temizleyip giriş ekranına dönme.
- Ücretsiz ve premium plan ayrımı: kullanıcı oturumunda plan etiketi okunur ve arayüz buna göre davranır.
- Hesap türü görünürlüğü: yerel hesap, Google hesabı, bulut senkron durumu ve plan etiketi ayarlarda gösterilir.

### 1.2 Veri katmanı ve senkronizasyon

- Local-first mimari: temel veri modeli internet olmasa da cihazda çalışır.
- Hesap bazlı storage scope: farklı kullanıcı verileri birbirine karışmadan tutulur.
- Opsiyonel Supabase bulut senkronu: aynı hesabın snapshot verisi cihazlar arasında taşınabilir.
- Otomatik reconcile mantığı: yerel snapshot ile bulut snapshot zaman damgasına göre uzlaştırılır.
- Bulut temizleme: hesap/veri silme akışında Supabase snapshot temizliği denenir.
- Kur bazlı veri gösterimi: depolama TRY tabanlı tutulur, görüntüleme seçilen para birimine çevrilir.
- Canlı kur çekme: TRY bazlı USD/EUR dönüşümleri dış servisle güncellenir, fallback oranlar korunur.

### 1.3 Ana sayfa ve dashboard

- Canlı kur ticker alanı: USD, EUR ve altın bilgisi üst şeritte akar.
- Net değer kartı: toplam varlık, toplam borç ve net fark tek bakışta gösterilir.
- Varlık dağılım halkası: nakit, döviz ve altın dağılımı görselleştirilir.
- Aylık tahmini gider kartı: ayın gidişine göre ay sonu harcama projeksiyonu üretilir.
- Aylık içgörü metni: harcama temposuna göre kısa yönlendirme mesajı gösterilir.
- Tasarruf hedefi ilerleme çubuğu: aylık hedef varsa ana sayfada ilerleme olarak görünür.
- Premium günlük harcama hızı: ay içi tempo günlük bazda hesaplanır.
- Premium ay sonu tamponu: gelir korunursa beklenen kalan tampon gösterilir.
- Premium odak kategorisi: ay içindeki en baskın gider kategorisi vurgulanır.
- Premium renewal radar: yaklaşan abonelik ve sabit ödeme yükleri listelenir.
- Premium anomaly watch: sıra dışı büyük işlem veya kategori sıçraması öne çıkarılır.

### 1.4 İşlem yönetimi

- Gelir, gider ve transfer işlemi ekleme.
- İşlem başlığı, tutar, kategori, para birimi ve not alanları ile kayıt oluşturma.
- İşlem listeleme ve geçmiş görünümü.
- Metin arama ile işlem bulma.
- Tür bazlı filtreleme.
- Ay bazlı filtreleme.
- Yıl bazlı filtreleme.
- İşlem düzenleme modalı.
- İşlem silme akışı.
- Kategori haritası üzerinden işlem-kategori eşleme.

### 1.5 Sabit giderler ve abonelikler

- Sabit gider, fatura ve abonelik sekmeli yapı.
- Tekrarlayan ödeme kaydı ekleme.
- Servis preset'leri ile hızlı kayıt oluşturma.
- Son ödeme günü takibi.
- Aylık ödendi/ödenmedi durumu takibi.
- Yaklaşan ödeme yükünün premium renewal radar tarafına akması.
- Hızlı ekleme akışının gider ekranını tetikleyebilmesi.

### 1.6 Varlık, borç ve finansal enstrümanlar

- Nakit, banka, cüzdan ve dijital varlık girişleri.
- Döviz bazlı varlık takibi.
- Altın bazlı varlık takibi.
- Borç kaydı tutma.
- Kredi kartı benzeri borç kalemleri tutma.
- KMH benzeri borç kalemleri tutma.
- Taksitli kredi/ödeme planı modeli.
- PMT tabanlı ödeme hesaplama yardımcıları.
- Kalan taksit ve borç görünürlüğü.
- Varlık kartlarında zengin görsel özet alanları.

### 1.7 Analitik ve karar destek

- Bu ay gelir KPI'ı.
- Bu ay gider KPI'ı.
- Birikim KPI'ı.
- Geçen aya göre değişim yüzdesi.
- Birikim oranı progress görünümü.
- Son 7 gün gider grafiği.
- Ortalama gider fişi hesabı.
- En büyük gider işlemi görünümü.
- En yoğun harcama günü görünümü.
- Haftanın günlerine göre harcama dağılımı.
- Hafta sonu harcama payı hesabı.
- Kategori bazlı gider yoğunluğu.
- Premium tahmin masası: günlük hız, ay sonu projeksiyonu ve kategori yoğunluğu.
- Premium renewal radar: kritik ödeme trafiği özeti.
- Premium anomaly izleme: işlem ve kategori sapmaları.
- Premium executive brief başlığı: ay özeti kısa anlatım halinde hazırlanır.

### 1.8 Takvim deneyimi

- Aylık finans özeti kartları.
- Gün bazlı harcama yoğunluğu görselleştirmesi.
- Takvim grid görünümü.
- Seçili para birimine göre günlük toplamların gösterimi.
- Gün detay modalı.
- Tarih bazlı işlem inceleme deneyimi.

### 1.9 Ayarlar ve özelleştirme

- Tema rengi seçimi.
- Para birimi sembolü seçimi: TRY, USD, EUR.
- Aylık tasarruf hedefi belirleme.
- Kategori yönetimi: ekleme.
- Kategori yönetimi: düzenleme.
- Kategori yönetimi: silme.
- Kategori emojisi belirleme.
- Kategori rengi belirleme.
- Kategori bütçe limiti tanımlama.
- Hesap bilgi kartı.
- Premium durum kartı ve canlı özellik özeti.
- Premium yükseltme bağlantısı veya Supabase abonelik bilgilendirmesi.
- Gizlilik politikası bağlantısı.
- Hesap silme bilgilendirmesi bağlantısı.
- Uygulama sürüm etiketi görünümü.

### 1.10 Dışa aktarma, yedek ve veri yönetimi

- Premium JSON dışa aktarma.
- Premium aylık brief dosyası indirme.
- Export sırasında tarih damgalı dosya adı üretme.
- Tüm kullanıcı verisini temizleme akışı.
- Legacy global storage anahtarları için temizleme koruması.
- Yerel veri silme ile birlikte bulut snapshot silme denemesi.

### 1.11 Premium canlı özellik seti

- Executive brief.
- Forecast desk.
- Gelişmiş veri dışa aktarma.
- Renewal alerts / renewal radar.
- Spending anomaly detection.
- Paylaşılabilir aylık premium brief metni.

### 1.12 Platform, yayın ve operasyon

- Vercel production deploy akışı.
- Production alias kullanımı.
- Supabase auth redirect güvenlik katmanı.
- Localhost redirect sızıntısına karşı production origin fallback koruması.
- Privacy policy sayfası.
- Account deletion sayfası.
- Capacitor Android paketleme altyapısı.
- Android APK/AAB üretim scriptleri.
- Google Play release dokümanları.
- İç test ve store listing dokümanları.

## 2. Uygulanabilir Aday Özellik Havuzu

### 2.1 Kısa vadede yüksek etkili çekirdek özellikler

- Kategori bazlı aylık bütçe planı.
- Zarf yöntemi ile harcama limiti yönetimi.
- Tekrarlayan gelir kaydı.
- Maaş günü ve düzenli gelir takvimi.
- Taksit takip ekranı.
- Abonelik iptal hatırlatıcıları.
- Merchant bazlı işlem gruplayıcı.
- İşlem etiket sistemi.
- Split transaction desteği.
- İade ve chargeback akışı.
- Transfer eşleme ve transfer doğrulama görünümü.
- Yinelenen işlem tespiti.
- CSV içe aktarma.
- Excel içe aktarma.
- Banka ekstresi format eşleyici.

### 2.2 Orta vadeli finans yönetimi derinliği

- Hedef bazlı birikim kasaları.
- Otomatik hedefe para ayırma kuralları.
- Borç kartopu planlayıcısı.
- Borç avalanche planlayıcısı.
- Nakit akışı runway hesabı.
- 30/60/90 günlük forecast görünümü.
- Senaryo simülasyonu: gelir düşerse ne olur.
- Senaryo simülasyonu: yeni sabit gider eklenirse ne olur.
- Net değer tarihçesi grafiği.
- Kategori limit aşımlarında canlı uyarı.
- Cüzdan bazlı performans görünümü.
- Birden fazla tasarruf hedefi yönetimi.
- Finansal milestone takibi.
- Varlık tahsis önerileri.
- Acil durum fonu takibi.

### 2.3 Premium ve analitik genişleme alanı

- Haftalık executive brief.
- E-posta ile otomatik aylık rapor gönderimi.
- PDF rapor üretimi.
- CSV rapor dışa aktarma.
- Özelleştirilebilir rapor oluşturucu.
- Yıllık finans özeti.
- Kategori trend analizi.
- Merchant trend analizi.
- Mevsimsellik tespiti.
- Harcama spike açıklaması ve öneri kartı.
- Gelir-gider dengesizliği alarmı.
- Fatura yoğunluğu skoru.
- Abonelik verimlilik skoru.
- Tasarruf potansiyeli skoru.
- Premium kullanıcıya özel benchmark görünümü.

### 2.4 Otomasyon ve akıllı yardımcılar

- Kural motoru: belirli açıklamaları otomatik kategorize etme.
- Kural motoru: belirli merchant'ları otomatik etiketleme.
- Doğal dille işlem ekleme.
- OCR ile fiş/fatura okuma.
- E-posta faturalarından veri çıkarma.
- Akıllı kategori önerisi.
- Unutulmuş abonelik tespiti.
- Yapay zekâ destekli tasarruf önerileri.
- Aylık brief için sesli özet.
- Harcama anomalisine karşı otomatik aksiyon önerisi.
- Ödeme günü yaklaşınca akıllı hatırlatma önceliklendirmesi.
- Hedef tutturmak için haftalık mini görevler.

### 2.5 İşbirliği ve çok kullanıcılı kullanım

- Aile bütçesi workspace'i.
- Eş/partner ile ortak kasa paylaşımı.
- Sadece görüntüleme yetkili paylaşım linki.
- Muhasebeci veya danışman rolü.
- Yorum bırakılabilen işlem kayıtları.
- Ortak hedefler.
- Ortak abonelik maliyeti paylaşımı.
- Birden fazla profil veya hane yönetimi.
- Çocuk/harçlık profili.
- Çok kullanıcı conflict çözüm ekranı.

### 2.6 Banka ve dış servis entegrasyonları

- Open banking entegrasyonu.
- Manuel banka hesabı bağlama sihirbazı.
- Otomatik ekstre eşleme kuralları.
- Kredi kartı statement import.
- Kripto fiyat veri kaynağı entegrasyonu.
- Alternatif kur sağlayıcı seçimi.
- Google Calendar ile ödeme günü senkronu.
- Apple Calendar ile ödeme günü senkronu.
- Stripe, Paddle veya Iyzico ile premium satın alma akışı.
- Webhook tabanlı premium aktivasyonu.
- Fatura servisleri için webhook alımı.
- Supabase Edge Functions ile arka plan işlem katmanı.

### 2.7 Mobil, masaüstü ve deneyim geliştirmeleri

- PWA kurulum akışı.
- Push notification desteği.
- Android yerel bildirimler.
- iOS paketleme ve TestFlight hattı.
- Ana ekran widget'ları.
- Biyometrik kilit.
- Uygulama içi PIN kilidi.
- Çevrimdışı kuyruk durumu görünümü.
- Erişilebilirlik geliştirmeleri.
- Çok dil desteği.
- Masaüstü kısayol komutları.
- Tablet optimize layout varyantları.

### 2.8 Güvenlik, destek ve operasyon

- İki aşamalı doğrulama.
- Cihaz ve oturum yönetimi.
- Admin premium yönetim paneli.
- Destek talebi ekranı.
- Audit log.
- Veri saklama ve retention ayarları.
- Şifre değiştirme ve hesap güvenliği ekranı.
- Şifre sıfırlama UX iyileştirmesi.
- Şifrelenmiş yerel yedek dosyası.
- Import/export sürüm uyumluluğu doğrulaması.
- Özellik bayrağı sistemi.
- Hata ve performans telemetry opt-in katmanı.

### 2.9 Büyüme ve gelir modeli özellikleri

- Ücretsiz deneme süresi.
- Promosyon kodu desteği.
- Referral sistemi.
- Öğrenci veya aile planı.
- Kurumsal/ekip planı.
- Satın alma geçmişi sayfası.
- Faturalandırma portalı.
- Uygulama içi onboarding checklist.
- Boş durum eğitim kartları.
- Premium karşılaştırma matrisi.

## 3. Önerilen Öncelik Sırası

İlk aşamada en mantıklı set:

1. Kategori bazlı bütçe planı.
2. Tekrarlayan gelir kaydı.
3. CSV/Excel içe aktarma.
4. Taksit takip ekranı.
5. PDF/CSV rapor dışa aktarma.
6. Kural motoru ile otomatik kategorileme.
7. Push notification ve ödeme hatırlatmaları.
8. Çoklu hedef ve kasa yapısı.
9. Stripe/Paddle/Iyzico premium satın alma hattı.
10. Aile bütçesi veya ortak kasa workspace'i.

## 4. Operasyon Notu

- Production alias: `https://knapsack-gamma.vercel.app`
- Production için açık redirect env değeri tanımlandı: `VITE_SUPABASE_AUTH_REDIRECT_TO=https://knapsack-gamma.vercel.app/landing`
- Redirect helper bu değeri `trim()` ile okur ve localhost değeri production'a sızarsa origin tabanlı güvenli fallback uygular.