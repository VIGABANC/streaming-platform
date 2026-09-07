import { NextResponse } from 'next/server'
import { createCommunityTelegramDependencies, formatCommunityWebhookError, handleCommunityUpdate, parseCommunityUpdate } from '@/lib/telegram-community'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const expectedSecret = process.env.TELEGRAM_COMMUNITY_WEBHOOK_SECRET
  if (expectedSecret && request.headers.get('x-telegram-bot-api-secret-token') !== expectedSecret) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  try {
    const update = parseCommunityUpdate(await request.json(), process.env.TELEGRAM_COMMUNITY_BOT_USERNAME)
    if (update.kind === 'ignore') return NextResponse.json({ ok: true })
    await handleCommunityUpdate(update, createCommunityTelegramDependencies())
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('telegram community webhook failed', { name: error instanceof Error ? error.name : 'unknown', message: formatCommunityWebhookError(error) })
    return NextResponse.json({ ok: false, error: 'temporarily_unavailable' }, { status: 503 })
  }
}
