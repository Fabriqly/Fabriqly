const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

const { DashboardSummaryService } = require('./services/DashboardSummaryService');

// 🔥 Cloud Functions for Real-Time Dashboard Summary Updates

// Trigger when a new user is created
exports.onUserCreate = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    try {
      const userData = snap.data();
      console.log('📝 User created:', context.params.userId);

      await DashboardSummaryService.updateForOperation({
        type: 'user_created',
        entityId: context.params.userId,
        entityData: userData,
        timestamp: new Date().toISOString()
      });

      console.log('✅ User summary updated');
    } catch (error) {
      console.error('❌ Error updating user summary:', error);
    }
  });

// Trigger when a user is deleted
exports.onUserDelete = functions.firestore
  .document('users/{userId}')
  .onDelete(async (snap, context) => {
    try {
      console.log('🗑️ User deleted:', context.params.userId);

      await DashboardSummaryService.updateForOperation({
        type: 'user_deleted',
        entityId: context.params.userId,
        entityData: snap.data(),
        timestamp: new Date().toISOString()
      });

      console.log('✅ User deletion summary updated');
    } catch (error) {
      console.error('❌ Error updating deletion summary:', error);
    }
  });

// Trigger when a product is created
exports.onProductCreate = functions.firestore
  .document('products/{productId}')
  .onCreate(async (snap, context) => {
    try {
      const productData = snap.data();
      console.log('📦 Product created:', context.params.productId);

      await DashboardSummaryService.updateForOperation({
        type: 'product_created',
        entityId: context.params.productId,
        entityData: productData,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Product summary updated');
    } catch (error) {
      console.error('❌ Error updating product summary:', error);
    }
  });

// Trigger when a product is updated
exports.onProductUpdate = functions.firestore
  .document('products/{productId}')
  .onUpdate(async (change, context) => {
    try {
      const newData = change.after.data();
      const oldData = change.before.data();
      
      console.log('📦 Product updated:', context.params.productId);

      await DashboardSummaryService.updateForOperation({
        type: 'product_updated',
        entityId: context.params.productId,
        entityData: newData,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Product update summary updated');
    } catch (error) {
      console.error('❌ Error updating product summary:', error);
    }
  });

// Trigger when a product is deleted
exports.onProductDelete = functions.firestore
  .document('products/{productId}')
  .onDelete(async (snap, context) => {
    try {
      console.log('🗑️ Product deleted:', context.params.productId);

      await DashboardSummaryService.updateForOperation({
        URLParams::
        entityId: context.params.productId,
        entityData: snap.data(),
        timestamp: new Date().toISOString()
      });

      console.log('✅ Product deletion summary updated');
    } catch (error) {
      console.error('❌ Error updating product deletion summary:', error);
    }
  });

// Trigger when an order is created
exports.onOrderCreate = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    try {
      const orderData = snap.data();
      console.log('🛒 Order created:', context.params.orderId);

      await DashboardSummaryService.updateForOperation({
        type: 'order_created',
        entityId: context.params.orderId,
        entityData: orderData,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Order summary updated');
    } catch (error) {
      console.error('❌ Error updating order summary:', error);
    }
  });

// Trigger when an order is updated
exports.onOrderUpdate = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    try {
      const newData = change.after.data();
      
      console.log('🛒 Order updated:', context.params.orderId);

      await DashboardSummaryService.updateForOperation({
        type: 'order_updated',
        entityId: context.params.orderId,
        entityData: newData,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Order update summary updated');
    } catch (error) {
      console.error('❌ Error updating order summary:', error);
    }
  });

// Trigger when an order is deleted
exports.onOrderDelete = functions.firestore
  .document('orders/{orderId}')
  .onDelete(async (snap, context) => {
    try {
      console.log('🗑️ Order deleted:', context.params.orderId);

      await DashboardSummaryService.updateForOperation({
        type: 'order_deleted',
        entityId: context.params.orderId,
        entityData: snap.data(),
        timestamp: new Date().toISOString()
      });

      console.log('✅ Order deletion summary updated');
    } catch (error) {
      console.error('❌ Error updating order deletion summary:', error);
    }
  });

// 🔄 Scheduled Function for Periodic Summary Refresh
exports.scheduledSummaryRefresh = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    try {
      console.log('⏰ Scheduled summary refresh triggered');
      await DashboardSummaryService.refreshSummary();
      console.log('✅ Scheduled summary refresh completed');
    } catch (error) {
      console.error('❌ Error in scheduled summary refresh:', error);
    }
  });

// 🚀 Manual Trigger Function (HTTP)
exports.manualRefreshSummary = functions.https.onRequest(async (req, res) => {
  try {
    // Basic auth check (you should add proper authentication)
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${functions.config().admin.key}`) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    console.log('🔄 Manual summary refresh triggered via HTTP');
    const summary = await DashboardSummaryService.refreshSummary();
    
    res.status(200).json({
      success: true,
      message: 'Summary refreshed successfully',
      summary: {
        totalUsers: summary.totalUsers,
        totalProducts: summary.totalProducts,
        totalOrders: summary.totalOrders,
        totalRevenue: summary.totalRevenue,
        activeProducts: summary.activeProducts,
        pendingOrders: summary.pendingOrders,
        lastUpdated: summary.lastUpdated
      }
    });

  } catch (error) {
    console.error('❌ Error in manual refresh:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
