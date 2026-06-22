# 🚀 Guía Rápida - Completar el Proyecto

Luis, aquí te dejo lo que ya está listo y lo que falta por hacer.

## ✅ Lo que ya está completo

### Backend
- ✅ Configuración de Express + TypeScript
- ✅ Conexión a MySQL con pool
- ✅ Autenticación con Azure AD (validación de JWT)
- ✅ Middleware de auth y rate limiting
- ✅ Controlador completo de EDIFICIOS (como ejemplo)
- ✅ Tipos TypeScript completos
- ✅ Error handling y logging

### Frontend
- ✅ Configuración de React + TypeScript + Vite
- ✅ MSAL (Azure AD) configurado
- ✅ Servicio de API con axios (incluye token automático)
- ✅ Servicio de edificios (como ejemplo)
- ✅ Tailwind CSS configurado
- ✅ React Router + Protected routes
- ✅ React Query setup

### Database
- ✅ Schema MySQL completo con:
  - Edificios, Cuentas, Presupuesto, Gastos
  - Usuarios y permisos
  - Vistas útiles
  - Stored procedures
  - Datos iniciales

## 🔨 Lo que falta por completar

Puedes seguir el mismo patrón del módulo de EDIFICIOS para crear los demás.

### 1. Backend - Controladores faltantes

**Cuentas** (`src/controllers/cuentas.controller.ts`):
```typescript
// Siguiendo el patrón de edificios:
- getCuentas() - Listar con opción de activo/nivel
- getCuentaById(id)
- createCuenta(dto)
- updateCuenta(id, dto)
- deleteCuenta(id) - desactivar
- getArbolCuentas() - vista jerárquica
```

**Presupuesto** (`src/controllers/presupuesto.controller.ts`):
```typescript
- getPresupuesto(filters) - con filtros: edificio, cuenta, año, mes
- getPresupuestoById(id)
- createPresupuesto(dto)
- updatePresupuesto(id, dto)
- deletePresupuesto(id)
- aprobarPresupuesto(id, dto) - cambiar estado aprobado
- copiarPresupuestoAnio(anioOrigen, anioDestino) - usar SP
```

**Gastos Reales** (`src/controllers/gastos.controller.ts`):
```typescript
- getGastos(filters)
- getGastoById(id)
- createGasto(dto)
- updateGasto(id, dto)
- deleteGasto(id)
```

**Dashboard** (`src/controllers/dashboard.controller.ts`):
```typescript
- getStats(anio) - estadísticas generales
- getComparativoMensual(edificioId, anio)
- getTopGastos(anio, limit)
- getPresupuestoVsReal(filters)
```

**Reportes** (`src/controllers/reportes.controller.ts`):
```typescript
- exportarExcel(filters)
- generarResumenAnual(anio)
```

### 2. Backend - Rutas faltantes

Crear archivos siguiendo el patrón de `edificios.routes.ts`:

```
src/routes/
├── cuentas.routes.ts
├── presupuesto.routes.ts
├── gastos.routes.ts
├── dashboard.routes.ts
└── reportes.routes.ts
```

Y registrarlos en `server.ts`:
```typescript
app.use(`${API_PREFIX}/cuentas`, cuentasRoutes);
app.use(`${API_PREFIX}/presupuesto`, presupuestoRoutes);
// etc...
```

### 3. Frontend - Páginas faltantes

**LoginPage** (`src/pages/LoginPage.tsx`):
```tsx
// Botón para hacer login con Azure AD
// Usar useMsal() hook
```

**DashboardPage** (`src/pages/DashboardPage.tsx`):
```tsx
// Cards con stats principales
// Gráficas de presupuesto vs real
// Top gastos
```

**EdificiosPage** (`src/pages/EdificiosPage.tsx`):
```tsx
// Tabla con lista de edificios
// Botones para crear/editar/desactivar
// Usar useQuery de React Query con edificiosService
```

**PresupuestoPage** (`src/pages/PresupuestoPage.tsx`):
```tsx
// Filtros: edificio, cuenta, año, mes
// Tabla editable para capturar montos
// Botón de aprobar
```

**GastosPage** (`src/pages/GastosPage.tsx`):
```tsx
// Formulario para registrar gastos
// Tabla con lista de gastos
// Adjuntar documentos (Box/SharePoint)
```

**ReportesPage** (`src/pages/ReportesPage.tsx`):
```tsx
// Filtros para generar reportes
// Botón para exportar Excel
// Visualización de comparativos
```

### 4. Frontend - Componentes útiles

**MainLayout** (`src/components/layouts/MainLayout.tsx`):
```tsx
// Navbar con menú
// Sidebar (opcional)
// Footer
// Outlet de React Router
```

**Table Component** (usa TanStack Table):
```tsx
// Componente reutilizable para tablas
// Con paginación, sorting, filtros
```

**Modal/Dialog** para formularios:
```tsx
// Modal reutilizable
// Usar para crear/editar
```

## 📝 Pasos sugeridos

1. **Primero, asegúrate de que funciona lo básico:**
   ```bash
   # Backend
   cd backend
   npm install
   npm run dev
   # Debería arrancar en puerto 3001
   
   # Frontend
   cd frontend
   npm install
   npm run dev
   # Debería arrancar en puerto 5173
   ```

2. **Probar la autenticación:**
   - Crea el App Registration en Azure
   - Configura las variables de entorno
   - Intenta hacer login
   - Verifica que el token se incluye en las peticiones

3. **Completar un módulo completo:**
   - Empieza con **Cuentas** (es más simple)
   - Crea el controller
   - Crea las rutas
   - Registra en server.ts
   - Crea el servicio en frontend
   - Crea la página
   - Prueba todo

4. **Sigue con los demás módulos:**
   - Presupuesto
   - Gastos
   - Dashboard
   - Reportes

## 🎨 Tips de UI

Para las tablas usa TanStack Table v8:
```tsx
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';
```

Para los formularios usa React Hook Form + Zod:
```tsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
```

Para los gráficos usa Recharts:
```tsx
import { LineChart, Line, XAxis, YAxis } from 'recharts';
```

## 🔐 Recordatorios importantes

1. **Nunca commitees los .env** - están en .gitignore
2. **El token de Azure AD ya se incluye automático** en cada request
3. **Los roles (ADMIN/GESTOR/VIEWER)** se validan en el backend
4. **Todas las rutas del frontend protegidas** con `<ProtectedRoute>`

## 📚 Documentación útil

- MSAL React: https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react
- TanStack Query: https://tanstack.com/query/latest
- TanStack Table: https://tanstack.com/table/latest
- React Hook Form: https://react-hook-form.com/
- Recharts: https://recharts.org/

## ❓ Si tienes dudas

Todo sigue el mismo patrón:
1. Backend: controller → routes → register in server.ts
2. Frontend: service → page → route in App.tsx

El ejemplo de **Edificios** está completo para que lo uses como referencia.

¡Éxito! 🚀
