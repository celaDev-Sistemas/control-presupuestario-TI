import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, ExternalLink, Search, Receipt } from 'lucide-react';
import { edificiosService } from '../services/edificios.service';
import { gastosService, cuentasService, MESES, formatMoney, type Gasto } from '../services/index';
import {
  Card, PageHeader, PageLoader, EmptyState, Badge,
  Button, Input, Select, Modal,
} from '../components/ui/index';

const ANIO_ACTUAL = new Date().getFullYear();

export default function GastosPage() {
  const qc = useQueryClient();
  const [filtros, setFiltros] = useState({
    anio: ANIO_ACTUAL,
    mes: 0,
    edificio_id: '',
    cuenta_id: '',
    busqueda: '',
  });
  const [showModal, setShowModal] = useState(false);

  const { data: edificios = [] } = useQuery({
    queryKey: ['edificios', 'activos'],
    queryFn: () => edificiosService.getAll(true),
  });
  const { data: cuentas = [] } = useQuery({
    queryKey: ['cuentas'],
    queryFn: () => cuentasService.getAll(),
  });
  const { data: gastos = [], isLoading } = useQuery({
    queryKey: ['gastos', filtros.anio, filtros.mes, filtros.edificio_id, filtros.cuenta_id],
    queryFn: () =>
      gastosService.getAll({
        anio: filtros.anio,
        mes: filtros.mes || undefined,
        edificio_id: filtros.edificio_id || undefined,
        cuenta_id: filtros.cuenta_id || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => gastosService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gastos'] }),
  });

  // Filtro local por búsqueda de texto
  const gastosFiltrados = filtros.busqueda.trim()
    ? gastos.filter(
        (g) =>
          g.descripcion.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
          g.proveedor?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
          g.numero_factura?.toLowerCase().includes(filtros.busqueda.toLowerCase())
      )
    : gastos;

  const totalFiltrado = gastosFiltrados.reduce((s, g) => s + g.monto, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Gastos Reales"
        description="Registro de gastos ejecutados vs presupuesto"
        action={
          <Button icon={<Plus size={15} />} onClick={() => setShowModal(true)}>
            Registrar gasto
          </Button>
        }
      />

      {/* Filtros */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        <Select
          label="Año"
          value={filtros.anio}
          onChange={(e) => setFiltros({ ...filtros, anio: Number(e.target.value) })}
        >
          {[ANIO_ACTUAL - 1, ANIO_ACTUAL].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Select>
        <Select
          label="Mes"
          value={filtros.mes}
          onChange={(e) => setFiltros({ ...filtros, mes: Number(e.target.value) })}
        >
          <option value={0}>Todos los meses</option>
          {MESES.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </Select>
        <Select
          label="Edificio"
          value={filtros.edificio_id}
          onChange={(e) => setFiltros({ ...filtros, edificio_id: e.target.value })}
        >
          <option value="">Todos</option>
          {edificios.map((e) => (
            <option key={e.id} value={e.id}>{e.codigo} — {e.nombre}</option>
          ))}
        </Select>
        <Select
          label="Cuenta"
          value={filtros.cuenta_id}
          onChange={(e) => setFiltros({ ...filtros, cuenta_id: e.target.value })}
        >
          <option value="">Todas</option>
          {cuentas.filter((c) => c.permite_movimientos).map((c) => (
            <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
          ))}
        </Select>
        <div className="relative">
          <label className="block text-xs font-medium text-gray-600 mb-1">Buscar</label>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Proveedor, factura..."
              value={filtros.busqueda}
              onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
              className="w-full pl-8 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#003366] focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      {/* Resumen */}
      {gastosFiltrados.length > 0 && (
        <div className="flex items-center gap-6 mb-4 text-sm">
          <span className="text-gray-500">
            {gastosFiltrados.length} gasto{gastosFiltrados.length !== 1 ? 's' : ''}
          </span>
          <span className="font-semibold text-gray-800">
            Total: {formatMoney(totalFiltrado)}
          </span>
        </div>
      )}

      {/* Lista */}
      {isLoading ? (
        <PageLoader />
      ) : gastosFiltrados.length === 0 ? (
        <EmptyState
          icon={<Receipt size={40} />}
          title="Sin gastos registrados"
          description="Registra un nuevo gasto usando el botón de arriba."
          action={
            <Button icon={<Plus size={15} />} onClick={() => setShowModal(true)}>
              Registrar gasto
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {gastosFiltrados.map((g) => (
            <GastoRow
              key={g.id}
              gasto={g}
              onDelete={() => {
                if (confirm('¿Eliminar este gasto?')) deleteMutation.mutate(g.id);
              }}
            />
          ))}
        </div>
      )}

      {/* Modal nuevo gasto */}
      <NuevoGastoModal
        open={showModal}
        edificios={edificios}
        cuentas={cuentas}
        onClose={() => setShowModal(false)}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ['gastos'] });
          setShowModal(false);
        }}
      />
    </div>
  );
}

// ── GastoRow ──────────────────────────────────────────────────────
function GastoRow({ gasto, onDelete }: { gasto: Gasto; onDelete: () => void }) {
  const fecha = new Date(gasto.fecha_gasto).toLocaleDateString('es-HN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const mes = MESES[gasto.mes - 1];

  return (
    <Card padding="sm" className="group hover:border-gray-300 transition-colors">
      <div className="flex items-start gap-4">
        {/* Fecha */}
        <div className="text-center min-w-[48px]">
          <p className="text-xs text-gray-400">{mes?.slice(0, 3)}</p>
          <p className="text-lg font-bold text-gray-800 leading-tight">
            {new Date(gasto.fecha_gasto).getDate().toString().padStart(2, '0')}
          </p>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
              {gasto.edificio_nombre ?? '—'}
            </span>
            <span className="text-xs text-gray-400">{gasto.cuenta_codigo} · {gasto.cuenta_nombre}</span>
          </div>
          <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">{gasto.descripcion}</p>
          {gasto.proveedor && (
            <p className="text-xs text-gray-500 mt-0.5">{gasto.proveedor}</p>
          )}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {gasto.numero_factura && (
              <span className="text-xs text-gray-400">Factura: {gasto.numero_factura}</span>
            )}
            {gasto.documento_url && (
              <a
                href={gasto.documento_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#003366] flex items-center gap-1 hover:underline"
              >
                <ExternalLink size={10} />
                Ver documento
              </a>
            )}
          </div>
        </div>

        {/* Monto */}
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-gray-900 tabular-nums">{formatMoney(gasto.monto, gasto.moneda)}</p>
          <Badge label={gasto.moneda} variant="blue" />
        </div>

        {/* Eliminar */}
        <button
          onClick={onDelete}
          className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity self-start shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </Card>
  );
}

// ── Modal nuevo gasto ─────────────────────────────────────────────
function NuevoGastoModal({ open, edificios, cuentas, onClose, onSaved }: any) {
  const hoy = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    edificio_id: '',
    cuenta_id: '',
    fecha_gasto: hoy,
    monto: '',
    moneda: 'HNL',
    descripcion: '',
    proveedor: '',
    numero_factura: '',
    documento_url: '',
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      gastosService.create({
        ...form,
        anio: new Date(form.fecha_gasto).getFullYear(),
        mes: new Date(form.fecha_gasto).getMonth() + 1,
        monto: parseFloat(form.monto),
        registrado_por: '',
      } as any),
    onSuccess: onSaved,
    onError: () => setError('No se pudo guardar el gasto. Verifica los datos.'),
  });

  const cuentasMovimiento = cuentas.filter((c: any) => c.permite_movimientos && c.activo);
  const isValid = form.edificio_id && form.cuenta_id && form.monto && form.descripcion && form.fecha_gasto;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar gasto"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!isValid}>
            Guardar gasto
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">{error}</div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Edificio *"
            value={form.edificio_id}
            onChange={(e) => setForm({ ...form, edificio_id: e.target.value })}
          >
            <option value="">Seleccionar...</option>
            {edificios.map((e: any) => (
              <option key={e.id} value={e.id}>{e.codigo}</option>
            ))}
          </Select>
          <Input
            label="Fecha *"
            type="date"
            value={form.fecha_gasto}
            onChange={(e) => setForm({ ...form, fecha_gasto: e.target.value })}
          />
        </div>

        <Select
          label="Cuenta *"
          value={form.cuenta_id}
          onChange={(e) => setForm({ ...form, cuenta_id: e.target.value })}
        >
          <option value="">Seleccionar...</option>
          {cuentasMovimiento.map((c: any) => (
            <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
          ))}
        </Select>

        <Input
          label="Descripción *"
          placeholder="Descripción del gasto"
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Monto *"
            type="number"
            placeholder="0.00"
            value={form.monto}
            onChange={(e) => setForm({ ...form, monto: e.target.value })}
          />
          <Select
            label="Moneda"
            value={form.moneda}
            onChange={(e) => setForm({ ...form, moneda: e.target.value })}
          >
            <option value="HNL">HNL</option>
            <option value="USD">USD</option>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Proveedor"
            placeholder="Nombre del proveedor"
            value={form.proveedor}
            onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
          />
          <Input
            label="N° de factura"
            placeholder="Ej: FAC-001234"
            value={form.numero_factura}
            onChange={(e) => setForm({ ...form, numero_factura: e.target.value })}
          />
        </div>

        <Input
          label="URL de documento"
          placeholder="https://... (Box, SharePoint, etc.)"
          value={form.documento_url}
          onChange={(e) => setForm({ ...form, documento_url: e.target.value })}
        />
      </div>
    </Modal>
  );
}
