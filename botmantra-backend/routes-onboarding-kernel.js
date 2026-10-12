/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * UNIFIED ONBOARDING KERNEL API
 * Complete system for AI-guided, voice, SSO, and referral onboarding
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();

module.exports = function(app, supabaseClient, io) {
  /**
   * POST /api/kernel/post-login-bootstrap
   * 🔑 CORE ENTRY POINT
   * 
   * Executed immediately after any login (OTP, SSO, Email, Social)
   * Creates node identity, initializes trust state, sets up session context
   */
  router.post('/kernel/post-login-bootstrap', async (req, res) => {
    try {
      const { userId, domain, deviceFingerprint, referralCode, ip, userAgent } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
      }

      // 1. DETECT BRAND FROM DOMAIN
      const brandId = resolveBrandFromDomain(domain);
      
      // 2. GET/CREATE USER NODE IDENTITY
      const { data: identity, error: identityError } = await supabaseClient
        .from('node_identity')
        .select('*')
        .eq('user_id', userId)
        .eq('brand', brandId)
        .single();

      let nodeIdentity = identity;

      if (identityError && identityError.code === 'PGRST116') {
        // Create new identity
        const { data: newIdentity, error: createError } = await supabaseClient
          .from('node_identity')
          .insert([{
            user_id: userId,
            brand: brandId,
            created_at: new Date().toISOString(),
            device_fingerprint: deviceFingerprint,
            ip_address: ip,
            user_agent: userAgent,
            is_first_login: true
          }])
          .select()
          .single();

        if (createError) throw createError;
        nodeIdentity = newIdentity;
      }

      // 3. GET/CREATE TRUST STATE
      const { data: trustState } = await supabaseClient
        .from('trust_state')
        .select('*')
        .eq('user_id', userId)
        .single();

      let updatedTrustState = trustState;

      if (!trustState) {
        const { data: newTrust, error: trustError } = await supabaseClient
          .from('trust_state')
          .insert([{
            user_id: userId,
            brand: brandId,
            trust_score: 50, // Base trust
            is_verified: false,
            is_mfa_enabled: false,
            is_enterprise: false,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (trustError) throw trustError;
        updatedTrustState = newTrust;
      }

      // 4. HANDLE REFERRAL
      let referralBonus = 0;
      if (referralCode) {
        const { data: referral, error: refError } = await supabaseClient
          .from('referral_codes')
          .select('*')
          .eq('code', referralCode)
          .eq('is_active', true)
          .single();

        if (referral && !refError) {
          // Log referral
          await supabaseClient
            .from('referral_logs')
            .insert([{
              referrer_id: referral.created_by,
              referred_user_id: userId,
              code_id: referral.id,
              brand: brandId,
              created_at: new Date().toISOString()
            }]);

          referralBonus = 500; // Credit bonus

          // Add to referrer's wallet
          await supabaseClient
            .from('reward_wallet')
            .insert([{
              user_id: referral.created_by,
              reward_type: 'referral',
              amount: 100,
              description: `Referral bonus for ${userId}`,
              brand: brandId,
              created_at: new Date().toISOString()
            }]);
        }
      }

      // 5. DETERMINE ONBOARDING FLOW
      let onboardingFlow = 'ai_chat';
      const { data: userProfile } = await supabaseClient
        .from('user_profiles')
        .select('onboarding_preference')
        .eq('user_id', userId)
        .single();

      if (userProfile?.onboarding_preference) {
        onboardingFlow = userProfile.onboarding_preference;
      }

      // 6. EMIT BOOTSTRAP EVENT
      if (io) {
        io.to(`user:${userId}`).emit('bootstrap_complete', {
          nodeIdentity,
          trustState: updatedTrustState,
          onboardingFlow,
          referralBonus,
          brand: brandId,
          isFirstLogin: nodeIdentity.is_first_login
        });
      }

      // 7. CREATE SESSION CONTEXT
      const sessionContext = {
        nodeId: nodeIdentity.id,
        userId,
        brand: brandId,
        trustScore: updatedTrustState.trust_score,
        onboardingFlow,
        isFirstLogin: nodeIdentity.is_first_login,
        startedAt: new Date().toISOString()
      };

      res.json({
        success: true,
        session: sessionContext,
        bootstrap: {
          nodeIdentity,
          trustState: updatedTrustState,
          referralBonus,
          brand: brandId,
          isFirstLogin: nodeIdentity.is_first_login
        }
      });

    } catch (error) {
      console.error('[post-login-bootstrap]', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/kernel/ai-onboarding-chat
   * 🤖 AI GUIDED ONBOARDING
   * 
   * Chat-based onboarding that extracts business info and auto-fills forms
   */
  router.post('/kernel/ai-onboarding-chat', async (req, res) => {
    try {
      const { userId, message, brand, conversationHistory = [] } = req.body;

      if (!userId || !message) {
        return res.status(400).json({ error: 'userId and message required' });
      }

      // 1. CLASSIFY USER MESSAGE INTENT
      const intent = classifyOnboardingIntent(message);

      // 2. EXTRACT BUSINESS DATA
      const extractedData = extractBusinessData(message, intent);

      // 3. AUTO-SAVE PROFILE UPDATES
      if (Object.keys(extractedData).length > 0) {
        const updatePayload = buildProfileUpdate(extractedData);
        
        await supabaseClient
          .from('user_profiles')
          .upsert({
            user_id: userId,
            ...updatePayload,
            updated_at: new Date().toISOString()
          });

        // Update business profile if present
        if (extractedData.businessName || extractedData.industry) {
          await supabaseClient
            .from('business_profiles')
            .upsert({
              user_id: userId,
              company_name: extractedData.businessName,
              industry: extractedData.industry,
              business_stage: extractedData.businessStage,
              updated_at: new Date().toISOString()
            });
        }
      }

      // 4. SAVE CONVERSATION TURN
      const updatedHistory = [...conversationHistory, { role: 'user', content: message }];

      await supabaseClient
        .from('onboarding_conversations')
        .insert([{
          user_id: userId,
          brand,
          intent,
          user_message: message,
          extracted_data: extractedData,
          created_at: new Date().toISOString()
        }]);

      // 5. GENERATE NEXT QUESTION OR COMPLETION
      const { response, isComplete, nextStep } = generateOnboardingResponse(
        intent,
        extractedData,
        updatedHistory
      );

      updatedHistory.push({ role: 'assistant', content: response });

      // 6. CALCULATE PROFILE COMPLETION %
      const { data: profile } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      const completionPercentage = calculateProfileCompletion(profile);

      res.json({
        success: true,
        response,
        intent,
        extractedData,
        conversationHistory: updatedHistory,
        isComplete,
        nextStep,
        profileCompletion: completionPercentage
      });

    } catch (error) {
      console.error('[ai-onboarding-chat]', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/kernel/voice-onboarding
   * 🎤 VOICE AVATAR ONBOARDING
   * 
   * Speech-to-text → AI Chat → Text-to-speech flow
   */
  router.post('/kernel/voice-onboarding', async (req, res) => {
    try {
      const { userId, audioData, brand, speechToTextEngine = 'whisper' } = req.body;

      if (!userId || !audioData) {
        return res.status(400).json({ error: 'userId and audioData required' });
      }

      // 1. CONVERT AUDIO TO TEXT
      let transcribedText;
      
      if (speechToTextEngine === 'whisper') {
        transcribedText = await convertSpeechToText(audioData, 'whisper');
      } else if (speechToTextEngine === 'google') {
        transcribedText = await convertSpeechToText(audioData, 'google');
      } else {
        transcribedText = audioData.text || '';
      }

      // 2. RUN AI ONBOARDING CHAT
      const chatResponse = await runAIOnboardingChat(userId, transcribedText, brand);

      // 3. CONVERT RESPONSE TO SPEECH
      const { audioUrl, duration } = await convertTextToSpeech(
        chatResponse.response,
        brand
      );

      // 4. SAVE VOICE SESSION
      await supabaseClient
        .from('voice_onboarding_sessions')
        .insert([{
          user_id: userId,
          brand,
          transcribed_text: transcribedText,
          ai_response: chatResponse.response,
          audio_url: audioUrl,
          duration,
          created_at: new Date().toISOString()
        }]);

      res.json({
        success: true,
        transcribedText,
        aiResponse: chatResponse.response,
        audioUrl,
        duration,
        conversationState: chatResponse.conversationHistory,
        profileCompletion: chatResponse.profileCompletion
      });

    } catch (error) {
      console.error('[voice-onboarding]', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/kernel/enterprise-sso-login
   * 🔐 ENTERPRISE SSO ONBOARDING
   * 
   * Handles Google Workspace, Azure AD, Okta, SAML, GitHub, OTP
   */
  router.post('/kernel/enterprise-sso-login', async (req, res) => {
    try {
      const {
        provider, // 'google', 'azure', 'github', 'okta', 'saml', 'otp'
        providerUserId,
        email,
        profile,
        enterpriseId,
        organizationId,
        role = 'member'
      } = req.body;

      if (!provider || !email) {
        return res.status(400).json({ error: 'provider and email required' });
      }

      // 1. GET OR CREATE SSO ACCOUNT
      const { data: existingSSO } = await supabaseClient
        .from('sso_accounts')
        .select('*')
        .eq('provider', provider)
        .eq('provider_user_id', providerUserId)
        .single();

      let ssoAccount = existingSSO;

      if (!existingSSO) {
        const { data: newSSO, error: ssoError } = await supabaseClient
          .from('sso_accounts')
          .insert([{
            provider,
            provider_user_id: providerUserId,
            email,
            profile_data: profile,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (ssoError) throw ssoError;
        ssoAccount = newSSO;
      }

      // 2. GET OR CREATE USER
      let userId = ssoAccount.user_id;

      if (!userId) {
        const { data: newUser, error: userError } = await supabaseClient
          .from('users_core')
          .insert([{
            email,
            first_name: profile?.given_name,
            last_name: profile?.family_name,
            avatar: profile?.picture,
            created_at: new Date().toISOString()
          }])
          .select('id')
          .single();

        if (userError) throw userError;
        userId = newUser.id;

        // Link SSO account to user
        await supabaseClient
          .from('sso_accounts')
          .update({ user_id: userId })
          .eq('id', ssoAccount.id);
      }

      // 3. ASSIGN ENTERPRISE ROLE
      if (enterpriseId || organizationId) {
        const { data: orgMap } = await supabaseClient
          .from('organization_map')
          .select('*')
          .eq('user_id', userId)
          .eq('organization_id', organizationId || enterpriseId)
          .single();

        if (!orgMap) {
          await supabaseClient
            .from('organization_map')
            .insert([{
              user_id: userId,
              organization_id: organizationId || enterpriseId,
              role: role,
              assigned_at: new Date().toISOString()
            }]);
        }

        // Create enterprise user record
        const { data: enterpriseUser } = await supabaseClient
          .from('enterprise_users')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!enterpriseUser) {
          await supabaseClient
            .from('enterprise_users')
            .insert([{
              user_id: userId,
              organization_id: organizationId || enterpriseId,
              role,
              mfa_required: true,
              created_at: new Date().toISOString()
            }]);
        }
      }

      // 4. UPDATE TRUST STATE
      await supabaseClient
        .from('trust_state')
        .upsert({
          user_id: userId,
          is_verified: true,
          is_enterprise: !!enterpriseId,
          verified_provider: provider,
          verified_at: new Date().toISOString()
        });

      // 5. SKIP ONBOARDING FOR ENTERPRISE
      const onboardingFlow = enterpriseId ? 'enterprise_dashboard' : 'ai_chat';

      res.json({
        success: true,
        userId,
        email,
        provider,
        onboardingFlow,
        enterprise: enterpriseId ? { id: enterpriseId, role } : null,
        session: {
          userId,
          isEnterprise: !!enterpriseId,
          isVerified: true
        }
      });

    } catch (error) {
      console.error('[enterprise-sso-login]', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/kernel/referral-register
   * 🎁 REFERRAL & GROWTH ENGINE
   * 
   * Creates referral codes, tracks referrals, applies rewards
   */
  router.post('/kernel/referral-register', async (req, res) => {
    try {
      const { userId, referredUserId, referralCode, brand } = req.body;

      if (!referredUserId) {
        return res.status(400).json({ error: 'referredUserId required' });
      }

      // 1. VALIDATE REFERRAL CODE
      let referralData = null;

      if (referralCode) {
        const { data: refCode, error: refError } = await supabaseClient
          .from('referral_codes')
          .select('*')
          .eq('code', referralCode)
          .eq('is_active', true)
          .single();

        if (!refError && refCode) {
          referralData = refCode;
        }
      } else if (userId) {
        // Use userId to find referrer's code
        const { data: userCodes } = await supabaseClient
          .from('referral_codes')
          .select('*')
          .eq('created_by', userId)
          .eq('is_active', true);

        referralData = userCodes?.[0];
      }

      // 2. RECORD REFERRAL
      const { data: referralLog, error: logError } = await supabaseClient
        .from('referral_logs')
        .insert([{
          referrer_id: referralData?.created_by || userId,
          referred_user_id: referredUserId,
          code_id: referralData?.id,
          brand,
          status: 'active',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (logError) throw logError;

      // 3. UPDATE VANSHAWALI (SOCIAL GRAPH)
      await supabaseClient
        .from('vanshawali_connections')
        .insert([{
          parent_id: referralData?.created_by || userId,
          child_id: referredUserId,
          connection_type: 'referral',
          trust_level: 50,
          created_at: new Date().toISOString()
        }]);

      // 4. APPLY REWARDS
      const referralReward = 500; // Credits
      const referrerReward = 100; // Credits

      // Referred user bonus
      await supabaseClient
        .from('reward_wallet')
        .insert([{
          user_id: referredUserId,
          reward_type: 'referral_bonus',
          amount: referralReward,
          description: 'Welcome bonus for joining via referral',
          brand,
          created_at: new Date().toISOString()
        }]);

      // Referrer bonus
      if (referralData?.created_by || userId) {
        await supabaseClient
          .from('reward_wallet')
          .insert([{
            user_id: referralData?.created_by || userId,
            reward_type: 'referral_reward',
            amount: referrerReward,
            description: `Referral reward for ${referredUserId}`,
            brand,
            created_at: new Date().toISOString()
          }]);
      }

      // 5. UPDATE KARMA SCORES
      const karmaUpdate = {
        user_id: referredUserId,
        action: 'joined_via_referral',
        points: 50,
        description: 'Joined community through referral',
        created_at: new Date().toISOString()
      };

      await supabaseClient
        .from('karma_ledger')
        .insert([karmaUpdate]);

      // 6. FEATURE UNLOCK
      await supabaseClient
        .from('feature_access')
        .upsert({
          user_id: referredUserId,
          feature: 'premium_templates',
          is_unlocked: true,
          unlocked_by: 'referral',
          unlocked_at: new Date().toISOString()
        });

      res.json({
        success: true,
        referral: referralLog,
        rewards: {
          referredUser: { type: 'credits', amount: referralReward },
          referrer: { type: 'credits', amount: referrerReward }
        },
        graphUpdated: true,
        karmaPoints: 50
      });

    } catch (error) {
      console.error('[referral-register]', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/kernel/onboarding-progress
   * Get user's onboarding completion status and next steps
   */
  router.get('/kernel/onboarding-progress/:userId', async (req, res) => {
    try {
      const { userId } = req.params;

      const { data: profile } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data: business } = await supabaseClient
        .from('business_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data: preferences } = await supabaseClient
        .from('ai_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      const completion = calculateProfileCompletion({
        profile,
        business,
        preferences
      });

      const nextSteps = determineNextOnboardingSteps(profile, business, preferences);

      res.json({
        success: true,
        completion,
        profile,
        business,
        preferences,
        nextSteps
      });

    } catch (error) {
      console.error('[onboarding-progress]', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.use('/api', router);
  return router;
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function resolveBrandFromDomain(domain) {
  if (!domain) return 'BOTMANTRA';
  
  const lowerDomain = domain.toLowerCase();
  
  if (lowerDomain.includes('botmantra')) return 'BOTMANTRA';
  if (lowerDomain.includes('mantravat')) return 'MANTRAVAT';
  if (lowerDomain.includes('jeetmantra')) return 'JEETMANTRA';
  if (lowerDomain.includes('juniormantra')) return 'JUNER';
  
  return 'BOTMANTRA'; // default
}

function classifyOnboardingIntent(message) {
  const lower = message.toLowerCase();
  
  if (lower.match(/build|create|develop|make/)) return 'wants_to_build';
  if (lower.match(/automate|workflow|process/)) return 'wants_automation';
  if (lower.match(/business|company|startup|team/)) return 'business_info';
  if (lower.match(/goal|objective|target|achieve/)) return 'business_goal';
  if (lower.match(/industry|sector|vertical|niche/)) return 'industry';
  if (lower.match(/budget|plan|cost|pricing/)) return 'budget';
  if (lower.match(/help|support|learn|how/)) return 'needs_help';
  
  return 'general_inquiry';
}

function extractBusinessData(message, intent) {
  const extracted = {};
  
  // Extract business name patterns
  const nameMatch = message.match(/(?:company|business|startup|called|named)[\s'"]*([A-Za-z\s&]+?)(?:[.,!?]|$)/i);
  if (nameMatch) extracted.businessName = nameMatch[1].trim();
  
  // Extract industry
  const industryMatch = message.match(/(?:industry|sector|vertical|field|business)[\s:]*([A-Za-z\s]+?)(?:[.,!?]|$)/i);
  if (industryMatch) extracted.industry = industryMatch[1].trim();
  
  // Extract goal
  const goalMatch = message.match(/(?:want|goal|aim|need)[\s:]*([A-Za-z\s]+?)(?:[.,!?]|$)/i);
  if (goalMatch) extracted.goal = goalMatch[1].trim();
  
  // Extract team size
  const teamMatch = message.match(/(\d+)\s*(?:person|people|team|employee)/i);
  if (teamMatch) extracted.teamSize = parseInt(teamMatch[1]);
  
  return extracted;
}

function buildProfileUpdate(extractedData) {
  const update = {};
  
  if (extractedData.businessName) update.company_name = extractedData.businessName;
  if (extractedData.industry) update.industry = extractedData.industry;
  if (extractedData.goal) update.business_goal = extractedData.goal;
  if (extractedData.teamSize) update.team_size = extractedData.teamSize;
  
  return update;
}

function generateOnboardingResponse(intent, extractedData, history) {
  const questions = {
    wants_to_build: "Great! What would you like to build? (e.g., chatbot, workflow, dashboard, knowledge base)",
    wants_automation: "Perfect! Which business process would you like to automate?",
    business_info: "Excellent! Tell me more about your business and what you do.",
    business_goal: "What's your primary goal with our platform?",
    industry: "Which industry are you in? This helps me suggest relevant templates.",
    budget: "What's your expected budget? This helps us recommend the right plan.",
    needs_help: "I'm happy to help! What would you like to know?",
    general_inquiry: "Tell me more about what you're looking to accomplish."
  };
  
  const response = questions[intent] || questions.general_inquiry;
  
  // Determine if onboarding is complete
  const isComplete = (
    extractedData.businessName &&
    extractedData.industry &&
    extractedData.goal &&
    history.length > 6
  );
  
  const nextStep = isComplete ? 'template_selection' : 'continue_chat';
  
  return { response, isComplete, nextStep };
}

function calculateProfileCompletion(data) {
  let completed = 0;
  let total = 6;
  
  if (data?.company_name) completed++;
  if (data?.industry) completed++;
  if (data?.business_goal) completed++;
  if (data?.team_size) completed++;
  if (data?.first_name && data?.last_name) completed++;
  if (data?.avatar) completed++;
  
  return Math.round((completed / total) * 100);
}

function determineNextOnboardingSteps(profile, business, preferences) {
  const steps = [];
  
  if (!profile?.company_name) steps.push({ step: 'company_setup', title: 'Set up your company profile' });
  if (!profile?.industry) steps.push({ step: 'industry_selection', title: 'Select your industry' });
  if (!preferences?.ai_provider) steps.push({ step: 'ai_setup', title: 'Configure AI preferences' });
  if (!business?.business_goal) steps.push({ step: 'goal_definition', title: 'Define your business goals' });
  
  return steps;
}

async function convertSpeechToText(audioData, engine) {
  // Integration with Whisper API or Google Cloud Speech-to-Text
  // For now, return mock
  return audioData.text || "User said something";
}

async function convertTextToSpeech(text, brand) {
  // Integration with ElevenLabs or Azure Voice Service
  // For now, return mock
  return {
    audioUrl: 'https://example.com/audio.mp3',
    duration: 5
  };
}

async function runAIOnboardingChat(userId, message, brand) {
  // Delegate to ai-onboarding-chat endpoint
  return {
    response: "Thank you for that information!",
    conversationHistory: [],
    profileCompletion: 60
  };
}
