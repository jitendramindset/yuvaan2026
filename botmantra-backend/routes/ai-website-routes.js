/**
 * AI Website Builder Routes
 * 
 * Endpoints:
 * POST /api/ai-web/design - Design new website from prompt
 * POST /api/ai-web/preview - Preview without saving
 * POST /api/ai-web/export - Export website as ZIP
 * GET /api/ai-web/templates - Get website templates
 * POST /api/ai-web/deploy - Deploy to hosting
 * GET /api/ai-web/sites - Get user's websites
 */

const express = require('express');
const router = express.Router();
const AIWebsiteBuilder = require('../ai-website-builder');
const WebsiteRenderer = require('../website-renderer');
const { authenticate } = require('../middleware/auth');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

// Initialize builder and renderer
const websiteBuilder = new AIWebsiteBuilder(process.env.ANTHROPIC_API_KEY);
const renderer = new WebsiteRenderer();

/**
 * POST /api/ai-web/design
 * Design a new website from natural language prompt
 */
router.post('/design', authenticate, async (req, res) => {
  try {
    const {
      prompt,
      website_type = 'landing',
      design_style = 'modern',
      brand_name,
      brand_colors,
      save = false
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    if (prompt.length > 2000) {
      return res.status(400).json({ success: false, error: 'Prompt too long (max 2000 chars)' });
    }

    // Check usage limits
    const siteCount = await checkWebsiteLimit(req.user.id);
    if (siteCount >= 10 && !isPremium(req.user)) {
      return res.status(429).json({
        success: false,
        error: 'Website limit reached (10). Upgrade to premium for unlimited sites.'
      });
    }

    // Generate website schema
    const schema = await websiteBuilder.designWebsite(prompt, {
      website_type,
      design_style,
      brand_name: brand_name || req.user.company_name || 'My Company',
      brand_colors,
      target_audience: 'general'
    });

    // Render to HTML/CSS/JS
    const rendered = renderer.renderWebsite(schema);

    // Save if requested
    if (save) {
      const siteId = await saveWebsite(schema, rendered, req.user.id);

      return res.status(201).json({
        success: true,
        message: 'Website designed and saved successfully',
        data: {
          site_id: siteId,
          site_name: schema.website_name,
          schema: schema,
          rendered: {
            page_count: rendered.pages.length,
            has_sitemap: true,
            has_robots: true
          },
          preview_url: `/preview/${siteId}`,
          export_url: `/api/ai-web/export/${siteId}`
        }
      });
    }

    // Return preview
    res.json({
      success: true,
      message: 'Website designed successfully (preview mode)',
      data: {
        preview_id: Date.now().toString(36),
        schema: schema,
        rendered: rendered,
        page_count: rendered.pages.length,
        estimated_build_time: schema.metadata.estimated_build_time
      }
    });

  } catch (error) {
    console.error('❌ Website Design Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Website design failed'
    });
  }
});

/**
 * POST /api/ai-web/preview
 * Preview website without saving
 */
router.post('/preview', authenticate, async (req, res) => {
  try {
    const { prompt, website_type = 'landing', design_style = 'modern' } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt required' });
    }

    const schema = await websiteBuilder.designWebsite(prompt, {
      website_type,
      design_style
    });

    const rendered = renderer.renderWebsite(schema);

    res.json({
      success: true,
      data: {
        schema: schema,
        html_preview: rendered.pages[0].content, // First page for quick preview
        page_count: rendered.pages.length,
        can_export: true
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Preview generation failed' });
  }
});

/**
 * POST /api/ai-web/export
 * Export website as downloadable ZIP file
 */
router.post('/export/:site_id', authenticate, async (req, res) => {
  try {
    const { site_id } = req.params;

    // Load website from database
    const { data: site, error } = await supabase
      .from('ai_websites')
      .select('*')
      .eq('id', site_id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !site) {
      return res.status(404).json({ success: false, error: 'Website not found' });
    }

    // Render website
    const rendered = renderer.renderWebsite(site.schema);

    // Create ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    const zipFilename = `${site.schema.website_name.replace(/\s/g, '-').toLowerCase()}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

    archive.pipe(res);

    // Add HTML pages
    rendered.pages.forEach(page => {
      archive.append(page.content, { name: page.filename });
    });

    // Add CSS
    archive.append(rendered.css, { name: 'css/styles.css' });

    // Add JavaScript
    archive.append(rendered.js, { name: 'js/main.js' });

    // Add sitemap
    archive.append(rendered.sitemap, { name: 'sitemap.xml' });

    // Add robots.txt
    archive.append(rendered.robots, { name: 'robots.txt' });

    // Add manifest.json
    archive.append(JSON.stringify(rendered.manifest, null, 2), { name: 'manifest.json' });

    // Add README
    archive.append(generateREADME(site.schema), { name: 'README.md' });

    archive.finalize();

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, error: 'Export failed' });
  }
});

/**
 * GET /api/ai-web/templates
 * Get pre-built website templates
 */
router.get('/templates', authenticate, async (req, res) => {
  try {
    const templates = [
      {
        id: 'startup_landing',
        name: 'Startup Landing Page',
        type: 'landing',
        style: 'modern',
        description: 'Perfect for SaaS startups and tech companies',
        pages: 3,
        preview_image: '/templates/startup.jpg',
        price: 0
      },
      {
        id: 'ecommerce_store',
        name: 'E-commerce Store',
        type: 'ecommerce',
        style: 'modern',
        description: 'Complete online store with product pages and checkout',
        pages: 10,
        preview_image: '/templates/ecommerce.jpg',
        price: 99
      },
      {
        id: 'portfolio_creative',
        name: 'Creative Portfolio',
        type: 'portfolio',
        style: 'minimal',
        description: 'Showcase your work beautifully',
        pages: 5,
        preview_image: '/templates/portfolio.jpg',
        price: 49
      },
      {
        id: 'blog_modern',
        name: 'Modern Blog',
        type: 'blog',
        style: 'modern',
        description: 'Content-focused blog with SEO optimization',
        pages: 15,
        preview_image: '/templates/blog.jpg',
        price: 0
      }
    ];

    res.json({
      success: true,
      data: {
        templates: templates,
        count: templates.length
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch templates' });
  }
});

/**
 * POST /api/ai-web/deploy
 * Deploy website to hosting (Netlify/Vercel)
 */
router.post('/deploy/:site_id', authenticate, async (req, res) => {
  try {
    const { site_id } = req.params;
    const { platform = 'netlify', domain } = req.body;

    // Load website
    const { data: site, error } = await supabase
      .from('ai_websites')
      .select('*')
      .eq('id', site_id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !site) {
      return res.status(404).json({ success: false, error: 'Website not found' });
    }

    // Deployment logic (placeholder - would integrate with Netlify/Vercel API)
    const deploymentUrl = `https://${site.schema.website_name.toLowerCase().replace(/\s/g, '-')}.netlify.app`;

    // Update database with deployment info
    await supabase
      .from('ai_websites')
      .update({
        deployed_url: deploymentUrl,
        deployed_at: new Date().toISOString(),
        deployment_platform: platform
      })
      .eq('id', site_id);

    res.json({
      success: true,
      message: 'Website deployed successfully',
      data: {
        deployment_url: deploymentUrl,
        platform: platform,
        deployed_at: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Deployment failed' });
  }
});

/**
 * GET /api/ai-web/sites
 * Get user's websites
 */
router.get('/sites', authenticate, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const { data: sites, error } = await supabase
      .from('ai_websites')
      .select('id, website_name, website_type, created_at, deployed_url, page_count')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: {
        sites: sites || [],
        count: (sites || []).length
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch websites' });
  }
});

/**
 * DELETE /api/ai-web/sites/:site_id
 * Delete website
 */
router.delete('/sites/:site_id', authenticate, async (req, res) => {
  try {
    const { site_id } = req.params;

    const { error } = await supabase
      .from('ai_websites')
      .delete()
      .eq('id', site_id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Website deleted successfully'
    });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Delete failed' });
  }
});

/**
 * Helper Functions
 */

async function checkWebsiteLimit(userId) {
  const { data, error } = await supabase
    .from('ai_websites')
    .select('id', { count: 'exact' })
    .eq('user_id', userId);

  return data?.length || 0;
}

async function saveWebsite(schema, rendered, userId) {
  const siteId = `site_${Date.now().toString(36)}`;

  const { error } = await supabase
    .from('ai_websites')
    .insert({
      id: siteId,
      user_id: userId,
      website_name: schema.website_name,
      website_type: schema.website_type,
      schema: schema,
      rendered_html: rendered,
      page_count: rendered.pages.length,
      is_published: false,
      created_at: new Date().toISOString()
    });

  if (error) throw error;

  return siteId;
}

function isPremium(user) {
  return user.plan === 'premium' || user.plan === 'enterprise';
}

function generateREADME(schema) {
  return `# ${schema.website_name}

AI-Generated Website by BotMantra

## Pages
${schema.pages.map(p => `- ${p.name} (/${p.slug})`).join('\n')}

## Technologies
- HTML5
- CSS3
- JavaScript
- Tailwind CSS

## Deployment
Upload these files to any static hosting provider:
- Netlify
- Vercel
- GitHub Pages
- AWS S3

## Support
For questions: support@botmantra.ai
`;
}

module.exports = router;
