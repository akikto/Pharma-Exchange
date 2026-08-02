# Brand Assets – MedLink B2B

## আপনার icon ও logo যোগ করুন

### ধাপ ১: ফাইল রাখুন

এই ফোল্ডারে (`frontend/public/brand/`) আপনার ফাইল কপি করুন:

| ফাইল | আকার | ব্যবহার |
|------|------|---------|
| `icon.png` | ৫১২×৫১২ px (বা বড়, বর্গাকার) | App icon, PWA, favicon |
| `logo.png` | প্রস্থ বেশি (যেমন ৮০০×২০০) | Login, Splash স্ক্রিন |
| `logo-light.png` | সাদা/হালকা রঙের লোগো | গাঢ় ব্যাকগ্রাউন্ডে (Splash) |

**সাপোর্টেড ফরম্যাট:** PNG, SVG, JPG, WEBP

### ধাপ ২: Icon জেনারেট করুন

```bash
npm run icons --workspace=frontend
```

এটি তৈরি করবে:
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `public/icons/icon-maskable-512.png`
- `public/favicon.svg` বা `favicon.png`

### ধাপ ৩: অ্যাপ চালু করুন

```bash
npm run dev
```

Splash, Login, Register এবং PWA install icon-এ আপনার logo দেখা যাবে।

---

## English

1. Copy your **square icon** to `icon.png` (min 512×512)
2. Optionally copy **horizontal logo** to `logo.png`
3. Run `npm run icons --workspace=frontend`
4. Restart dev server

## Tips

- **Icon** = বর্গাকার (১:১) — হোম স্ক্রিন, PWA
- **Logo** = অনুভূমিক — স্প্ল্যাশ ও লগইন পেজ
- স্বচ্ছ ব্যাকগ্রাউন্ড (PNG) সবচেয়ে ভালো ফল দেয়
- Theme color পরিবর্তন: `frontend/src/config/brand.ts`
