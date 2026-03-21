# GitHub Issue Paketi (TR)

Bu dosyadaki her bolum tek bir GitHub issue olarak acilabilir.

---

## [P0] AuthContext test paketi ekle

Labels: auth, testing, reliability
Type: task
Estimate: 1-2 gun

### Kapsam
- src/contexts/AuthContext.tsx
- src/tests/AuthContext.test.tsx (yeni)

### Aciklama
Email login, Google callback, demo login, logout ve rate limit akislarini testle guvenceye al.

### Kabul Kriterleri
- [ ] Email login basari/basarisizlik senaryolari testte yesil.
- [ ] Google callback code/token hata yollari testte kapsanmis.
- [ ] Demo login route guard ile uyumlu (isAuthenticated true).
- [ ] Logout sonrasi auth state ve account scope temizligi dogrulanmis.

### DoD
- [ ] npm run test -- --run src/tests/AuthContext.test.tsx gecer.

---

## [P0] Cloud sync conflict korumasi

Labels: sync, data-integrity, backend
Type: feature
Estimate: 2-3 gun

### Kapsam
- src/hooks/useFinance.ts
- src/utils/cloudSync.ts

### Aciklama
Coklu cihaz duzenlemelerinde sessiz veri ezilmesini engellemek icin conflict kurali ekle.

### Kabul Kriterleri
- [ ] Entity payload'larinda updatedAt/version alanlari var.
- [ ] Pull sirasinda local-cloud versiyon karsilastirmasi yapiliyor.
- [ ] Cakisma halinde deterministic kural calisiyor (or. last-write-wins + log).

### DoD
- [ ] useFinance persistence testlerine conflict senaryolari eklendi ve gecti.

---

## [P0] Cloud yazim retry + gorunur hata

Labels: sync, ux, reliability
Type: improvement
Estimate: 1-2 gun

### Kapsam
- src/hooks/useFinance.ts

### Aciklama
Fire-and-forget cloud yazimlarina retry ve hata gorunurlugu ekle.

### Kabul Kriterleri
- [ ] upsert/delete cloud yazimlari max 3 deneme yapiyor.
- [ ] Tum denemeler basarisizsa kullaniciya net durum mesaji gorunuyor.
- [ ] Local-first davranis korunuyor.

### DoD
- [ ] Mock Supabase ile retry sayisi ve hata metni testte dogrulanir.

---

## [P1] Premium otoritesini server-first yap

Labels: premium, security, auth
Type: improvement
Estimate: 1-2 gun

### Kapsam
- src/utils/premium.ts
- src/contexts/AuthContext.tsx

### Aciklama
Premium plani birincil olarak Supabase subscription kaynagina bagla.

### Kabul Kriterleri
- [ ] resolveSubscriptionPlan oncelikle Supabase row kullanir.
- [ ] Env override sadece debug bayragi acikken devrede.
- [ ] Fallback sebebi loglanir.

### DoD
- [ ] premium testleri server-first davranisi dogrular.

---

## [P1] AuthContext moduler refaktor

Labels: auth, maintainability, refactor
Type: refactor
Estimate: 2-4 gun

### Kapsam
- src/contexts/AuthContext.tsx
- src/contexts/auth/* (yeni)

### Aciklama
Buyuk auth dosyasini email, google ve session alt modullerine bol.

### Kabul Kriterleri
- [ ] Public API (useAuth) bozulmadi.
- [ ] Email/Google/session logic ayrik modullere tasindi.
- [ ] Tum mevcut auth testleri yesil.

### DoD
- [ ] Yeni moduller icin birim test eklendi.

---

## [P1] Landing auth-first sadelestirme v2

Labels: ui, ux, conversion
Type: improvement
Estimate: 1 gun

### Kapsam
- src/pages/Landing.tsx

### Aciklama
Giris donusumu icin CTA hiyerarsisini daha keskin hale getir.

### Kabul Kriterleri
- [ ] Birincil CTA tek, Google ikincil, Demo tersiyer.
- [ ] Premium mesaji giris sonrasi baglama kaydirildi.
- [ ] Guven mikro-kopyasi korunuyor.

### DoD
- [ ] pageBehavior testinde auth CTA akisi yesil.

---

## [P2] Currency + premiumInsights edge-case hardening

Labels: utils, performance, stability
Type: improvement
Estimate: 1-2 gun

### Kapsam
- src/utils/currency.ts
- src/utils/premiumInsights.ts

### Aciklama
GOLD rate edge-case ve buyuk veri performansini guclendir.

### Kabul Kriterleri
- [ ] GOLD rate 0/undefined durumunda guvenli fallback var.
- [ ] premiumInsights buyuk listelerde sinirli sure/pencereleme ile calisir.

### DoD
- [ ] ilgili unit testlere edge-case senaryolari eklendi.

---

## [P2] AppChrome nav indicator guvenligi

Labels: ui, navigation, resilience
Type: bugfix
Estimate: 0.5-1 gun

### Kapsam
- src/components/AppChrome.tsx
- src/App.tsx

### Aciklama
Route degisimi/resize siralarinda indicator hesaplama guvenligini artir.

### Kabul Kriterleri
- [ ] Null ref ve stale layout guardlari var.
- [ ] Indicator fallback ile crash olmadan calisir.

### DoD
- [ ] En az bir integration testi route degisiminde crash olmadigini dogrular.

---

## [P2] Settings ekraninda sync health gorunurlugu

Labels: settings, sync, ux
Type: improvement
Estimate: 1 gun

### Kapsam
- src/pages/Settings.tsx
- src/hooks/useFinance.ts

### Aciklama
Sync acik/kapali/basarisiz durumunu daha seffaf goster.

### Kabul Kriterleri
- [ ] Son pull/push zamani gorunur.
- [ ] Son hata nedeni gorunur.
- [ ] Offline mod acikca etiketlenir.

### DoD
- [ ] Settings davranis testi yeni durum etiketlerini dogrular.

---

## [P3] Auth + premium smoke otomasyonu

Labels: e2e, release, qa
Type: task
Estimate: 1-2 gun

### Kapsam
- docs/live-auth-premium-smoke-checklist-tr.md
- tests/e2e/*

### Aciklama
Release sonrasi kritik akislari yari-otomatik/otomatik smoke testlere bagla.

### Kabul Kriterleri
- [ ] En az bir e2e: login, guarded route, premium yonlendirme, logout.
- [ ] Tek komutla calisir (lokal veya CI).

### DoD
- [ ] E2E pass raporu release notuna eklenebilir.
