import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDoctor } from '../../hooks/useDoctor';
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Building2,
  User,
  CreditCard,
  Settings,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import './AdminSidebar.css';

interface SidebarItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
  disabled?: boolean;
  badge?: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Appointments', path: '/admin/appointments', icon: CalendarCheck },
  { label: 'Live Queue', path: '/admin/queue', icon: Users },
  { label: 'Clinics & Hospitals', path: '/admin/clinics', icon: Building2, adminOnly: true },
  { label: 'Special Dates / Leaves', path: '/admin/special-dates', icon: CalendarCheck, adminOnly: true },
  { label: 'Doctor Profile', path: '/admin/profile', icon: User, adminOnly: true },
  { label: 'Fees & Payments', path: '/admin/payments', icon: CreditCard },
  { label: 'Online Consult Requests', path: '/admin/online-consult', icon: UserCheck },
  { label: 'Global Settings', path: '/admin/settings', icon: Settings, adminOnly: true },
];

export function AdminSidebar() {
  const { role, user } = useAuth();
  const { doctor } = useDoctor();
  const isAdmin = role === 'admin';

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <div className="admin-sidebar__logo">
          <ShieldCheck size={28} />
        </div>
        <div>
          <h2 className="admin-sidebar__title">{doctor?.full_name || 'Doctor Portal'}</h2>
          <p className="admin-sidebar__subtitle">Clinic Management</p>
        </div>
      </div>

      <div className="admin-sidebar__role-badge">
        {isAdmin ? (
          <span className="badge badge--admin">
            <ShieldCheck size={14} /> ADMIN ROLE
          </span>
        ) : (
          <span className="badge badge--staff">
            <UserCheck size={14} /> STAFF ROLE
          </span>
        )}
      </div>

      <div className="admin-sidebar__nav">
        {SIDEBAR_ITEMS.map((item) => {
          if (item.adminOnly && !isAdmin) return null;

          if (item.disabled) {
            return (
              <div key={item.label} className="admin-sidebar__item admin-sidebar__item--disabled">
                <item.icon size={20} />
                <span>{item.label}</span>
                {item.badge && <span className="admin-sidebar__tag">{item.badge}</span>}
              </div>
            );
          }

          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `admin-sidebar__item ${isActive ? 'admin-sidebar__item--active' : ''}`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="admin-sidebar__footer">
        <p className="admin-sidebar__user-email">{user?.email}</p>
        <span className="admin-sidebar__version">v1.2.0 • Phase 2</span>
      </div>
    </aside>
  );
}
