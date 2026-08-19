# VPS Production Access

## Infraestructura
- **Proveedor:** Hostinger VPS
- **IP:** 31.97.167.199
- **Dominio:** app.conectamente.cl

## SSH Access
```bash
ssh -i ~/.ssh/id_ed25519 root@31.97.167.199
```

**Configuración:**
- SSH Key: ED25519 (`~/.ssh/id_ed25519`)
- User: root
- Port: 22 (default)

## PostgreSQL (Docker)
```bash
# Via SSH + docker exec
ssh -i ~/.ssh/id_ed25519 root@31.97.167.199 'docker exec conectamente-db psql -U app_user -d conectamente -c "SELECT * FROM \"Usuario\";"'
```

**Configuración:**
- Host: localhost (dentro del VPS)
- Puerto: 5434 (mapeado desde 5432)
- Usuario: app_user
- Base datos: conectamente
- Docker container: conectamente-db
- Imagen: postgres:16-alpine

## Usuarios Producción
5 usuarios preconfigurados (contraseña: `ChangeMe123!`):

| Email | Rol | Nombre |
|-------|-----|--------|
| backoffice@conectamente.cl | backoffice | Backoffice Demo |
| medico1@conectamente.cl | medico | Dra. María García |
| medico2@conectamente.cl | medico | Dr. Juan Rodríguez |
| cliente-isapre@conectamente.cl | cliente | Cliente Isapre Demo |
| cliente-empresa@conectamente.cl | cliente | Cliente Empresa Demo |

## Aplicación
- URL: https://app.conectamente.cl
- Deploy: PM2 process `conectamente-core` puerto 3001
- Reverse proxy: Nginx
- Rebuild: `cd /app && npm run build && pm2 restart conectamente-core`

## Secretos
No incluir en este archivo:
- SSH key privadas
- Contraseñas reales
- API tokens
- .env valores sensibles

Ver `.claude/projects/*/memory/` para detalles privados.
