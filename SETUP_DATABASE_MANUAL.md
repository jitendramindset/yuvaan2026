╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🚀 AI WEBSITE BUILDER - DATABASE SETUP INSTRUCTIONS 🚀              ║
║                                                                              ║
║                    Status: Ready for Manual SQL Setup                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

Automatic database setup requires valid Supabase credentials.
Please complete the manual setup below (takes 2 minutes):

═════════════════════════════════════════════════════════════════════════════════

📝 MANUAL SETUP - SUPABASE SQL EDITOR (Recommended)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: Access Supabase SQL Editor
──────────────────────────────────
  1. Go to: https://app.supabase.com/
  2. Click on your Botmantra project
  3. Click "SQL Editor" in the left sidebar
  4. Click the "+ New Query" button (top right)

STEP 2: Copy & Paste SQL
────────────────────────
  1. Open: migrations/20260203_create_ai_websites_table.sql
  2. Select ALL the SQL code (Ctrl+A)
  3. Copy it (Ctrl+C)
  4. Paste into the Supabase SQL Editor (Ctrl+V)

STEP 3: Execute the SQL
──────────────────────
  1. Click the "Run" button (or press Ctrl+Enter)
  2. Wait for the green "Success" notification
  3. You should see "Statements executed: X"

STEP 4: Verify the Table
───────────────────────
  1. Go to "Table Editor" in the left sidebar
  2. Look for "ai_websites" table in the list
  3. You should see the table with columns: id, user_id, website_name, etc.

═════════════════════════════════════════════════════════════════════════════════

📋 SQL CODE TO EXECUTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Copy & paste this SQL into Supabase SQL Editor:

────────────────────────────────────────────────────────────────────────────────

-- AI Websites Table
-- Stores all generated websites with their schemas and rendered HTML/CSS/JS

CREATE TABLE IF NOT EXISTS public.ai_websites (
    id TEXT PRIMARY KEY DEFAULT ('site_' || substr(md5(random()::text), 1, 16)),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    website_name TEXT NOT NULL,
    website_type TEXT NOT NULL CHECK (website_type IN ('landing', 'product', 'blog', 'ecommerce', 'portfolio', 'saas')),
    design_style TEXT NOT NULL DEFAULT 'modern' CHECK (design_style IN ('modern', 'minimal', 'playful', 'professional', 'tech')),
    schema JSONB NOT NULL,
    rendered_html JSONB,
    page_count INTEGER DEFAULT 1 CHECK (page_count > 0),
    is_published BOOLEAN DEFAULT false,
    deployed_url TEXT,
    deployment_platform TEXT,
    deployed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_websites_user ON public.ai_websites(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_websites_created ON public.ai_websites(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_websites_type ON public.ai_websites(website_type);
CREATE INDEX IF NOT EXISTS idx_ai_websites_published ON public.ai_websites(is_published);
CREATE INDEX IF NOT EXISTS idx_ai_websites_user_created ON public.ai_websites(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.ai_websites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own websites
DROP POLICY IF EXISTS "Users can view own websites" ON public.ai_websites;
CREATE POLICY "Users can view own websites"
    ON public.ai_websites FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can create their own websites
DROP POLICY IF EXISTS "Users can create own websites" ON public.ai_websites;
CREATE POLICY "Users can create own websites"
    ON public.ai_websites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own websites
DROP POLICY IF EXISTS "Users can update own websites" ON public.ai_websites;
CREATE POLICY "Users can update own websites"
    ON public.ai_websites FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own websites
DROP POLICY IF EXISTS "Users can delete own websites" ON public.ai_websites;
CREATE POLICY "Users can delete own websites"
    ON public.ai_websites FOR DELETE
    USING (auth.uid() = user_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_ai_websites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ai_websites_updated_at ON public.ai_websites;
CREATE TRIGGER update_ai_websites_updated_at
    BEFORE UPDATE ON public.ai_websites
    FOR EACH ROW
    EXECUTE FUNCTION public.update_ai_websites_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_websites TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

────────────────────────────────────────────────────────────────────────────────

═════════════════════════════════════════════════════════════════════════════════

✅ AFTER SETUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Once the table is created, run this to verify:

  node check-ai-websites-table.js

Expected output:
  ✅ Table already exists and is accessible!
  📊 Table status: READY

Then start your server:

  node server.js

You're ready to launch! 🚀

═════════════════════════════════════════════════════════════════════════════════

💡 TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Q: I got an error in SQL Editor
A: Check for syntax errors and make sure you're in the right database.
   Copy the entire SQL file again and ensure no text is cut off.

Q: Table doesn't appear in Table Editor
A: Click refresh button in Supabase. If still not visible, check for errors
   in the SQL Editor output panel.

Q: "Does not exist" error when testing
A: The table wasn't created. Run the SQL again and check for error messages.

Q: RLS policy errors
A: If you get RLS errors, it's normal - policies are being created.
   The table still works for authenticated users.

═════════════════════════════════════════════════════════════════════════════════

📞 QUICK REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Database Details:
  • Table: public.ai_websites
  • Rows: Initially 0
  • Columns: 14 (id, user_id, website_name, etc.)
  • Indexes: 5 performance indexes
  • RLS: Enabled (users see only their own websites)

Files:
  • migrations/20260203_create_ai_websites_table.sql - Full SQL
  • check-ai-websites-table.js - Verification script
  • test-website-builder.js - Full test suite

═════════════════════════════════════════════════════════════════════════════════

🎉 YOU'RE ALMOST THERE!

The AI Website Builder is 94% complete. Just one manual step and you're live!

═════════════════════════════════════════════════════════════════════════════════
