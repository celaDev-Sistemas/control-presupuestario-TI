import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts';
import {
  TrendingUp, DollarSign, Building2, AlertCircle, BookOpen,
} from 'lucide-react';
import {
  dashboardService, formatMoney, MESES,
  type ResumenEdificio,
} from '../services/index';
import { Card, StatCard, PageHeader, PageLoader, Badge, Select } from '../components/ui/index';

const ANIO_ACTUAL = new Date().getFullYear();

export default function DashboardPage() {
  const [anio, setAnio] = useState(ANIO_ACTUAL);

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboard-stats', anio],
    queryFn: () => dashboardService.getStats(anio),
  });

  const { data: mensual = [], isLoading: loadingMensual } = useQuery({
    queryKey: ['dashboard-mensual', anio],
    queryFn: () => dashboardService.getComparativoMensual(anio),
  });

  const { data: edificios = [], isLoading: loadingEdificios } = useQuery({
    queryKey: ['dashboard-edificios', anio],
    queryFn: () => dashboardService.getResumenEdificios(anio),
  });

  // Datos para el gráfico mensual
  const chartData = mensual.map((m) => ({
    mes: m.mes_nombre.slice(0, 3),
    Presupuestado: m.presupuestado,
    Ejecutado: m.real,
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Dashboard"
        description={`Resumen presupuestario ${anio}`}
        action={
          <Select
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="w-28"
          >
            {[ANIO_ACTUAL - 1, ANIO_ACTUAL, ANIO_ACTUAL + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
        }
      />

      {/* KPIs */}
      {loadingStats ? (
        <PageLoader />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Presupuesto Total"
            value={formatMoney(stats?.presupuesto_total ?? 0)}
            icon={<DollarSign size={18} />}
            accent="bg-[#003366]"
          />
          <StatCard
            label="Ejecutado"
            value={formatMoney(stats?.gastado_total ?? 0)}
            sub={`${stats?.porcentaje_ejecutado ?? 0}% del presupuesto`}
            icon={<TrendingUp size={18} />}
            accent="bg-[#FF6600]"
          />
          <StatCard
            label="Disponible"
            value={formatMoney(stats?.disponible_total ?? 0)}
            icon={<BookOpen size={18} />}
            accent="bg-emerald-600"
          />
          <StatCard
            label="Edificios activos"
            value={String(stats?.numero_edificios ?? 0)}
            sub={stats?.presupuesto_pendiente_aprobacion
              ? `${stats.presupuesto_pendiente_aprobacion} pendientes de aprobación`
              : 'Todo aprobado'}
            icon={<Building2 size={18} />}
            accent="bg-purple-600"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico mensual */}
        <Card className="lg:col-span-2" padding="md">
          <p className="text-sm font-semibold text-gray-800 mb-4">
            Presupuestado vs Ejecutado — {anio}
          </p>
          {loadingMensual ? (
            <PageLoader />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    v >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(1)}M`
                      : v >= 1_000
                      ? `${(v / 1_000).toFixed(0)}K`
                      : String(v)
                  }
                />
                <Tooltip
                  formatter={(value: number) => formatMoney(value)}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Presupuestado" fill="#003366" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Ejecutado" fill="#FF6600" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Resumen por edificio */}
        <Card padding="md">
          <p className="text-sm font-semibold text-gray-800 mb-4">Por Edificio</p>
          {loadingEdificios ? (
            <PageLoader />
          ) : edificios.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <AlertCircle size={28} className="text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">Sin datos para {anio}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {edificios.map((e: ResumenEdificio) => (
                <EdificioProgressRow key={e.edificio_codigo} edificio={e} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Tabla detalle por edificio */}
      {!loadingEdificios && edificios.length > 0 && (
        <Card className="mt-6" padding="md">
          <p className="text-sm font-semibold text-gray-800 mb-4">
            Detalle por Edificio — {anio}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs text-gray-500 font-medium pb-2">Edificio</th>
                  <th className="text-right text-xs text-gray-500 font-medium pb-2">Presupuesto</th>
                  <th className="text-right text-xs text-gray-500 font-medium pb-2">Ejecutado</th>
                  <th className="text-right text-xs text-gray-500 font-medium pb-2">Disponible</th>
                  <th className="text-right text-xs text-gray-500 font-medium pb-2">%</th>
                  <th className="text-right text-xs text-gray-500 font-medium pb-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {edificios.map((e: ResumenEdificio) => {
                  const pct = e.porcentaje_ejecutado;
                  const variant =
                    pct > 100 ? 'red' : pct > 90 ? 'yellow' : pct > 0 ? 'green' : 'gray';
                  return (
                    <tr key={e.edificio_codigo} className="border-b border-gray-100 last:border-0">
                      <td className="py-2.5 font-medium text-gray-800">
                        <span className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 mr-2 font-mono">
                          {e.edificio_codigo}
                        </span>
                        {e.edificio_nombre}
                      </td>
                      <td className="py-2.5 text-right text-gray-600 tabular-nums">
                        {formatMoney(e.presupuesto_anual)}
                      </td>
                      <td className="py-2.5 text-right text-gray-800 tabular-nums font-medium">
                        {formatMoney(e.gasto_anual)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-emerald-700 font-medium">
                        {formatMoney(e.disponible)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-gray-700">
                        {pct}%
                      </td>
                      <td className="py-2.5 text-right">
                        <Badge
                          label={pct > 100 ? 'Excedido' : pct > 90 ? 'Por agotarse' : pct > 0 ? 'En curso' : 'Sin gasto'}
                          variant={variant}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// Sub-componente para la barra de progreso por edificio
function EdificioProgressRow({ edificio }: { edificio: ResumenEdificio }) {
  const pct = Math.min(edificio.porcentaje_ejecutado, 100);
  const overBudget = edificio.porcentaje_ejecutado > 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-xs text-gray-700 font-medium">{edificio.edificio_nombre}</span>
        <span className={`text-xs font-semibold tabular-nums ${overBudget ? 'text-red-600' : 'text-gray-600'}`}>
          {edificio.porcentaje_ejecutado}%
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${overBudget ? 'bg-red-500' : 'bg-[#003366]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
