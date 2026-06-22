import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Pencil, ToggleLeft, ToggleRight, BarChart2 } from 'lucide-react';
import { edificiosService, type Edificio } from '../services/edificios.service';
import {
  Card, PageHeader, PageLoader, EmptyState, Badge,
  Button, Modal, Input, Select,
} from '../components/ui/index';
import { formatMoney } from '../services/index';

export default function EdificiosPage() {
  const qc = useQueryClient();
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'activos' | 'inactivos'>('activos');
  const [modal, setModal] = useState<{ open: boolean; edificio?: Edificio }>({ open: false });

  const { data: edificios = [], isLoading } = useQuery({
    queryKey: ['edificios', filtroActivo],
    queryFn: () =>
      filtroActivo === 'todos'
        ? edificiosService.getAll()
        : edificiosService.getAll(filtroActivo === 'activos'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      edificiosService.update(id, { activo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['edificios'] }),
  });

  const saveMutation = useMutation({
    mutationFn: (data: { id?: string; codigo: string; nombre: string; descripcion?: string }) =>
      data.id
        ? edificiosService.update(data.id, data)
        : edificiosService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['edificios'] });
      setModal({ open: false });
    },
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Edificios"
        description="Gestión de los edificios y proyectos de Celaque"
        action={
          <Button icon={<Plus size={15} />} onClick={() => setModal({ open: true })}>
            Nuevo edificio
          </Button>
        }
      />

      {/* Filtros */}
      <div className="flex gap-2 mb-5">
        {(['todos', 'activos', 'inactivos'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltroActivo(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors
              ${filtroActivo === f
                ? 'bg-[#003366] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 self-center">
          {edificios.length} resultado{edificios.length !== 1 ? 's' : ''}
        </span>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : edificios.length === 0 ? (
        <EmptyState
          icon={<Building2 size={40} />}
          title="No hay edificios"
          description="Crea el primer edificio para comenzar."
          action={
            <Button icon={<Plus size={15} />} onClick={() => setModal({ open: true })}>
              Nuevo edificio
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {edificios.map((e) => (
            <EdificioCard
              key={e.id}
              edificio={e}
              onEdit={() => setModal({ open: true, edificio: e })}
              onToggle={() => toggleMutation.mutate({ id: e.id, activo: !e.activo })}
            />
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      <EdificioModal
        open={modal.open}
        edificio={modal.edificio}
        loading={saveMutation.isPending}
        error={saveMutation.isError ? 'Ocurrió un error. Verifica los datos.' : undefined}
        onClose={() => setModal({ open: false })}
        onSave={(data) => saveMutation.mutate({ ...data, id: modal.edificio?.id })}
      />
    </div>
  );
}

// ── EdificioCard ──────────────────────────────────────────────────
function EdificioCard({
  edificio,
  onEdit,
  onToggle,
}: {
  edificio: Edificio;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const { data: stats } = useQuery({
    queryKey: ['edificio-stats', edificio.id],
    queryFn: () => edificiosService.getStats(edificio.id, new Date().getFullYear()),
    enabled: edificio.activo,
  });

  return (
    <Card padding="md" className={`relative ${!edificio.activo ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-[#003366]/10 flex items-center justify-center">
            <Building2 size={18} className="text-[#003366]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{edificio.nombre}</p>
            <p className="text-xs text-gray-400 font-mono">{edificio.codigo}</p>
          </div>
        </div>
        <Badge
          label={edificio.activo ? 'Activo' : 'Inactivo'}
          variant={edificio.activo ? 'green' : 'gray'}
        />
      </div>

      {/* Descripción */}
      {edificio.descripcion && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{edificio.descripcion}</p>
      )}

      {/* Stats (si activo y hay datos) */}
      {stats && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-400">Presupuesto</p>
            <p className="text-xs font-semibold text-gray-800 tabular-nums">
              {formatMoney(stats.presupuesto_total ?? 0)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-400">Disponible</p>
            <p className="text-xs font-semibold text-emerald-700 tabular-nums">
              {formatMoney(stats.disponible ?? 0)}
            </p>
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
        >
          <Pencil size={12} />
          Editar
        </button>
        <button
          onClick={onToggle}
          className={`flex items-center gap-1.5 text-xs transition-colors ml-auto
            ${edificio.activo ? 'text-gray-500 hover:text-red-600' : 'text-gray-500 hover:text-green-600'}`}
        >
          {edificio.activo
            ? <><ToggleLeft size={14} /> Desactivar</>
            : <><ToggleRight size={14} /> Activar</>
          }
        </button>
      </div>
    </Card>
  );
}

// ── EdificioModal ─────────────────────────────────────────────────
function EdificioModal({
  open, edificio, loading, error, onClose, onSave,
}: {
  open: boolean;
  edificio?: Edificio;
  loading: boolean;
  error?: string;
  onClose: () => void;
  onSave: (data: { codigo: string; nombre: string; descripcion?: string }) => void;
}) {
  const [form, setForm] = useState({
    codigo: edificio?.codigo ?? '',
    nombre: edificio?.nombre ?? '',
    descripcion: edificio?.descripcion ?? '',
  });

  // Sincronizar con edificio al abrir
  if (edificio && form.codigo === '' && edificio.codigo) {
    setForm({ codigo: edificio.codigo, nombre: edificio.nombre, descripcion: edificio.descripcion ?? '' });
  }

  function handleSubmit() {
    if (!form.codigo.trim() || !form.nombre.trim()) return;
    onSave({
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || undefined,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={edificio ? 'Editar edificio' : 'Nuevo edificio'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!form.codigo || !form.nombre}>
            {edificio ? 'Guardar cambios' : 'Crear edificio'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
            {error}
          </div>
        )}
        <Input
          label="Código *"
          placeholder="Ej: L30, AGA-N19"
          value={form.codigo}
          onChange={(e) => setForm({ ...form, codigo: e.target.value })}
          disabled={!!edificio}
        />
        <Input
          label="Nombre *"
          placeholder="Ej: Edificio L30"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
          <textarea
            rows={2}
            placeholder="Descripción opcional..."
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#003366] focus:ring-2 focus:ring-blue-100 resize-none"
          />
        </div>
      </div>
    </Modal>
  );
}
