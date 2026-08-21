import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Students = lazy(() => import('./pages/Students'));
const Teachers = lazy(() => import('./pages/Teachers'));
const Courses = lazy(() => import('./pages/Courses'));
const Batches = lazy(() => import('./pages/Batches'));
const Enrollments = lazy(() => import('./pages/Enrollments'));
const EnrollmentRequests = lazy(() => import('./pages/EnrollmentRequests'));
const ApplyEnrollment = lazy(() => import('./pages/ApplyEnrollment'));
const Fees = lazy(() => import('./pages/Fees'));
const Attendance = lazy(() => import('./pages/Attendance'));

const RouteFallback = () => (
  <div className="flex h-screen items-center justify-center bg-surface">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-100 border-t-navy-500" />
  </div>
);

function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/apply"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <ApplyEnrollment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['founder', 'admin', 'teacher', 'student']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students"
          element={
            <ProtectedRoute allowedRoles={['founder', 'admin', 'teacher']}>
              <Students />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teachers"
          element={
            <ProtectedRoute allowedRoles={['founder', 'admin']}>
              <Teachers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/courses"
          element={
            <ProtectedRoute allowedRoles={['founder', 'admin', 'teacher', 'student']}>
              <Courses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/batches"
          element={
            <ProtectedRoute allowedRoles={['founder', 'admin', 'teacher']}>
              <Batches />
            </ProtectedRoute>
          }
        />

        <Route
          path="/enrollments"
          element={
            <ProtectedRoute allowedRoles={['founder', 'admin', 'teacher', 'student']}>
              <Enrollments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/enrollment-requests"
          element={
            <ProtectedRoute allowedRoles={['founder', 'admin']}>
              <EnrollmentRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/fees"
          element={
            <ProtectedRoute allowedRoles={['founder', 'admin', 'student']}>
              <Fees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute allowedRoles={['founder', 'admin', 'teacher', 'student']}>
              <Attendance />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
