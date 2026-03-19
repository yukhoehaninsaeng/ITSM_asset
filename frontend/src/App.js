import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout      from './components/layout/Layout';
import Login       from './pages/Login';
import Dashboard   from './pages/Dashboard';
import Assets      from './pages/Assets';
import AssetDetail from './pages/AssetDetail';
import Scan        from './pages/Scan';
import ScanLanding from './pages/ScanLanding';
import Users       from './pages/Users';
import './index.css';

const Guard = ({ children }) => {
  const { user } = useAuth();
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily:"'IBM Plex Sans KR', sans-serif", fontSize:13 },
            success: { iconTheme: { primary:'#2e9e6b', secondary:'#fff' } },
            error:   { iconTheme: { primary:'#d94f3d', secondary:'#fff' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login"             element={<Login />} />
          <Route path="/scan/:assetNumber" element={<ScanLanding />} />

          {/* Protected */}
          <Route path="/dashboard"             element={<Guard><Dashboard /></Guard>} />
          <Route path="/assets"                element={<Guard><Assets /></Guard>} />
          <Route path="/assets/:assetNumber"   element={<Guard><AssetDetail /></Guard>} />
          <Route path="/scan"                  element={<Guard><Scan /></Guard>} />
          <Route path="/users"                 element={<Guard><Users /></Guard>} />

          {/* Fallback */}
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
