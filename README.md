# N17Chat - Nostr Chat Client

A Telegram-like chat client for Nostr messages built with Nuxt, DaisyUI, and the NDK (Nostr Development Kit).

## Features

- View and manage Nostr chat conversations
- Send and receive messages using Nostr protocol
- Message persistence with IndexedDB via Dexie.js
- Responsive UI with DaisyUI and TailwindCSS

## Technical Stack

- Nuxt 3
- Vue 3
- TailwindCSS
- DaisyUI
- Pinia for state management
- NDK (Nostr Development Kit)
- Dexie.js for IndexedDB access

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Usage

The app requires a Nostr extension like nos2x or Alby to be installed in the browser to function properly. This allows the app to request the user's public key and to sign events.

## Development

### Architecture

- `components/` - UI components
- `stores/` - Pinia stores for state management
- `plugins/` - Nuxt plugins like Nostr NDK integration
- `types/` - TypeScript type definitions
- `layouts/` - Nuxt layouts
- `pages/` - Nuxt pages

### Database Structure

The app uses Dexie.js to store Nostr events with the following schema:

- `events` table:
  - `id` (primary key) - Event ID
  - `pubkey` (indexed) - Public key of the event author
  - `created_at` (indexed) - Timestamp
  - `kind` (indexed) - Nostr event kind

### Requirements

- Node.js 18+
- Browser with Nostr extension (for signing)
