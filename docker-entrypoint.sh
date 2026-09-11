#!/bin/sh
set -e
# أول تشغيل: تجهيز قاعدة البيانات، ثم افتح /setup من المتصفح لإنشاء المتجر والمدير
if [ ! -f /data/dokkanek.db ]; then
  echo "Initializing database..."
  npx prisma db push
fi
exec "$@"
