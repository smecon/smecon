<template>
  <div class="legal-page">
    <header class="page-header">
      <h1>Terms of Service</h1>
      <p><strong>Last updated: {{ lastUpdated }}</strong></p>
    </header>
    
    <div class="content-wrapper">
      <h2>1. Acceptance of Terms</h2>
      <p>By accessing and using {{ siteName }} (the "Site"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>

      <h2>2. Use of the Site</h2>
      <p>This site and its components are offered for informational purposes only; this site shall not be responsible or liable for the accuracy, usefulness or availability of any information transmitted or made available via the site, and shall not be responsible or liable for any error or omissions in that information.</p>

      <h2>3. Intellectual Property</h2>
      <p>The Site and its original content, features, and functionality are owned by {{ siteName }} and are protected by international copyright, trademark, and other intellectual property or proprietary rights laws.</p>

      <h2>4. Limitation of Liability</h2>
      <p>In no event shall {{ siteName }} be liable for any direct, indirect, incidental, special, or consequential damages arising out of or in any way connected with the use of our tools or services.</p>

      <h2>5. Governing Law</h2>
      <p>These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which the owner of the Site is based, without regard to its conflict of law provisions.</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useHead } from '@unhead/vue';

const siteName = import.meta.env.VITE_SITE_NAME;
const siteUrl = import.meta.env.VITE_SITE_URL;

const lastUpdated = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
});

const pageTitle = `Terms of Service | ${siteName}`;
const pageDescription = `Read the Terms of Service for ${siteName}. Understand the rules and guidelines for using our free content creator tools.`;
const pageUrl = `${siteUrl}/terms-of-service`;

useHead({
  title: pageTitle,
  link: [
    { rel: 'canonical', href: pageUrl }
  ],
  meta: [
    { name: 'description', content: pageDescription },
    { property: 'og:title', content: pageTitle },
    { property: 'og:description', content: pageDescription },
    { property: 'og:url', content: pageUrl },
    { property: 'og:image', content: `${siteUrl}/logo.png` },
  ],
});
</script>

<style scoped>
.legal-page {
  max-width: 800px;
  margin: 0 auto;
}
.page-header {
  text-align: center;
  margin-bottom: 2rem;
}
.page-header h1 {
  font-size: 2.5rem;
}
.content-wrapper {
  background-color: var(--card-background);
  padding: 1.5rem;
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  line-height: var(--line-height-base);
}
@media (min-width: 768px) {
  .content-wrapper {
    padding: 3rem;
  }
}
.content-wrapper h2 {
  font-size: 1.75rem;
  margin-top: 2rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}
.content-wrapper p {
  margin-bottom: 1rem;
}
</style>