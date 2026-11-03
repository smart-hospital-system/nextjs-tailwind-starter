# پلن رفع مشکل — بنیان امنیتی: هدرهای HTTP و CSP

> **وضعیت:** پیشنویس، منتظر تأیید. هیچ کدی نوشته نشده و هیچ برنچی ساخته نشده است.
> **مشکل هدف:** `SEC-02` از گزارش `PROJECT_ANALYSIS_FA.md` — `next.config.ts:3-5` خالی است؛ هیچ هدر امنیتی‌ای ارسال نمی‌شود.

---

## ۱. چرا این مشکل؟

### ۱.۱ چرا «بحرانی‌ترین» این است و نه بستهٔ دیگر

| مشکل | شدت در گزارش | چرا الان نه |
|---|---|---|
| `SEC-01` نبود احراز هویت/RBAC | 🔴 بحرانی | بزرگ‌ترین شکاف پروژه است، اما به مدل داده، انتخاب پکیج Auth و تصمیم دربارهٔ جریان ورود وابسته است. یک تصمیم معماری چندروزه است، نه یک «رفع باگ». |
| `SEC-05` آسیب‌پذیری وابستگی‌ها | 🟠 متوسط | CVEها در `sharp`/`libvips` هستند؛ پروژه در حال حاضر هیچ تصویر کاربری پردازش نمی‌کند، پس بهره‌برداری فعلی ممکن نیست. با ارتقای `next@15.5.29` در فاز ۰ حل می‌شود. |
| `SEC-02` **هدرهای امنیتی** | 🔴 بحرانی | ✅ **انتخاب شد**: پیش‌نیاز همهٔ کارهای بعدی، صفر وابستگی، ریسک پایین، قابل راستی‌آزمایی عینی |

**استدلال کلیدی:** هر صفحه‌ای که بعداً ساخته شود (ورود، داشبورد، پرونده بیمار) تا وقتی CSP و `frame-ancestors` وجود نداشته باشد، از روز اول در برابر Clickjacking و XSS باز است. اضافه‌کردن آن پس از ساخت ۲۰ صفحه هزینهٔ بازبینی همهٔ مسیرها را دارد. این تنها کاری است که «هزینهٔ تعویق» آن واقعاً بالاست و در همین مرحله با صفر وابستگی قابل انجام است.

### ۱.۲ وضعیت فعلی (شواهد)

```
next.config.ts
1  import type { NextConfig } from "next";
2
3  const nextConfig: NextConfig = {
4    /* config options here */
5  };
6
7  export default nextConfig;
```

- هیچ `headers()` وجود ندارد.
- `middleware.ts` وجود ندارد (`ls: cannot access 'middleware.ts'`).
- `poweredByHeader` تنظیم نشده → هدر `X-Powered-By: Next.js` ارسال می‌شود.

---

## ۲. دامنه

### در دامنه (این PR)

| # | کار | فایل |
|---|---|---|
| ۱ | افزودن `poweredByHeader: false` | `next.config.ts` |
| ۲ | افزودن `productionBrowserSourceMaps: false` (صریح‌سازی) | `next.config.ts` |
| ۳ | افزودن `headers()` با ۷ هدر امنیتی (بدون CSP اجرایی) | `next.config.ts` |
| ۴ | افزودن CSP در حالت **Report-Only** | `next.config.ts` |
| ۵ | مستندسازی تصمیم در `docs/security-headers.md` | فایل جدید |

### خارج از دامنه (به‌صراحت)

- ❌ احراز هویت، RBAC، `middleware.ts` → PR جداگانه (فاز ۱)
- ❌ اجرایی‌کردن CSP (enforce) با nonce → به `middleware.ts` نیاز دارد، فاز ۱
- ❌ ارتقای نسخه‌ها و رفع CVEها (`SEC-05`, `SEC-06`) → PR جداگانه
- ❌ راه‌اندازی تست/CI (`TEST-01`) → PR جداگانه
- ❌ هر تغییری در `app/page.tsx`, `app/layout.tsx`, استایل‌ها

---

## ۳. تصمیم فنی: چرا CSP ابتدا Report-Only؟

CSP سخت‌گیرانه در Next.js App Router با مشکل شناخته‌شده‌ای روبه‌روست: Next برای hydration، اسکریپت inline تزریق می‌کند (`self.__next_f.push(...)`). دو راه وجود دارد:

| گزینه | روش | هزینه |
|---|---|---|
| **A. nonce-based و اجرایی از روز اول** | `middleware.ts` برای هر درخواست nonce می‌سازد و در هدر CSP می‌گذارد | کل اپ از Static به Dynamic تبدیل می‌شود؛ CSP اشتباه = صفحهٔ سفید |
| **B. Report-Only در فاز ۰، اجرایی در فاز ۱** ✅ | `Content-Security-Policy-Report-Only` + بقیهٔ هدرها اجرایی | صفر ریسک شکستن اپ؛ داده‌های نقض برای تنظیم دقیق CSP جمع می‌شود |

**پیشنهاد: گزینهٔ B.** دلیل: CSPی که بجای نظارت از روز اول «اجرایی» شود و اشتباه تنظیم شده باشد، اپ را می‌شکند — و در سیستم بیمارستانی شکستن صفحهٔ ورود یعنی توقف کار. با Report-Only هم حفاظت‌های واقعیِ همین PR (HSTS، `X-Frame-Options`، `nosniff`، `frame-ancestors`) از همان لحظه فعال‌اند و CSP فقط گزارش می‌دهد. سپس در فاز ۱، هم‌زمان با ساخت `middleware.ts` برای Auth، CSP با nonce اجرایی می‌شود.

> اگر تأیید کنید که اجرایی‌کردن CSP از همین حالا را ترجیح می‌دهید، گزینهٔ A را با nonce پیاده می‌کنم و صراحتاً می‌نویسم که این PR صفحات را Dynamic می‌کند.

---

## ۴. مقادیر دقیق هدرها

| هدر | مقدار پیشنهادی | هدف |
|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | جلوگیری از downgrade به HTTP |
| `X-Content-Type-Options` | `nosniff` | جلوگیری از MIME sniffing |
| `X-Frame-Options` | `DENY` | Clickjacking (برای مرورگرهای قدیمی، در کنار `frame-ancestors`) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | نشت مسیرهای داخلی/شناسهٔ بیمار در Referer |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` | بستن APIهای مرورگری بی‌استفاده |
| `Cross-Origin-Opener-Policy` | `same-origin` | جداسازی context پنجره |
| `Cross-Origin-Resource-Policy` | `same-origin` | جلوگیری از embedding منابع |
| `X-DNS-Prefetch-Control` | `on` | کارایی (بی‌خطر) |
| `X-Powered-By` | **حذف** (`poweredByHeader: false`) | کاهش fingerprinting |

CSP پیشنهادی (Report-Only، مرحلهٔ ۱):

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests
```

نکته: `'unsafe-inline'` در `script-src` موقتی است و در فاز ۱ با nonce حذف می‌شود. این دقیقاً همان چیزی است که گزارش‌های Report-Only قابل‌اندازه‌گیری می‌کنند.

اعمال روی همهٔ مسیرها: `source: "/:path*"` تا مسیرهای API و `_next/static` هم پوشش داده شوند؛ هدرهای امنیتی روی دارایی‌های استاتیک هم بی‌ضررند.

---

## ۵. مراحل اجرا (پس از تأیید)

| گام | کار | خروجی |
|---|---|---|
| ۱ | ویرایش `next.config.ts`: `poweredByHeader`, `productionBrowserSourceMaps`, `headers()` | فایل ۷ خطی → ~۵۵ خط با کامنت توضیحی |
| ۲ | افزودن CSP در Report-Only (فقط هدر، بدون endpoint گزارش در این مرحله) | — |
| ۳ | نوشتن `docs/security-headers.md`: هر هدر، چرایی، مقدار، و چه زمانی CSP اجرایی می‌شود | سند تصمیم |
| ۴ | اجرا و راستی‌آزمایی (بخش ۶) | شواهد خروجی |
| ۵ | کامیت + PR از برنچ جلسه | لینک PR |

---

## ۶. معیار پذیرش و راستی‌آزمایی

| بررسی | دستور | معیار قبولی |
|---|---|---|
| تایپ‌چک | `npx tsc --noEmit` | بدون خطا |
| لینت | `npx eslint .` | ۰ خطا (هشدار موجود `route.ts:27` از قبل هست و در دامنهٔ این PR نیست) |
| اجرای سرور | `next dev` روی `0.0.0.0:3000` | بالا می‌آید |
| هدرها | `curl -sSI http://localhost:3000/` | هر ۷ هدر با مقدار درست + نبودِ `X-Powered-By` |
| CSP | `curl -sSI ... \| grep -i content-security-policy` | فقط `-Report-Only` وجود دارد، نه نسخهٔ اجرایی |
| مسیر API | `curl -sSI http://localhost:3000/api/hello` | هدرها روی API هم اعمال شده‌اند |
| عدم شکست UI | بازکردن `/` در پیش‌نمایش | صفحه مثل قبل رندر می‌شود |

### ⚠️ دو نکتهٔ مهم دربارهٔ راستی‌آزمایی

1. **`next build` در این محیط شکست می‌خورد** — به دلیل `BUG-04` (واکشی Geist از Google Fonts) که هیچ ارتباطی با این تغییر ندارد. بنابراین راستی‌آزمایی از طریق `next dev` + `curl` انجام می‌شود. اگر `build` سبز هم لازم است، پیشنهاد می‌کنم **قبل از** این PR، یک PR یک‌خطی برای self-host فونت بزنیم (BUG-04) تا از این پس هر PR قابل build باشد. تصمیم با شما.
2. **تست خودکار وجود ندارد** (`TEST-01`). در این PR تست اضافه نمی‌کنم چون نیازمند راه‌اندازی فریم‌ورک است و دامنه را می‌شکند؛ اما بررسی `curl` را به‌صورت اسکریپت `scripts/verify-headers.sh` می‌گذارم تا بعداً به CI وصل شود — اگر مایل باشید (اختیاری).

---

## ۷. ریسک‌ها و بازگشت

| ریسک | احتمال | کاهش |
|---|---|---|
| شکستن اپ به‌خاطر CSP | بسیار کم (Report-Only است) | CSP اجرایی نیست؛ فقط گزارش |
| `frame-ancestors: none` با embed شدن در iframe پیش‌نمایش | متوسط | **مورد انتظار**: پیش‌نمایش خودش iframe است؛ باید بررسی کنم که `X-Frame-Options: DENY` پیش‌نمایش Arena را نشکند. اگر شکست، دامنه‌ها را به‌صورت مجاز استثنا می‌کنم و در گزارش می‌نویسم |
| `upgrade-insecure-requests` در محیط HTTP | کم | فقط روی CSP اثر دارد؛ در Report-Only بی‌اثر است |
| HSTS روی `localhost` | صفر | HSTS روی HTTP نادیده گرفته می‌شود |

**بازگشت:** تغییرات فقط در `next.config.ts` + یک فایل مستندات است. `git revert <commit>` کافی است؛ هیچ migration یا تغییر داده‌ای وجود ندارد.

**تخمین:** ۱ تا ۲ ساعت کار + بازبینی.

---

## ۸. دو نکتهٔ فرآیندی که باید بدانید

1. **نام برنچ:** طبق قالب پیام شما باید `fix/<name>` ساخته شود، اما در این جلسه من فقط مجازم روی `arena/72dd5c91-nextjs-tailwind-starter` کار کنم (Arena جلسه را با همین برنچ می‌شناسد). پس کامیت روی همین برنچ انجام و PR از آن به `main` باز می‌شود؛ اگر برنچ `fix/security-headers` را ترجیح می‌دهید، بعد از ساخت PR نامش را در GitHub تغییر دهید.
2. **قدم (ج) دربارهٔ کلیدهای API:** در حال حاضر **هیچ کلید API یا دادهٔ حساسی در کد نیست** (جست‌وجو شد: نه `.env`، نه string اعتبارنامه). `.env*` هم از قبل در `.gitignore` هست (خط ۲۸). بنابراین آن قدم در این ریپو موضوعیت ندارد مگر وقتی Auth/DB اضافه شود — آن‌وقت `.env.example` و `lib/env.ts` را می‌سازم.

---

## ۹. تأیید لازم

لطفاً یکی را انتخاب کنید:

- **الف)** همین پلن با گزینهٔ B (CSP فقط Report-Only) → شروع می‌کنم.
- **ب)** گزینهٔ A: CSP اجرایی با nonce از همین حالا (کل اپ Dynamic می‌شود).
- **ج)** اول `BUG-04` (self-host فونت) تا build سبز شود، بعد این PR.
- **د)** به‌جای این، مستقیماً سراغ `SEC-01` (Auth + RBAC) برویم — انتظار داشته باشید پلنش بزرگ‌تر و چندمرحله‌ای باشد.
