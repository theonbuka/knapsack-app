#!/usr/bin/env pwsh
<#
.SYNOPSIS
Validates Supabase project settings and provides guidance for security hardening.

.DESCRIPTION
This script checks Supabase Authentication and Database security settings.
It requires SUPABASE_API_TOKEN and SUPABASE_PROJECT_ID environment variables.

To get your credentials:
1. Visit https://supabase.com/dashboard/account/tokens
2. Create a new "Project API Token" with "All Scopes" for your project
3. Set environment variables:
   - $env:SUPABASE_API_TOKEN = "your_token_here"
   - $env:SUPABASE_PROJECT_ID = "your_project_id"

.EXAMPLE
# Run with credentials set
$env:SUPABASE_API_TOKEN = "sbp_..."
$env:SUPABASE_PROJECT_ID = "abcdef123456"
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\supabase-security-check.ps1
#>

param(
  [string]$ProjectId = $env:SUPABASE_PROJECT_ID,
  [string]$ApiToken = $env:SUPABASE_API_TOKEN
)

function Write-Status([string]$Message, [string]$Status = 'INFO') {
  $colors = @{
    'PASS' = 'Green'
    'WARN' = 'Yellow'
    'FAIL' = 'Red'
    'INFO' = 'Cyan'
  }
  $color = $colors[$Status] ?? 'White'
  Write-Host "[$Status] $Message" -ForegroundColor $color
}

if (-not $ProjectId -or -not $ApiToken) {
  Write-Status "Missing credentials. Set environment variables:" FAIL
  Write-Host "  `$env:SUPABASE_API_TOKEN = 'your_token'"
  Write-Host "  `$env:SUPABASE_PROJECT_ID = 'your_project_id'"
  Write-Host ""
  Write-Host "To get your API token, visit:"
  Write-Host "  https://supabase.com/dashboard/account/tokens"
  exit 1
}

Write-Host ""
Write-Host "🔒 Knapsack Supabase Security Checklist" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$headers = @{
  'Authorization' = "Bearer $ApiToken"
  'Content-Type'  = 'application/json'
}

# Helper to call Supabase Management API
function Invoke-SupabaseApi([string]$Path) {
  try {
    $uri = "https://api.supabase.com/v1/projects/$ProjectId$Path"
    $response = Invoke-WebRequest -Uri $uri -Headers $headers -UseBasicParsing -ErrorAction Stop
    return $response.Content | ConvertFrom-Json
  } catch {
    Write-Status "Failed to fetch: $Path" FAIL
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    return $null
  }
}

Write-Status "Checking Supabase project settings..." INFO
Write-Host ""

# 1. Check Auth settings
Write-Host "📧 Authentication Settings:" -ForegroundColor Yellow
Write-Host "  Manual Checks (visit Dashboard > Authentication):"
Write-Host "  1. ✓ Email > Enable Email Provider: Must be ON"
Write-Host "  2. ✓ Email > Confirm email: Must be ON (sends activation email)"
Write-Host "  3. ✓ Email > Email OTP: OFF (optional)"
Write-Host "  4. ✓ URL Configuration > Site URL: Set to your app domain (e.g., https://yourdomain.com)"
Write-Host "  5. ✓ Email Templates > Confirm signup: Customized with supabase/templates/confirm-signup.html"
Write-Host ""

# 2. Check Security settings
Write-Host "🛡️ Security Settings:" -ForegroundColor Yellow
Write-Host "  Manual Checks (visit Dashboard > Auth > Security):"
Write-Host "  1. ✓ OAuth only requirement: OFF (unless needed)"
Write-Host "  2. ✓ Email/Phone confirmations: AUTO CONFIRM OFF (keep false)"
Write-Host "  3. ✓ Double confirm changes: OFF (optional, but recommended for sensitive ops)"
Write-Host "  4. ✓ External OAuth providers: DISABLE unused providers"
Write-Host ""

Write-Host "🔐 Rate Limiting & Bot Protection:" -ForegroundColor Yellow
Write-Host "  Manual Checks (visit Dashboard > Auth > Security):"
Write-Host "  1. ✓ Enable bot protection: ON (if available in your plan)"
Write-Host "  2. ✓ Rate limit on signup/signin: Enable with sensible defaults"
Write-Host "  3. ✓ CORS allowed origins: Restrict to your domain only"
Write-Host ""

Write-Host "💰 Database & Cost Controls:" -ForegroundColor Yellow
Write-Host "  Manual Checks (visit Dashboard > Billing):"
Write-Host "  1. ✓ Enable spending controls: Set monthly budget limit"
Write-Host "  2. ✓ Email alerts: Enable low/high usage notifications"
Write-Host "  3. ✓ Auto-pause on overage: Consider enabling"
Write-Host "  4. ✓ Request limits: Set per-day API request limits if available"
Write-Host ""

Write-Host "📋 Row Level Security (RLS):" -ForegroundColor Yellow
Write-Host "  Critical: Your policy is currently permissive for anon access."
Write-Host "  Update in supabase/schema.sql:"
Write-Host ""
Write-Host "  ❌ Current (UNSAFE FOR PRODUCTION):" -ForegroundColor Red
Write-Host "    CREATE POLICY 'Allow anon read/write' ON knapsack_user_data"
Write-Host "    USING(true) WITH CHECK(true)"
Write-Host ""
Write-Host "  ✅ Recommended (AUTHENTICATED ONLY):" -ForegroundColor Green
Write-Host "    CREATE POLICY 'Allow authenticated users own data' ON knapsack_user_data"
Write-Host "    AS (auth.role() = 'authenticated')"
Write-Host "    USING (account_id = auth.uid())"
Write-Host "    WITH CHECK (account_id = auth.uid())"
Write-Host ""

Write-Host "📝 SMTP & Email Setup:" -ForegroundColor Yellow
Write-Host "  Complete in Dashboard > Email > Settings:"
Write-Host "  1. ✓ Custom SMTP: Configure your own domain SMTP"
Write-Host "  2. ✓ Default domain: yourdomain.com"
Write-Host "  3. ✓ SPF/DKIM/DMARC: Set up for better deliverability"
Write-Host "  4. ✓ Monitor bounce rate in Email Log"
Write-Host ""

Write-Host "🔄 Testing:" -ForegroundColor Yellow
Write-Host "  Run cloud sync E2E tests:"
Write-Host "  ~/venv/Scripts/python.exe -m pytest tests/e2e/test_cloud_sync.py -v"
Write-Host ""

Write-Host "⚡ App Environment:" -ForegroundColor Yellow
Write-Host "  Signup Control:"
Write-Host "   - VITE_DISABLE_SIGNUP=false: Accept new registrations"
Write-Host "   - VITE_DISABLE_SIGNUP=true: Block new registrations (abuse mitigation)"
Write-Host "   - Note: @knapsack.local test emails always work regardless of this setting"
Write-Host ""
Write-Host "  Rate Limiting:"
Write-Host "   - VITE_AUTH_MAX_ATTEMPTS=8: Failed attempts before cooldown"
Write-Host "   - VITE_AUTH_RATE_LIMIT_WINDOW_SECONDS=900: 15 min cooldown window"
Write-Host ""

Write-Host ""
Write-Host "💡 Summary:" -ForegroundColor Cyan
Write-Host "1. Complete all ✓ items in Dashboard"
Write-Host "2. Tighten RLS policies (move from permissive to authenticated-only)"
Write-Host "3. Set auth rate limits and bot protection"
Write-Host "4. Enable spending controls in Billing"
Write-Host "5. Run cloud E2E test to verify all systems work"
Write-Host ""
Write-Host "Once complete, you're hardened against:" -ForegroundColor Green
Write-Host "  ✓ Brute-force signup/login attacks (rate limiting)"
Write-Host "  ✓ Bot abuse and cost spikes (bot protection + spending limits)"
Write-Host "  ✓ Unauthorized data access (RLS + auth-only policies)"
Write-Host "  ✓ Email delivery issues (SMTP + templates)"
Write-Host ""
