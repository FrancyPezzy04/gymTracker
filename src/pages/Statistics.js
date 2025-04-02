import React, { useState, useEffect } from 'react';
import supabase from '../supabaseClient';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BackButton from '../components/BackButton';
import Toast from '../components/Toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Statistics = () => {
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [hasWorkouts, setHasWorkouts] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState('');
  const [muscles, setMuscles] = useState([]);
  const [exercisesWithWeights, setExercisesWithWeights] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dataInitialized, setDataInitialized] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const initializeData = async () => {
      setInitialLoading(true);
      await fetchUser();
      setInitialLoading(false);
    };
    initializeData();
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        setInitialLoading(true);
        await Promise.all([
          fetchExercises(),
          checkWorkouts(),
          fetchMuscles()
        ]);
        setDataInitialized(true);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    if (user) {
      loadUserData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedExercise) {
      fetchExerciseHistory();
    }
  }, [selectedExercise]);

  useEffect(() => {
    if (user && exercises.length > 0) {
      fetchExercisesWithWeights();
    }
  }, [exercises, user, selectedMuscle]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) {
        setError('Per visualizzare le statistiche devi effettuare il login.');
        return;
      }
    } catch (error) {
      setError('Errore nel caricamento del profilo utente. Per favore, effettua nuovamente il login.');
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMuscles = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('muscles')
        .not('muscles', 'is', null)
        .order('muscles');

      if (error) throw error;
      const uniqueMuscles = [...new Set(data.map(ex => ex.muscles))].filter(Boolean);
      setMuscles(uniqueMuscles);
    } catch (error) {
      console.error('Error fetching muscles:', error);
    }
  };

  const fetchExercisesWithWeights = async () => {
    if (!user) {
      console.log('User not logged in, skipping fetchExercisesWithWeights');
      return;
    }

    try {
      setLoading(true);
      const { data: historyData, error: historyError } = await supabase
        .from('workout_exercise_history')
        .select(`
          exercise_id,
          weight,
          workout_history:workout_history_id (
            user_id,
            date
          )
        `)
        .eq('workout_history.user_id', user.id)
        .not('weight', 'is', null)
        .gt('weight', 0);

      if (historyError) throw historyError;

      if (!historyData || historyData.length === 0) {
        setExercisesWithWeights([]);
        return;
      }

      const exerciseIds = [...new Set(historyData.map(item => item.exercise_id))];
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('id, name, muscles')
        .in('id', exerciseIds);

      if (exercisesError) throw exercisesError;

      let filteredExercises = exercisesData || [];
      if (selectedMuscle) {
        filteredExercises = filteredExercises.filter(ex => ex.muscles === selectedMuscle);
      }

      setExercisesWithWeights(filteredExercises);
    } catch (error) {
      console.error('Error fetching exercises with weights:', error);
      setExercisesWithWeights([]);
    } finally {
      setLoading(false);
    }
  };

  const checkWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_history')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (error) throw error;
      setHasWorkouts(data && data.length > 0);
    } catch (error) {
      console.error('Error checking workouts:', error);
      setHasWorkouts(false);
    }
  };

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workout_exercise_history')
        .select(`
          exercise_id,
          weight,
          exercise:exercises (
            name,
            muscle_group
          )
        `)
        .eq('user_id', user.id)
        .not('weight', 'is', null)
        .gt('weight', 0);

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      setToast({
        message: 'Errore nel caricamento delle statistiche',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExerciseHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workout_exercise_history')
        .select(`
          weight,
          created_at,
          workout_history:workout_history_id (
            date
          )
        `)
        .eq('exercise_id', selectedExercise)
        .eq('workout_history.user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const sortedData = data ? [...data].sort((a, b) => {
        const dateA = new Date(a.workout_history.date);
        const dateB = new Date(b.workout_history.date);
        return dateA - dateB;
      }) : [];

      setExerciseHistory(sortedData);
    } catch (error) {
      setError('Errore nel caricamento della cronologia degli esercizi. Riprova più tardi.');
      console.error('Error fetching exercise history:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: exerciseHistory.map(item => 
      new Date(item.workout_history.date).toLocaleDateString('it-IT')
    ),
    datasets: [
      {
        label: 'Peso (kg)',
        data: exerciseHistory.map(item => item.weight),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Andamento Pesi'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Peso (kg)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Data'
        }
      }
    }
  };

  if (initialLoading || !dataInitialized) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento statistiche...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-yellow-800 mb-4">Accesso Richiesto</h2>
          <p className="text-yellow-700 mb-4">
            Per visualizzare le statistiche dei tuoi allenamenti, effettua il login.
          </p>
          <Link 
            to="/login" 
            className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
          >
            Vai al Login
          </Link>
        </div>
      </div>
    );
  }

  if (!hasWorkouts && dataInitialized) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-yellow-800 mb-4">Nessun Allenamento Salvato</h2>
          <p className="text-yellow-700 mb-4">
            Non hai ancora salvato nessun allenamento. Le statistiche saranno disponibili dopo aver completato e salvato almeno un allenamento.
          </p>
          <Link 
            to="/workout-management" 
            className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
          >
            Vai alla Gestione Allenamenti
          </Link>
        </div>
      </div>
    );
  }

  if (exercisesWithWeights.length === 0 && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-yellow-800 mb-4">Nessun Dato Disponibile</h2>
          <p className="text-yellow-700 mb-4">
            Non ci sono ancora esercizi con pesi salvati. Completa almeno un allenamento per vedere le statistiche.
          </p>
          <Link 
            to="/workout-management" 
            className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
          >
            Vai alla Gestione Allenamenti
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <h1 className="text-3xl font-bold mb-8">Statistiche Allenamenti</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtra per Muscolo
            </label>
            <select
              value={selectedMuscle}
              onChange={(e) => setSelectedMuscle(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Tutti i muscoli</option>
              {muscles.map(muscle => (
                <option key={muscle} value={muscle}>
                  {muscle}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleziona Esercizio
            </label>
            <select
              value={selectedExercise || ''}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Seleziona un esercizio</option>
              {exercisesWithWeights.map(exercise => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedExercise && exerciseHistory.length > 0 ? (
          <div className="h-[400px]">
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : selectedExercise ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600 mb-4">
              Non ci sono dati disponibili per questo esercizio. Prova a selezionare un altro esercizio.
            </p>
            <p className="text-sm text-gray-500">
              I dati appariranno qui dopo aver completato e salvato almeno un allenamento con questo esercizio.
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600">
              Seleziona un esercizio dal menu a tendina per visualizzare le statistiche dei pesi utilizzati.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics; 