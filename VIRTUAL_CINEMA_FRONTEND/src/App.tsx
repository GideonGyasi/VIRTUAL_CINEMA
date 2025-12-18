import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Room from './pages/Room';
import CreateRoom from './pages/Room/CreateRoom';
import GroupWatchPage from './pages/Room/GroupWatchPage';
import AuthProvider from './context/AuthProvider';
import SocketProvider from "./context/SocketProvider";
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';



function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Home page is accessible without auth */}
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/home" element={<Layout><Home /></Layout>} />

            <Route path="/room/:roomId" element={<PrivateRoute><Room /></PrivateRoute>} />
            <Route path="/room/create" element={<PrivateRoute><CreateRoom /></PrivateRoute>} />
            <Route path="/group/:sessionId" element={<GroupWatchPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;