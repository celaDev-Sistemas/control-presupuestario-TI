# ✅ Checklist de Deployment

Usa esta lista antes de subir a producción en tu servidor.

## 🗄️ Base de Datos

- [ ] MySQL 8.0+ instalado
- [ ] Base de datos `control_presupuestario` creada
- [ ] Usuario de BD creado con permisos correctos
- [ ] Schema importado: `mysql -u user -p control_presupuestario < database/schema.sql`
- [ ] Verificar que hay datos iniciales: `SELECT * FROM edificios;`
- [ ] Backup automático configurado

## 🔐 Azure AD App Registration

- [ ] App Registration creado en Azure Portal
- [ ] Nombre: `Control Presupuestario Celaque`
- [ ] Redirect URIs configurados (dev + producción)
- [ ] API Scope creado: `api://{CLIENT_ID}/access_as_user`
- [ ] CLIENT_ID copiado
- [ ] TENANT_ID confirmado: `deb13623-4618-4c6b-a268-3d5e4dec1c30`

## 🔧 Backend

- [ ] Node.js 18+ instalado
- [ ] Carpeta `backend` subida al servidor
- [ ] `npm install` ejecutado
- [ ] `.env` creado con valores de producción:
  - [ ] `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
  - [ ] `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID`
  - [ ] `CORS_ORIGIN` con tu dominio de producción
  - [ ] `JWT_SECRET` generado (mínimo 32 caracteres aleatorios)
  - [ ] `NODE_ENV=production`
- [ ] `npm run build` ejecutado sin errores
- [ ] PM2 instalado: `npm install -g pm2`
- [ ] Backend arrancado: `pm2 start npm --name presupuesto-api -- start`
- [ ] Backend guardado: `pm2 save`
- [ ] Auto-inicio configurado: `pm2 startup` (seguir instrucciones)
- [ ] Logs revisados: `pm2 logs presupuesto-api`
- [ ] Health check responde: `curl http://localhost:3001/health`

## 🎨 Frontend

- [ ] Carpeta `frontend` preparada
- [ ] `npm install` ejecutado
- [ ] `.env` creado con valores de producción:
  - [ ] `VITE_AZURE_TENANT_ID`
  - [ ] `VITE_AZURE_CLIENT_ID`
  - [ ] `VITE_REDIRECT_URI` con tu dominio de producción
  - [ ] `VITE_API_URL` apuntando a tu API (puede ser relativo: `/api/v1`)
- [ ] `npm run build` ejecutado sin errores
- [ ] Archivos de `dist/` copiados a `/var/www/presupuesto/` (o tu carpeta de nginx)

## 🌐 Nginx

- [ ] Nginx instalado
- [ ] Archivo de configuración creado: `/etc/nginx/sites-available/presupuesto`
- [ ] Frontend sirviendo correctamente (ruta `/`)
- [ ] Proxy al backend funcionando (ruta `/api`)
- [ ] Symlink creado: `ln -s /etc/nginx/sites-available/presupuesto /etc/nginx/sites-enabled/`
- [ ] Configuración testeada: `sudo nginx -t`
- [ ] Nginx reiniciado: `sudo systemctl reload nginx`
- [ ] Dominio apuntando al servidor
- [ ] Sitio accesible desde navegador

## 🔒 SSL/HTTPS

- [ ] Certbot instalado: `apt install certbot python3-certbot-nginx`
- [ ] Certificado generado: `certbot --nginx -d tu-dominio.com`
- [ ] Auto-renovación configurada (certbot lo hace automático)
- [ ] HTTPS funcionando
- [ ] Redirect HTTP → HTTPS configurado

## 👥 Usuarios

- [ ] Usuario admin creado en tabla `usuarios`
- [ ] Email del admin es tu cuenta @celaque.com
- [ ] Rol del admin es `ADMIN`
- [ ] Poder hacer login con Azure AD
- [ ] Token incluido en requests (verificar en Network tab del navegador)

## 🧪 Pruebas

- [ ] Login con Azure AD funciona
- [ ] Ver lista de edificios funciona
- [ ] Crear un edificio funciona
- [ ] Editar un edificio funciona
- [ ] Desactivar un edificio funciona
- [ ] Dashboard carga sin errores
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en logs del backend: `pm2 logs`

## 📊 Monitoreo

- [ ] PM2 monit funcionando: `pm2 monit`
- [ ] Logs del backend revisables: `pm2 logs presupuesto-api`
- [ ] Nginx logs accesibles: `tail -f /var/log/nginx/access.log`
- [ ] MySQL logs accesibles: `tail -f /var/log/mysql/error.log`

## 🔄 Backups

- [ ] Backup de MySQL configurado (diario recomendado)
- [ ] Script de backup:
  ```bash
  mysqldump -u presupuesto_user -p control_presupuestario > backup_$(date +%Y%m%d).sql
  ```
- [ ] Cron job para backup automático
- [ ] Backups guardados en ubicación segura

## 🚀 Performance

- [ ] Gzip habilitado en Nginx
- [ ] Cache headers configurados
- [ ] PM2 con 2+ instancias (cluster mode) si el servidor lo permite:
  ```bash
  pm2 start npm --name presupuesto-api -i 2 -- start
  ```

## 📱 Azure AD - Configuración adicional

- [ ] Usuarios @celaque.com pueden hacer login
- [ ] Redirect URIs incluyen tanto http://localhost:5173 (dev) como https://tu-dominio.com (prod)
- [ ] En "Authentication" → "Implicit grant and hybrid flows":
  - [ ] ✅ Access tokens (no es necesario marcar ID tokens)
- [ ] Token lifetime por defecto está OK (1 hora)

## 🔧 Configuraciones de seguridad

- [ ] CORS configurado solo con tu dominio
- [ ] Rate limiting activo (100 req/15min por defecto)
- [ ] Helmet headers activos
- [ ] MySQL usuario con permisos mínimos necesarios
- [ ] Firewall configurado (solo puertos 80, 443, 22)
- [ ] SSH con key-based auth (no password)

## 📝 Documentación

- [ ] README.md actualizado con tu info de deployment
- [ ] Variables de entorno documentadas
- [ ] Contactos de soporte agregados
- [ ] Procedures de rollback documentados

---

## 🆘 Si algo falla

**Backend no arranca:**
```bash
pm2 logs presupuesto-api --lines 100
# Revisar errores de conexión a BD o configuración
```

**Frontend no carga:**
```bash
tail -f /var/log/nginx/error.log
# Verificar permisos en /var/www/presupuesto/
ls -la /var/www/presupuesto/
```

**Error 401 (Autenticación):**
- Verificar que CLIENT_ID es el mismo en frontend y backend
- Verificar que el token se está enviando: Network tab → Headers → Authorization: Bearer ...
- Verificar en Azure que el scope está expuesto

**Error de CORS:**
- Verificar CORS_ORIGIN en backend/.env
- Reiniciar backend: `pm2 restart presupuesto-api`

---

Una vez todo esté ✅, ¡tu sistema está listo para producción! 🎉
