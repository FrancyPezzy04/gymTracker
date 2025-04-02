import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const checkEmailExists = async (email) => {
    try {
      // Using Supabase's auth.signInWithOtp to check if email exists
      // This doesn't actually log the user in but will return a specific error if the email doesn't exist
      const { error } = await supabase.auth.signInWithOtp({
        email,
        shouldCreateUser: false,
      });

      // If there's no error or the error doesn't mention "email not found", the email likely exists
      return !error || !error.message.includes("email not found");
    } catch (err) {
      console.error("Error checking email:", err);
      return false;
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First check if email already exists
      const emailExists = await checkEmailExists(email);

      if (emailExists) {
        setError("Questa email è già registrata.");
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }

      // If email doesn't exist, proceed with signup
      const { error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Success
      alert('Registrazione completata! Controlla la tua email per la conferma.');
      navigate('/');
    } catch (err) {
      setError("Si è verificato un errore durante la registrazione. Riprova più tardi.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Registrazione</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSignup}>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            required
            minLength="6"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={loading}
        >
          {loading ? 'Elaborazione...' : 'Registrati'}
        </button>
      </form>
      <p className="mt-4 text-center text-gray-600 dark:text-gray-300">
        Hai già un account?{' '}
        <a href="/login" className="text-blue-500 hover:underline">Accedi</a>
      </p>
    </div>
  );
};

export default SignupPage;