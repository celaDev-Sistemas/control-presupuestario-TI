import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Plus, Save } from 'lucide-react';
import { edificiosService } from '../services/edificios.service';
import { presupuestoService, cuentasService, MESES, formatMoney, type PresupuestoItem } from '../services/index';
import {
  Card, PageHeader, PageLoader, EmptyState, Badge,
  Button, Select,
} from '../components/ui/index';

const ANIO_ACTUAL = new Date().getFullYear();

export default function PresupuestoPage() {
  const qc = useQueryClient();
  const [anio, setAnio] = useState(ANIO_ACTUAL);
  const [edificioId, setEdificioId] = useState('');
  const [editCell, setEditCell] = useState<{ id: string; monto: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: edificios = [] } = useQuery({
    queryKey: ['edificios', 'activos'],
    queryFn: () => edificiosService.getAll(true),
  });

  const { data: cuentas = [] } = useQuery({
    queryKey: ['cuentas'],
    queryFn: () => cuentasService.getAll(),
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['presupuesto', anio, edificioId],
    queryFn: () => presupuestoService.getAll({ anio, edificio_id: edificioId || undefined }),
    enabled: true,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, monto }: { id: string; monto: number }) =>
      presupuestoService.update(id, { monto_planificado: monto }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presupuesto'] });
      setEditCell(null);
    },
  });

  const aprobarMutation = useMutation({
    mutationFn: ({ id, aprobado }: { id: string; aprobado: boolean }) =>
      presupuestoService.aprobar(id, aprobado),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['presupuesto'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => presupuestoService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['presupuesto'] }),
  });

  // Totales por mes
  const totalesMes = Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1;
    return items
      .filter((it) => it.mes === mes)
      .reduce((s, it) => s + it.monto_planificado, 0);
  });

  const totalAnual = items.reduce((s, it) => s + it.monto_planificado, 0);

  return (
    <div className="p-6 max-w-full mx-auto">
      <PageHeader
        title="Presupuesto"
        description="Planificación presupuestaria por edificio y cuenta"
        action={
          <Button icon={<Plus size={15} />} onClick={() => setShowForm(true)}>
            Agregar ítem
          </Button>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select
          label="Año"
          value={anio}
          onChange={(e) => setAnio(Number(e.target.value))}
          className="w-28"
        >
          {[ANIO_ACTUAL - 1, ANIO_ACTUAL, ANIO_ACTUAL + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Select>
        <Select
          label="Edificio"
          value={edificioId}
          onChange={(e) => setEdificioId(e.target.value)}
          className="w-52"
        >
          <option value="">Todos los edificios</option>
          {edificios.map((e) => (
            <option key={e.id} value={e.id}>{e.codigo} — {e.nombre}</option>
          ))}
        </Select>
        {items.length > 0 && (
          <div className="ml-auto self-end text-xs text-gray-500">
            {items.length} ítem{items.length !== 1 ? 's' : ''} ·{' '}
            <span className="font-medium text-gray-700">Total: {formatMoney(totalAnual)}</span>
          </div>
        )}
      </div>

      {/* Formulario rápido de nuevo ítem */}
      {showForm && (
        <NuevoItemForm
          edificios={edificios}
          cuentas={cuentas}
          anio={anio}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['presupuesto'] });
            setShowForm(false);
          }}
        />
      )}

      {/* Tabla */}
      {isLoading ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <EmptyState
          title="Sin presupuesto para este período"
          description="Agrega ítems de presupuesto usando el botón de arriba."
          action={
            <Button icon={<Plus size={15} />} onClick={() => setShowForm(true)}>
              Agregar ítem
            </Button>
          }
        />
      ) : (
        <Card padding="sm" className="overflow-x-auto">
          <table className="w-full text-xs min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-gray-500 font-medium py-2 px-3 sticky left-0 bg-white">
                  Edificio
                </th>
                <th className="text-left text-gray-500 font-medium py-2 px-3">Cuenta</th>
                {MESES.map((m, i) => (
                  <th key={i} className="text-right text-gray-500 font-medium py-2 px-2 whitespace-nowrap">
                    {m.slice(0, 3)}
                  </th>
                ))}
                <th className="text-right text-gray-500 font-medium py-2 px-3">Total</th>
                <th className="py-2 px-2 text-gray-500 font-medium">Estado</th>
                <th className="py-2 px-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const totalItem = item.monto_planificado; // Por ahora es 1 mes; ajusta si tienes 12
                return (
                  <PresupuestoRow
                    key={item.id}
                    item={item}
                    editCell={editCell}
                    onStartEdit={(id, monto) => setEditCell({ id, monto: String(monto) })}
                    onEditChange={(monto) => setEditCell((c) => c ? { ...c, monto } : null)}
                    onSaveEdit={() => {
                      if (editCell) {
                        updateMutation.mutate({ id: editCell.id, monto: parseFloat(editCell.monto) });
                      }
                    }}
                    onCancelEdit={() => setEditCell(null)}
                    onAprobar={() => aprobarMutation.mutate({ id: item.id, aprobado: !item.aprobado })}
                    onDelete={() => {
                      if (confirm('¿Eliminar este ítem de presupuesto?')) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                    saving={updateMutation.isPending && editCell?.id === item.id}
                  />
                );
              })}
            </tbody>
            {/* Totales */}
            <tfoot className="border-t-2 border-gray-200 bg-gray-50">
              <tr>
                <td colSpan={2} className="py-2 px-3 text-xs font-semibold text-gray-700">
                  Total por mes
                </td>
                {totalesMes.map((t, i) => (
                  <td key={i} className="py-2 px-2 text-right text-xs font-semibold text-gray-800 tabular-nums">
                    {t > 0 ? formatMoney(t) : '—'}
                  </td>
                ))}
                <td className="py-2 px-3 text-right text-xs font-bold text-[#003366] tabular-nums">
                  {formatMoney(totalAnual)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </Card>
      )}
    </div>
  );
}

// ── Fila de la tabla ──────────────────────────────────────────────
function PresupuestoRow({
  item, editCell, onStartEdit, onEditChange, onSaveEdit, onCancelEdit,
  onAprobar, onDelete, saving,
}: any) {
  const isEditing = editCell?.id === item.id;
  const MESES_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50 group">
      <td className="py-2 px-3 sticky left-0 bg-inherit">
        <span className="font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded text-xs">
          {item.edificio_codigo ?? '—'}
        </span>
      </td>
      <td className="py-2 px-3 max-w-[160px]">
        <p className="truncate text-gray-800 font-medium">{item.cuenta_nombre ?? item.cuenta_id}</p>
        <p className="text-gray-400 font-mono">{item.cuenta_codigo}</p>
      </td>

      {/* Columna por mes (el ítem tiene un mes específico) */}
      {Array.from({ length: 12 }, (_, i) => {
        const esMes = item.mes === i + 1;
        if (!esMes) {
          return (
            <td key={i} className="py-2 px-2 text-right text-gray-300">—</td>
          );
        }
        return (
          <td key={i} className="py-2 px-2 text-right">
            {isEditing ? (
              <input
                autoFocus
                type="number"
                value={editCell.monto}
                onChange={(e) => onEditChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSaveEdit()}
                className="w-24 text-right border border-[#003366] rounded px-1.5 py-0.5 text-xs outline-none"
              />
            ) : (
              <button
                onClick={() => onStartEdit(item.id, item.monto_planificado)}
                className="tabular-nums font-medium text-gray-800 hover:text-[#003366] hover:underline"
              >
                {formatMoney(item.monto_planificado)}
              </button>
            )}
          </td>
        );
      })}

      <td className="py-2 px-3 text-right tabular-nums font-medium text-gray-800">
        {formatMoney(item.monto_planificado)}
      </td>

      <td className="py-2 px-2">
        <button onClick={onAprobar} title={item.aprobado ? 'Desaprobar' : 'Aprobar'}>
          <Badge
            label={item.aprobado ? 'Aprobado' : 'Pendiente'}
            variant={item.aprobado ? 'green' : 'yellow'}
          />
        </button>
      </td>

      <td className="py-2 px-2">
        {isEditing ? (
          <div className="flex gap-1">
            <button
              onClick={onSaveEdit}
              disabled={saving}
              className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
            >
              {saving ? '...' : <Save size={12} />}
            </button>
            <button onClick={onCancelEdit} className="p-1 rounded text-gray-400 hover:bg-gray-100">
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={onDelete}
            className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={12} />
          </button>
        )}
      </td>
    </tr>
  );
}

// ── Formulario nuevo ítem ─────────────────────────────────────────
function NuevoItemForm({ edificios, cuentas, anio, onClose, onSaved }: any) {
  const [form, setForm] = useState({
    edificio_id: '',
    cuenta_id: '',
    mes: String(new Date().getMonth() + 1),
    monto_planificado: '',
    moneda: 'HNL',
    comentario: '',
  });

  const createMutation = useMutation({
    mutationFn: () => presupuestoService.create({
      ...form,
      anio,
      mes: Number(form.mes),
      monto_planificado: parseFloat(form.monto_planificado),
    } as any),
    onSuccess: onSaved,
  });

  const cuentasMovimiento = cuentas.filter((c: any) => c.permite_movimientos && c.activo);

  return (
    <Card padding="md" className="mb-5 border-[#003366]/20">
      <p className="text-sm font-semibold text-gray-800 mb-4">Nuevo ítem de presupuesto</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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

        <Select
          label="Cuenta *"
          value={form.cuenta_id}
          onChange={(e) => setForm({ ...form, cuenta_id: e.target.value })}
          className="col-span-2"
        >
          <option value="">Seleccionar...</option>
          {cuentasMovimiento.map((c: any) => (
            <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
          ))}
        </Select>

        <Select
          label="Mes *"
          value={form.mes}
          onChange={(e) => setForm({ ...form, mes: e.target.value })}
        >
          {MESES.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </Select>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Monto *</label>
          <input
            type="number"
            placeholder="0.00"
            value={form.monto_planificado}
            onChange={(e) => setForm({ ...form, monto_planificado: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#003366] focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <Select
          label="Moneda"
          value={form.moneda}
          onChange={(e) => setForm({ ...form, moneda: e.target.value })}
        >
          <option value="HNL">HNL</option>
          <option value="USD">USD</option>
        </Select>
      </div>

      <div className="flex gap-2 mt-4">
        <Button
          onClick={() => createMutation.mutate()}
          loading={createMutation.isPending}
          disabled={!form.edificio_id || !form.cuenta_id || !form.monto_planificado}
          icon={<Check size={14} />}
          size="sm"
        >
          Guardar
        </Button>
        <Button variant="secondary" onClick={onClose} size="sm">
          Cancelar
        </Button>
      </div>
    </Card>
  );
}
