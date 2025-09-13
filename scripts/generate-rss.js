import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

const DIST_PATH = path.resolve(process.cwd(), 'dist');
const ARTICLES_PATH = path.resolve(process.cwd(), 'public/articles.json');
const SITE_URL = process.env.VITE_SITE_URL || 'https://example.com';
const SITE_NAME = process.env.VITE_SITE_NAME || 'My Awesome Blog';
const SITE_DESCRIPTION = `The latest articles, tips, and insights from ${SITE_NAME}.`;

// Fungsi untuk membersihkan teks agar aman untuk XML (menghapus karakter ilegal)
function escapeXmlText(text) {
  return text.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

// Fungsi untuk membuat blok deskripsi CDATA
function createCdataDescription(summary, imageUrl) {
  const imageTag = imageUrl ? `<img src="${imageUrl}" alt="" /><br/><br/>` : '';
  const fullDescription = imageTag + summary;
  // CDATA secara otomatis menangani karakter khusus di dalamnya
  return `<![CDATA[${fullDescription}]]>`;
}

async function main() {
  console.log('Generating RSS feed...');

  try {
    const fileContent = await fs.readFile(ARTICLES_PATH, 'utf-8');
    const articles = JSON.parse(fileContent);

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const publishedArticles = articles.filter(post => post.date && new Date(post.date) <= today);

    const latestArticles = publishedArticles
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20);

    const feedItems = latestArticles.map(article => {
      // PERBAIKAN KUNCI: Pastikan URL untuk enclosure di-escape dengan benar
      const enclosure = article.imageUrl 
        ? `<enclosure url="${escapeXmlText(article.imageUrl)}" length="0" type="image/jpeg" />` 
        : '';

      return `
    <item>
      <title>${escapeXmlText(article.term)}</title>
      <link>${SITE_URL}/${article.slug}</link>
      <guid>${SITE_URL}/${article.slug}</guid>
      <pubDate>${new Date(article.date).toUTCString()}</pubDate>
      <description>${createCdataDescription(article.summary, article.imageUrl)}</description>
      ${enclosure}
    </item>
      `;
    }).join('');

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXmlText(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXmlText(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${feedItems}
  </channel>
</rss>`;

    await fs.writeFile(path.join(DIST_PATH, 'rss.xml'), rssFeed.trim());
    console.log(`RSS feed generated successfully with ${latestArticles.length} items!`);

  } catch (e) {
    console.error(`Could not generate RSS feed. Error: ${e.message}`);
  }
}

main();