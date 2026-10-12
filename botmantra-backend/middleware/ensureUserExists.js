/**
 * Fix: Auto-create user records for successful auth
 * 
 * This middleware ensures that every authenticated user has a user record
 * in the users table and business context in business_users table.
 */

module.exports = async function ensureUserExists(req, res, next) {
  // Skip if no auth header
  if (!req.headers.authorization) {
    return next();
  }

  try {
    const token = req.headers.authorization.substring(7);
    const jwt = require('jsonwebtoken');
    const jwtPayload = jwt.decode(token);
    
    if (!jwtPayload) return next();
    
    const userId = jwtPayload.sub || jwtPayload.userId || jwtPayload.id;
    const userEmail = jwtPayload.email;
    
    if (!userId) return next();
    
    const supabase = req.supabase;
    
    // Check if user record exists by ID
    let userRecord = null;
    try {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();
      userRecord = data;
    } catch (err) {
      userRecord = null;
    }
    
    // If user record doesn't exist by ID, try by email
    let existingByEmail = null;
    if (!userRecord && userEmail) {
      try {
        const { data: emailRecord } = await supabase
          .from('users')
          .select('id')
          .eq('email', userEmail)
          .single();
        existingByEmail = emailRecord;
      } catch (err) {
        existingByEmail = null;
      }
    }
    
    // If user record doesn't exist, create it
    if (!userRecord) {
      if (existingByEmail) {
        // Email exists with different ID - this user authenticated with newer account
        // Just log the mismatch but continue (business_users handles the actual access)
        console.log(`[User Sync] Email ${userEmail} exists with ID ${existingByEmail.id}, current auth ID ${userId}`);
      } else {
        // Completely new user - create record
        try {
          await supabase
            .from('users')
            .insert({
              id: userId,
              email: userEmail || `user_${userId.substring(0, 8)}@app.local`,
              full_name: jwtPayload.full_name || jwtPayload.name || 'User',
              created_at: new Date().toISOString()
            });
        } catch (err) {
          console.log('[User Sync] User insert failed:', err.message);
        }
      }
    }
    
    // Check if business_users entry exists
    let businessUser = null;
    try {
      const { data } = await supabase
        .from('business_users')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      businessUser = data?.[0] || null;
    } catch (err) {
      businessUser = null;
    }
    
    // If business_users entry doesn't exist, create one
    if (!businessUser) {
      // Get or create a default business
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id')
        .limit(1);
      
      let businessId = businesses?.[0]?.id;
      
      // If no business exists, create one
      if (!businessId) {
        let newBusiness = null;
        try {
          const { data } = await supabase
            .from('businesses')
            .insert({
              name: 'Default Business',
              owner_id: userId,
              created_at: new Date().toISOString()
            })
            .select('id')
            .single();
          newBusiness = data;
        } catch (err) {
          console.log('[User Sync] Business creation failed:', err.message);
          newBusiness = null;
        }
        
        businessId = newBusiness?.id;
      }
      
      // Create business_users entry
      if (businessId) {
        try {
          await supabase
            .from('business_users')
            .insert({
              user_id: userId,
              business_id: businessId,
              role_id: 'user', // Default role
              joined_at: new Date().toISOString()
            });
        } catch (err) {
          console.log('[User Sync] business_users insert failed:', err.message);
        }
      }
    }
    
  } catch (error) {
    console.log('[User Sync] Error:', error.message);
    // Don't fail the request, just log the error
  }
  
  next();
};
