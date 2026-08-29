// Initialize Firebase
firebase.initializeApp(window.firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// Collections references
const appDataDocRef = db.collection('appConfig').doc('data');
const usersCollection = db.collection('users');
const operationsArchiveCollection = db.collection('operationsArchive');
const exchangeCollection = db.collection('bookExchanges');
const userChosenBooksCollection = db.collection('userChosenBooks');

let currentUser = null;
let isAdmin = false;

// التحقق من الصلاحيات
async function checkAuth() {
  return new Promise((resolve, reject) => {
    auth.onAuthStateChanged(async (user) => {
      const authStatus = document.getElementById('authStatus');
      if (!user) {
        authStatus.innerHTML = '🔒 يجب تسجيل الدخول أولاً<br><small>سيتم تحويلك للصفحة الرئيسية...</small>';
        setTimeout(() => window.location.href = 'index.html', 2000);
        reject('Not authenticated');
        return;
      }
      
      try {
        const userDoc = await usersCollection.doc(user.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          currentUser = { ...user, ...userData };
          isAdmin = userData.isAdmin || false;
          
          if (!isAdmin) {
            authStatus.innerHTML = '⚠️ هذه الصفحة متاحة فقط للمدراء<br><small>سيتم تحويلك للصفحة الرئيسية...</small>';
            setTimeout(() => window.location.href = 'index.html', 2000);
            reject('Not admin');
            return;
          }
          
          authStatus.innerHTML = '✅ تم التحقق من الصلاحيات بنجاح';
          setTimeout(() => {
            document.getElementById('authGuard').classList.add('hidden');
            document.getElementById('statsApp').classList.remove('hidden');
            loadAllStats();
          }, 1000);
          resolve(currentUser);
        } else {
          authStatus.innerHTML = '❌ لم يتم العثور على بيانات المستخدم';
          reject('User data not found');
        }
      } catch (error) {
        authStatus.innerHTML = '❌ خطأ في التحقق من الصلاحيات';
        reject(error);
      }
    });
  });
}

// تحميل جميع الإحصائيات
async function loadAllStats() {
  try {
    // Show loading indicators
    document.querySelectorAll('.loading').forEach(el => el.style.display = 'block');
    
    // Load all data in parallel
    await Promise.all([
      loadLevelsAndBooks(),
      loadUsersStats(),
      loadArchiveStats(),
      loadChosenBooksStats(),
      loadStorageStats(),
      loadExchangeStats(),
      loadActiveUsersStats(),
      loadMessagesStats(),
      loadNotificationsStats()
    ]);
    
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// تحميل إحصائيات المستويات والكتب
async function loadLevelsAndBooks() {
  try {
    const doc = await appDataDocRef.get();
    const data = doc.exists ? doc.data() : {};
    const levels = data.levels || [];
    
    // Update KPIs
    document.getElementById('kpiLevels').textContent = levels.length;
    
    let totalBooks = 0;
    let booksWithoutImage = 0;
    const bookNames = new Map();
    const levelsList = document.getElementById('levelsList');
    levelsList.innerHTML = '';
    
    levels.forEach(level => {
      const books = level.books || [];
      totalBooks += books.length;
      
      // Count books without images
      books.forEach(book => {
        const hasImage = (level.booksWithImages && level.booksWithImages[book]) || 
                       (level.bookImages && level.bookImages[book]);
        if (!hasImage) booksWithoutImage++;
        
        // Track duplicate names
        if (!bookNames.has(book)) {
          bookNames.set(book, []);
        }
        bookNames.get(book).push(level.name);
      });
      
      // Add to levels list
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <div>${level.name}</div>
        <div class="pill info">${books.length} كتاب</div>
      `;
      levelsList.appendChild(item);
    });
    
    // Count duplicates
    let duplicates = 0;
    bookNames.forEach((levels, book) => {
      if (levels.length > 1) duplicates++;
    });
    
    // Update KPIs
    document.getElementById('kpiBooks').textContent = totalBooks;
    document.getElementById('booksNoImage').textContent = booksWithoutImage;
    document.getElementById('booksDuplicate').textContent = duplicates;
    
    // Count books without level in exchanges
    const exchangesSnapshot = await exchangeCollection.get();
    let booksNoLevel = 0;
    exchangesSnapshot.forEach(doc => {
      const exchange = doc.data();
      if (!exchange.bookLevel || exchange.bookLevel === '') {
        booksNoLevel++;
      }
    });
    document.getElementById('booksNoLevel').textContent = booksNoLevel;
    
  } catch (error) {
    console.error('Error loading levels:', error);
  }
}

// تحميل إحصائيات المستخدمين
async function loadUsersStats() {
  try {
    const snapshot = await usersCollection.get();
    let totalUsers = 0;
    let activeUsers = 0;
    let pendingUsers = 0;
    let adminUsers = 0;
    const recentSignups = new Map(); // date -> count
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    snapshot.forEach(doc => {
      const user = doc.data();
      totalUsers++;
      
      if (user.isActive) activeUsers++;
      else pendingUsers++;
      
      if (user.isAdmin) adminUsers++;
      
      // Track recent signups
      if (user.createdAt) {
        const createdDate = user.createdAt.toDate();
        if (createdDate >= sevenDaysAgo) {
          const dateKey = createdDate.toLocaleDateString('ar-EG');
          recentSignups.set(dateKey, (recentSignups.get(dateKey) || 0) + 1);
        }
      }
    });
    
    // Update KPIs
    document.getElementById('kpiUsers').textContent = totalUsers;
    document.getElementById('kpiUsersActive').textContent = activeUsers;
    document.getElementById('kpiUsersPending').textContent = pendingUsers;
    document.getElementById('usersTotal').textContent = totalUsers;
    document.getElementById('usersActive').textContent = activeUsers;
    document.getElementById('usersPending').textContent = pendingUsers;
    document.getElementById('usersAdmins').textContent = adminUsers;
    
    // Create signups chart
    const chartContainer = document.getElementById('signupsChart');
    chartContainer.innerHTML = '';
    
    // Generate last 7 days
    const maxCount = Math.max(...Array.from(recentSignups.values()), 1);
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toLocaleDateString('ar-EG');
      const count = recentSignups.get(dateKey) || 0;
      const height = (count / maxCount) * 100;
      
      const bar = document.createElement('div');
      bar.className = 'bar';
      bar.style.height = `${height}%`;
      bar.title = `${dateKey}: ${count} تسجيل`;
      chartContainer.appendChild(bar);
    }
    
  } catch (error) {
    console.error('Error loading users stats:', error);
  }
}

// تحميل إحصائيات الأرشيف
async function loadArchiveStats() {
  try {
    const snapshot = await operationsArchiveCollection.get();
    let addCount = 0;
    let editCount = 0;
    let deleteCount = 0;
    const byEntity = new Map();
    const byUser = new Map();
    
    snapshot.forEach(doc => {
      const operation = doc.data();
      
      // Count by action
      if (operation.action === 'add' || operation.action === 'إضافة') addCount++;
      else if (operation.action === 'edit' || operation.action === 'تعديل') editCount++;
      else if (operation.action === 'delete' || operation.action === 'حذف') deleteCount++;
      
      // Count by entity
      const entity = operation.entity || 'غير محدد';
      byEntity.set(entity, (byEntity.get(entity) || 0) + 1);
      
      // Count by user
      const userName = operation.performedBy || 'مجهول';
      byUser.set(userName, (byUser.get(userName) || 0) + 1);
    });
    
    // Update KPIs
    document.getElementById('kpiArchive').textContent = snapshot.size;
    document.getElementById('archiveAdd').textContent = addCount;
    document.getElementById('archiveEdit').textContent = editCount;
    document.getElementById('archiveDelete').textContent = deleteCount;
    
    // Update entity distribution
    const entityList = document.getElementById('archiveByEntity');
    entityList.innerHTML = '';
    Array.from(byEntity.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([entity, count]) => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
          <div>${entity}</div>
          <div class="pill">${count}</div>
        `;
        entityList.appendChild(item);
      });
    
    // Update top active users
    const usersList = document.getElementById('topActiveUsers');
    usersList.innerHTML = '';
    Array.from(byUser.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([user, count]) => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
          <div>${user}</div>
          <div class="pill info">${count} عملية</div>
        `;
        usersList.appendChild(item);
      });
    
  } catch (error) {
    console.error('Error loading archive stats:', error);
  }
}

// تحميل إحصائيات الكتب المختارة
async function loadChosenBooksStats() {
  try {
    const snapshot = await userChosenBooksCollection.get();
    const bookCounts = new Map();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const chosenBooks = data.chosenBooks || {};
      
      Object.entries(chosenBooks).forEach(([level, books]) => {
        Object.entries(books).forEach(([book, count]) => {
          const key = `${book} (${level})`;
          bookCounts.set(key, (bookCounts.get(key) || 0) + count);
        });
      });
    });
    
    // Update top chosen books
    const topBooks = document.getElementById('topChosenBooks');
    topBooks.innerHTML = '';
    
    if (bookCounts.size === 0) {
      topBooks.innerHTML = '<div class="list-item">لا توجد كتب مختارة بعد</div>';
    } else {
      Array.from(bookCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([book, count], index) => {
          const item = document.createElement('div');
          item.className = 'list-item';
          item.innerHTML = `
            <div>${index + 1}. ${book}</div>
            <div class="pill success">${count} اختيار</div>
          `;
          topBooks.appendChild(item);
        });
    }
    
  } catch (error) {
    console.error('Error loading chosen books stats:', error);
  }
}

// تحميل إحصائيات التخزين
async function loadStorageStats() {
  try {
    // This is an estimation since Firebase Storage doesn't provide direct APIs for total size
    // In production, you might want to track this separately in Firestore
    
    let imagesCount = 0;
    let attachmentsCount = 0;
    let totalSize = 0;
    
    // Count book images from levels data
    const doc = await appDataDocRef.get();
    const data = doc.exists ? doc.data() : {};
    const levels = data.levels || [];
    
    levels.forEach(level => {
      const imagesA = level.booksWithImages || {};
      const imagesB = level.bookImages || {};
      imagesCount += Object.keys(imagesA).length + Object.keys(imagesB).length;
    });
    
    // Count exchange images
    const exchangesSnapshot = await exchangeCollection.get();
    exchangesSnapshot.forEach(doc => {
      const exchange = doc.data();
      if (exchange.bookImageUrl) imagesCount++;
    });
    
    // Estimate sizes (these are approximate)
    const avgImageSize = 200 * 1024; // 200KB average per image
    const avgAttachmentSize = 500 * 1024; // 500KB average per attachment
    
    const imagesSize = imagesCount * avgImageSize;
    const attachmentsSize = attachmentsCount * avgAttachmentSize;
    totalSize = imagesSize + attachmentsSize;
    
    // Update display
    document.getElementById('storageImages').textContent = formatBytes(imagesSize);
    document.getElementById('storageAttachments').textContent = formatBytes(attachmentsSize);
    document.getElementById('storageTotal').textContent = formatBytes(totalSize);
    document.getElementById('imagesCount').textContent = imagesCount;
    document.getElementById('attachmentsCount').textContent = attachmentsCount;
    
  } catch (error) {
    console.error('Error loading storage stats:', error);
    document.getElementById('storageImages').textContent = 'خطأ في التحميل';
    document.getElementById('storageAttachments').textContent = 'خطأ في التحميل';
    document.getElementById('storageTotal').textContent = 'خطأ في التحميل';
  }
}

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 بايت';
  const k = 1024;
  const sizes = ['بايت', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// تحميل إحصائيات تبادل الكتب
async function loadExchangeStats() {
  try {
    const snapshot = await exchangeCollection.get();
    let openCount = 0;
    let closedCount = 0;
    let offersCount = 0;
    let requestsCount = 0;
    const bookCounts = new Map();
    const levelCounts = new Map();
    const userContributions = new Map();
    const closeTimes = [];
    
    const now = new Date();
    
    snapshot.forEach(doc => {
      const exchange = doc.data();
      
      // Count open/closed
      if (exchange.status === 'closed' || exchange.isClosed) {
        closedCount++;
        // Calculate close time if dates available
        if (exchange.createdAt && exchange.closedAt) {
          const created = exchange.createdAt.toDate();
          const closed = exchange.closedAt.toDate();
          const timeDiff = closed - created;
          closeTimes.push(timeDiff);
        }
      } else if (!exchange.expiryDate || exchange.expiryDate.toDate() > now) {
        openCount++;
      } else {
        closedCount++; // Expired
      }
      
      // Count offers/requests
      if (exchange.type === 'offer') offersCount++;
      else if (exchange.type === 'request') requestsCount++;
      
      // Count by book
      const bookKey = `${exchange.bookName} (${exchange.bookLevel || 'غير محدد'})`;
      bookCounts.set(bookKey, (bookCounts.get(bookKey) || 0) + 1);
      
      // Count by level
      const level = exchange.bookLevel || 'غير محدد';
      levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
      
      // Count user contributions
      const userName = exchange.userName || 'مجهول';
      userContributions.set(userName, (userContributions.get(userName) || 0) + 1);
    });
    
    // Calculate average close time
    let avgCloseTime = '-';
    if (closeTimes.length > 0) {
      const avgMs = closeTimes.reduce((a, b) => a + b, 0) / closeTimes.length;
      const days = Math.floor(avgMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((avgMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      avgCloseTime = `${days} يوم ${hours} ساعة`;
    }
    
    // Update display
    document.getElementById('exchangeOpen').textContent = openCount;
    document.getElementById('exchangeClosed').textContent = closedCount;
    document.getElementById('exchangeOffers').textContent = offersCount;
    document.getElementById('exchangeRequests').textContent = requestsCount;
    document.getElementById('exchangeAvgCloseTime').textContent = avgCloseTime;
    
    // Top books in exchange
    const topBooksEl = document.getElementById('topExchangeBooks');
    topBooksEl.innerHTML = '';
    Array.from(bookCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([book, count], index) => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
          <div>${index + 1}. ${book}</div>
          <div class="pill info">${count} إعلان</div>
        `;
        topBooksEl.appendChild(item);
      });
    
    // Top levels in exchange
    const topLevelsEl = document.getElementById('topExchangeLevels');
    topLevelsEl.innerHTML = '';
    Array.from(levelCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([level, count]) => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
          <div>${level}</div>
          <div class="pill">${count} إعلان</div>
        `;
        topLevelsEl.appendChild(item);
      });
    
    // Top contributors
    const topContributorsEl = document.getElementById('topExchangeContributors');
    topContributorsEl.innerHTML = '';
    Array.from(userContributions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([user, count]) => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
          <div>${user}</div>
          <div class="pill success">${count} إعلان</div>
        `;
        topContributorsEl.appendChild(item);
      });
    
  } catch (error) {
    console.error('Error loading exchange stats:', error);
  }
}

// تحميل إحصائيات المستخدمين النشطين
async function loadActiveUsersStats() {
  try {
    // This requires tracking last activity in user documents
    // For now, we'll estimate based on created/modified dates
    const snapshot = await usersCollection.get();
    const now = new Date();
    const day = 24 * 60 * 60 * 1000;
    
    let active24h = 0;
    let active7d = 0;
    let active30d = 0;
    
    snapshot.forEach(doc => {
      const user = doc.data();
      // Check last activity (you may need to add lastActivity field)
      const lastActivity = user.lastActivity ? user.lastActivity.toDate() : 
                          user.lastLogin ? user.lastLogin.toDate() : 
                          user.createdAt ? user.createdAt.toDate() : null;
      
      if (lastActivity) {
        const timeDiff = now - lastActivity;
        if (timeDiff <= day) active24h++;
        if (timeDiff <= 7 * day) active7d++;
        if (timeDiff <= 30 * day) active30d++;
      }
    });
    
    document.getElementById('activeUsers24h').textContent = active24h;
    document.getElementById('activeUsers7d').textContent = active7d;
    document.getElementById('activeUsers30d').textContent = active30d;
    
    // Conversion rates (these would need proper tracking)
    // For now, showing placeholder values
    document.getElementById('conversionMatchToMessage').textContent = '0%';
    document.getElementById('conversionMessageToClose').textContent = '0%';
    document.getElementById('conversionOverall').textContent = '0%';
    
  } catch (error) {
    console.error('Error loading active users stats:', error);
  }
}

// تحميل إحصائيات الرسائل
async function loadMessagesStats() {
  try {
    // Admin messages
    const adminMessagesSnapshot = await db.collection('adminMessages').get();
    let totalAdminMessages = 0;
    let adminMessagesWithAttachments = 0;
    let messagesRead24h = 0;
    let totalRead = 0;
    const now = new Date();
    const day = 24 * 60 * 60 * 1000;
    
    adminMessagesSnapshot.forEach(doc => {
      const message = doc.data();
      totalAdminMessages++;
      
      if (message.attachment || message.attachmentUrl) {
        adminMessagesWithAttachments++;
      }
      
      // Check read status (needs tracking)
      if (message.readBy && message.readBy.length > 0) {
        totalRead += message.readBy.length;
        // Check if read within 24h
        if (message.sentAt) {
          const sentTime = message.sentAt.toDate();
          message.readBy.forEach(reader => {
            if (reader.readAt) {
              const readTime = reader.readAt.toDate();
              if ((readTime - sentTime) <= day) {
                messagesRead24h++;
              }
            }
          });
        }
      }
    });
    
    // Calculate read rates
    const totalRecipients = totalAdminMessages * (await usersCollection.get()).size;
    const read24hRate = totalRecipients > 0 ? Math.round((messagesRead24h / totalRecipients) * 100) : 0;
    const totalReadRate = totalRecipients > 0 ? Math.round((totalRead / totalRecipients) * 100) : 0;
    
    document.getElementById('adminMessagesSent').textContent = totalAdminMessages;
    document.getElementById('adminMessagesRead24h').textContent = `${read24hRate}%`;
    document.getElementById('adminMessagesReadTotal').textContent = `${totalReadRate}%`;
    document.getElementById('adminMessagesWithAttach').textContent = adminMessagesWithAttachments;
    
    // User to admin messages
    const userMessagesSnapshot = await db.collection('userMessages')
      .where('toUserId', '==', 'admin')
      .get();
    
    let userToAdminCount = userMessagesSnapshot.size;
    let unanswered = 0;
    
    userMessagesSnapshot.forEach(doc => {
      const message = doc.data();
      if (!message.replied) {
        unanswered++;
      }
    });
    
    document.getElementById('userToAdminMessages').textContent = userToAdminCount;
    document.getElementById('unansweredMessages').textContent = unanswered;
    document.getElementById('avgResponseTime').textContent = '-'; // Needs tracking
    
  } catch (error) {
    console.error('Error loading messages stats:', error);
  }
}

// تحميل إحصائيات الإشعارات
async function loadNotificationsStats() {
  try {
    const notificationsSnapshot = await db.collection('notifications').get();
    let totalNotifications = 0;
    let readNotifications = 0;
    let matchNotifications = 0;
    let matchEngaged = 0;
    
    notificationsSnapshot.forEach(doc => {
      const notification = doc.data();
      totalNotifications++;
      
      if (notification.isRead) {
        readNotifications++;
      }
      
      // Check if it's a match notification
      if (notification.type === 'book_match' || notification.type === 'special_match') {
        matchNotifications++;
        if (notification.isRead || notification.clicked) {
          matchEngaged++;
        }
      }
    });
    
    // Calculate rates
    const readRate = totalNotifications > 0 ? Math.round((readNotifications / totalNotifications) * 100) : 0;
    const matchEngagementRate = matchNotifications > 0 ? Math.round((matchEngaged / matchNotifications) * 100) : 0;
    
    document.getElementById('notificationsSent').textContent = totalNotifications;
    document.getElementById('notificationsRead').textContent = readNotifications;
    document.getElementById('notificationReadRate').textContent = `${readRate}%`;
    document.getElementById('matchNotificationsSent').textContent = matchNotifications;
    document.getElementById('matchNotificationEngagement').textContent = `${matchEngagementRate}%`;
    document.getElementById('matchToMessageConversion').textContent = '0'; // Needs tracking
    
  } catch (error) {
    console.error('Error loading notifications stats:', error);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  checkAuth().catch(error => {
    console.error('Authentication error:', error);
  });
});
