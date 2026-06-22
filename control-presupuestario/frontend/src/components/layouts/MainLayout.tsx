import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Receipt,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/edificios',   label: 'Edificios',   icon: Building2       },
  { to: '/presupuesto', label: 'Presupuesto', icon: BookOpen        },
  { to: '/gastos',      label: 'Gastos',      icon: Receipt         },
  { to: '/reportes',    label: 'Reportes',    icon: BarChart3       },
];

export default function MainLayout() {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const user = accounts[0];
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '??';

  async function handleLogout() {
    await instance.logoutPopup({ mainWindowRedirectUri: '/' });
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ── SIDEBAR ─────────────────────────────────────── */}
      <aside
        className={`
          flex flex-col bg-[#003366] text-white transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-56' : 'w-16'}
        `}
      >
        {/* Logo / toggle */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded bg-[#FF6600] flex items-center justify-center text-xs font-bold shrink-0">
                C
              </div>
              <span className="text-sm font-semibold whitespace-nowrap leading-tight">
                Celaque<br />
                <span className="text-xs font-normal text-white/60">Presupuesto</span>
              </span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1 rounded hover:bg-white/10 transition-colors shrink-0"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group
                 ${isActive
                   ? 'bg-white/15 text-white font-medium'
                   : 'text-white/70 hover:bg-white/10 hover:text-white'
                 }`
              }
              title={!sidebarOpen ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {sidebarOpen && (
                <>
                  <span className="flex-1 whitespace-nowrap">{label}</span>
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-white/10 p-3">
          <div className={`flex items-center gap-3 ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-[#FF6600] flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>
            {sidebarOpen && (
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-white/50 truncate">{user?.username}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`
              mt-3 flex items-center gap-2 text-xs text-white/60 hover:text-white
              transition-colors w-full rounded px-2 py-1.5 hover:bg-white/10
              ${sidebarOpen ? '' : 'justify-center'}
            `}
            title={!sidebarOpen ? 'Cerrar sesión' : undefined}
          >
            <LogOut size={14} />
            {sidebarOpen && 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          {/* Breadcrumb placeholder - cada página lo sobreescribe */}
          <div id="page-breadcrumb" />
          <div className="flex items-center gap-3">
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 relative">
              <Bell size={18} />
            </button>
            <div className="w-7 h-7 rounded-full bg-[#003366] flex items-center justify-center text-xs font-bold text-white">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
