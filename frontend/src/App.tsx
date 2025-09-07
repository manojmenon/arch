import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Tokens from './pages/Tokens';
import Admin from './pages/Admin';
import Profile from './pages/Profile';

function App() {
  return (
    <AppLayout>
      <Routes>
        {/* Public routes - accessible to everyone */}
        <Route path="/" element={
          <ProtectedRoute requireAuth={false} allowAuthenticated={true}>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/login" element={
          <ProtectedRoute requireAuth={false}>
            <Login />
          </ProtectedRoute>
        } />
        <Route path="/signup" element={
          <ProtectedRoute requireAuth={false}>
            <Signup />
          </ProtectedRoute>
        } />
        
        {/* Protected routes - only accessible when authenticated */}
        <Route path="/dashboard" element={
          <ProtectedRoute requireAuth={true}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/projects" element={
          <ProtectedRoute requireAuth={true}>
            <Projects />
          </ProtectedRoute>
        } />
        <Route path="/projects/:id" element={
          <ProtectedRoute requireAuth={true}>
            <ProjectDetail />
          </ProtectedRoute>
        } />
        <Route path="/tokens" element={
          <ProtectedRoute requireAuth={true}>
            <Tokens />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requireAuth={true}>
            <Admin />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute requireAuth={true}>
            <Profile />
          </ProtectedRoute>
        } />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default App;

