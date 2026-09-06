import { useAuth } from '../../context/AuthContext';
import { useClinics } from '../../hooks/useClinics';
import { LogOut, Building2, User as UserIcon } from 'lucide-react';
import { Button } from '../common/Button';
import './AdminHeader.css';

interface AdminHeaderProps {
  selectedClinicId: string;
  onClinicChange: (clinicId: string) => void;
}

export function AdminHeader({ selectedClinicId, onClinicChange }: AdminHeaderProps) {
  const { user, role, signOut } = useAuth();
  const { clinics } = useClinics();

  // Filter ONLY Private Clinics (exclude external third-party hospitals)
  const privateClinicsOnly = clinics.filter(c =>
    !c.name.toLowerCase().includes('hospital') &&
    !c.name.toLowerCase().includes('super specialty')
  );

  return (
    <header className="admin-header">
      <div className="admin-header__clinic-selector">
        <Building2 size={16} className="admin-header__icon" />
        <select
          className="admin-header__select"
          value={selectedClinicId}
          onChange={(e) => onClinicChange(e.target.value)}
        >
          <option value="">All Private Clinics</option>
          {privateClinicsOnly.map((clinic) => (
            <option key={clinic.id} value={clinic.id}>
              {clinic.name}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-header__user-actions">
        <div className="admin-header__user-info">
          <div className="admin-header__avatar">
            <UserIcon size={16} />
          </div>
          <div className="user-text-wrapper">
            <span className="admin-header__user-name" title={user?.email || ''}>
              {user?.user_metadata?.full_name || user?.email || 'Admin'}
            </span>
            <span className="admin-header__user-role">
              {role?.toUpperCase()}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={signOut}
          icon={<LogOut size={15} />}
        >
          Logout
        </Button>
      </div>
    </header>
  );
}
