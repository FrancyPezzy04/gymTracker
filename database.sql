create table public.workout_exercise_history (
  id uuid not null default extensions.uuid_generate_v4(),
  workout_history_id uuid not null,
  exercise_id integer not null,
  weight numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  constraint workout_exercise_history_pkey primary key (id),
  constraint workout_exercise_history_workout_history_id_fkey foreign key (workout_history_id) references workout_history(id) on delete cascade,
  constraint workout_exercise_history_exercise_id_fkey foreign key (exercise_id) references exercises(id) on delete cascade
) TABLESPACE pg_default; 