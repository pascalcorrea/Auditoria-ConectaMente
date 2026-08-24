# Security Policy

## Reporting a Vulnerability

Please report security vulnerabilities to security@conectamente.cl (or replace with actual email).
Do not disclose vulnerabilities publicly until they are patched.

## Security Measures

### Authentication & Authorization
- NextAuth.js v4 with JWT strategy
- Role-based access control (cliente, medico, backoffice)
- Cross-organization data isolation (organizacionId filter on all queries)
- Session expiry: 30 days (configurable)

### Data Protection
- Centralized role checks (lib/security.ts)
- Request logging for audit trail (lib/request-logger.ts)
- Cross-org filters on all database queries
- User ownership verification on sensitive operations

### API Security
- Consistent error responses (lib/error-handler.ts)
- Rate limit headers on sensitive endpoints
- CSRF protection via NextAuth (SameSite cookies)

### What We Don't Cover

- Real rate limiting (use reverse proxy: nginx, Cloudflare, AWS WAF)
- DDoS protection (use CDN: Cloudflare, AWS CloudFront)
- Database encryption at rest (use cloud provider: AWS RDS encryption, Azure Encryption)
- SSL/TLS termination (use reverse proxy or load balancer)

## Security Checklist

- [ ] Secrets (.env) are never committed to git (use .env.example)
- [ ] NEXTAUTH_SECRET is 32+ characters
- [ ] Database requires password authentication
- [ ] All API routes verify user session and role
- [ ] Cross-org queries filter by organizacionId
- [ ] Logs do not contain secrets or PII
- [ ] External API calls (Daily.co, Deepgram) use secure HTTPS

## Incident Response

1. Immediately disable affected accounts or features
2. Collect logs and evidence
3. Notify affected users
4. Deploy patch
5. Conduct post-mortem
