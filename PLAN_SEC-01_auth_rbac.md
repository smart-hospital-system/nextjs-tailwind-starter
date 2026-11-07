# پلن رفع `SEC-01` — احراز هویت، RBAC، لایهٔ داده و CSP اجرایی

> **وضعیت:** پیش‌نویس، منتظر تأیید. هیچ کدی نوشته نشده، هیچ وابستگی‌ای نصب نشده است.
> **مبنا:** `PROJECT_ANALYSIS_FA.md` (SEC‑01، SEC‑07، SEC‑08) + وضعیت فعلی `main` در کامیت `7ce9967`.
> **نسخه‌های بررسی‌شده روی رجیستری npm در تاریخ ۲۰۲۶‑۱۱‑۰۴.**

---

## ۰. خلاصه اجرایی

`SEC-01` تنها مشکل باقی‌مانده‌ای است که تا حل نشود، **ساختن هیچ صفحهٔ واقعی معنا ندارد**: هر مسیری که اضافه شود امروز عمومی است. برخلاف کارهای قبلی (هدر، فونت، تست) این یک **تصمیم معماری چندلایه** است: چهار تصمیم + پنج PR.

| تصمیم | پیشنهاد من | چرا |
|---|---|---|
| ۱. پکیج Auth | **Better‑Auth 1.7.16** | تنها گزینهٔ پایدار و App‑Router‑native؛ پشتیبانی رسمی از Next 15 و Drizzle و Vitest |
| ۲. دیتابیس/ORM | **Postgres + Drizzle ORM 0.45.4** | type‑safe، بدون codegen سنگین، پشتیبانی رسمی Better‑Auth، قابل تست با PGlite |
| ۳. مدل RBAC | **نقش‌محور + scoping در لایهٔ داده، Deny‑by‑Default** | ساده و قابل ممیزی؛ ABAC بعداً روی همین پایه |
| ۴. CSP | **nonce + `middleware.ts`، ابتدا Report‑Only با endpoint، بعد enforce** | بدون nonce اجرایی‌کردن = صفحهٔ سفید |

**چیزی که بدون پاسخ شما قابل شروع نیست:** بخش ۱۱ (پنج سؤال باز). مهم‌ترینش: **Postgres کجا میزبانی می‌شود؟**

---

## ۱. وضعیت فعلی (شواهد)

```
app/
├── api/hello/route.ts        ← تنها API، بدون auth
├── layout.tsx                ← lang="fa" dir="rtl"
└── page.tsx                  ← صفحهٔ خوش‌آمد قالب
next.config.ts                ← هدرهای امنیتی + CSP Report-Only (PR #4)
middleware.ts                 ← وجود ندارد
prisma/ | drizzle/ | db/      ← وجود ندارد
.env / .env.example           ← وجود ندارد
```

| سنجه | مقدار |
|---|---|
| مسیرهای محافظت‌شده | **۰** (هیچ مسیری auth ندارد) |
| جداول دیتابیس | **۰** |
| نقش‌ها | **۰** |
| تست‌ها | ۹ (CI فعال ✅) |
| `.env` در `.gitignore` | ✅ از قبل (خط ۲۸) |

**زیرساخت محلی (بررسی‌شده):** `psql`, `postgres`, `docker`, `sqlite3` — **هیچ‌کدام نصب نیست**. این یعنی استراتژی تست نمی‌تواند به Docker محلی تکیه کند؛ راه‌حل در بخش ۸.

---

## ۲. تصمیم ۱ — پکیج احراز هویت

### ۲.۱ مقایسه (بر اساس واقعیت نسخه‌ها، نه شهرت)

| معیار | **Better‑Auth 1.7.16** | NextAuth/Auth.js | JWT دستی |
|---|---|---|---|
| نسخهٔ پایدار برای App Router | ✅ `1.7.16` — پایدار | ⚠️ `latest` = **4.24.15** (مدل Pages)؛ نسخهٔ App‑Router‑native = **`5.0.0-beta.32`** | — |
| Peer با Next 15.5.29 | ✅ `^14 \|\| ^15 \|\| ^16` | ✅ | — |
| Peer با Drizzle 0.45.4 | ✅ `^0.45.2` | نیاز به adapter جداگانه | — |
| Session در دیتابیس | ✅ پیش‌فرض (قابل ممیزی/ابطال) | ✅ با adapter | ✗ باید خودت بسازی |
| RBAC داخلی | ✅ دارد (organization/roles) | ✗ دستی | ✗ دستی |
| پشتیبانی از OIDC/LDAP بیمارستانی | ✅ plugin | ✅ | ✗ |
| هزینهٔ نگه‌داری برای ما | کم | متوسط | **بالا و پرخطر** |
| ریسک | جدیدتر، اکوسیستم کوچک‌تر | v5 هنوز beta | باگ‌های امنیتی خانگی |

### ۲.۲ پیشنهاد

> **Better‑Auth 1.7.16** با adapter رسمی Drizzle و session در دیتابیس.

**دلایل تعیین‌کننده:**
1. NextAuth برای App Router هنوز **beta** است (`5.0.0-beta.32`)؛ ساختن لایهٔ امنیتی بیمارستان روی beta، ریسک غیرقابل‌قبول است.
2. Better‑Auth هم‌زمان با Next 15، Drizzle 0.45 و Vitest 5 سازگار است — یعنی exact match با استک فعلی، بدون adapter جانبی.
3. session در دیتابیس (نه فقط JWT) یعنی **ابطال فوری دسترسی** — الزام امنیتی بیمارستان: وقتی کارمندی اخراج می‌شود، باید بتوانی همهٔ نشست‌هایش را همان لحظه باطل کنی.
4. JWT دستی رد می‌شود: تاریخچهٔ آسیب‌پذیری‌های `alg=none`، چرخش کلید، و مدیریت refresh در نهایت به همان کتابخانه می‌رسد.

### ۲.۳ پیکربندی امنیتی اجباری

| مورد | مقدار |
|---|---|
| ذخیرهٔ رمز | **Argon2id** (`@node-rs/argon2` 2.2.2) — نه bcrypt، نه SHA |
| کوکی نشست | `HttpOnly`, `Secure` (در production), `SameSite=Lax`, `__Host-` prefix |
| عمر نشست | پیش‌فرض ۷ روز برای کارکنان، ۳۰ دقیقه inactivity برای نقش‌های حساس |
| Secret | `BETTER_AUTH_SECRET` ≥ ۳۲ بایت، از env، **هرگز در کد** |
| نرخ تلاش ورود | محدودیت ۵ تلاش/۱۵ دقیقه per IP+email، قفل موقت حساب |
| ثبت رویداد | همهٔ login/logout/failed‑login در `audit_log` |

---

## ۳. تصمیم ۲ — دیتابیس و ORM

### ۳.۱ ORM: Drizzle در برابر Prisma

| معیار | **Drizzle 0.45.4** | Prisma |
|---|---|---|
| نسخهٔ قابل اتکا | 0.45.4 پایدار | `latest` روی npm = **8.0.0-rc.30** (RC)؛ پایدار `7.10.1` |
| سازگاری Better‑Auth | ✅ peer رسمی `^0.45.2` | ✅ (peer `^5\|^6\|^7`) |
| Codegen | ندارد (TS خالص) | نیاز به `prisma generate` |
| وزن/binary | سبک، بدون engine بومی | engine بومی، مشکل در محیط‌های محدود |
| تست بدون Docker | ✅ با **PGlite** | سخت‌تر |

> **پیشنهاد: Drizzle + Postgres.** دلیل تعیین‌کننده: در این محیط Docker/Postgres نیست و Drizzle با PGlite (Postgres کامپایل‌شده به WASM) اجازهٔ **تست یکپارچه با SQL واقعی** می‌دهد. Prisma روی نسخهٔ RC است و engine بومی در محیط بسته دردسر دارد.

### ۳.۲ Postgres کجا؟

| گزینه | مناسب برای | یادداشت |
|---|---|---|
| **Supabase** | سریع‌ترین شروع، مدیریت‌شده | کانکتور Supabase در همین گفتگو فعال است؛ اما **RLS و Auth خودش** را با Better‑Auth قاطی نکنیم — فقط Postgres خام |
| **Neon** | serverless، branching برای تست | نیاز به شبکهٔ باز |
| **On‑Premise (بیمارستان)** | الزام احتمالی دادهٔ سلامت | بهترین از نظر انطباق؛ نیاز به ops |

**سؤال کلیدی برای شما:** هدف نهایی On‑Premise است یا ابری؟ این روی انتخاب connection pooling و سیاست backup اثر می‌گذارد.

### ۳.۳ Schema اولیه (فاز ۱)

| جدول | ستون‌های اصلی | نکته |
|---|---|---|
| `user` | id (uuid), email (unique), name, email_verified, image, created_at | مدیریت‌شده توسط Better‑Auth |
| `account` | id, user_id → user, provider_id, account_id, password (hash) | اعتبارنامهٔ محلی اینجا |
| `session` | id, token, user_id, expires_at, ip_address, user_agent | قابل ابطال |
| `verification` | id, identifier, value, expires_at | بازیابی رمز/تأیید ایمیل |
| `role` | name (PK: ADMIN/DOCTOR/NURSE/PHARMACIST/RECEPTION/LAB/PATIENT), description | ثابت‌های seed شده |
| `user_role` | user_id, role_id, granted_by, granted_at | چند نقش برای یک کاربر (پرستار + پذیرش) |
| `audit_log` | id, actor_id, action, resource, resource_id, ip, user_agent, metadata jsonb, created_at | **append-only**؛ پایهٔ SEC‑08 |

> جداول دامنه (patient, appointment, encounter…) **در این فاز ساخته نمی‌شوند** — فقط `user`/`role`/`audit_log` که auth لازم دارد.

---

## ۴. تصمیم ۳ — ماتریس RBAC

### ۴.۱ نقش‌ها

`ADMIN` · `DOCTOR` · `NURSE` · `PHARMACIST` · `RECEPTION` · `LAB` · `PATIENT`

### ۴.۲ ماتریس دسترسی (نمونهٔ قابل اجرا)

| منبع / عمل | ADMIN | DOCTOR | NURSE | PHARMACIST | RECEPTION | LAB | PATIENT |
|---|---|---|---|---|---|---|---|
| `patient:read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👤 own |
| `patient:create` | ✅ | — | — | — | ✅ | — | — |
| `patient:update` | ✅ | 👤 own | — | — | ✅ | — | 👤 own |
| `appointment:create` | ✅ | ✅ | — | — | ✅ | — | ✅ |
| `encounter:read` (EMR) | ✅ | 👤 own | 👤 ward | — | — | — | 👤 own |
| `encounter:write` | ✅ | 👤 own | ✍️ nursing notes | — | — | — | — |
| `prescription:create` | ✅ | ✅ | — | — | — | — | — |
| `prescription:dispense` | ✅ | — | — | ✅ | — | — | — |
| `lab_result:read` | ✅ | 👤 own | 👤 ward | — | — | ✅ | 👤 own |
| `invoice:*` | ✅ | — | — | — | ✅ | — | 👤 own |
| `staff:manage` | ✅ | — | — | — | — | — | — |
| `audit_log:read` | ✅ | — | — | — | — | — | — |
| `settings:*` | ✅ | — | — | — | — | — | — |

✅ مجاز · 👤 فقط دادهٔ مرتبط با خودش · ✍️ محدود به نوع مشخص · — ممنوع

### ۴.۳ در کدام لایه اعمال شود؟ (هر چهار لایه، نه یکی)

| لایه | کار | چرا |
|---|---|---|
| ۱. `middleware.ts` | فقط **coarse**: نبود نشست → ریدایرکت به `/login`؛ پیشوند مسیر ↔ نقش (مثلاً `/dashboard/pharmacy` فقط PHARMACIST/ADMIN) | سریع، اما **به‌تنهایی کافی نیست** (middleware در Edge است و نمی‌تواند کوئری دیتابیس بزند) |
| ۲. Server Component / Route Handler | `requireSession()` + `assertPermission(action, resource)` در **هر** مسیر | مرز واقعی اعتماد؛ Deny‑by‑Default |
| ۳. لایهٔ داده (Repository) | هر کوئری با `ActorContext` اجرا می‌شود: `listPatients(actor)` خودش فیلتر «own/ward» را اعمال می‌کند | جلوگیری از نشت داده در جایی که فراموش می‌شود |
| ۴. UI | پنهان‌کردن دکمه/منو | فقط UX — **هرگز** مبنای امنیت |

**قاعدهٔ طلایی:** هیچ Route Handler یا Server Action نباید بدون `assertPermission` مرج شود؛ این در PRها به‌صورت تست اجباری چک می‌شود.

### ۴.۴ تست‌پذیری (روی زیرساخت PR #5)

- تابع `can(actor, action, resource)` **خالص** است (بدون DB) → تست واحد کامل برای ماتریس نقش×عمل (حدود ۴۰ حالت).
- Repository‌ها با PGlite تست یکپارچه می‌شوند: «پزشک A پروندهٔ بیمار B را نمی‌بیند».
- یک تست «قرارداد امنیتی»: هر فایل `app/api/**/route.ts` باید `requireSession` یا استثنای مستند داشته باشد.

---

## ۵. تصمیم ۴ — CSP اجرایی + nonce

### ۵.۱ وضعیت فعلی

`next.config.ts` هدر `Content-Security-Policy-Report-Only` می‌فرستد (PR #4). هیچ چیزی بلوکه نمی‌شود و هیچ endpoint گزارشی هم نیست.

### ۵.۲ چرا اجرایی‌کردن به `middleware.ts` گره خورده

Next.js برای hydration اسکریپت inline تزریق می‌کند. برای CSP سخت‌گیرانه باید per‑request nonce ساخت و Next آن را روی اسکریپت‌های خودش اعمال می‌کند — این کار فقط در `middleware.ts` ممکن است. پس این تصمیم **طبیعتاً** هم‌زمان با Auth انجام می‌شود، چون Auth هم `middleware.ts` می‌خواهد.

**هزینهٔ واقعی:** مسیرهای پوشش‌داده‌شده توسط middleware از Static به Dynamic تبدیل می‌شوند. برای داشبورد بیمارستان این inevitability است؛ برای صفحهٔ بازاریابی، matcher را محدود می‌کنیم تا استاتیک بماند.

### ۵.۳ مسیر سه‌مرحله‌ای (بدون شکستن چیزی)

| مرحله | کار | نتیجه |
|---|---|---|
| A | `middleware.ts` می‌سازد: nonce + هدر CSP **Report‑Only** + `x-nonce` | هیچ چیزی نمی‌شکند؛ داده جمع می‌شود |
| B | endpoint `POST /api/csp-report` (rate‑limited، فقط در production فعال) | نقض‌ها در لاگ قابل مشاهده می‌شوند |
| C | حذف `'unsafe-inline'` از `script-src` و تغییر به `Content-Security-Policy` اجرایی | XSS سطح مرورگر بسته می‌شود |

**معیار عبور از B به C:** دو هفته بدون نقض غیرمنتظره در محیط staging.

---

## ۶. تقسیم به پنج PR (هر کدام مستقل و قابل برگشت)

| # | عنوان | دامنه | معیار پذیرش |
|---|---|---|---|
| **P1** | `feat(db): data layer and schema` | drizzle + drizzle-kit، `db/schema.ts`، migration اول، seed نقش‌ها، `lib/env.ts` با zod، `.env.example` | `drizzle-kit migrate` روی PGlite سبز؛ تست schema؛ `env` بدون متغیر لازم خطای واضح می‌دهد |
| **P2** | `feat(auth): credential auth with DB sessions` | بهتر‑آث، `/login`، `/logout`، کوکی امن، Argon2id، rate limit، `middleware.ts` (coarse) | تست: ورود موفق/ناموفق، ابطال نشست، محافظت از `/dashboard` |
| **P3** | `feat(rbac): role matrix and policy layer` | `lib/authz/policy.ts` (تابع خالص), `requireSession`, `assertPermission`, گارد نقش در middleware، تست قرارداد | ۴۰+ تست ماتریس؛ هیچ مسیر محافظت‌نشده‌ای باقی نماند |
| **P4** | `feat(audit): append-only audit log` | جدول + نویسندهٔ رویداد، ثبت login/logout/failed/role‑change، صفحهٔ خواندن برای ADMIN | تست: رویدادها ثبت و غیرقابل‌تغییرند |
| **P5** | `feat(security): enforce CSP with nonce` | nonce در middleware، endpoint گزارش، حذف `unsafe-inline`، به‌روزرسانی `docs/security-headers.md` | CSP اجرایی، `curl` بدون violation، UI سالم |

**ترتیب اجباری:** P1 → P2 → P3 → P4 → P5. هر PR روی `main` مرج می‌شود و CI (که از PR #5 داریم) آن را می‌سنجد.

---

## ۷. زیرساخت جدید لازم

| مورد | انتخاب | چرا |
|---|---|---|
| `better-auth` | 1.7.16 | بخش ۲ |
| `drizzle-orm` + `drizzle-kit` | 0.45.4 / 0.31.11 | بخش ۳ |
| `pg` | ^8 | درایور Postgres |
| `@node-rs/argon2` | 2.2.2 | هش رمز (سریع، بدون build بومی) |
| `zod` | 4.6.7 | اعتبارسنجی env و ورودی فرم‌ها |
| `@electric-sql/pglite` (dev) | 0.5.15 | تست SQL واقعی بدون Docker |

**هیچ کلید یا رمزی در کد نمی‌رود.** `.env.example` اضافه می‌شود (SEC‑07) و `.env*` از قبل در `.gitignore` است.

---

## ۸. استراتژی راستی‌آزمایی (محدودیت واقعی محیط)

بررسی کردم: در این محیط `psql`، `postgres`، `docker` و `sqlite3` **نصب نیستند**. بنابراین:

| سطح | ابزار | کجا اجرا می‌شود |
|---|---|---|
| منطق مجوزدهی (`can()`) | Vitest، بدون DB | محلی + CI ✅ |
| Repository و migration | **PGlite** (Postgres در WASM) | محلی + CI ✅ |
| Postgres واقعی | سرویس‌کانتینر `postgres:16` در GitHub Actions | CI ✅ |
| Production | Postgres میزبانی‌شده | استقرار شما |

این یعنی هر PR در همین محیط قابل اثبات است، بدون اینکه به Docker محلی نیاز داشته باشیم — و CI به‌طور موازی migration را روی Postgres واقعی هم می‌سنجد.

---

## ۹. ریسک‌ها و کاهش

| ریسک | احتمال | کاهش |
|---|---|---|
| middleware ضعیف به‌عنوان مرز امنیتی | متوسط | مرز اصلی لایهٔ ۲ و ۳؛ middleware فقط UX/redirect |
| از دست رفتن Static rendering | قطعی | matcher محدود به مسیرهای داشبورد |
| قفل‌شدن کاربران در login بی‌قفل | کم | تست‌های E2E ورود + مسیر بازیابی |
| نبود SMTP برای بازیابی رمز | متوسط | فاز اول: بازنشانی توسط ADMIN؛ SMTP در PR جدا |
| PGlite با برخی افزونه‌های Postgres ناسازگار | کم | فقط SQL استاندارد در migration اول |
| مهاجرت schema بعداً | متوسط | drizzle-kit از روز اول؛ هر تغییر = migration فایل |

---

## ۱۰. تخمین

| PR | تخمین |
|---|---|
| P1 داده و schema | ۲–۳ روز |
| P2 Auth | ۳–۴ روز |
| P3 RBAC | ۲–۳ روز |
| P4 Audit log | ۱–۲ روز |
| P5 CSP اجرایی | ۱ روز |
| **جمع** | **۹–۱۳ روز کاری** (یک توسعه‌دهنده) |

---

## ۱۱. پنج سؤال باز — بدون پاسخ این‌ها شروع نمی‌کنم

1. **Postgres کجا؟** Supabase / Neon / On‑Premise؟ (اگر On‑Premise، آیا TLS و backup دارید؟)
2. **در فاز اول، بیمار هم لاگین می‌کند** یا فقط کارکنان؟ (این ماتریس RBAC و صفحه‌های P3 را تغییر می‌دهد)
3. **MFA برای نقش‌های حساس** (ADMIN، داروساز) از فاز اول اجباری باشد یا فاز بعد؟
4. **بازیابی رمز با ایمیل** لازم است؟ (اگر بله، SMTP دارید؟)
5. **SSO/AD بیمارستان** (LDAP/Entra ID) در نقشه راه هست؟ (اگر بله، معماری را از حالا برای OIDC باز می‌گذاریم)

---

## ۱۲. خارج از دامنه (به‌صراحت)

- ❌ جداول دامنهٔ بالینی (بیمار، نوبت، پرونده) — PRهای بعدی
- ❌ MFA، SSO، بازیابی رمز با ایمیل (مگر پاسخ سؤال ۳ و ۴ خلافش را بگوید)
- ❌ رمزنگاری در حال سکون در سطح دیتابیس (کار زیرساخت)
- ❌ داشبورد واقعی — فقط یک صفحهٔ محافظت‌شدهٔ حداقلی برای اثبات auth
- ❌ `BUG-01`, `BUG-02`, `BUG-05`, `UI-03`… — همچنان باز، خارج از این پلن

---

## ۱۳. برای تأیید

- **الف)** پلن را همان‌طور که هست تأیید می‌کنم → با **P1** شروع کن.
- **ب)** پکیج Auth را عوض کن (مثلاً NextAuth beta یا Prisma) → بگویید کدام.
- **ج)** فقط Auth بدون RBAC و AuditLog در فاز اول (کوتاه‌تر، ولی `SEC-01` کامل بسته نمی‌شود).
- **د)** ابتدا به سؤالات بخش ۱۱ پاسخ می‌دهم، بعد شروع کن.

> **پیشنهاد من: `د` سپس `الف`** — چون پاسخ سؤال ۱ و ۲ روی schema و ماتریس اثر مستقیم دارد و اصلاح بعدی‌شان هزینهٔ migration دارد.
