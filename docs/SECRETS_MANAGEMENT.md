# Secrets Management

## Environment Variables (Production)

Sensitive env vars:
- DATABASE_URL: PostgreSQL connection (never in code)
- NEXTAUTH_SECRET: 32+ character random
- DAILY_API_KEY: Daily.co production key
- DEEPGRAM_API_KEY: Deepgram production key
- SENTRY_DSN: Sentry project DSN

## Where to Store

**Option 1: Cloud Provider (Recommended)**
- AWS Secrets Manager / Parameter Store
- Azure Key Vault
- Google Cloud Secret Manager
- Vercel Environment Variables

**Option 2: Self-Hosted**
- GitHub Secrets (CI/CD only)
- Environment file on server (600 permissions)
- Vault software (HashiCorp Vault)

**Option 3: What NOT to Do**
- ❌ Commit .env to git
- ❌ Store in Docker image
- ❌ Share in Slack/email
- ❌ Use weak/default secrets

## Secret Rotation

Rotate quarterly:
1. Generate new secret
2. Update in secrets store
3. Restart application
4. Invalidate old secret
5. Log rotation event

## Access Control

- Only ops/backend team can access
- All access logged
- Revoke on departure
- Review access monthly
