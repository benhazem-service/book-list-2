// Helper functions to track user activities for better statistics
// This file can be imported in main.js to track various activities

// Track user activity
async function trackUserActivity(userId, activityType, details = {}) {
  try {
    const db = firebase.firestore();
    await db.collection('userActivities').add({
      userId: userId,
      activityType: activityType, // 'search', 'message', 'exchange', 'login', etc.
      details: details,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Update last activity in user document
    await db.collection('users').doc(userId).update({
      lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
      [`activityCounts.${activityType}`]: firebase.firestore.FieldValue.increment(1)
    });
  } catch (error) {
    console.error('Error tracking activity:', error);
  }
}

// Track search queries
async function trackSearchQuery(query, level, userId) {
  try {
    const db = firebase.firestore();
    await db.collection('searchQueries').add({
      query: query,
      level: level,
      userId: userId,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error tracking search:', error);
  }
}

// Track conversion from notification to action
async function trackNotificationConversion(notificationId, action) {
  try {
    const db = firebase.firestore();
    await db.collection('notifications').doc(notificationId).update({
      conversions: firebase.firestore.FieldValue.arrayUnion({
        action: action, // 'clicked', 'messaged', 'exchangeCreated'
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      })
    });
  } catch (error) {
    console.error('Error tracking conversion:', error);
  }
}

// Track message response time
async function trackMessageResponse(messageId, responseTime) {
  try {
    const db = firebase.firestore();
    await db.collection('messageMetrics').add({
      messageId: messageId,
      responseTime: responseTime, // in milliseconds
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error tracking message response:', error);
  }
}

// Track exchange closure
async function trackExchangeClosure(exchangeId, createdAt) {
  try {
    const db = firebase.firestore();
    const closedAt = new Date();
    const duration = closedAt - createdAt;
    
    await db.collection('bookExchanges').doc(exchangeId).update({
      closedAt: closedAt,
      status: 'closed',
      closureDuration: duration
    });
    
    // Update metrics collection
    await db.collection('exchangeMetrics').add({
      exchangeId: exchangeId,
      closureDuration: duration,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error tracking exchange closure:', error);
  }
}

// Export functions for use in other files
if (typeof window !== 'undefined') {
  window.trackUserActivity = trackUserActivity;
  window.trackSearchQuery = trackSearchQuery;
  window.trackNotificationConversion = trackNotificationConversion;
  window.trackMessageResponse = trackMessageResponse;
  window.trackExchangeClosure = trackExchangeClosure;
}
