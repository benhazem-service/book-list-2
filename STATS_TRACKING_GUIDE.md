# دليل تتبع الإحصائيات المتقدمة

## الإحصائيات الجديدة المضافة

### 1. نشاط تبادل الكتب
- **إعلانات مفتوحة/مغلقة**: يتم حسابها تلقائياً من حالة الإعلان
- **متوسط زمن الإغلاق**: يحتاج إضافة حقل `closedAt` عند إغلاق الإعلان
- **أكثر الكتب والمستويات نشاطاً**: محسوبة تلقائياً
- **أعلى المستخدمين مساهمة**: محسوبة من عدد الإعلانات

### 2. نشاط المستخدمين
- **المستخدمون النشطون (24h/7d/30d)**: يحتاج تتبع `lastActivity` في مستند المستخدم
- **نسب التحويل**: تحتاج تتبع خاص باستخدام `tracking-helper.js`

### 3. الرسائل والإشعارات
- **رسائل الإدارة**: محسوبة من مجموعة `adminMessages`
- **نسب القراءة**: تحتاج تتبع `readBy` array مع timestamps
- **إشعارات المطابقة**: محسوبة من نوع الإشعار
- **نسبة التفاعل**: تحتاج تتبع النقرات والتحويلات

## كيفية تحسين دقة الإحصائيات

### 1. إضافة تتبع النشاط في main.js

```javascript
// Import tracking helper
<script src="tracking-helper.js"></script>

// Track user login
auth.onAuthStateChanged(async (user) => {
  if (user) {
    await trackUserActivity(user.uid, 'login');
  }
});

// Track search in exchange
function performExchangeSearch() {
  const query = document.getElementById('exchangeSearchInput').value;
  const level = document.getElementById('exchangeLevelSelect').value;
  
  // Track search
  if (currentUser) {
    trackSearchQuery(query, level, currentUser.uid);
  }
  
  // ... rest of search logic
}

// Track exchange closure
function closeExchange(exchangeId) {
  const exchangeDoc = await exchangeCollection.doc(exchangeId).get();
  const createdAt = exchangeDoc.data().createdAt.toDate();
  
  await trackExchangeClosure(exchangeId, createdAt);
  
  // ... rest of closure logic
}

// Track notification conversion
function handleNotificationClick(notificationId, notificationType) {
  await trackNotificationConversion(notificationId, 'clicked');
  
  // If user creates message after clicking
  if (userSendsMessage) {
    await trackNotificationConversion(notificationId, 'messaged');
  }
  
  // If user creates exchange after clicking
  if (userCreatesExchange) {
    await trackNotificationConversion(notificationId, 'exchangeCreated');
  }
}
```

### 2. إضافة حقول التتبع في Firestore

#### في مستند المستخدم (users collection):
```javascript
{
  // ... existing fields
  "lastActivity": timestamp,
  "lastLogin": timestamp,
  "activityCounts": {
    "search": number,
    "message": number,
    "exchange": number,
    "login": number
  }
}
```

#### في مستند الإعلان (bookExchanges collection):
```javascript
{
  // ... existing fields
  "createdAt": timestamp,
  "closedAt": timestamp,
  "status": "open" | "closed",
  "closureDuration": number // milliseconds
}
```

#### في مستند الرسالة الإدارية (adminMessages collection):
```javascript
{
  // ... existing fields
  "sentAt": timestamp,
  "readBy": [
    {
      "userId": string,
      "readAt": timestamp
    }
  ],
  "attachment": {
    "url": string,
    "name": string,
    "viewCount": number,
    "downloadCount": number
  }
}
```

#### في مستند الإشعار (notifications collection):
```javascript
{
  // ... existing fields
  "type": "book_match" | "special_match" | "general",
  "isRead": boolean,
  "clicked": boolean,
  "conversions": [
    {
      "action": "clicked" | "messaged" | "exchangeCreated",
      "timestamp": timestamp
    }
  ]
}
```

### 3. تحديث دوال الإغلاق والقراءة

```javascript
// Mark admin message as read
async function markAdminMessageAsRead(messageId, userId) {
  await db.collection('adminMessages').doc(messageId).update({
    readBy: firebase.firestore.FieldValue.arrayUnion({
      userId: userId,
      readAt: firebase.firestore.FieldValue.serverTimestamp()
    })
  });
}

// Close exchange with tracking
async function closeExchangeWithTracking(exchangeId) {
  const now = new Date();
  await db.collection('bookExchanges').doc(exchangeId).update({
    status: 'closed',
    closedAt: now,
    closureDuration: firebase.firestore.FieldValue.serverTimestamp()
  });
}
```

## الإحصائيات المستقبلية الموصى بها

1. **معدل الاحتفاظ بالمستخدمين**: نسبة المستخدمين الذين يعودون بعد 7/30 يوم
2. **معدل النمو الشهري**: مقارنة المستخدمين الجدد شهرياً
3. **أوقات الذروة**: أكثر الأوقات نشاطاً في اليوم/الأسبوع
4. **معدل الأخطاء**: تتبع الأخطاء في الرفع/التحميل/العمليات
5. **رضا المستخدمين**: نظام تقييم للتبادلات الناجحة

## ملاحظات مهمة

- بعض الإحصائيات تظهر كـ "0" أو "-" لأنها تحتاج تتبع إضافي
- يمكن تحسين دقة الإحصائيات بإضافة المزيد من نقاط التتبع
- التتبع الإضافي لن يؤثر على الأداء إذا تم بشكل غير متزامن
- يُنصح بإضافة فهارس Firestore للاستعلامات المعقدة
