# VEYRA Telegram Operations

## Webhook URLs

After the Vercel deployment is ready, configure the two bots separately:

```text
Feedback Bot:  https://<vercel-domain>/api/telegram/webhook
Community Bot: https://<vercel-domain>/api/telegram/community-webhook
```

The Feedback Bot keeps the legacy `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` names as fallbacks. New deployments should use the explicit names below.

## Vercel variables

Set these in Production and Preview when testing both environments:

```text
TELEGRAM_FEEDBACK_BOT_TOKEN
TELEGRAM_FEEDBACK_WEBHOOK_SECRET
TELEGRAM_FEEDBACK_BOT_USERNAME
TELEGRAM_COMMUNITY_BOT_TOKEN
TELEGRAM_COMMUNITY_WEBHOOK_SECRET
TELEGRAM_COMMUNITY_BOT_USERNAME
TELEGRAM_ADMIN_CHAT_IDS
TELEGRAM_ADMIN_USER_IDS
```

Keep bot tokens and webhook secrets as Vercel Secrets. User-facing usernames and comma-separated chat/user ids may be Config values. Never commit real values to `.env.example` or Git.

## BotFather setup

1. Create or reuse one bot for community use and one bot for feedback.
2. Set each bot's username and description.
3. Keep Privacy Mode enabled for Community Bot. It will answer buttons, direct messages, mentions, and replies to its messages.
4. Do not add Feedback Bot to the public group unless a visible entry point is specifically required; use its deep link instead.
5. Add Community Bot to the public group.
6. Add Feedback Bot to the private admin group and make it an administrator if Telegram requires that for the intended message actions.

## Set the webhooks

PowerShell example:

```powershell
$feedbackApi = 'https://api.telegram.org/bot' + $feedbackToken
$communityApi = 'https://api.telegram.org/bot' + $communityToken

Invoke-RestMethod -Method Post -Uri ($feedbackApi + '/setWebhook') -ContentType 'application/json' -Body (@{
  url = 'https://<vercel-domain>/api/telegram/webhook'
  secret_token = $feedbackSecret
  allowed_updates = @('message', 'callback_query')
} | ConvertTo-Json)

Invoke-RestMethod -Method Post -Uri ($communityApi + '/setWebhook') -ContentType 'application/json' -Body (@{
  url = 'https://<vercel-domain>/api/telegram/community-webhook'
  secret_token = $communitySecret
  allowed_updates = @('message', 'callback_query')
} | ConvertTo-Json)
```

Verify each bot:

```powershell
Invoke-RestMethod -Uri ($feedbackApi + '/getWebhookInfo') | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri ($communityApi + '/getWebhookInfo') | ConvertTo-Json -Depth 5
```

The reported URL must be the exact route, the pending count should fall after a test message, and there must be no recent `503` error.

## Smoke tests

1. POST an invalid secret to each route and expect `401`.
2. Send `/start` to Feedback Bot privately and expect the type keyboard.
3. Open a deep link such as `/start playback`, describe the issue, skip context, and submit.
4. Confirm the Supabase row exists before checking AI/GitHub status.
5. Confirm the admin group receives one card with buttons.
6. Press `Resolve` as an admin and confirm the lifecycle status changes.
7. Send ordinary unrelated text in the public group and confirm Community Bot stays quiet.
8. Mention Community Bot and press `Report a problem`; confirm it opens Feedback Bot privately.
9. Repeat the same Telegram update and confirm no duplicate ticket or GitHub issue is created.
