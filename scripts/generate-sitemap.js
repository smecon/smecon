import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';

const DIST_PATH = path.resolve(process.cwd(), 'dist');
const ARTICLES_PATH = path.resolve(process.cwd(), 'public/articles.json');
const SITE_URL = process.env.VITE_SITE_URL || 'https://www.kontenkit.com';

async function main() {
  console.log('Generating sitemap based on project structure...');
  
  const allPages = [];
  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];

  const staticPages = [
    { url: '/', changefreq: 'daily', priority: '1.0' },
    { url: '/categories', changefreq: 'weekly', priority: '0.8' },
    { url: '/about', changefreq: 'monthly', priority: '0.7' },
    { url: '/contact', changefreq: 'monthly', priority: '0.7' },
    { url: '/privacy-policy', changefreq: 'yearly', priority: '0.5' },
    { url: '/terms-of-service', changefreq: 'yearly', priority: '0.5' },
  ];

  staticPages.forEach(page => {
    allPages.push({
      ...page,
      lastmod: todayISO,
    });
  });

  try {
    const fileContent = await fs.readFile(ARTICLES_PATH, 'utf-8');
    const articles = JSON.parse(fileContent);

    const publishedArticles = articles.filter(article => {
      if (!article.date) return false;
      const postDate = new Date(article.date);
      today.setHours(23, 59, 59, 999); 
      return postDate <= today;
    });

    publishedArticles.forEach(article => {
      allPages.push({
        url: `/${article.slug}`,
        lastmod: article.date,
        changefreq: 'yearly',
        priority: '0.9',
      });
    });

    const categoryMap = new Map();
    publishedArticles.forEach(article => {
      if (article.categorySlug) {
        const existingDate = categoryMap.get(article.categorySlug) || '1970-01-01';
        if (article.date > existingDate) {
          categoryMap.set(article.categorySlug, article.date);
        }
      }
    });

    categoryMap.forEach((lastmod, slug) => {
      allPages.push({
        url: `/category/${slug}`,
        lastmod: lastmod,
        changefreq: 'weekly',
        priority: '0.8',
      });
    });

  } catch (e) {
    console.warn(`Could not read or process ${ARTICLES_PATH}. Sitemap will only contain static pages. Error: ${e.message}`);
  }

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allPages.map(page => `
  <url>
    <loc>${SITE_URL}${page.url.endsWith('/') && page.url.length > 1 ? page.url.slice(0, -1) : page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}
</urlset>`.trim();

  await fs.writeFile(path.join(DIST_PATH, 'sitemap.xml'), sitemapContent);
  console.log(`Sitemap generated successfully with ${allPages.length} URLs!`);
}

main();