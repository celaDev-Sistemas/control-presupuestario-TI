import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Download, FileSpreadsheet, BarChart3 } from 'lucide-react';
import { edificiosService } from '../services/edificios.service';
import { dashboardService, MESES, formatMoney, porcent } from '../services/index';
import { Card, PageHeader, PageLoader, EmptyState, Badge, Button, Select } from '../components/ui/index';

const ANIO_ACTUAL = new Date().getFullYear();

export default function ReportesPage() {
  const [anio, setAnio] = useState(ANIO_ACTUAL);
  const [edificioId, setEdificioId] = useState('');
  const [exporting, setExporting] = useState(false);

  const { data: edificios = [] } = useQuery({
    queryKey: ['edificios', 'activos'],
    queryFn: () => edificiosService.getAll(true),
  });

  const { data: mensual = [], isLoading: loadingMensual } = useQuery({
    queryKey: ['reporte-mensual', anio, edificioId],
    queryFn: () => dashboardService.getComparativoMensual(anio, edificioId || undefined),
  });

  const { data: edificiosResumen = [], isLoading: loadingEdificios } = useQuery({
    queryKey: ['reporte-edificios', anio],
    queryFn: () => dashboardService.getResumenEdificios(anio),
  });

  // Datos para el gráfico de área
  const chartData = mensual.map((m) => ({
    mes: m.mes_nombre.slice(0, 3),
    Presupuestado: m.presupuestado,
    Ejecutado: m.real,
    Diferencia: Math.max(0, m.presupuestado - m.real),
  }));

  // Totales del año
  const totalPresupuestado = mensual.reduce((s, m) => s + m.presupuestado, 0);
  const totalEjecutado = mensual.reduce((s, m) => s + m.real, 0);
  const pctEjecutado = porcent(totalEjecutado, totalPresupuestado);

  async function handleExport() {
    setExporting(true);
    // TODO: implementar cuando el backend tenga el endpoint
    setTimeout(() => setExporting(false), 1500);
    alert('La exportación a Excel estará disponible cuando el backend tenga el endpoint /reportes/excel implementado.');
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Reportes"
        description="Comparativos y análisis presupuestario"
        action={
          <Button
            icon={<Download size={15} />}
            onClick={handleExport}
            loading={exporting}
            variant="secondary"
          >
            Exportar Excel
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
          className="w-56"
        >
          <option value="">Todos los edificios</option>
          {edificios.map((e) => (
            <option key={e.id} value={e.id}>{e.codigo} — {e.nombre}</option>
          ))}
        </Select>
      </div>

      {/* KPIs rápidos */}
      {!loadingMensual && mensual.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card padding="md">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Presupuestado {anio}</p>
            <p className="mt-1 text-xl font-bold text-gray-900 tabular-nums">{formatMoney(totalPresupuestado)}</p>
          </Card>
          <Card padding="md">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Ejecutado {anio}</p>
            <p className="mt-1 text-xl font-bold text-[#FF6600] tabular-nums">{formatMoney(totalEjecutado)}</p>
          </Card>
          <Card padding="md">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Disponible</p>
            <p className="mt-1 text-xl font-bold text-emerald-600 tabular-nums">
              {formatMoney(totalPresupuestado - totalEjecutado)}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">{pctEjecutado}% ejecutado</p>
          </Card>
        </div>
      )}

      {/* Gráfico de área */}
      <Card padding="md" className="mb-6">
        <p className="text-sm font-semibold text-gray-800 mb-4">Evolución Mensual — {anio}</p>
        {loadingMensual ? (
          <PageLoader />
        ) : mensual.length === 0 ? (
          <EmptyState
            icon={<BarChart3 size={40} />}
            title="Sin datos para este período"
          />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPresup" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#003366" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#003366" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorEjec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6600" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#FF6600" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M`
                  : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K`
                  : String(v)
                }
              />
              <Tooltip
                formatter={(value: number) => formatMoney(value)}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="Presupuestado"
                stroke="#003366"
                strokeWidth={2}
                fill="url(#colorPresup)"
              />
              <Area
                type="monotone"
                dataKey="Ejecutado"
                stroke="#FF6600"
                strokeWidth={2}
                fill="url(#colorEjec)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Tabla mensual detallada */}
      {!loadingMensual && mensual.length > 0 && (
        <Card padding="sm" className="mb-6">
          <p className="text-sm font-semibold text-gray-800 mb-4 px-3 pt-2">Detalle Mensual</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {['Mes', 'Presupuestado', 'Ejecutado', 'Diferencia', '% Ejecución', 'Estado'].map((h) => (
                  <th key={h} className="text-left text-xs text-gray-400 font-medium pb-2 px-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mensual.map((m) => {
                const diff = m.presupuestado - m.real;
                const pct = porcent(m.real, m.presupuestado);
                const variant =
                  pct > 100 ? 'red' : pct > 90 ? 'yellow' : pct > 50 ? 'blue' : pct > 0 ? 'green' : 'gray';
                return (
                  <tr key={m.mes} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-medium text-gray-700">{m.mes_nombre}</td>
                    <td className="py-2.5 px-3 tabular-nums text-gray-600">{formatMoney(m.presupuestado)}</td>
                    <td className="py-2.5 px-3 tabular-nums font-medium text-gray-800">{formatMoney(m.real)}</td>
                    <td className={`py-2.5 px-3 tabular-nums font-medium ${diff >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {diff >= 0 ? '+' : ''}{formatMoney(diff)}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct > 100 ? 'bg-red-500' : 'bg-[#003366]'}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 tabular-nums w-8 text-right">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge
                        label={pct > 100 ? 'Excedido' : pct > 90 ? 'Por agotarse' : pct > 0 ? 'En curso' : 'Sin gasto'}
                        variant={variant}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Total */}
            <tfoot className="border-t-2 border-gray-200 bg-gray-50">
              <tr>
                <td className="py-2.5 px-3 text-xs font-bold text-gray-800">Total {anio}</td>
                <td className="py-2.5 px-3 tabular-nums text-xs font-bold text-gray-700">
                  {formatMoney(totalPresupuestado)}
                </td>
                <td className="py-2.5 px-3 tabular-nums text-xs font-bold text-gray-700">
                  {formatMoney(totalEjecutado)}
                </td>
                <td className={`py-2.5 px-3 tabular-nums text-xs font-bold
                  ${totalPresupuestado - totalEjecutado >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {formatMoney(totalPresupuestado - totalEjecutado)}
                </td>
                <td className="py-2.5 px-3 text-xs font-bold text-gray-700">{pctEjecutado}%</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </Card>
      )}

      {/* Tabla por edificio */}
      {!loadingEdificios && edificiosResumen.length > 0 && (
        <Card padding="sm">
          <div className="flex items-center justify-between px-3 pt-2 mb-4">
            <p className="text-sm font-semibold text-gray-800">Resumen por Edificio — {anio}</p>
            <FileSpreadsheet size={16} className="text-gray-400" />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {['Edificio', 'Presupuesto', 'Ejecutado', 'Disponible', '% Ejecución'].map((h) => (
                  <th key={h} className="text-left text-xs text-gray-400 font-medium pb-2 px-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {edificiosResumen.map((e) => {
                const pct = e.porcentaje_ejecutado;
                return (
                  <tr key={e.edificio_codigo} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded mr-2">
                        {e.edificio_codigo}
                      </span>
                      <span className="text-gray-800 font-medium">{e.edificio_nombre}</span>
                    </td>
                    <td className="py-2.5 px-3 tabular-nums text-gray-600">{formatMoney(e.presupuesto_anual)}</td>
                    <td className="py-2.5 px-3 tabular-nums font-medium text-gray-800">{formatMoney(e.gasto_anual)}</td>
                    <td className="py-2.5 px-3 tabular-nums font-medium text-emerald-700">{formatMoney(e.disponible)}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct > 100 ? 'bg-red-500' : 'bg-[#003366]'}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-gray-600">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
