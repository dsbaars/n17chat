<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface LinkMetadata {
  title: string;
  description: string;
  image: string;
  url: string;
  hostname: string;
}

const props = defineProps({
  url: {
    type: String,
    required: true
  }
})

const metadata = ref<LinkMetadata | null>(null)
const loading = ref(true)
const error = ref(false)

async function extractMetadataFromText(html: string, url: string): Promise<LinkMetadata> {
  // Parse the HTML content
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  
  // Extract metadata
  const title = doc.querySelector('title')?.textContent || 
                doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || 
                doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') || 
                new URL(url).hostname
  
  const description = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || 
                      doc.querySelector('meta[name="description"]')?.getAttribute('content') || 
                      doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content') || 
                      ''
  
  let image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || 
              doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') || 
              ''
  
  // Make sure the image URL is absolute
  if (image && !image.startsWith('http')) {
    const urlObj = new URL(url)
    image = `${urlObj.protocol}//${urlObj.host}${image.startsWith('/') ? '' : '/'}${image}`
  }


   // Try to load the image directly first, and use proxy only if needed
   if (image) {
     // Use a synchronous approach to check image loading
     const originalImageUrl = image;
     try {
       // Create a new image and wait for it to load or fail
       await new Promise((resolve, reject) => {
         const imgElement = new Image();
         imgElement.onload = resolve;
         imgElement.onerror = reject;
         imgElement.src = originalImageUrl;
       });
       // If we get here, the image loaded successfully
     } catch {
       console.log('Image loading failed, using proxy');
       // If direct loading fails, use the CORS proxy
       image = 'https://api.cors.lol/?url=' + encodeURIComponent(originalImageUrl);
     }
   }
  // Get hostname
  const urlObj = new URL(url)
  const hostname = urlObj.hostname
  
  return {
    title,
    description,
    image,
    url,
    hostname
  }
}

async function fetchWithPublicProxy(url: string) {
  // Use a public CORS proxy
  const proxyUrl = `https://api.cors.lol/?url=${encodeURIComponent(url)}`
  const response = await fetch(proxyUrl)
  const data = await response.text()
  
  if (!response.ok) {
    throw new Error('Failed to fetch with proxy')
  }
  
  return data
}

async function fetchLinkMetadata(url: string) {
  try {
    loading.value = true
    error.value = false

    let html = ''
    
    try {
      // Try direct access first (will likely fail due to CORS)
      const response = await fetch(url, {
        mode: 'cors', // This is actually the default
        headers: {
          'Accept': 'text/html'
        }
      })
      
      if (!response.ok) {
        throw new Error('Direct fetch failed')
      }
      
      html = await response.text()
    } catch (directFetchError) {
      console.log('Direct fetch failed, trying with proxy:', directFetchError)
      // Fall back to public CORS proxy
      html = await fetchWithPublicProxy(url)
    }
    
    metadata.value = await extractMetadataFromText(html, url)
  } catch (err) {
    console.error('Error fetching link metadata:', err)
    
    // Create a basic metadata object from the URL itself
    try {
      const urlObj = new URL(url)
      metadata.value = {
        title: urlObj.hostname,
        description: '',
        image: '',
        url,
        hostname: urlObj.hostname
      }
    } catch {
      // If even the URL parsing fails, set error
      error.value = true
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLinkMetadata(props.url)
})
</script>

<template>
  <div v-if="!loading && metadata" class="link-preview mt-2 rounded overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
    <a :href="metadata.url" target="_blank" class="block text-inherit no-underline">
      <div class="flex flex-col sm:flex-row">
        <!-- Image preview on the left or top -->
        <div v-if="metadata.image" class="sm:w-1/3 h-32 sm:h-auto overflow-hidden bg-gray-100 flex-shrink-0">
          <img :src="metadata.image" :alt="metadata.title" class="w-full h-full object-cover" crossorigin="anonymous" >
        </div>
        
        <!-- Content on the right or bottom -->
        <div class="p-3 flex-grow">
          <h3 class="text-sm font-semibold line-clamp-2 mb-1 text-gray-800">{{ metadata.title }}</h3>
          <p v-if="metadata.description" class="text-xs text-gray-600 line-clamp-3 mb-2">{{ metadata.description }}</p>
          <div class="text-xs text-gray-500 truncate">{{ metadata.hostname }}</div>
        </div>
      </div>
    </a>
  </div>
  
  <div v-else-if="loading" class="link-preview-loading mt-2 p-3 rounded border border-gray-200">
    <div class="flex items-center space-x-2">
      <div class="animate-pulse w-4 h-4 rounded-full bg-gray-300"/>
      <div class="text-xs text-gray-500">Loading preview...</div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style> 