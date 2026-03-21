# Knapsack Due Diligence Raporu

Bu rapor, projeyi bir yazılım satın alıcısı veya ürün yatırımcısı gibi değerlendirerek hazırlanmıştır.

## 1. Yönetici Özeti

Knapsack, sıradan bir kişisel finans CRUD uygulamasından daha güçlü bir ürün hissi veriyor. Görsel dil, ürün karakteri, local-first yaklaşım, premium katman fikri ve dağıtım disiplini olumlu. Buna karşılık ürünün dış yüzeyi, altyapı sertliğinin biraz önüne geçmiş durumda.

Kısa karar:

- Hazır satılacak finans ürünü olarak: henüz erken.
- Güçlü bir MVP ve ürünleşmeye yakın varlık olarak: değerli.
- En mantıklı satın alma pozisyonu: tasarım ve ürün yönü güçlü, ama güvenlik, sync ve entitlement sertleştirmesi gerektiren bir varlık.

## 2. Genel Karar

### Tavsiye

- Şu anki haliyle tam olgun ürün fiyatlamasıyla alınması önerilmez.
- Ürünleşme sprinti planıyla, teknik riskler fiyat görüşmesine dahil edilerek alınabilir.

### Satın Alma Notu

- Ürün hissi: güçlü.
- Teknik borç: yönetilebilir ama kritik alanlarda yoğun.
- Ticari anlatı: ikna edici.
- Güven modeli: yeniden ele alınmalı.

## 3. Puan Kartı

| Alan | Puan | Not |
|------|------|-----|
| Ürün fikri ve konumlama | 8/10 | Premium içgörü katmanı anlamlı ve farklılaştırıcı |
| Görsel kalite ve marka hissi | 8/10 | Sıradan finans dashboard kalıplarından daha güçlü |
| Kullanıcı deneyimi | 7/10 | Akışlar güçlü, fakat bazı yüzeylerde yoğunluk fazla |
| Mimari yön | 7/10 | Local-first + opsiyonel sync mantıklı |
| Güvenlik ve kimlik modeli | 4/10 | Client-side güven modeline fazla yaslanıyor |
| Bulut senkron güvenilirliği | 4/10 | Kimlik uyumu ve oturum stratejisi net değil |
| Monetizasyon hazırlığı | 6/10 | Premium hikâye var, ödeme otoritesi eksik |
| Test ve release güvencesi | 5/10 | Bazı faydalı testler var, ama release gate zayıf |
| Operasyon ve deploy disiplini | 7/10 | Vercel, Android ve dokümantasyon tarafı olumlu |

### Ağırlıklı Sonuç

- Yaklaşık genel skor: 6.2/10
- Sınıf: güçlü MVP / pre-hardening ürün

## 4. Güçlü Yanlar

### 4.1 Ürün yönü doğru

- Local-first finans takibi mantıklı bir çekirdek sunuyor.
- Premium katman, ürünün doğal akışına eklenmiş; sonradan yapıştırılmış hissi vermiyor.
- Renewal radar, anomaly watch ve executive brief, fark yaratabilecek premium modüller.

### 4.2 Tasarım kalitesi yüksek

- Görsel sistem tutarlı.
- Landing, Home ve Analytics sıradan dashboard kalıplarının üstünde bir ürün hissi veriyor.
- Tipografi, spacing, motion ve kart dili genel olarak olgun görünüyor.

### 4.3 Teknik yapı tamamen dağınık değil

- Deploy, Android sync ve release scriptleri düşünülmüş.
- Supabase entegrasyonu gelişi güzel değil; bilinçli bir yön var.
- Route, feature ve premium ayrımı okunabilir bir şekilde yapılandırılmış.

### 4.4 Dokümantasyon kültürü var

- Play Store, release readiness ve legal sayfa tarafında ciddi ilerleme var.
- Ürün envanteri ve smoke checklist gibi operasyonel dokümanlar mevcut.

## 5. En Kritik Riskler

### 5.1 Bulut senkron ile auth kimliği çakışıyor

- Uygulama içi account kimliği ile Supabase RLS beklentisi aynı modele dayanmıyor.
- Sync özelliği kullanıcıya görünür şekilde sunulsa da üretim güvenilirliği şüpheli.
- Bu, alıcı açısından en önemli mimari risklerden biri.

### 5.2 Güvenlik iddiası abartılı kalıyor

- Secure storage yaklaşımı istemci tarafında çözülüyor.
- Şifreleme anahtarı yine istemci tarafında erişilebilir.
- Salt’sız hash yaklaşımı finans uygulaması standardı için düşük kalıyor.

### 5.3 Premium yetkilendirme tam server-authoritative değil

- Entitlement akışı kısmen frontend tarafında çözümleniyor.
- Bu, premium ürün satışı için ticari ve teknik risk üretir.

### 5.4 Ürün vaadi ile gerçek yüzey tam örtüşmüyor

- Transfer takibi dokümantasyonda güçlü anlatılmış, ama ana kullanım yüzeyinde görünür değil.
- Bu tip farklar, alıcı güvenini hızlı düşürür.

## 6. Boğucu ve Gereksiz Taraflar

### Gereksiz özellik sorunu

Projede tamamen gereksiz bir özellik yığını yok. Sorun daha çok aynı hikâyenin fazla sayıda yüzeyde tekrarlanması.

### Boğuculuk nerede oluşuyor

- Landing ekranı hem auth formu, hem satış ekranı, hem premium tanıtımı gibi davranıyor.
- Home ekranı dashboard ile premium teaser arasında bölünüyor.
- Analytics ekranı zaten veri yoğunken premium kartlarla daha da doluyor.
- Settings ekranı hesap ve veri yönetimi yerine kısmen ikinci bir analitik yüzeyine dönüşüyor.

### Sonuç

- Özellik fazlalığı yok.
- Mesajlaşma ve yerleşim fazlalığı var.
- Ürün sadeleştirilirse daha pahalı ve daha güvenilir görünür.

## 7. Teknik Kalite Değerlendirmesi

### İyi taraflar

- Kod tabanı tamamen dağınık değil.
- Premium insight mantığı ayrı utility katmanına alınmış.
- Sayfa bazlı davranış testleri ve bazı util testleri doğru yöne işaret ediyor.

### Zayıf taraflar

- E2E testler kırılgan ve metin bağımlı.
- Kritik iş kuralları için server otoritesi yeterince güçlü değil.
- Sync ve auth arası yetki modeli tam kapanmamış.
- Güvenlik söylemi ile gerçek teknik uygulama arasında boşluk var.

## 8. Ticari Değerlendirme

### Güçlü ticari taraflar

- Premium anlatı temelsiz değil; ürün içinden çıkıyor.
- Ücretsiz ve premium ayrımı kullanıcıya anlaşılır biçimde sunulabiliyor.
- Mobil paketleme düşünülmüş olması artı puan.

### Zayıf ticari taraflar

- Gerçek ödeme altyapısı görünür biçimde oturmamış.
- Premium hak yönetimi tam server-side değil.
- Landing ekranı fazla anlatıyor; conversion açısından netlik kaybı yaratabilir.

## 9. Satın Alma Senaryosu

### Senaryo A: Hızlı yeniden markalama ve satış

- Tavsiye: hayır.
- Sebep: güvenlik, sync ve entitlement sertleştirmesi olmadan risk yüksek.

### Senaryo B: 2-4 haftalık hardening sonrası piyasaya çıkarma

- Tavsiye: evet, mantıklı.
- Sebep: ürün hissi ve tasarım kalitesi bu yatırımı destekliyor.

### Senaryo C: Teknoloji ve ürün yönü için ekip içi satın alma

- Tavsiye: evet.
- Sebep: temel fikir, görsel kalite ve ürün omurgası değerli.

## 10. Son Hüküm

Knapsack, iyi görünmeye çalışan boş bir demo değil. Gerçek ürün aklı olan, tasarımsal olarak güçlü, fakat güvenlik ve altyapı tarafında sertleştirilmesi gereken bir MVP.

En doğru tanım:

- Satın alınabilir bir prototip değil.
- Ürünleşmeye çok yakın, tasarım gücü yüksek bir çekirdek ürün.

En kritik sonraki adım:

1. Auth, sync ve premium otoritesini server-first hale getirmek.
2. Ürün mesajlaşmasını sadeleştirmek.
3. Dokümantasyon ile gerçek özellik yüzeyini birebir hizalamak.