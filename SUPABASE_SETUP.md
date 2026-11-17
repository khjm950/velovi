# إعداد اتصال Supabase في Velovi

هذه الخطوة مطلوبة مرة واحدة قبل تسجيل الدخول.

1. افتح مشروع Velovi في Supabase.
2. افتح **Project Settings → API** (قد تظهر صفحة المفاتيح باسم **API Keys**).
3. انسخ **Project URL**.
4. انسخ **Publishable key** أو مفتاح **anon / public** القديم.
5. افتح ملف `supabase-config.js` في مستودع GitHub وعدّل القيمتين:

```js
window.VELOVI_SUPABASE_CONFIG = {
  url: "https://YOUR_PROJECT_REF.supabase.co",
  anonKey: "YOUR_PUBLISHABLE_OR_ANON_KEY"
};
```

6. احفظ التعديل وانتظر نشر الموقع، ثم أعد تحميل Velovi.

## تنبيه أمني مهم

- المفتاح المسموح به في المتصفح هو **Publishable / anon** فقط.
- لا تضع أبداً `service_role` أو أي Secret key في `supabase-config.js` أو أي ملف واجهة.
- تعتمد حماية بيانات الأسرة على سياسات RLS ووظائف قاعدة البيانات؛ المفتاح العام ليس بديلاً عنها.
- مكتبة Supabase JavaScript تُحمّل من jsDelivr، لذلك يلزم اتصال بالإنترنت عند تسجيل الدخول.

## ما تتضمنه هذه المرحلة

- تسجيل الدخول بحساب Supabase Auth موجود.
- إنشاء أسرة عبر RPC `create_household`.
- قراءة الأسرة والعضويات وفق سياسات RLS.
- إضافة عضو موجود مسبقاً باستخدام UID عبر `add_household_member`.
- تحديث صلاحيات العضو وإزالته عبر وظائف RPC الحالية.
- إخفاء بيانات العرض التجريبي حتى لا تظهر كبيانات حقيقية.

ربط الحسابات والحركات المالية لم يكتمل في هذه المرحلة، وستبقى أزرار الإضافة المالية معطلة إلى أن نربط مخطط هذين الجدولين وعمليات RLS الخاصة بهما.
