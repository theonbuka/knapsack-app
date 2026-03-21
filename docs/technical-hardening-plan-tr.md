# Knapsack Teknik Hardening Planı

Bu plan, alıcı gözüyle en kritik görülen riskleri kapatmak için hazırlanmıştır. Amaç yeni özellik eklemek değil, ürünün güvenilirliğini ve satılabilirliğini artırmaktır.

## 1. Hedef

Ürünü şu seviyeye taşımak:

- güven modeli daha savunulabilir,
- bulut senkron gerçekten çalışır,
- premium yetkileri tartışmasız şekilde doğrulanır,
- pazarlama söylemi ile gerçek davranış birebir hizalanır,
- release süreci daha az kırılgan olur.

## 2. İlk 3 Kritik Çalışma Hattı

### Hat 1: Auth, Sync ve Kimlik Otoritesini Birleştir

#### Problem

- Uygulama içi hesap anahtısı ile Supabase `auth.uid()` temelli RLS modeli tam uyuşmuyor.
- Sync, kullanıcıya açık bir değer önerisi olarak sunuluyor ama teknik otorite modeli kırılgan.

#### Hedef Mimari

- Cloud sync için tek otorite Supabase authenticated user olsun.
- `account_id` alanı daima gerçek Supabase user UUID kullansın.
- Sync işlemleri aktif Supabase session ile çalışsın.
- Local-only hesap ile cloud hesap net ayrışsın.

#### Uygulama Adımları

1. `AuthState` içine ayrı bir `supabaseUserId` alanı ekle.
2. Google ve email auth başarılarında gerçek Supabase user UUID’sini persist et.
3. `accountStorage` fonksiyonlarını iki seviyeye ayır:
   - local storage scope key
   - cloud sync identity key
4. `cloudSync.ts` içinde `account_id` olarak yalnızca `supabaseUserId` kullan.
5. Supabase session stratejisini yeniden tanımla:
   - sync gerekiyorsa session’ı hemen sign-out etme
   - local-first veri modeli korunacaksa session lifecycle açıkça yönetilsin
6. Settings ekranındaki “bulut senkron aktif” söylemini gerçek bağlantı ve sync health durumuna bağla.

#### Kabul Kriteri

- Authenticated kullanıcı cloud push yapabiliyor.
- Aynı kullanıcı ikinci cihazda cloud pull yapabiliyor.
- RLS policy ile veri yalnızca kendi satırına erişebiliyor.
- Cloud kapalı ya da başarısız ise kullanıcıya dürüst durum gösteriliyor.

#### Tahmini Efor

- 2 ila 4 gün

### Hat 2: Güvenlik ve Secret Modelini Düzelt

#### Problem

- Mevcut secure storage istemci tarafında çözülen bir gizleme katmanı gibi çalışıyor.
- Şifreleme anahtarı istemcide erişilebilir.
- Salt’sız SHA-256 parola yaklaşımı zayıf.

#### Hedef Mimari

- Yerel veriyi “tam güvenli” diye pazarlamamak.
- Kimlik ve parola otoritesini mümkün olduğunca Supabase tarafına taşımak.
- Yerel depolamayı güvenlik sınırı değil, cihaz içi rahatlık katmanı olarak görmek.

#### Uygulama Adımları

1. `SecureStorage` açıklamalarını ve ürün mesajlarını düzelt:
   - “encrypted local storage” söylemi kalsın
   - “secure” veya güvenlik iddiası daha dikkatli kurulsun
2. `VITE_ENCRYPTION_KEY` kullanımını kaldır veya yalnızca test/dev için destekle.
3. Yerel anahtarın yine localStorage içinde tutulduğu mimariyi güvenlik özelliği gibi sunmayı bırak.
4. Local login gerekiyorsa en azından:
   - salt ekle,
   - daha güçlü KDF kullan,
   - migration planı yaz
5. Mümkünse email/password akışında Supabase auth dışındaki local password modelini ikinci plana çek.
6. Güvenlik README ve ürün metinlerini teknik gerçekle hizala.

#### Kabul Kriteri

- Güvenlik söylemi ile gerçek uygulama çelişmiyor.
- Kritik oturum ve parola mantığı server-authoritative hale geliyor.
- Local storage artık yanlış beklenti yaratmıyor.

#### Tahmini Efor

- 1 ila 3 gün

### Hat 3: Premium Yetki ve Ürün Vaadini Sertleştir

#### Problem

- Premium entitlement kısmen frontend env ve client-side çözümlemeye dayanıyor.
- README ve ürün yüzeyi arasında bazı vaad farkları var.

#### Hedef Mimari

- Premium plan tek otorite olarak Supabase subscription tablosundan çözülsün.
- Frontend env whitelist yalnızca acil fallback veya admin debug modu olsun.
- Pazarlanan her özellik gerçekten görünür ve çalışır olsun.

#### Uygulama Adımları

1. `resolveSubscriptionPlan` fallback zincirini sadeleştir:
   - öncelik Supabase row
   - fallback sadece açık debug modu varsa devreye girsin
2. Premium yükseltme akışını netleştir:
   - ödeme linki
   - talep formu
   - admin onayı
   - webhook işleme
3. Transfer özelliği için karar ver:
   - gerçekten ekle
   - ya da tüm pazarlama ve README söyleminden çıkar
4. Landing’de premium anlatıyı sadeleştir:
   - auth ekranı daha kısa olsun
   - detaylı premium anlatı ayrı satış yüzeyine taşınsın
5. Home, Analytics ve Settings arasında premium bilgi tekrarını azalt.

#### Kabul Kriteri

- Premium/free ayrımı server tarafında net.
- README ile gerçek kullanım yüzeyi birebir uyumlu.
- Kullanıcı aynı premium anlatıyı dört ekranda tekrar görmüyor.

#### Tahmini Efor

- 2 ila 3 gün

## 3. İkinci Dalga Çalışmalar

### Test ve release güvencesi

1. E2E testleri gerçek kullanıcı yolculuğuna göre yeniden yaz.
2. Metin bağımlı assertion’ları azalt.
3. Free ve premium kullanıcı smoke senaryoları ekle.
4. Google redirect login için staging smoke adımı ekle.
5. Sync açık/kapalı mod için ayrı test senaryosu ekle.

### Ürün sadeleştirme

1. Landing’i auth-first yap.
2. Premium satış anlatısını tek bir yüzeye topla.
3. Settings’i hesap ve veri yönetimi odağına döndür.
4. Analytics’i ileri içgörülerin ana evi yap.

### Operasyon ve gözlemlenebilirlik

1. Sync hata loglarını sınıflandır.
2. Premium entitlement okunamadığında fallback reason logla.
3. Deploy sonrası smoke checklist’i release sürecine bağla.
4. Feature flag sistemi ekle.

## 4. Önerilen Sprint Planı

### Sprint 1

- Auth + sync identity uyumu
- Supabase session lifecycle düzeni
- Sync health mesajlarının düzeltilmesi

### Sprint 2

- Premium otoritesinin server-first hale getirilmesi
- Transfer vaadi konusunda ürün kararının verilmesi
- Landing ve Settings sadeleştirmesi

### Sprint 3

- E2E sertleştirme
- Smoke test otomasyonu
- Güvenlik söyleminin dokümantasyonda temizlenmesi

## 5. Başarı Ölçütleri

- Cloud sync iki cihaz arasında güvenilir çalışıyor.
- Premium plan manipülasyonu sadece client ile yapılamıyor.
- README ve ekranlar aynı özellik setini anlatıyor.
- Landing conversion yüzeyi daha sade.
- Release sonrası kritik akışlar checklist ile doğrulanıyor.

## 6. Hızlı Kazançlar

Kod kırmadan hemen yapılabilecek düşük riskli iyileştirmeler:

1. README’de transfer vaadini düzeltmek veya özelliği net işaretlemek.
2. Settings’te cloud sync durum metnini daha dürüst yapmak.
3. Landing’de premium metin bloklarını kısaltmak.
4. Güvenlik metinlerinde “secure” yerine daha teknik ve doğru ifadeler kullanmak.

## 7. Sonuç

Bu proje yeni özellik eklemekten çok hardening ile değer kazanacak bir noktada. Doğru iş sırası uygulanırsa kısa sürede “güzel MVP” seviyesinden “satılabilir ürün” seviyesine çıkabilir.

## 8. Teknik Backlog (Issue Format)

Asagidaki maddeler sprint planlamada dogrudan issue olarak acilabilir.

### P0-1: AuthContext icin test paketi ekle

- Oncelik: P0
- Efor: 1-2 gun
- Kapsam:
   - src/contexts/AuthContext.tsx
   - src/tests/AuthContext.test.tsx (yeni)
- Amaç:
   - Email login, Google callback, demo login, logout ve rate limit akislarinin regresyonunu azaltmak.
- Kabul Kriteri:
   - Email login basari/basarisizlik senaryolari testte yeşil.
   - Google callback code/token hata yolları testte kapsaniyor.
   - Demo login route guard ile uyumlu (isAuthenticated true) testle dogrulaniyor.
   - Logout sonrasi auth state ve account scope temizligi testte dogrulaniyor.
- Test/DoD:
   - npm run test -- --run src/tests/AuthContext.test.tsx gecer.

### P0-2: Cloud sync conflict korumasi

- Oncelik: P0
- Efor: 2-3 gun
- Kapsam:
   - src/hooks/useFinance.ts
   - src/utils/cloudSync.ts
- Amaç:
   - Coklu cihaz duzenlemelerinde sessiz veri ezilmesini azaltmak.
- Kabul Kriteri:
   - Her entity payload icin updatedAt/version alanı saklaniyor.
   - Pull sirasinda local ve cloud versiyonlari karsilastiriliyor.
   - Cakisma halinde deterministic kural calisiyor (or. last-write-wins + log).
- Test/DoD:
   - useFinance persistence testlerine conflict senaryosu eklenir ve gecer.

### P0-3: Cloud yazimlarina retry + görünür hata

- Oncelik: P0
- Efor: 1-2 gun
- Kapsam:
   - src/hooks/useFinance.ts
- Amaç:
   - Gecici ag hatalarinda cloud yazim dayanıklılığını artırmak.
- Kabul Kriteri:
   - upsert/delete cloud yazimlari en az 3 deneme yapar.
   - Tum denemeler basarisizsa UI tarafinda kullaniciya durum mesaji verilir.
   - Local-first davranis korunur.
- Test/DoD:
   - Mock Supabase ile retry sayisi ve hata mesaji testte dogrulanir.

### P1-1: Premium otoritesini server-first yap

- Oncelik: P1
- Efor: 1-2 gun
- Kapsam:
   - src/utils/premium.ts
   - src/contexts/AuthContext.tsx
- Amaç:
   - Premium yetkiyi Supabase subscription kaydi merkezli hale getirmek.
- Kabul Kriteri:
   - resolveSubscriptionPlan ilk kaynak olarak Supabase row kullanir.
   - Env override yalnizca acik debug bayragi varken calisir.
   - Fallback kullanildiginda reason loglanir.
- Test/DoD:
   - premium testleri server-first davranisi dogrular.

### P1-2: AuthContext parcalama refaktoru

- Oncelik: P1
- Efor: 2-4 gun
- Kapsam:
   - src/contexts/AuthContext.tsx
   - src/contexts/auth/* (yeni)
- Amaç:
   - Buyuk context dosyasini daha testlenebilir alt modullere ayirmak.
- Kabul Kriteri:
   - Email auth, Google auth ve session sync logic ayrik moduller olarak ayrilir.
   - Public API (useAuth) bozulmadan kalir.
   - Tum mevcut auth testleri yesil kalir.
- Test/DoD:
   - Yeni moduller icin birim test eklenir.

### P1-3: Landing auth-first sadeleştirme v2

- Oncelik: P1
- Efor: 1 gun
- Kapsam:
   - src/pages/Landing.tsx
- Amaç:
   - Giris donusumunu artırmak icin eylem hiyerarsisini daha belirginleştirmek.
- Kabul Kriteri:
   - Birincil CTA tek (Giris Yap/Hesap Olustur), Google ikincil, Demo tersiyer kalir.
   - Premium mesaji giris sonrasi baglama kaydirilir.
   - Form altinda guven mikro-kopyasi korunur.
- Test/DoD:
   - pageBehavior testinde auth CTA akisi guncellenir ve gecer.

### P2-1: currency ve insight performans hardening

- Oncelik: P2
- Efor: 1-2 gun
- Kapsam:
   - src/utils/currency.ts
   - src/utils/premiumInsights.ts
- Amaç:
   - Edge-case ve buyuk veri setinde stabiliteyi guclendirmek.
- Kabul Kriteri:
   - GOLD rate 0/undefined durumlarinda guvenli fallback var.
   - premiumInsights hesaplari buyuk listelerde sure limiti veya pencereleme ile calisir.
- Test/DoD:
   - utils ve premiumInsights testlerine edge-case eklenir.

### P2-2: AppChrome nav indicator guvenligi

- Oncelik: P2
- Efor: 0.5-1 gun
- Kapsam:
   - src/components/AppChrome.tsx
   - src/App.tsx
- Amaç:
   - Resize/route gecislerinde DOM olgunlasma kaynakli kaymalari azaltmak.
- Kabul Kriteri:
   - Null ref ve stale layout guardlari eklenir.
   - Indicator hesaplamasi guvenli fallback ile calisir.
- Test/DoD:
   - En az bir integration testi ile route degisiminde crash olmadigi dogrulanir.

### P2-3: Cloud sync durumunu UI’da netlestir

- Oncelik: P2
- Efor: 1 gun
- Kapsam:
   - src/pages/Settings.tsx
   - src/hooks/useFinance.ts
- Amaç:
   - Sync acik/kapali/basarisiz durumlarini kullaniciya net gostermek.
- Kabul Kriteri:
   - Son pull/push zamani ve son hata nedeni gorunur.
   - Offline modda acik durum metni var.
- Test/DoD:
   - pageBehavior veya yeni Settings testi ile durum label’lari dogrulanir.

### P3-1: Auth + premium smoke checklist otomasyonu

- Oncelik: P3
- Efor: 1-2 gun
- Kapsam:
   - docs/live-auth-premium-smoke-checklist-tr.md
   - tests/e2e/*
- Amaç:
   - Release sonrasi kritik akislari manuel checkliste bagimli olmadan calistirmak.
- Kabul Kriteri:
   - En az 1 e2e senaryo: login, guarded route, premium yonlendirme, logout.
   - CI veya lokal script ile tek komutta kosar.
- Test/DoD:
   - E2E pass raporu release notuna eklenebilir.