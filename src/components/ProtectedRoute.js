import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import supabase from '../supabaseClient';

const ProtectedRoute = () => {
  const user = supabase.auth.getUser();

  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;