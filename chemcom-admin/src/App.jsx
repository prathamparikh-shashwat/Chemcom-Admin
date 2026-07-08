import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OrderDetails from './pages/OrderDetails';
import ManageUsers from './pages/ManageUsers';
import SystemSettings from './pages/SystemSettings';
import ManageProducts from './pages/ManageProducts';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routing */}
          <Route path="/login" element={<Login />} />

          {/* Secure Admin Routing */}
          <Route element={<ProtectedAdminRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<ManageProducts />} />
            <Route path="/orders/:id" element={<OrderDetails />} />
            <Route path="/users" element={<ManageUsers />} />
            <Route path="/system-settings" element={<SystemSettings />} />
          </Route>

          {/* Wildcard Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
