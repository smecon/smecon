<template>
  <div v-if="htmlContent" v-html="htmlContent" ref="adContainer" class="ad-renderer-wrapper"></div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';

const props = defineProps({
  slotName: {
    type: String,
    required: true,
  },
});

const htmlContent = ref('');
const adContainer = ref(null);

const executeScriptsInContainer = (container) => {
  const scriptElements = container.querySelectorAll('script');
  scriptElements.forEach(oldScript => {
    const newScript = document.createElement('script');
    Array.from(oldScript.attributes).forEach(attr => {
      newScript.setAttribute(attr.name, attr.value);
    });
    if (oldScript.innerHTML) {
      newScript.innerHTML = oldScript.innerHTML;
    }
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
};

onMounted(async () => {
  try {
    const adModule = await import(`../../ads-content/${props.slotName}.html?raw`);
    const rawContent = adModule.default;

    // Hanya render jika file tidak kosong
    if (rawContent && rawContent.trim() !== '') {
      htmlContent.value = rawContent;
      await nextTick();
      if (adContainer.value) {
        executeScriptsInContainer(adContainer.value);
      }
    }
  } catch (error) {
    // Ini normal jika file tidak ada atau kosong, jadi kita tidak perlu log error
  }
});
</script>

<style scoped>
.ad-renderer-wrapper {
  /* Style ini akan berlaku untuk div pembungkus */
  margin: 2rem 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>