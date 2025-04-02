import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WorkoutPage from './pages/WorkoutPage';
import LoginPage from './pages/LoginPage';
import UserPage from './pages/UserPage';
import SignupPage from './pages/SignupPage';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import MyWorkoutsPage from './pages/MyWorkoutsPage';
import ProtectedRoute from './components/ProtectedRoute';
import WorkoutDetailPage from './pages/WorkoutDetailPage';
import WorkoutManagement from './pages/WorkoutManagement';
import Statistics from './pages/Statistics';
import { AuthProvider } from './contexts/AuthContext';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<UserPage />} />
                <Route path="/WorkoutPage" element={<WorkoutPage />} />
                <Route path="/my-workouts" element={<MyWorkoutsPage />} />
                <Route path="/workout/:id" element={<WorkoutDetailPage />} />
                <Route path="/workout-management" element={<WorkoutManagement />} />
                <Route path="/statistics" element={<Statistics />} />
              </Route>
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
