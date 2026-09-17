param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectRef
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
  throw 'Node.js/npm is required to run Supabase migrations.'
}

if (-not $env:SUPABASE_ACCESS_TOKEN) {
  Write-Host 'SUPABASE_ACCESS_TOKEN is not set. Run: npx supabase login'
  exit 1
}

if ($ProjectRef -notmatch '^[a-z0-9]{20}$') {
  throw 'ProjectRef must be the 20-character Supabase project reference.'
}

Write-Host "Linking Supabase project $ProjectRef..."
npx supabase link --project-ref $ProjectRef
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host 'Applying checked-in migrations...'
npx supabase db push
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host 'Migration deployment completed. Verify missing_availability_reports through the authenticated application path.'
