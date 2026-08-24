# Deployment Guide

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Daily.co account (video conferencing)
- Deepgram account (transcription, optional)

## Environment Setup

1. Copy .env.example to .env and fill in secrets:

```bash
cp .env.example .env
# Edit .env with production values
```

2. Database migration:

```bash
npx prisma migrate deploy
```

3. Build:

```bash
npm run build
npm start
```

## Monitoring

- Watch logs for `[ERROR]` tags
- Monitor database connection pool (Prisma default: 10 connections)
- Set up alerts for 5xx HTTP errors
- Check Daily.co API quota usage

## Rollback

- Git tag each production release: `git tag -a v1.0.0 -m "Release 1.0.0"`
- Database migrations are one-way; maintain rollback plan (e.g., shadow tables)

## Configuration

### Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| DATABASE_URL | Yes | PostgreSQL connection string with SSL for production |
| NEXTAUTH_SECRET | Yes | Generate with: `openssl rand -base64 32` |
| NEXTAUTH_URL | Yes | Public URL (https://your-domain.com) |
| DAILY_API_KEY | Optional | For real video conferencing |
| DEEPGRAM_API_KEY | Optional | For AI transcription |

### Performance Tuning

- Database pool size: `PRISMA_MAX_CONNECTIONS=20` (adjust based on load)
- Cache TTL: Query cache defaults to 5 minutes (configurable in lib/cache.ts)
- Session max age: 30 days (NextAuth default)
