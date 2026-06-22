-- ============================================
-- SISTEMA DE CONTROL PRESUPUESTARIO - CELAQUE
-- Schema MySQL 8.0+
-- ============================================

-- Configuración inicial
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- TABLAS PRINCIPALES
-- ============================================

-- 1. EDIFICIOS
CREATE TABLE edificios (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_codigo (codigo),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. CUENTAS CONTABLES (con jerarquía)
CREATE TABLE cuentas (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    cuenta_padre_id VARCHAR(36) NULL,
    nivel INT NOT NULL DEFAULT 1,
    tipo ENUM('GRUPO', 'CUENTA', 'SUBCUENTA') NOT NULL,
    permite_movimientos BOOLEAN DEFAULT TRUE COMMENT 'Si FALSE, es solo agrupador',
    orden INT NOT NULL DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cuenta_padre_id) REFERENCES cuentas(id) ON DELETE RESTRICT,
    INDEX idx_codigo (codigo),
    INDEX idx_padre (cuenta_padre_id),
    INDEX idx_nivel (nivel),
    INDEX idx_tipo (tipo),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. AÑOS FISCALES
CREATE TABLE anios_fiscales (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    anio INT NOT NULL UNIQUE,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    bloqueado BOOLEAN DEFAULT FALSE COMMENT 'Si TRUE, no permite modificaciones',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_anio (anio),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. PRESUPUESTO PLANIFICADO
CREATE TABLE presupuesto (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    edificio_id VARCHAR(36) NOT NULL,
    cuenta_id VARCHAR(36) NOT NULL,
    anio INT NOT NULL,
    mes INT NOT NULL COMMENT '1-12',
    monto_planificado DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    moneda ENUM('HNL', 'USD') NOT NULL DEFAULT 'HNL',
    comentario TEXT,
    aprobado BOOLEAN DEFAULT FALSE,
    aprobado_por VARCHAR(100),
    fecha_aprobacion TIMESTAMP NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (edificio_id) REFERENCES edificios(id) ON DELETE RESTRICT,
    FOREIGN KEY (cuenta_id) REFERENCES cuentas(id) ON DELETE RESTRICT,
    UNIQUE KEY uk_presupuesto (edificio_id, cuenta_id, anio, mes),
    INDEX idx_anio_mes (anio, mes),
    INDEX idx_edificio (edificio_id),
    INDEX idx_cuenta (cuenta_id),
    INDEX idx_aprobado (aprobado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. GASTOS REALES / EJECUTADOS
CREATE TABLE gastos_reales (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    edificio_id VARCHAR(36) NOT NULL,
    cuenta_id VARCHAR(36) NOT NULL,
    anio INT NOT NULL,
    mes INT NOT NULL,
    fecha_gasto DATE NOT NULL,
    monto DECIMAL(15,2) NOT NULL,
    moneda ENUM('HNL', 'USD') NOT NULL DEFAULT 'HNL',
    proveedor VARCHAR(200),
    numero_factura VARCHAR(100),
    descripcion TEXT NOT NULL,
    documento_url VARCHAR(500) COMMENT 'URL a Box, SharePoint, etc.',
    centro_costo VARCHAR(50),
    registrado_por VARCHAR(100) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (edificio_id) REFERENCES edificios(id) ON DELETE RESTRICT,
    FOREIGN KEY (cuenta_id) REFERENCES cuentas(id) ON DELETE RESTRICT,
    INDEX idx_fecha (fecha_gasto),
    INDEX idx_anio_mes (anio, mes),
    INDEX idx_edificio (edificio_id),
    INDEX idx_cuenta (cuenta_id),
    INDEX idx_proveedor (proveedor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. USUARIOS Y PERMISOS
CREATE TABLE usuarios (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(100) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    azure_ad_id VARCHAR(100) UNIQUE COMMENT 'Si usas Azure AD',
    rol ENUM('ADMIN', 'GESTOR', 'VIEWER') NOT NULL DEFAULT 'VIEWER',
    departamento VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_rol (rol),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. PERMISOS POR EDIFICIO (qué usuarios pueden ver/editar qué edificios)
CREATE TABLE usuario_edificios (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    usuario_id VARCHAR(36) NOT NULL,
    edificio_id VARCHAR(36) NOT NULL,
    puede_leer BOOLEAN DEFAULT TRUE,
    puede_escribir BOOLEAN DEFAULT FALSE,
    puede_aprobar BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (edificio_id) REFERENCES edificios(id) ON DELETE CASCADE,
    UNIQUE KEY uk_usuario_edificio (usuario_id, edificio_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_edificio (edificio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. LOG DE AUDITORÍA
CREATE TABLE auditoria (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    usuario_id VARCHAR(36),
    tabla VARCHAR(50) NOT NULL,
    registro_id VARCHAR(36) NOT NULL,
    accion ENUM('INSERT', 'UPDATE', 'DELETE', 'APPROVE') NOT NULL,
    datos_anteriores JSON,
    datos_nuevos JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario (usuario_id),
    INDEX idx_tabla (tabla),
    INDEX idx_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Presupuesto vs Real por Edificio y Cuenta
CREATE VIEW v_presupuesto_vs_real AS
SELECT 
    e.codigo AS edificio_codigo,
    e.nombre AS edificio_nombre,
    c.codigo AS cuenta_codigo,
    c.nombre AS cuenta_nombre,
    p.anio,
    p.mes,
    p.monto_planificado,
    COALESCE(SUM(g.monto), 0) AS monto_real,
    (p.monto_planificado - COALESCE(SUM(g.monto), 0)) AS diferencia,
    CASE 
        WHEN p.monto_planificado > 0 THEN 
            ROUND((COALESCE(SUM(g.monto), 0) / p.monto_planificado * 100), 2)
        ELSE 0 
    END AS porcentaje_ejecutado,
    p.moneda
FROM presupuesto p
INNER JOIN edificios e ON p.edificio_id = e.id
INNER JOIN cuentas c ON p.cuenta_id = c.id
LEFT JOIN gastos_reales g ON 
    g.edificio_id = p.edificio_id 
    AND g.cuenta_id = p.cuenta_id 
    AND g.anio = p.anio 
    AND g.mes = p.mes
WHERE e.activo = TRUE AND c.activo = TRUE
GROUP BY 
    e.id, c.id, p.anio, p.mes, p.monto_planificado, p.moneda;

-- Vista: Resumen anual por edificio
CREATE VIEW v_resumen_anual_edificio AS
SELECT 
    e.codigo AS edificio_codigo,
    e.nombre AS edificio_nombre,
    p.anio,
    SUM(p.monto_planificado) AS presupuesto_anual,
    COALESCE(SUM(g.monto), 0) AS gasto_anual,
    (SUM(p.monto_planificado) - COALESCE(SUM(g.monto), 0)) AS disponible,
    CASE 
        WHEN SUM(p.monto_planificado) > 0 THEN 
            ROUND((COALESCE(SUM(g.monto), 0) / SUM(p.monto_planificado) * 100), 2)
        ELSE 0 
    END AS porcentaje_ejecutado
FROM edificios e
INNER JOIN presupuesto p ON p.edificio_id = e.id
LEFT JOIN gastos_reales g ON 
    g.edificio_id = p.edificio_id 
    AND g.anio = p.anio
WHERE e.activo = TRUE
GROUP BY e.id, p.anio;

-- Vista: Árbol de cuentas con jerarquía
CREATE VIEW v_arbol_cuentas AS
WITH RECURSIVE cuentas_recursivo AS (
    -- Nivel 1: Cuentas padre
    SELECT 
        id,
        codigo,
        nombre,
        cuenta_padre_id,
        nivel,
        tipo,
        CAST(codigo AS CHAR(500)) AS ruta,
        CAST(nombre AS CHAR(500)) AS ruta_nombres
    FROM cuentas
    WHERE cuenta_padre_id IS NULL AND activo = TRUE
    
    UNION ALL
    
    -- Niveles siguientes
    SELECT 
        c.id,
        c.codigo,
        c.nombre,
        c.cuenta_padre_id,
        c.nivel,
        c.tipo,
        CONCAT(cr.ruta, ' > ', c.codigo),
        CONCAT(cr.ruta_nombres, ' > ', c.nombre)
    FROM cuentas c
    INNER JOIN cuentas_recursivo cr ON c.cuenta_padre_id = cr.id
    WHERE c.activo = TRUE
)
SELECT * FROM cuentas_recursivo
ORDER BY ruta;

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Insertar año fiscal 2026
INSERT INTO anios_fiscales (anio, fecha_inicio, fecha_fin, activo) 
VALUES (2026, '2026-01-01', '2026-12-31', TRUE);

-- Insertar edificios basados en tu Excel
INSERT INTO edificios (codigo, nombre, descripcion) VALUES
('L30', 'Edificio L30', 'Oficinas principales L30'),
('AGA-N19-20', 'Agalta 19/20', 'Oficinas Agalta N19/20'),
('CIP', 'CIP', 'Centro Industrial Parque'),
('ATL', 'Atlas', 'Edificio Atlas'),
('DA', 'DA', 'Desarrollo DA'),
('CVT', 'CVT', 'Centro de Ventas y Tecnología'),
('RDM', 'Real de Minas', 'Proyecto Real de Minas'),
('ZORZALES', 'Zorzales', 'Proyecto Zorzales'),
('LIRIOS', 'Los Lirios', 'Proyecto Los Lirios'),
('L8', 'Edificio L8', 'Edificio L8'),
('APOLO', 'Apolo', 'Proyecto Apolo'),
('LASALLE', 'La Salle', 'Proyecto La Salle'),
('MIRAMONTES', 'Miramontes', 'Proyecto Miramontes'),
('ADMIN', 'Administración General', 'Gastos generales de administración');

-- Insertar estructura de cuentas principales (basado en tu Excel)
INSERT INTO cuentas (codigo, nombre, cuenta_padre_id, nivel, tipo, permite_movimientos, orden) VALUES
-- NIVEL 1: GRUPOS PRINCIPALES
('6100', 'Gastos Operacionales', NULL, 1, 'GRUPO', FALSE, 1),
('8100', 'Otros Gastos', NULL, 1, 'GRUPO', FALSE, 2),
('1900', 'Construcción en Proceso', NULL, 1, 'GRUPO', FALSE, 3);

-- NIVEL 2: SUBGRUPOS
SET @grupo_6100 = (SELECT id FROM cuentas WHERE codigo = '6100');
SET @grupo_8100 = (SELECT id FROM cuentas WHERE codigo = '8100');

INSERT INTO cuentas (codigo, nombre, cuenta_padre_id, nivel, tipo, permite_movimientos, orden) VALUES
('6100-210', 'Auditoría/Consultorías', @grupo_6100, 2, 'CUENTA', TRUE, 10),
('6100-250', 'Sistemas', @grupo_6100, 2, 'GRUPO', FALSE, 20),
('6100-260', 'Mantenimiento', @grupo_6100, 2, 'CUENTA', TRUE, 30),
('6100-360', 'Suscripciones', @grupo_6100, 2, 'CUENTA', TRUE, 40),
('6100-390', 'Internet', @grupo_6100, 2, 'CUENTA', TRUE, 50),
('6100-470', 'Suministros de Oficina', @grupo_6100, 2, 'CUENTA', TRUE, 60),
('8100-020', 'Otros Gastos', @grupo_8100, 2, 'CUENTA', TRUE, 70);

-- NIVEL 3: SUBCUENTAS DE SISTEMAS
SET @grupo_sistemas = (SELECT id FROM cuentas WHERE codigo = '6100-250');

INSERT INTO cuentas (codigo, nombre, cuenta_padre_id, nivel, tipo, permite_movimientos, orden) VALUES
('6100-250-01', 'NetSuite', @grupo_sistemas, 3, 'SUBCUENTA', TRUE, 21),
('6100-250-02', 'Box', @grupo_sistemas, 3, 'SUBCUENTA', TRUE, 22),
('6100-250-03', 'Wrike', @grupo_sistemas, 3, 'SUBCUENTA', TRUE, 23),
('6100-250-04', 'Gmail', @grupo_sistemas, 3, 'SUBCUENTA', TRUE, 24),
('6100-250-05', 'Salesforce', @grupo_sistemas, 3, 'SUBCUENTA', TRUE, 25),
('6100-250-06', 'Zoho', @grupo_sistemas, 3, 'SUBCUENTA', TRUE, 26),
('6100-250-07', 'Licencias Desarrollos', @grupo_sistemas, 3, 'SUBCUENTA', TRUE, 27),
('6100-250-08', 'Licencias Adicionales', @grupo_sistemas, 3, 'SUBCUENTA', TRUE, 28),
('6100-250-10', 'Licencia Office', @grupo_sistemas, 3, 'SUBCUENTA', TRUE, 29),
('6100-250-11', 'Flair', @grupo_sistemas, 3, 'SUBCUENTA', TRUE, 30),
('6100-250-12', 'Lynx', @grupo_sistemas, 3, 'SUBCUENTA', TRUE, 31);

-- Crear usuario admin por defecto
INSERT INTO usuarios (email, nombre, rol, departamento) VALUES
('luis@celaque.com', 'Luis - Admin', 'ADMIN', 'Sistemas');

-- ============================================
-- PROCEDIMIENTOS ALMACENADOS ÚTILES
-- ============================================

DELIMITER $$

-- Procedimiento: Copiar presupuesto de un año a otro
CREATE PROCEDURE sp_copiar_presupuesto_anio(
    IN p_anio_origen INT,
    IN p_anio_destino INT,
    IN p_factor_ajuste DECIMAL(5,2)
)
BEGIN
    DECLARE v_count INT;
    
    -- Verificar si ya existe presupuesto en año destino
    SELECT COUNT(*) INTO v_count 
    FROM presupuesto 
    WHERE anio = p_anio_destino;
    
    IF v_count > 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Ya existe presupuesto para el año destino';
    END IF;
    
    -- Copiar presupuesto con factor de ajuste
    INSERT INTO presupuesto (
        edificio_id, cuenta_id, anio, mes, 
        monto_planificado, moneda, comentario, 
        aprobado, created_by
    )
    SELECT 
        edificio_id, 
        cuenta_id, 
        p_anio_destino, 
        mes,
        ROUND(monto_planificado * p_factor_ajuste, 2),
        moneda,
        CONCAT('Copiado de ', p_anio_origen, ' con ajuste ', p_factor_ajuste, 'x'),
        FALSE,
        'SYSTEM'
    FROM presupuesto
    WHERE anio = p_anio_origen;
    
    SELECT ROW_COUNT() AS registros_copiados;
END$$

-- Procedimiento: Obtener disponible por cuenta y edificio
CREATE PROCEDURE sp_disponible_presupuesto(
    IN p_edificio_id VARCHAR(36),
    IN p_cuenta_id VARCHAR(36),
    IN p_anio INT,
    IN p_mes INT
)
BEGIN
    SELECT 
        e.nombre AS edificio,
        c.nombre AS cuenta,
        p.monto_planificado,
        COALESCE(SUM(g.monto), 0) AS gastado,
        (p.monto_planificado - COALESCE(SUM(g.monto), 0)) AS disponible,
        p.moneda
    FROM presupuesto p
    INNER JOIN edificios e ON p.edificio_id = e.id
    INNER JOIN cuentas c ON p.cuenta_id = c.id
    LEFT JOIN gastos_reales g ON 
        g.edificio_id = p.edificio_id 
        AND g.cuenta_id = p.cuenta_id 
        AND g.anio = p.anio 
        AND g.mes = p.mes
    WHERE 
        p.edificio_id = p_edificio_id
        AND p.cuenta_id = p_cuenta_id
        AND p.anio = p_anio
        AND p.mes = p_mes
    GROUP BY p.id;
END$$

DELIMITER ;

-- ============================================
-- ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================

-- Índice compuesto para búsquedas frecuentes
ALTER TABLE presupuesto 
    ADD INDEX idx_lookup (edificio_id, cuenta_id, anio, mes);

ALTER TABLE gastos_reales 
    ADD INDEX idx_lookup (edificio_id, cuenta_id, anio, mes);

-- Full-text search en descripciones
ALTER TABLE gastos_reales 
    ADD FULLTEXT INDEX idx_ft_descripcion (descripcion);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- FIN DEL SCHEMA
-- ============================================
