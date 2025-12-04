import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Room from './pages/Room';
import CreateRoom from './pages/Room/CreateRoom';
import GroupWatchPage from './pages/Room/GroupWatchPage';
import AuthProvider from './context/AuthProvider';
import SocketProvider from './context/SocketContext';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4
};

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
            <Route
              path="/"
              element={
                <motion.div
                  key="landing"
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <Landing />
                </motion.div>
              }
            />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />

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