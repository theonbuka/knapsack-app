# Teknik Issue Export (TR)

Bu dosya, backlog maddelerini GitHub Issues veya Jira'ya hizli kopyalama icin hazirlar.

## Kullanim

- GitHub: Her basligi ayri issue olarak ac.
- Jira: Baslik satirini Summary, Aciklama bolumunu Description olarak kullan.
- Etiketleri issue labels alanina ekle.

---

## 1) [P0] AuthContext test paketi ekle

- Tip: Task
- Oncelik: P0
- Etiketler: auth, testing, reliability
- Efor: 1-2 gun
- Kapsam:
  - src/contexts/AuthContext.tsx
  - src/tests/AuthContext.test.tsx (yeni)
- Aciklama:
  - Email login, Google callback, demo login, logout ve rate limit akislarini testle guvenceye al.
- Kabul Kriterleri:
  - Email login basari/basarisizlik senaryolari testte yesil.
  - Google callback code/token hata yollari testte kapsanmis.
  - Demo login route guard ile uyumlu (isAuthenticated true).
  - Logout sonrasi auth state ve account scope temizligi dogrulanmis.
- Test/DoD:
  - npm run test -- --run src/tests/AuthContext.test.tsx gecer.

## 2) [P0] Cloud sync conflict korumasi

- Tip: Feature
- Oncelik: P0
- Etiketler: sync, data-integrity, backend
- Efor: 2-3 gun
- Kapsam:
  - src/hooks/useFinance.ts
  - src/utils/cloudSync.ts
- Aciklama:
  - Coklu cihaz duzenlemelerinde sessiz veri ezilmesini engellemek icin conflict kurali ekle.
- Kabul Kriterleri:
  - Entity payload'larinda updatedAt/version alanlari var.
  - Pull sirasinda local-cloud versiyon karsilastirmasi yapiliyor.
  - Cakisma halinde deterministic kural calisiyor (or. last-write-wins + log).
- Test/DoD:
  - useFinance persistence testlerine conflict senaryolari eklendi ve gecti.

## 3) [P0] Cloud yazim retry + gorunur hata

- Tip: Improvement
- Oncelik: P0
- Etiketler: sync, ux, reliability
- Efor: 1-2 gun
- Kapsam:
  - src/hooks/useFinance.ts
- Aciklama:
  - Fire-and-forget cloud yazimlarina retry ve hata gorunurlugu ekle.
- Kabul Kriterleri:
  - upsert/delete cloud yazimlari max 3 deneme yapiyor.
  - Tum denemeler basarisizsa kullaniciya net durum mesaji gorunuyor.
  - Local-first davranis korunuyor.
- Test/DoD:
  - Mock Supabase ile retry sayisi ve hata metni testte dogrulanir.

## 4) [P1] Premium otoritesini server-first yap

- Tip: Improvement
- Oncelik: P1
- Etiketler: premium, security, auth
- Efor: 1-2 gun
- Kapsam:
  - src/utils/premium.ts
  - src/contexts/AuthContext.tsx
- Aciklama:
  - Premium plani birincil olarak Supabase subscription kaynagina bagla.
- Kabul Kriterleri:
  - resolveSubscriptionPlan oncelikle Supabase row kullanir.
  - Env override sadece debug bayragi acikken devrede.
  - Fallback sebebi loglanir.
- Test/DoD:
  - premium testleri server-first davranisi dogrular.

## 5) [P1] AuthContext moduler refaktor

- Tip: Refactor
- Oncelik: P1
- Etiketler: auth, maintainability, refactor
- Efor: 2-4 gun
- Kapsam:
  - src/contexts/AuthContext.tsx
  - src/contexts/auth/* (yeni)
- Aciklama:
  - Buyuk auth dosyasini email, google ve session alt modullerine bol.
- Kabul Kriterleri:
  - Public API (useAuth) bozulmadi.
  - Email/Google/session logic ayrik modullere tasindi.
  - Tum mevcut auth testleri yesil.
- Test/DoD:
  - Yeni moduller icin birim test eklendi.

## 6) [P1] Landing auth-first sadeleştirme v2

- Tip: Improvement
- Oncelik: P1
- Etiketler: ui, ux, conversion
- Efor: 1 gun
- Kapsam:
  - src/pages/Landing.tsx
- Aciklama:
  - Giris donusumu icin CTA hiyerarsisini daha keskin hale getir.
- Kabul Kriterleri:
  - Birincil CTA tek, Google ikincil, Demo tersiyer.
  - Premium mesaji giris sonrasi baglama kaydirildi.
  - Guven mikro-kopyasi korunuyor.
- Test/DoD:
  - pageBehavior testinde auth CTA akisi yesil.

## 7) [P2] Currency + premiumInsights edge-case hardening

- Tip: Improvement
- Oncelik: P2
- Etiketler: utils, performance, stability
- Efor: 1-2 gun
- Kapsam:
  - src/utils/currency.ts
  - src/utils/premiumInsights.ts
- Aciklama:
  - GOLD rate edge-case ve buyuk veri performansini guclendir.
- Kabul Kriterleri:
  - GOLD rate 0/undefined durumunda guvenli fallback var.
  - premiumInsights buyuk listelerde sinirli sure/pencereleme ile calisir.
- Test/DoD:
  - ilgili unit testlere edge-case senaryolari eklendi.

## 8) [P2] AppChrome nav indicator guvenligi

- Tip: Bugfix
- Oncelik: P2
- Etiketler: ui, navigation, resilience
- Efor: 0.5-1 gun
- Kapsam:
  - src/components/AppChrome.tsx
  - src/App.tsx
- Aciklama:
  - Route degisimi/resize siralarinda indicator hesaplama guvenligini artir.
- Kabul Kriterleri:
  - Null ref ve stale layout guardlari var.
  - Indicator fallback ile crash olmadan calisir.
- Test/DoD:
  - En az bir integration testi route degisiminde crash olmadigini dogrular.

## 9) [P2] Settings ekraninda sync health gorunurlugu

- Tip: Improvement
- Oncelik: P2
- Etiketler: settings, sync, ux
- Efor: 1 gun
- Kapsam:
  - src/pages/Settings.tsx
  - src/hooks/useFinance.ts
- Aciklama:
  - Sync acik/kapali/basarisiz durumunu daha seffaf goster.
- Kabul Kriterleri:
  - Son pull/push zamani gorunur.
  - Son hata nedeni gorunur.
  - Offline mod acikca etiketlenir.
- Test/DoD:
  - Settings davranis testi yeni durum etiketlerini dogrular.

## 10) [P3] Auth + premium smoke otomasyonu

- Tip: Task
- Oncelik: P3
- Etiketler: e2e, release, qa
- Efor: 1-2 gun
- Kapsam:
  - docs/live-auth-premium-smoke-checklist-tr.md
  - tests/e2e/*
- Aciklama:
  - Release sonrasi kritik akislari yari-otomatik/otomatik smoke testlere bagla.
- Kabul Kriterleri:
  - En az bir e2e: login, guarded route, premium yonlendirme, logout.
  - Tek komutla calisir (lokal veya CI).
- Test/DoD:
  - E2E pass raporu release notuna eklenebilir.

---

## Jira icin hizli alan eslestirmesi

- Summary: Baslik satiri
- Description: Aciklama + Kabul Kriterleri + Test/DoD
- Priority: P0/P1/P2/P3
- Labels: Etiketler satiri
- Story Points: Efora gore ekip standardi
