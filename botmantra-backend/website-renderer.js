/**
 * Website Renderer - HTML/CSS/JS Generator
 * 
 * Converts AI-generated website schemas into production-ready static sites
 * Outputs: HTML5, CSS3, JavaScript, optimized assets
 */

class WebsiteRenderer {
  constructor() {
    this.version = '1.0.0';
  }

  /**
   * Render complete website to HTML/CSS/JS
   */
  renderWebsite(websiteSchema) {
    const { pages, styles, structure, brand, seo } = websiteSchema;

    const renderedPages = pages.map(page => this.renderPage(page, websiteSchema));
    const css = this.generateCSS(styles, brand);
    const js = this.generateJS(websiteSchema);
    const assets = this.prepareAssets(websiteSchema);

    return {
      pages: renderedPages,
      css: css,
      js: js,
      assets: assets,
      sitemap: this.generateSitemap(pages),
      robots: this.generateRobotsTxt(),
      manifest: this.generateManifest(brand)
    };
  }

  /**
   * Render individual page
   */
  renderPage(page, websiteSchema) {
    const { structure, brand, seo, styles } = websiteSchema;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${page.meta.description}">
    <meta name="keywords" content="${page.meta.keywords}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${page.meta.title}">
    <meta property="og:description" content="${page.meta.description}">
    <meta property="og:image" content="${seo.meta.og_image}">
    <meta property="og:type" content="website">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${page.meta.title}">
    <meta name="twitter:description" content="${page.meta.description}">
    
    <title>${page.meta.title}</title>
    
    <!-- Styles -->
    <link rel="stylesheet" href="/css/styles.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@3.4.0/dist/tailwind.min.css">
    
    <!-- Fonts -->
    ${this.generateFontLinks(styles.fonts)}
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/assets/favicon.png">
    
    <!-- JSON-LD Schema -->
    <script type="application/ld+json">
    ${JSON.stringify(seo.schema, null, 2)}
    </script>
</head>
<body class="antialiased">
    ${this.renderNavigation(structure.navigation, brand)}
    
    <main>
        ${page.sections.map(section => this.renderSection(section, styles)).join('\n        ')}
    </main>
    
    ${this.renderFooter(structure.footer, brand)}
    
    <!-- Scripts -->
    <script src="/js/main.js"></script>
    ${page.scripts.map(script => `<script src="${script}"></script>`).join('\n    ')}
</body>
</html>`;

    return {
      slug: page.slug,
      filename: `${page.slug}.html`,
      content: html
    };
  }

  /**
   * Render navigation
   */
  renderNavigation(nav, brand) {
    const transparentClass = nav.transparent ? 'bg-transparent' : 'bg-white shadow-md';
    const stickyClass = nav.sticky ? 'sticky top-0 z-50' : '';

    return `
    <nav class="${transparentClass} ${stickyClass}">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <a href="/" class="text-2xl font-bold" style="color: ${brand.colors.primary}">
                        ${brand.name}
                    </a>
                </div>
                <div class="hidden md:flex items-center space-x-8">
                    ${nav.items.map(item => `
                    <a href="${item.href}" class="text-gray-700 hover:text-gray-900 transition">
                        ${item.label}
                    </a>`).join('')}
                </div>
                <div class="md:hidden flex items-center">
                    <button id="mobile-menu-toggle" class="text-gray-700">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Mobile Menu -->
        <div id="mobile-menu" class="hidden md:hidden bg-white border-t">
            <div class="px-2 pt-2 pb-3 space-y-1">
                ${nav.items.map(item => `
                <a href="${item.href}" class="block px-3 py-2 text-gray-700 hover:bg-gray-50">
                    ${item.label}
                </a>`).join('')}
            </div>
        </div>
    </nav>`;
  }

  /**
   * Render section based on type
   */
  renderSection(section, styles) {
    const renderers = {
      hero: this.renderHeroSection,
      features: this.renderFeaturesSection,
      testimonials: this.renderTestimonialsSection,
      pricing: this.renderPricingSection,
      cta: this.renderCTASection,
      footer: this.renderFooterSection
    };

    const renderer = renderers[section.type] || this.renderGenericSection;
    return renderer.call(this, section, styles);
  }

  /**
   * Render hero section
   */
  renderHeroSection(section, styles) {
    return `
    <section class="relative py-20 overflow-hidden" style="background: linear-gradient(135deg, ${styles.colors.primary}, ${styles.colors.secondary})">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid md:grid-cols-2 gap-12 items-center">
                <div class="text-white">
                    <h1 class="text-5xl md:text-6xl font-bold mb-6">
                        ${section.content.headline}
                    </h1>
                    <p class="text-xl mb-8 opacity-90">
                        ${section.content.subheadline}
                    </p>
                    <div class="flex flex-col sm:flex-row gap-4">
                        <a href="${section.content.cta_primary.href}" 
                           class="px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition text-center">
                            ${section.content.cta_primary.text}
                        </a>
                        <a href="${section.content.cta_secondary.href}" 
                           class="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition text-center">
                            ${section.content.cta_secondary.text}
                        </a>
                    </div>
                </div>
                <div class="hidden md:block">
                    <img src="${section.content.image}" alt="Hero Image" class="rounded-lg shadow-2xl">
                </div>
            </div>
        </div>
    </section>`;
  }

  /**
   * Render features section
   */
  renderFeaturesSection(section, styles) {
    return `
    <section class="py-20 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-4xl font-bold mb-4">Features</h2>
                <p class="text-xl text-gray-600">Everything you need to succeed</p>
            </div>
            <div class="grid md:grid-cols-${section.columns} gap-8">
                ${section.items.map(item => `
                <div class="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition">
                    <div class="w-12 h-12 rounded-lg flex items-center justify-center mb-4" 
                         style="background-color: ${styles.colors.primary}20">
                        <svg class="w-6 h-6" style="color: ${styles.colors.primary}" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold mb-2">${item.title}</h3>
                    <p class="text-gray-600">${item.description}</p>
                </div>`).join('')}
            </div>
        </div>
    </section>`;
  }

  /**
   * Render testimonials section
   */
  renderTestimonialsSection(section, styles) {
    return `
    <section class="py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-4xl font-bold mb-4">What Our Customers Say</h2>
            </div>
            <div class="grid md:grid-cols-3 gap-8">
                ${section.items.map(item => `
                <div class="bg-white p-8 rounded-lg shadow-md">
                    <div class="flex items-center mb-4">
                        ${Array(item.rating).fill('★').join('')}
                    </div>
                    <p class="text-gray-700 mb-6 italic">"${item.quote}"</p>
                    <div class="flex items-center">
                        <img src="${item.avatar}" alt="${item.author}" class="w-12 h-12 rounded-full mr-4">
                        <div>
                            <div class="font-bold">${item.author}</div>
                            <div class="text-sm text-gray-600">${item.role}</div>
                        </div>
                    </div>
                </div>`).join('')}
            </div>
        </div>
    </section>`;
  }

  /**
   * Render pricing section
   */
  renderPricingSection(section, styles) {
    return `
    <section class="py-20 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
                <p class="text-xl text-gray-600">Choose the plan that's right for you</p>
            </div>
            <div class="grid md:grid-cols-${section.items.length} gap-8">
                ${section.items.map(plan => `
                <div class="bg-white rounded-lg shadow-lg p-8 ${plan.highlighted ? 'border-4 transform scale-105' : ''}" 
                     style="${plan.highlighted ? `border-color: ${styles.colors.primary}` : ''}">
                    ${plan.highlighted ? '<div class="text-center mb-4"><span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">POPULAR</span></div>' : ''}
                    <div class="text-center mb-8">
                        <h3 class="text-2xl font-bold mb-4">${plan.name}</h3>
                        <div class="text-5xl font-bold mb-2">$${plan.price}</div>
                        <div class="text-gray-600">per ${plan.period}</div>
                    </div>
                    <ul class="space-y-4 mb-8">
                        ${plan.features.map(feature => `
                        <li class="flex items-center">
                            <svg class="w-5 h-5 mr-2" style="color: ${styles.colors.primary}" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                            ${feature}
                        </li>`).join('')}
                    </ul>
                    <a href="${plan.cta.href}" 
                       class="block w-full py-3 px-6 text-center font-semibold rounded-lg transition ${plan.highlighted ? 'text-white' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}"
                       style="${plan.highlighted ? `background-color: ${styles.colors.primary}` : ''}">
                        ${plan.cta.text}
                    </a>
                </div>`).join('')}
            </div>
        </div>
    </section>`;
  }

  /**
   * Render CTA section
   */
  renderCTASection(section, styles) {
    return `
    <section class="py-20" style="background: linear-gradient(135deg, ${styles.colors.primary}, ${styles.colors.secondary})">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">
                ${section.content.headline}
            </h2>
            <p class="text-xl text-white opacity-90 mb-8">
                ${section.content.description}
            </p>
            <a href="${section.content.cta.href}" 
               class="inline-block px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition text-lg">
                ${section.content.cta.text}
            </a>
        </div>
    </section>`;
  }

  /**
   * Render footer
   */
  renderFooter(footer, brand) {
    return `
    <footer class="bg-gray-900 text-white py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid md:grid-cols-${footer.columns.length + 1} gap-8 mb-8">
                <div>
                    <div class="text-2xl font-bold mb-4" style="color: ${brand.colors.primary}">
                        ${brand.name}
                    </div>
                    <p class="text-gray-400 mb-4">
                        Building the future of web applications
                    </p>
                    <div class="flex space-x-4">
                        ${footer.social.map(social => `
                        <a href="#" class="text-gray-400 hover:text-white transition">
                            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                        </a>`).join('')}
                    </div>
                </div>
                ${footer.columns.map(col => `
                <div>
                    <h3 class="font-bold mb-4">${col.title}</h3>
                    <ul class="space-y-2">
                        ${col.links.map(link => `
                        <li><a href="#" class="text-gray-400 hover:text-white transition">${link}</a></li>`).join('')}
                    </ul>
                </div>`).join('')}
            </div>
            <div class="border-t border-gray-800 pt-8 text-center text-gray-400">
                ${footer.copyright}
            </div>
        </div>
    </footer>`;
  }

  /**
   * Generate CSS
   */
  generateCSS(styles, brand) {
    return `
/* Global Styles */
:root {
    --color-primary: ${styles.colors.primary};
    --color-secondary: ${styles.colors.secondary};
    --color-accent: ${styles.colors.accent};
    --font-primary: ${styles.fonts.primary}, sans-serif;
    --font-secondary: ${styles.fonts.secondary}, sans-serif;
    --spacing-xs: ${styles.spacing.xs};
    --spacing-sm: ${styles.spacing.sm};
    --spacing-md: ${styles.spacing.md};
    --spacing-lg: ${styles.spacing.lg};
    --spacing-xl: ${styles.spacing.xl};
    --radius-sm: ${styles.borderRadius.sm};
    --radius-md: ${styles.borderRadius.md};
    --radius-lg: ${styles.borderRadius.lg};
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: var(--font-primary);
    line-height: 1.6;
    color: #333;
}

h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-secondary);
    font-weight: 700;
    line-height: 1.2;
}

a {
    text-decoration: none;
    color: inherit;
}

img {
    max-width: 100%;
    height: auto;
}

/* Utility Classes */
.container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 1rem;
}

.btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-md);
    font-weight: 600;
    transition: all 0.3s ease;
    cursor: pointer;
}

.btn-primary {
    background-color: var(--color-primary);
    color: white;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Animations */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.fade-in {
    animation: fadeIn 0.6s ease-out;
}

/* Responsive */
@media (max-width: 768px) {
    .container {
        padding: 0 1rem;
    }
}
`;
  }

  /**
   * Generate JavaScript
   */
  generateJS(websiteSchema) {
    return `
// Mobile Menu Toggle
document.getElementById('mobile-menu-toggle')?.addEventListener('click', function() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
});

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Intersection Observer for Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);

document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// Form Validation
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        // Add your form handling logic here
        console.log('Form submitted');
    });
});

console.log('Website initialized - Powered by BotMantra AI');
`;
  }

  /**
   * Generate font links
   */
  generateFontLinks(fonts) {
    const fontUrls = {
      'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
      'Montserrat': 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap',
      'Poppins': 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap'
    };

    return `<link href="${fontUrls[fonts.primary] || fontUrls['Inter']}" rel="stylesheet">`;
  }

  /**
   * Generate sitemap.xml
   */
  generateSitemap(pages) {
    const baseUrl = 'https://example.com'; // Will be replaced with actual domain
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${pages.map(page => `
    <url>
        <loc>${baseUrl}/${page.slug === 'index' ? '' : page.slug}</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>${page.slug === 'index' ? '1.0' : '0.8'}</priority>
    </url>`).join('')}
</urlset>`;
  }

  /**
   * Generate robots.txt
   */
  generateRobotsTxt() {
    return `User-agent: *
Allow: /
Sitemap: https://example.com/sitemap.xml`;
  }

  /**
   * Generate manifest.json
   */
  generateManifest(brand) {
    return {
      name: brand.name,
      short_name: brand.name,
      description: `${brand.name} - AI-Generated Website`,
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: brand.colors.primary,
      icons: [
        {
          src: '/assets/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/assets/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    };
  }

  /**
   * Prepare assets
   */
  prepareAssets(websiteSchema) {
    return {
      images: [],
      videos: [],
      fonts: websiteSchema.styles.fonts,
      favicon: '/assets/favicon.png'
    };
  }

  /**
   * Render generic section (fallback)
   */
  renderGenericSection(section, styles) {
    return `
    <section class="py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center">
                <h2 class="text-4xl font-bold mb-4">Section</h2>
                <p class="text-xl text-gray-600">Content goes here</p>
            </div>
        </div>
    </section>`;
  }
}

module.exports = WebsiteRenderer;
