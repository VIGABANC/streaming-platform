import { describe, expect, it } from 'vitest'
import { createMemoryTelegramSessionStore } from '@/lib/telegram-sessions'

describe('Telegram wizard sessions', () => {
  it('stores and clears a private feedback draft', async () => {
    const store = createMemoryTelegramSessionStore()
    await store.save({ bot: 'feedback', chatId: '10', userId: '10', step: 'description', draft: { type: 'bug' }, updatedAt: new Date().toISOString() })
    await expect(store.get('feedback', '10', '10')).resolves.toMatchObject({ step: 'description', draft: { type: 'bug' } })
    await store.clear('feedback', '10', '10')
    await expect(store.get('feedback', '10', '10')).resolves.toBeNull()
  })
})
