import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../supabaseClient';

const MyWorkoutsPage = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('Utente non autenticato');

        const { data, error: workoutError } = await supabase
          .from('workouts')
          .select(`
            id, workout_name, days_per_week, created_at,
            workout_exercises (
              id, day, sets, reps,
              exercises ( id, name, muscles )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (workoutError) throw workoutError;

        setWorkouts(data);
      } catch (err) {
        setError(err.message);
        console.error('Errore nel recupero dei workout:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, []);

  // Funzione per eliminare un workout
const handleDelete = async (workoutId) => {
  const confirmDelete = window.confirm("Sei sicuro di voler eliminare questa scheda?");
  if (!confirmDelete) return;

  try {
    // Elimina la scheda (e automaticamente gli esercizi correlati)
    const { error } = await supabase.from('workouts').delete().eq('id', workoutId);
    if (error) throw error;

    // Rimuove la scheda dallo stato
    setWorkouts(prevWorkouts => prevWorkouts.filter(w => w.id !== workoutId));
  } catch (err) {
    console.error('Errore durante l\'eliminazione:', err.message);
    alert('Errore durante l\'eliminazione. Riprova.');
  }
};


  if (loading) return <div className="text-center py-8">Caricamento...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Errore: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Le Mie Schede Allenamento</h1>

      {workouts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl mb-4">Nessuna scheda trovata</p>
          <Link to="/WorkoutPage" className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition">
            Crea la tua prima scheda
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workouts.map(workout => (
            <div key={workout.id} className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition relative">
              {/* Intestazione con bottone elimina */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold truncate">{workout.workout_name || `Scheda ${workout.id}`}</h2>
                <button
                  onClick={() => handleDelete(workout.id)}
                  className="text-white hover:text-red-500 transition"
                  title="Elimina"
                >
                  🗑️
                </button>
              </div>

              {/* Dettagli Allenamento */}
              <div className="p-4 bg-white dark:bg-gray-800">
                <h3 className="font-bold text-white mb-3 text-lg">Anteprima Allenamento:</h3>

                {Array.from({ length: workout.days_per_week }).map((_, dayIndex) => {
                  const dayNumber = dayIndex + 1;
                  const dayExercises = workout.workout_exercises?.filter(ex => ex.day === dayNumber) || [];
                  const previewExercises = dayExercises.slice(0, 2);

                  return (
                    <div key={dayIndex} className="mb-4">
                      <div className="flex text-white items-center mb-2">
                        <h4 className="font-semibold">Giorno {dayNumber}</h4>
                        <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                          {dayExercises.length} esercizi
                        </span>
                      </div>

                      {previewExercises.length > 0 ? (
                        <ul className="space-y-2">
                          {previewExercises.map(exercise => (
                            <li key={exercise.id} className="pl-2 text-white border-l-2 border-blue-400">
                              <p className="text-sm font-medium">{exercise.exercises.name}</p>
                              <p className="text-xs text-gray-500">{exercise.sets}x{exercise.reps}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Nessun esercizio</p>
                      )}

                      {dayExercises.length > 2 && (
                        <p className="text-sm text-gray-500 mt-2">
                          + {dayExercises.length - 2} altri esercizi...
                        </p>
                      )}
                    </div>
                  );
                })}

                {/* Link per visualizzare il workout completo */}
                <div className="mt-4">
                  <Link to={`/workout/${workout.id}`} className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                    Visualizza scheda completa →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyWorkoutsPage;
