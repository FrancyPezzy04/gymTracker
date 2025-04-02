import React, { useState, useEffect } from 'react';
import supabase from '../supabaseClient';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useAuth } from '../contexts/AuthContext';
import BackButton from '../components/BackButton';
import Toast from '../components/Toast';
import { Link } from 'react-router-dom';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Annulla
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Elimina
          </button>
        </div>
      </div>
    </div>
  );
};

const WorkoutManagement = () => {
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [weights, setWeights] = useState({});
  const [units, setUnits] = useState({});
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inputErrors, setInputErrors] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    historyId: null
  });
  const [detailsDialog, setDetailsDialog] = useState({
    isOpen: false,
    workout: null
  });
  const [historyPage, setHistoryPage] = useState(0);
  const workoutsPerPage = 3;
  const [selectedDay, setSelectedDay] = useState(1);
  const [toast, setToast] = useState(null);
  const { user: authUser } = useAuth();

  useEffect(() => {
    if (authUser) {
      fetchWorkouts();
      fetchWorkoutHistory();
    } else {
      setLoading(false);
    }
  }, [authUser]);

  const fetchWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error) {
      setToast({
        message: 'Errore nel caricamento degli allenamenti',
        type: 'error'
      });
    }
  };

  const fetchWorkoutHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_history')
        .select(`
          *,
          workout_exercise_history (
            weight,
            exercise:exercises (
              name
            )
          )
        `)
        .eq('user_id', authUser.id)
        .order('date', { ascending: false });
      
      if (error) throw error;
      setWorkoutHistory(data || []);
    } catch (error) {
      setToast({
        message: 'Errore nel caricamento della cronologia',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWorkoutSelect = async (workoutId) => {
    setLoading(true);
    try {
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', workoutId)
        .single();
      
      if (workoutError) throw workoutError;
      
      const { data, error } = await supabase
        .from('workout_exercises')
        .select(`
          id,
          sets,
          reps,
          day,
          exercise:exercises (
            id,
            name,
            muscles
          )
        `)
        .eq('workout_id', workoutId);
      
      if (error) throw error;
      
      setSelectedWorkout(workoutId);
      setExercises(data || []);
      
      // Trova il primo giorno che ha esercizi
      const firstDayWithExercises = data?.length > 0 
        ? Math.min(...data.map(ex => ex.day))
        : 1;
      
      setSelectedDay(firstDayWithExercises);
      
      // Initialize weights and units objects with empty values
      const initialWeights = {};
      const initialUnits = {};
      data.forEach(workoutExercise => {
        initialWeights[workoutExercise.exercise.id] = '';
        initialUnits[workoutExercise.exercise.id] = 'kg';
      });
      setWeights(initialWeights);
      setUnits(initialUnits);
      setInputErrors({});
    } catch (error) {
      setToast({
        message: 'Errore nel caricamento degli esercizi',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (exerciseId, value) => {
    // Validazione input
    if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 1000)) {
      setWeights(prev => ({
        ...prev,
        [exerciseId]: value
      }));
      // Rimuovi errore se presente
      setInputErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[exerciseId];
        return newErrors;
      });
    }
  };

  const handleUnitChange = (exerciseId, unit) => {
    setUnits(prev => ({
      ...prev,
      [exerciseId]: unit
    }));
  };

  const validateInputs = () => {
    const errors = {};
    exercises
      .filter(workoutExercise => workoutExercise.day === selectedDay)
      .forEach(workoutExercise => {
        const weight = weights[workoutExercise.exercise.id];
        if (!weight || weight === '') {
          errors[workoutExercise.exercise.id] = 'Inserisci un peso';
        } else if (parseFloat(weight) <= 0 || parseFloat(weight) > 1000) {
          errors[workoutExercise.exercise.id] = 'Peso non valido';
        }
      });
    setInputErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveWorkout = async () => {
    if (!selectedWorkout || !authUser) {
      setToast({
        message: 'Dati mancanti. Seleziona un allenamento.',
        type: 'error'
      });
      return;
    }
    if (!validateInputs()) return;

    try {
      setLoading(true);
      setError(null);
      
      // Imposta l'ora a mezzanotte per evitare problemi di fuso orario
      const workoutDate = new Date(selectedDate);
      workoutDate.setHours(0, 0, 0, 0);
      
      // First, create the workout history entry
      const { data: workoutHistoryData, error: workoutHistoryError } = await supabase
        .from('workout_history')
        .insert([{
          user_id: authUser.id,
          workout_id: selectedWorkout,
          date: workoutDate.toISOString()
        }])
        .select()
        .single();

      if (workoutHistoryError) {
        throw new Error('Errore nella creazione della cronologia dell\'allenamento');
      }

      // Then, save the exercise weights only for the selected day
      const exerciseHistoryData = exercises
        .filter(workoutExercise => workoutExercise.day === selectedDay)
        .map(workoutExercise => {
          const weight = weights[workoutExercise.exercise.id];
          
          if (!weight || isNaN(parseFloat(weight))) {
            return null;
          }
          
          return {
            workout_history_id: workoutHistoryData.id,
            exercise_id: workoutExercise.exercise.id,
            weight: parseFloat(weight)
          };
        }).filter(Boolean);

      if (exerciseHistoryData.length === 0) {
        throw new Error('Nessun peso valido da salvare');
      }

      const { error: exerciseHistoryError } = await supabase
        .from('workout_exercise_history')
        .insert(exerciseHistoryData);

      if (exerciseHistoryError) {
        // Se c'è un errore nel salvataggio dei pesi, elimina anche l'entry della cronologia
        await supabase
          .from('workout_history')
          .delete()
          .eq('id', workoutHistoryData.id);
        throw new Error('Errore nel salvataggio dei pesi degli esercizi');
      }
      
      // Reset form and show success message
      setSelectedWorkout(null);
      setExercises([]);
      setWeights({});
      setUnits({});
      setInputErrors({});
      await fetchWorkoutHistory();
      
      setToast({
        message: 'Allenamento salvato con successo',
        type: 'success'
      });
      
    } catch (error) {
      setToast({
        message: error.message || 'Errore nel salvataggio dell\'allenamento',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (historyId) => {
    setConfirmDialog({
      isOpen: true,
      historyId
    });
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('workout_history')
        .delete()
        .eq('id', confirmDialog.historyId);
      
      if (error) throw error;
      await fetchWorkoutHistory();
      setLoading(false);
      setConfirmDialog({ isOpen: false, historyId: null });
      setToast({
        message: 'Allenamento eliminato con successo',
        type: 'success'
      });
    } catch (error) {
      setToast({
        message: 'Errore nell\'eliminazione dell\'allenamento',
        type: 'error'
      });
      setLoading(false);
      setConfirmDialog({ isOpen: false, historyId: null });
    }
  };

  const handleWorkoutClick = (history) => {
    setDetailsDialog({
      isOpen: true,
      workout: history
    });
  };

  const tileContent = ({ date }) => {
    const workoutDate = date.toISOString().split('T')[0];
    const workout = workoutHistory.find(
      workout => workout.date.split('T')[0] === workoutDate
    );

    // Controlla se la data ha esercizi per il workout selezionato
    const hasExercisesForSelectedWorkout = selectedWorkout && exercises.some(exercise => {
      return exercise.day === selectedDay;
    });

    return (
      <div className="relative">
        <div className="w-2 h-2 rounded-full mx-auto"
             style={{ 
               backgroundColor: workout 
                 ? '#22c55e' 
                 : hasExercisesForSelectedWorkout 
                   ? '#3b82f6' 
                   : 'transparent' 
             }} />
      </div>
    );
  };

  const tileClassName = ({ date }) => {
    const workoutDate = date.toISOString().split('T')[0];
    const hasWorkout = workoutHistory.some(
      workout => workout.date.split('T')[0] === workoutDate
    );
    
    // Controlla se la data ha esercizi per il workout selezionato
    const hasExercisesForSelectedWorkout = selectedWorkout && exercises.some(exercise => {
      return exercise.day === selectedDay;
    });

    if (hasWorkout) {
      return 'bg-green-50 hover:bg-green-100';
    } else if (hasExercisesForSelectedWorkout) {
      return 'bg-blue-50 hover:bg-blue-100';
    }
    return '';
  };

  const getSelectedWorkoutName = () => {
    const workout = workouts.find(w => w.id === selectedWorkout);
    return workout ? workout.workout_name : '';
  };

  const handlePrevPage = () => {
    setHistoryPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    const maxPage = Math.ceil(workoutHistory.length / workoutsPerPage) - 1;
    setHistoryPage(prev => Math.min(maxPage, prev + 1));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento in corso...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, historyId: null })}
        onConfirm={handleConfirmDelete}
        title="Elimina Allenamento"
        message="Sei sicuro di voler eliminare questo allenamento? Questa azione non può essere annullata."
      />

      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${detailsDialog.isOpen ? '' : 'hidden'}`}>
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">
              Dettagli Allenamento
            </h3>
            <button
              onClick={() => setDetailsDialog({ isOpen: false, workout: null })}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          {detailsDialog.workout && (
            <div>
              <p className="text-lg font-medium mb-4">
                {new Date(detailsDialog.workout.date).toLocaleDateString('it-IT')} - 
                {workouts.find(w => w.id === detailsDialog.workout.workout_id)?.workout_name}
              </p>
              <div className="space-y-3">
                {detailsDialog.workout.workout_exercise_history.map((exercise, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{exercise.exercise.name}</span>
                    <span className="text-blue-600 font-medium">{exercise.weight} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <h1 className="text-3xl font-bold mb-8">Gestisci Allenamenti</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Le Tue Schede</h2>
          {!authUser ? (
            <p className="text-gray-500">Effettua il login per vedere le tue schede.</p>
          ) : workouts.length === 0 ? (
            <p className="text-gray-500">Non hai ancora creato nessuna scheda di allenamento.</p>
          ) : (
            <div className="space-y-2">
              {workouts.map(workout => (
                <button
                  key={workout.id}
                  onClick={() => handleWorkoutSelect(workout.id)}
                  className={`w-full p-3 text-left rounded-lg ${
                    selectedWorkout === workout.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-medium">{workout.workout_name}</div>
                </button>
              ))}
            </div>
          )}

          {selectedWorkout && (
            <div className="mt-6">
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h2 className="text-xl font-semibold text-blue-800">Scheda Selezionata</h2>
                <p className="text-blue-600 font-medium">{getSelectedWorkoutName()}</p>
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giorno Allenamento
                  </label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                    className="w-full p-2 border rounded"
                  >
                    {[...new Set(exercises.map(e => e.day))]
                      .sort((a, b) => a - b)
                      .map(day => (
                        <option key={day} value={day}>
                          Giorno {day}
                        </option>
                      ))}
                  </select>
                </div>
                <p className="text-sm text-blue-500 mt-2">
                  Numero di esercizi per il giorno {selectedDay}: {exercises.filter(e => e.day === selectedDay).length}
                </p>
              </div>
              <h2 className="text-xl font-semibold mb-4">Inserisci Pesi</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Allenamento
                </label>
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="space-y-4">
                {exercises
                  .filter(workoutExercise => workoutExercise.day === selectedDay)
                  .map(workoutExercise => (
                    <div key={workoutExercise.id} className="flex items-center gap-4">
                      <div className="flex-1">
                        <span className="font-medium">{workoutExercise.exercise.name}</span>
                        <div className="text-sm text-gray-500">
                          {workoutExercise.sets} serie x {workoutExercise.reps} ripetizioni
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={weights[workoutExercise.exercise.id] || ''}
                          onChange={(e) => handleWeightChange(workoutExercise.exercise.id, e.target.value)}
                          className={`w-24 p-2 border rounded ${inputErrors[workoutExercise.exercise.id] ? 'border-red-500' : ''}`}
                          placeholder="Peso"
                          min="0"
                          max="1000"
                          step="0.1"
                        />
                        <select
                          value={units[workoutExercise.exercise.id]}
                          onChange={(e) => handleUnitChange(workoutExercise.exercise.id, e.target.value)}
                          className="p-2 border rounded"
                        >
                          <option value="kg">kg</option>
                          <option value="lbs">lbs</option>
                        </select>
                      </div>
                      {inputErrors[workoutExercise.exercise.id] && (
                        <p className="text-red-500 text-sm">{inputErrors[workoutExercise.exercise.id]}</p>
                      )}
                    </div>
                  ))}
              </div>
              <button
                onClick={saveWorkout}
                className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
              >
                Salva Allenamento
              </button>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Calendario Allenamenti</h2>
          <div className="bg-white rounded-lg shadow-lg p-4">
            <Calendar
              onChange={(date) => {
                const newDate = new Date(date);
                newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), selectedDate.getSeconds());
                setSelectedDate(newDate);
              }}
              value={selectedDate}
              tileContent={tileContent}
              maxDate={new Date()}
              minDate={new Date(2020, 0, 1)}
              locale="it-IT"
              formatDay={(locale, date) => date.getDate().toString()}
              tileClassName={tileClassName}
              calendarClassName="bg-white rounded-lg shadow-lg p-4"
              navigationLabel={({ date }) => 
                date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
              }
              prevLabel={<span className="text-blue-500 text-xl">←</span>}
              nextLabel={<span className="text-blue-500 text-xl">→</span>}
              prev2Label={null}
              next2Label={null}
              showNeighboringMonth={false}
              showFixedNumberOfWeeks={false}
              formatShortWeekday={(locale, date) => 
                date.toLocaleDateString('it-IT', { weekday: 'short' })
              }
              className="w-full"
              tileDisabled={({ date }) => date > new Date()}
              fullWidth={true}
              showWeekNumbers={false}
              minDetail="month"
            />
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Ultimi Allenamenti</h3>
              <div className="space-y-2">
                {workoutHistory
                  .slice(historyPage * workoutsPerPage, (historyPage + 1) * workoutsPerPage)
                  .map(history => (
                    <div 
                      key={history.id} 
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => handleWorkoutClick(history)}
                    >
                      <div>
                        <p className="font-medium">{new Date(history.date).toLocaleDateString('it-IT')}</p>
                        <p className="text-sm text-gray-500">
                          {workouts.find(w => w.id === history.workout_id)?.workout_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(history.id);
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          Elimina
                        </button>
                        <span className="text-blue-500">→</span>
                      </div>
                    </div>
                  ))}
              </div>
              {workoutHistory.length > workoutsPerPage && (
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={handlePrevPage}
                    disabled={historyPage === 0}
                    className={`px-4 py-2 rounded-lg ${
                      historyPage === 0
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    ← Precedenti
                  </button>
                  <span className="text-gray-600">
                    Pagina {historyPage + 1} di {Math.ceil(workoutHistory.length / workoutsPerPage)}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={(historyPage + 1) * workoutsPerPage >= workoutHistory.length}
                    className={`px-4 py-2 rounded-lg ${
                      (historyPage + 1) * workoutsPerPage >= workoutHistory.length
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    Successivi →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutManagement; 