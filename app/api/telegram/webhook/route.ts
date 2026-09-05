import { NextResponse } from 'next/server'
import { createDefaultTelegramDependencies, formatTelegramWebhookError, handleTelegramUpdate, parseTelegramUpdate } from '@/lib/telegram'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (expectedSecret && request.headers.get('x-telegram-bot-api-secret-token') !== expectedSecret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  try {
    const update = parseTelegramUpdate(await request.json())
    if (update.kind === 'ignore') return NextResponse.json({ ok: true })
    await handleTelegramUpdate(update, createDefaultTelegramDependencies())
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('telegram webhook failed', {
      name: error instanceof Error ? error.name : 'unknown',
      message: formatTelegramWebhookError(error),
    })
    return NextResponse.json({ ok: false, error: 'temporarily_unavailable' }, { status: 503 })
  }
}
