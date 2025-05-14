import type { NostrEvent as BaseNostrEvent } from '@nostrify/nostrify'

// Extend the NostrEvent type to include our custom properties
export interface NostrEvent extends BaseNostrEvent {
  isSent?: boolean;
  recipient?: string;
}

export interface Contact {
  pubkey: string
  name?: string
  picture?: string
  profile?: any
  lastMessage?: string
  lastMessageTime?: Date
  unreadCount?: number
  hidden?: boolean
}

export interface Message {
  id: string
  kind?: number;
  pubkey: string
  content: string
  created_at: number
  tags: string[][]
  sig: string
  isSent?: boolean
}

export enum NostrKind {
  DirectMessage = 14,
  Seal = 13,
  GiftWrap = 1059,
}

export type { BaseNostrEvent } 