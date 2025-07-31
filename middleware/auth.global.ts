export default defineNuxtRouteMiddleware((to) => {
  // Only run on client side
  if (process.server) return

  // Skip the no-extension page itself to avoid infinite redirects
  if (to.path === '/no-extension') return

  // Check if Nostr extension is available
  const hasNostrExtension = typeof window !== "undefined" && "nostr" in window

  // If no extension is available and we're not already on the no-extension page,
  // redirect to the no-extension page
  if (!hasNostrExtension) {
    return navigateTo('/no-extension')
  }
}) 