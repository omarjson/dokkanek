# نشر دكّانك

## أ) ويندوز — للمحلات (الأسهل، بدون خبرة)

1. ثبت **Node.js LTS** من `nodejs.org` (التالي-التالي-إنهاء).
2. انسخ مجلد المشروع (أو `git clone`) وافتحه.
3. نقرة مزدوجة على **`install.bat`** — يثبت ويجهز ويفتح المنظومة.
4. افتح المتصفح: `http://localhost:3000` — معالج التثبيت يظهر تلقائيا أول مرة.
5. حسابات التجربة: `admin / admin123`.

> هذه هي خدمة التثبيت المدفوعة: تنصيب + تجهيز أصناف المحل + تدريب سريع.

## ب) سيرفر VPS — للفروع والاستضافة (Docker)

أرخص خيار عملي: أي VPS بذاكرة 1GB+ (تكلفة شهرية رمزية) + Docker.

## 1. تجهيز السيرفر (Ubuntu)

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git
sudo usermod -aG docker $USER
# سجل خروج ودخول لتفعيل مجموعة docker
```

## 2. التشغيل

```bash
git clone https://github.com/omarjson/dokkanek.git
cd dokkanek
docker compose up -d --build
```

افتح `http://SERVER_IP:3000/setup` وأكمل معالج التثبيت (المتجر + المدير).

## 3. رابط آمن (اختياري)

- الأسهل: Cloudflare Tunnel يشير إلى `localhost:3000` (HTTPS مجاني بدون فتح منافذ).
- أو: Caddy/Nginx كوكيل عكسي + شهادة Let's Encrypt.

## 4. النسخ الاحتياطي

```bash
# نسخة من القاعدة خارج الحاوية
docker cp dokkanek:/data/dokkanek.db ./dokkanek-backup-$(date +%F).db
```

أضف الأمر لـ cron أسبوعيا. (يوجد زر تنزيل نسخة من داخل صفحة الإعدادات أيضا.)

## 5. التحديث لإصدار جديد

```bash
cd dokkanek
git pull
docker compose up -d --build
```

البيانات في مجلد `dokkanek-data` لا تُمس عند التحديث.

## ملاحظات الإنتاج

- غيّر منفذ `3000` في `docker-compose.yml` لو محجوز.
- للفروع المتعددة: نسخة واحدة مركزية + دخول كل فرع بحسابه.
- كلمات المرور مخزنة مشفرة (SHA-256 + ملح خاص)، والجلسات HttpOnly.
