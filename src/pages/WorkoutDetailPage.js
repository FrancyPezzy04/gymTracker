import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import supabase from '../supabaseClient';

const WorkoutDetailPage = () => {
  const { id } = useParams();
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const { data, error } = await supabase
          .from('workouts')
          .select(`
            id,
            workout_name,
            days_per_week,
            created_at,
            workout_exercises (
              id,
              day,
              sets,
              reps,
              exercises (
                id,
                name,
                muscles
              )
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setWorkout(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [id]);

  if (loading) return <div className="text-center py-8">Caricamento...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Errore: {error}</div>;

  return (
<div className="flex justify-center items-center min-h-screen px-4">
  <div className="max-w-xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
    <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-white">{workout.workout_name}</h1>
    
    <div className="p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm sm:text-base">
          {workout.days_per_week} giorni
        </span>
        <span className=" text-white mt-2 sm:mt-0 text-white text-white-500 dark:text-gray-400 text-sm">
          Creata il: {new Date(workout.created_at).toLocaleDateString('it-IT')}
        </span>
      </div>

      {Array.from({ length: workout.days_per_week }).map((_, dayIndex) => {
        const dayNumber = dayIndex + 1;
        const dayExercises = workout.workout_exercises?.filter(ex => ex.day === dayNumber) || [];

        return (
          <div key={dayNumber} className="mb-6">
            <h2 className="text-lg sm:text-xl text-white font-bold mb-3 text-center">Giorno {dayNumber}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dayExercises.map(exercise => (
                <div key={exercise.id} className="p-4 border rounded-lg bg-gray-100 dark:bg-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">{exercise.exercises.name}</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">{exercise.exercises.muscles}</p>
                  <div className="mt-2">
                    <span className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded mr-2 text-sm">
                      {exercise.sets} serie
                    </span>
                    <span className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-sm">
                      {exercise.reps} ripetizioni
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </div>
</div>

  );
};

export default WorkoutDetailPage;