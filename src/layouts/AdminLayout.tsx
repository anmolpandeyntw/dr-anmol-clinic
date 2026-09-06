import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminHeader } from '../components/admin/AdminHeader';
import { ProtectedRoute } from '../components/admin/ProtectedRoute';
import './AdminLayout.css';

export default function AdminLayout() {
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');

  return (
    <ProtectedRoute>
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-layout__main">
          <AdminHeader
            selectedClinicId={selectedClinicId}
            onClinicChange={setSelectedClinicId}
          />
          <div className="admin-layout__content">
            <Outlet context={{ clinicId: selectedClinicId }} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
