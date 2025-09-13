<template>
  <div class="blog-index-page">
    <header class="page-header">
      <h1>{{ pageTitle }}</h1>
      <p v-if="pageDescription">{{ pageDescription }}</p>
    </header>

    <AdRenderer v-if="!props.categorySlug && adSlots.homepage.enabled" slotName="homepage" />

    <div v-if="isLoading && !isLoaded" class="loading-state">
      <p>Loading articles...</p>
    </div>

    <div v-else-if="sortedPosts.length > 0" class="posts-grid">
      <BlogPostCard
        v-for="post in sortedPosts"
        :key="post.slug"
        :title="post.term || post.title"
        :description="post.summary"
        :date="post.date"
        :slug="post.slug"
        :image-url="post.imageUrl"
      />
    </div>
    
    <div v-else class="no-posts">
      <p>No articles published yet. Please check back later!</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import { useHead } from '@unhead/vue';
import BlogPostCard from '@/components/ui/BlogPostCard.vue';
import AdRenderer from '@/components/ads/AdRenderer.vue';
import { adSlots } from '@/adConfig.js';
import { useArticles } from '@/composables/useArticles.js';

const props = defineProps({
  categorySlug: String
});

const { articles: allPosts, isLoading, isLoaded, fetchArticles } = useArticles();

onMounted(() => {
  fetchArticles();
});

const siteName = import.meta.env.VITE_SITE_NAME || 'KontenKit';
const siteUrl = import.meta.env.VITE_SITE_URL || 'https://www.kontenkit.com';

const filteredPosts = computed(() => {
  if (!props.categorySlug) {
    return allPosts.value;
  }
  return allPosts.value.filter(post => post.categorySlug === props.categorySlug);
});

const currentCategoryName = computed(() => {
  if (!props.categorySlug) return null;
  const post = allPosts.value.find(p => p.categorySlug === props.categorySlug);
  return post ? post.category : props.categorySlug;
});

const publishedPosts = computed(() => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return filteredPosts.value.filter(post => {
    if (!post.date) return false;
    const postDate = new Date(post.date);
    return postDate <= today;
  });
});

const sortedPosts = computed(() => {
  return [...publishedPosts.value].sort((a, b) => new Date(b.date) - new Date(a.date));
});

const pageTitle = computed(() => {
  return props.categorySlug ? currentCategoryName.value : `The ${siteName} Blog`;
});

const pageDescription = computed(() => {
  return props.categorySlug 
    ? `All articles in the "${currentCategoryName.value}" category.`
    : `The latest articles, tips, and insights from ${siteName}.`;
});

useHead(() => {
  const url = props.categorySlug ? `${siteUrl}/category/${props.categorySlug}` : siteUrl;
  const imageUrl = `${siteUrl}/logo.png`;

  return {
    title: pageTitle.value,
    link: [{ rel: 'canonical', href: url }],
    meta: [
      { name: 'description', content: pageDescription.value },
      { property: 'og:title', content: pageTitle.value },
      { property: 'og:description', content: pageDescription.value },
      { property: 'og:url', content: url },
      { property: 'og:image', content: imageUrl },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:image', content: imageUrl },
      { name: 'twitter:title', content: pageTitle.value },
      { name: 'twitter:description', content: pageDescription.value },
    ],
  };
});

watch(() => props.categorySlug, () => {
});
</script>

<style scoped>
.page-header {
  text-align: center;
  margin-bottom: 3rem;
}
.page-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}
.page-header p {
  font-size: 1.1rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: auto;
}
.posts-grid {
  column-count: 1;
  column-gap: var(--spacing-md);
}
.posts-grid > * {
  break-inside: avoid;
  margin-bottom: var(--spacing-md);
}
@media (min-width: 768px) {
  .posts-grid {
    column-count: 2;
  }
}
@media (min-width: 992px) {
  .posts-grid {
    column-count: 3;
  }
}
.loading-state,
.no-posts {
  text-align: center;
  margin-top: 4rem;
  color: var(--text-secondary);
}
</style>