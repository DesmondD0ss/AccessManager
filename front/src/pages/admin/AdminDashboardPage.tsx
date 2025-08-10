// AdminDashboardPage.tsx remains unchanged
import React from 'react';
import AdminLayout from './components/AdminLayout';
import { Outlet } from 'react-router-dom';

const AdminDashboardPage: React.FC = () => {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
};

export default AdminDashboardPage;