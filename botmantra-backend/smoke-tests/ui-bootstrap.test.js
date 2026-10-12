require('dotenv').config();

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const baseUrl = process.env.KERNEL_BASE_URL || process.env.API_BASE_URL || 'http://localhost:5000';

const getHeaders = () => {
  const token = process.env.AUTH_TOKEN;
  if (!token) return { 'Content-Type': 'application/json' };
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
};

const resolveContext = async () => {
  const token = process.env.AUTH_TOKEN;
  if (token) return {};

  let userId = process.env.TEST_USER_ID;
  let businessId = process.env.TEST_BUSINESS_ID;

  if (userId && businessId) {
    return { user_id: userId, business_id: businessId };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return { user_id: userId, business_id: businessId };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let user = null;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single();
    if (!error) {
      user = data;
    }
  } catch (error) {
    user = null;
  }

  if (user?.id) {
    userId = user.id;
    let businessUser = null;
    try {
      const { data, error } = await supabase
        .from('business_users')
        .select('business_id')
        .eq('user_id', userId)
        .limit(1)
        .single();
      if (!error) {
        businessUser = data;
      }
    } catch (error) {
      businessUser = null;
    }

    businessId = businessUser?.business_id;

    if (!businessId) {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('id')
          .limit(1)
          .single();
        if (!error) {
          businessId = data?.id;
        }
      } catch (error) {
        businessId = null;
      }
    }
  }

  return { user_id: userId, business_id: businessId };
};

const getBody = async () => {
  const context = await resolveContext();
  return {
    ...context,
    device: 'web',
    screen: 'dashboard'
  };
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const run = async () => {
  console.log('UI Bootstrap smoke test starting...');

  let response;
  try {
    const body = await getBody();
    response = await axios.post(`${baseUrl}/ui-bootstrap`, body, {
      headers: getHeaders(),
      validateStatus: () => true
    });
  } catch (error) {
    console.error('Request error:', error?.message || error);
    throw error;
  }

  if (!response) {
    throw new Error('No response received from /ui-bootstrap');
  }

  if (response.status >= 500) {
    console.error('Response status:', response.status);
    console.error('Response body:', response.data);
    throw new Error('Server error from /ui-bootstrap');
  }

  if (response.status !== 200) {
    console.error('Response status:', response.status);
    console.error('Response body:', response.data);
    throw new Error('UI bootstrap failed. Provide AUTH_TOKEN or TEST_USER_ID/TEST_BUSINESS_ID, or set SUPABASE_URL/SERVICE_ROLE_KEY for auto-resolution.');
  }

  const data = response.data || {};

  assert(data.layout || data.ui, 'Missing layout/ui in response');
  assert(data.screen, 'Missing screen in response');

  console.log('✅ UI Bootstrap smoke test passed');
};

run().catch((error) => {
  console.error('❌ UI Bootstrap smoke test failed:', error?.message || error);
  process.exit(1);
});
