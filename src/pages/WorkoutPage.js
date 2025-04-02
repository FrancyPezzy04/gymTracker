import React, { useState, useEffect, useRef } from 'react';
import supabase from '../supabaseClient';
import BackButton from '../components/BackButton';
import Toast from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';

const CounterInput = ({ id, label, value, min = 1, max = 10, onChange }) => {
  const handleIncrement = () => {
    onChange(Math.min(value + 1, max));
  };

  const handleDecrement = () => {
    onChange(Math.max(value - 1, min));
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg w-40">
      <div className="w-full flex flex-col justify-between items-center">
        <div className="grow py-1.5 px-4 w-full">
          <span className="block text-xs text-gray-400 text-center mb-1">
            {label}
          </span>
          <input
            className="w-full p-0 bg-transparent border-0 text-white focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none w-full text-center text-sm focus:ring-blue-500 focus:border-blue-500"
            style={{ '-moz-appearance': 'textfield' }}
            type="number"
            id={id}
            value={value}
            min={min}
            max={max}
            onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
            aria-roledescription="Number field"
          />
        </div>
        <div className="flex w-full">
          <button
            type="button"
            onClick={handleDecrement}
            className="flex-1 inline-flex justify-center items-center text-sm font-medium bg-gray-700 text-white hover:bg-gray-600 focus:outline-hidden focus:bg-gray-600 disabled:opacity-50 disabled:pointer-events-none p-2 h-8 rounded-bl-lg border-r border-gray-600"
            aria-label="Decrease"
          >
            <svg className="w-3 h-3 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleIncrement}
            className="flex-1 inline-flex justify-center items-center text-sm font-medium bg-gray-700 text-white hover:bg-gray-600 focus:outline-hidden focus:bg-gray-600 disabled:opacity-50 disabled:pointer-events-none p-2 h-8 rounded-br-lg"
            aria-label="Increase"
          >
            <svg className="w-3 h-3 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const CustomDropdown = ({ options, selected, onSelect, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-xs" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-1 text-sm text-gray-700 dark:text-gray-300 bg-gray-800 dark:bg-gray-800 border border-gray-600 rounded-full hover:bg-gray-700 dark:hover:bg-gray-700 transition-colors"
      >
        {selected || placeholder}
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg transition-all duration-150 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
      >
        <div className="py-1 max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onSelect(option.value);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const WorkoutPage = () => {
  const [exercises, setExercises] = useState([]);
  const [workoutDays, setWorkoutDays] = useState(3);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [sets, setSets] = useState(1);
  const [reps, setReps] = useState(10);
  const [selectedMuscle, setSelectedMuscle] = useState('');
  const [muscles, setMuscles] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [workoutName, setWorkoutName] = useState('La mia scheda');
  const [toast, setToast] = useState(null);
  const { user } = useAuth();

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase.from('exercises').select('*');
      if (error) throw error;

      setExercises(data);
      setMuscles([...new Set(data.map(ex => ex.muscles))]);
    } catch (err) {
      console.error('Errore nel caricamento esercizi:', err);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const filteredExercises = selectedMuscle
    ? exercises.filter(ex => ex.muscles === selectedMuscle)
    : exercises;

  const handleAddExercise = () => {
    if (!selectedExerciseId) return;

    const exerciseDetails = exercises.find(ex => ex.id === parseInt(selectedExerciseId));

    if (!exerciseDetails) {
      setToast({
        message: 'Esercizio non trovato! Ricarica la pagina o riprova',
        type: 'error'
      });
      setSelectedExerciseId('');
      return;
    }

    const newExercise = {
      exercise_id: parseInt(selectedExerciseId),
      name: exerciseDetails.name,
      muscles: exerciseDetails.muscles,
      day: selectedDay,
      sets: parseInt(sets),
      reps: parseInt(reps),
      temp_id: Date.now()
    };

    setSelectedExercises([...selectedExercises, newExercise]);
    setSelectedExerciseId('');
    setToast({
      message: 'Esercizio aggiunto con successo!',
      type: 'success'
    });
  };

  const handleRemoveExercise = (tempId) => {
    setSelectedExercises(selectedExercises.filter(ex => ex.temp_id !== tempId));
  };

  const handleSaveWorkout = async () => {
    if (!user) {
      setToast({
        message: 'Effettua il login per salvare la scheda!',
        type: 'warning'
      });
      return;
    }

    try {
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert([{
          user_id: user.id,
          days_per_week: workoutDays,
          workout_name: workoutName
        }])
        .select()
        .single();

      if (workoutError) throw workoutError;

      const exercisesToInsert = selectedExercises.map(ex => ({
        workout_id: workout.id,
        exercise_id: ex.exercise_id,
        sets: ex.sets,
        reps: ex.reps,
        day: ex.day
      }));

      const { error: relationError } = await supabase
        .from('workout_exercises')
        .insert(exercisesToInsert);

      if (relationError) throw relationError;

      setToast({
        message: 'Scheda salvata con successo!',
        type: 'success'
      });
      setSelectedExercises([]);
      setWorkoutName('La mia scheda');
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      setToast({
        message: `Errore durante il salvataggio: ${error.message}`,
        type: 'error'
      });
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="flex justify-between items-center mb-6">
        <BackButton />
        <h1 className="text-2xl font-bold">Crea la tua scheda</h1>
      </div>

      {/* Nome scheda centrato */}
      <div className="max-w-md mx-auto mb-8 text-center">
        <input
          type="text"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          className="w-full p-2 text-center border-b-2 border-blue-500 focus:outline-none bg-transparent text-xl font-medium"
          placeholder="Nome della tua scheda"
          required
        />
      </div>

      {/* Sezione input allineati */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Colonna sinistra */}
        <div className="space-y-6">
          <div className="input-group text-center">
            <label className="block text-sm font-medium text-gray-700 mb-2">Giorni alla settimana</label>
            <div className="flex justify-center">
              <CustomDropdown
                options={[3, 4, 5].map(d => ({ value: d, label: `${d} giorni` }))}
                selected={`${workoutDays} giorni`}
                onSelect={(value) => setWorkoutDays(Number(value))}
                placeholder="Seleziona giorni"
              />
            </div>
          </div>

          <div className="input-group text-center">
            <label className="block text-sm font-medium text-gray-700 mb-2">Giorno di allenamento</label>
            <div className="flex justify-center">
              <CustomDropdown
                options={[...Array(workoutDays)].map((_, i) => ({
                  value: i + 1,
                  label: `Giorno ${i + 1}`
                }))}
                selected={`Giorno ${selectedDay}`}
                onSelect={(value) => setSelectedDay(Number(value))}
                placeholder="Seleziona giorno"
              />
            </div>
          </div>

          <div className="input-group text-center">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtra per muscolo</label>
            <div className="flex justify-center">
              <CustomDropdown
                options={[
                  { value: '', label: 'Tutti i muscoli' },
                  ...muscles.map(m => ({ value: m, label: m }))
                ]}
                selected={selectedMuscle || 'Tutti i muscoli'}
                onSelect={(value) => setSelectedMuscle(value)}
                placeholder="Filtra per muscolo"
              />
            </div>
          </div>
        </div>

        {/* Colonna destra */}
        <div className="space-y-6">
          <div className="input-group text-center">
            <label className="block text-sm font-medium text-gray-700 mb-2">Seleziona esercizio</label>
            <div className="flex justify-center">
              <CustomDropdown
                options={filteredExercises.map(ex => ({
                  value: ex.id,
                  label: `${ex.name} (${ex.muscles})`
                }))}
                selected={
                  filteredExercises.find(ex => ex.id === selectedExerciseId)?.name ||
                  'Seleziona esercizio'
                }
                onSelect={(value) => setSelectedExerciseId(value)}
                placeholder="Seleziona esercizio"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="input-group text-center">
              <label className="block text-sm font-medium text-gray-700 mb-2">Serie</label>
              <div className="flex justify-center">
                <CounterInput
                  id="sets-input"
                  label="Serie"
                  value={sets}
                  onChange={setSets}
                />
              </div>
            </div>

            <div className="input-group text-center">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ripetizioni</label>
              <div className="flex justify-center">
                <CounterInput
                  id="reps-input"
                  label="Ripetizioni"
                  value={reps}
                  onChange={setReps}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottone Aggiungi centrato */}
      <div className="flex justify-center my-8">
        <button
          onClick={handleAddExercise}
          disabled={!selectedExerciseId}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:hover:scale-100"
        >
          Aggiungi Esercizio
        </button>
      </div>

      {/* Lista degli esercizi aggiunti */}
      {selectedExercises.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Esercizi Aggiunti</h2>
          <ul className="space-y-4">
            {selectedExercises.map((exercise, index) => (
              <li key={index} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{exercise.name}</h3>
                    <div className="mt-1 flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{exercise.muscles}</span>
                      <span className="text-gray-300">•</span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-xs rounded-full">
                          Giorno {exercise.day}
                        </span>
                        {exercise.flag && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Completato
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleRemoveExercise(exercise.temp_id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bottone Salva centrato */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={handleSaveWorkout}
          disabled={selectedExercises.length === 0 || !workoutName.trim()}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 px-12 rounded-full transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
        >
          Salva Scheda
        </button>
      </div>
    </div>
  );
};

export default WorkoutPage;