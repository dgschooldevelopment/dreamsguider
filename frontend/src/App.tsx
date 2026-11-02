import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminCourses } from './pages/admin/AdminCourses';
import { AdminCurriculum } from './pages/admin/AdminCurriculum';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminAssignments } from './pages/admin/AdminAssignments';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { MyCourses } from './pages/student/MyCourses';
import { CoursePlayer } from './pages/student/CoursePlayer';
import { StudentAssignments } from './pages/student/StudentAssignments';

export const App: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />
          ) : (
            <Register />
          )
        }
      />

      {/* Protected Admin Routes */}
      <Route element={<ProtectedRoute requireAdmin={true} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/courses" element={<AdminCourses />} />
          <Route path="/admin/courses/:id/curriculum" element={<AdminCurriculum />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/assignments" element={<AdminAssignments />} />
        </Route>
      </Route>

      {/* Protected Student Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/my-courses" element={<MyCourses />} />
          <Route path="/learn/:slug" element={<CoursePlayer />} />
          <Route path="/assignments" element={<StudentAssignments />} />
        </Route>
      </Route>

      {/* Root redirect */}
      <Route
        path="/"
        element={
          <Navigate
            to={
              isAuthenticated
                ? isAdmin
                  ? '/admin'
                  : '/dashboard'
                : '/login'
            }
            replace
          />
        }
      />

      {/* 404 Fallback */}
      <Route
        path="*"
        element={
          <Navigate
            to={
              isAuthenticated
                ? isAdmin
                  ? '/admin'
                  : '/dashboard'
                : '/login'
            }
            replace
          />
        }
      />
    </Routes>
  );
};

export default App;
