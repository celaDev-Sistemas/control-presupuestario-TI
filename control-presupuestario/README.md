# 💰 Sistema de Control Presupuestario - Celaque

Sistema completo de control presupuestario con división por edificios, cuentas jerárquicas, y seguimiento de presupuesto vs gastos reales.

## 🏗️ Arquitectura

```
Frontend (React + TypeScript + Tailwind)
           ↓ HTTPS + Bearer Token
Backend (Express + TypeScript API REST)
           ↓
MySQL 8.0+ Database
```

**Autenticación:** Azure AD (MSAL) con tu tenant existente

---

## 📋 Pre-requisitos

### En tu servidor

- **Node.js 18+** y npm
- **MySQL 8.0+**
- **PM2** (para mantener el backend corriendo)
- **Nginx** o Apache (para servir el frontend y hacer proxy al backend)

### Para desarrollo local

- Node.js 18+
- MySQL 8.0+
- Git

---

## 🚀 Instalación

### 1️⃣ Base de Datos MySQL

```bash
# 1. Crear la base de datos
mysql -u root -p
CREATE DATABASE control_presupuestario CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'presupuesto_user'@'localhost' IDENTIFIED BY 'tu_password_seguro';
GRANT ALL PRIVILEGES ON control_presupuestario.* TO 'presupuesto_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 2. Importar el schema
cd control-presupuestario/database
mysql -u presupuesto_user -p control_presupuestario < schema.sql
```

### 2️⃣ Configurar Azure AD App Registration

Necesitas crear un App Registration en Azure AD para la autenticación:

**Paso 1: Crear App Registration**
1. Ve a [Azure Portal](https://portal.azure.com)
2. Azure Active Directory > App registrations > New registration
3. Nombre: `Control Presupuestario Celaque`
4. Supported account types: `Accounts in this organizational directory only`
5. Redirect URI: 
   - Tipo: `Single-page application (SPA)`
   - URI: `http://localhost:5173` (para desarrollo)
   - Después agrega tu URL de producción: `https://tu-dominio.com`

**Paso 2: Configurar API**
1. En tu App Registration, ve a "Expose an API"
2. Click "Add a scope"
3. Application ID URI: `api://{CLIENT_ID}` (acepta el sugerido)
4. Scope name: `access_as_user`
5. Who can consent: `Admins and users`
6. Display name: `Access Control Presupuestario`
7. Guardar

**Paso 3: Obtener credenciales**
- Ve a "Overview" y copia:
  - **Application (client) ID** → Lo usarás como `AZURE_AD_CLIENT_ID`
  - **Directory (tenant) ID** → Ya lo tienes: `deb13623-4618-4c6b-a268-3d5e4dec1c30`

### 3️⃣ Backend API

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
nano .env  # Editar con tus valores

# Variables importantes:
# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=control_presupuestario
# DB_USER=presupuesto_user
# DB_PASSWORD=tu_password_seguro
# AZURE_AD_TENANT_ID=deb13623-4618-4c6b-a268-3d5e4dec1c30
# AZURE_AD_CLIENT_ID=tu-client-id-del-app-registration
# CORS_ORIGIN=http://localhost:5173,https://tu-dominio.com

# Compilar TypeScript
npm run build

# Probar en desarrollo
npm run dev
```

### 4️⃣ Frontend React

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
nano .env  # Editar con tus valores

# Variables importantes:
# VITE_AZURE_TENANT_ID=deb13623-4618-4c6b-a268-3d5e4dec1c30
# VITE_AZURE_CLIENT_ID=tu-client-id-del-app-registration
# VITE_REDIRECT_URI=http://localhost:5173
# VITE_API_URL=http://localhost:3001/api/v1

# Probar en desarrollo
npm run dev

# Compilar para producción
npm run build
# Los archivos estáticos quedan en dist/
```

---

## 🖥️ Deployment en tu Servidor

### Opción A: Con PM2 (Recomendado)

```bash
# 1. Instalar PM2 globalmente (si no lo tienes)
npm install -g pm2

# 2. Subir el backend
cd backend
pm2 start npm --name "presupuesto-api" -- start
pm2 save
pm2 startup  # Seguir las instrucciones para auto-inicio

# 3. Verificar que está corriendo
pm2 list
pm2 logs presupuesto-api
```

### Opción B: Como servicio systemd

```bash
# Crear archivo de servicio
sudo nano /etc/systemd/system/presupuesto-api.service
```

Contenido:
```ini
[Unit]
Description=Control Presupuestario API
After=network.target mysql.service

[Service]
Type=simple
User=tu_usuario
WorkingDirectory=/ruta/a/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
# Activar y arrancar
sudo systemctl daemon-reload
sudo systemctl enable presupuesto-api
sudo systemctl start presupuesto-api
sudo systemctl status presupuesto-api
```

### Frontend con Nginx

```bash
# 1. Copiar archivos compilados
cd frontend
npm run build
sudo cp -r dist/* /var/www/presupuesto/

# 2. Configurar Nginx
sudo nano /etc/nginx/sites-available/presupuesto
```

Contenido:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/presupuesto;
    index index.html;

    # Frontend - SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy al backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

```bash
# 3. Activar sitio
sudo ln -s /etc/nginx/sites-available/presupuesto /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL con Let's Encrypt (Recomendado)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

---

## 📊 Uso del Sistema

### Usuarios y Roles

El sistema tiene 3 roles:
- **ADMIN**: Acceso total, puede crear/editar todo
- **GESTOR**: Puede gestionar presupuesto de edificios asignados
- **VIEWER**: Solo lectura

### Flujo de Trabajo

1. **Configuración inicial (ADMIN)**
   - Crear edificios
   - Configurar cuentas y subcuentas
   - Asignar permisos a usuarios

2. **Planificación presupuestaria (GESTOR)**
   - Capturar presupuesto por edificio/cuenta/mes
   - Solicitar aprobaciones
   - Ajustar según feedback

3. **Seguimiento (GESTOR/VIEWER)**
   - Registrar gastos reales
   - Ver reportes de ejecución
   - Dashboard con indicadores

---

## 🛠️ Desarrollo

### Estructura del proyecto

```
control-presupuestario/
├── backend/
│   ├── src/
│   │   ├── config/          # DB y Azure AD config
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── middleware/      # Auth, validación
│   │   ├── routes/          # Endpoints API
│   │   ├── types/           # TypeScript interfaces
│   │   └── server.ts        # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── config/          # MSAL config
│   │   ├── pages/           # Vistas
│   │   ├── services/        # API calls
│   │   └── App.tsx
│   └── package.json
│
└── database/
    └── schema.sql           # Schema MySQL
```

### Agregar nuevos endpoints (Backend)

```typescript
// 1. Crear controller: src/controllers/ejemplo.controller.ts
export async function getMisDatos(req: AuthRequest, res: Response) {
  // Tu lógica aquí
}

// 2. Crear rutas: src/routes/ejemplo.routes.ts
import { Router } from 'express';
import { getMisDatos } from '../controllers/ejemplo.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);
router.get('/', getMisDatos);
export default router;

// 3. Registrar en server.ts
import ejemploRoutes from './routes/ejemplo.routes';
app.use(`${API_PREFIX}/ejemplo`, ejemploRoutes);
```

### Agregar nuevas páginas (Frontend)

```typescript
// 1. Crear página: src/pages/MiPagina.tsx
export default function MiPagina() {
  return <div>Mi contenido</div>;
}

// 2. Agregar ruta en App.tsx
<Route path="mi-ruta" element={<MiPagina />} />
```

---

## 🐛 Troubleshooting

### Backend no inicia
```bash
# Ver logs
pm2 logs presupuesto-api

# Verificar conexión a MySQL
mysql -u presupuesto_user -p control_presupuestario

# Verificar variables de entorno
cat backend/.env
```

### Error de autenticación (401)
- Verificar que el CLIENT_ID en frontend y backend coincidan
- Verificar que el App Registration tenga el scope `access_as_user`
- Ver consola del navegador para errores de MSAL

### CORS errors
- Agregar tu dominio a `CORS_ORIGIN` en backend/.env
- Reiniciar el backend después de cambiar .env

### Base de datos
```sql
-- Ver tablas creadas
USE control_presupuestario;
SHOW TABLES;

-- Ver datos iniciales
SELECT * FROM edificios;
SELECT * FROM cuentas WHERE cuenta_padre_id IS NULL;
```

---

## 📞 Soporte

Para dudas o problemas:
- Revisar logs: `pm2 logs presupuesto-api`
- Consola del navegador (F12)
- MySQL logs: `/var/log/mysql/error.log`

---

## 🔄 Actualizaciones

```bash
# Backend
cd backend
git pull
npm install
npm run build
pm2 restart presupuesto-api

# Frontend
cd frontend
git pull
npm install
npm run build
sudo cp -r dist/* /var/www/presupuesto/
sudo systemctl reload nginx
```

---

**Desarrollado para Celaque por el equipo de Sistemas** 🚀
