import { createClient } from '@supabase/supabase-js';

// Inserisci il tuo URL e la tua chiave API di Supabase
const supabaseUrl = 'https://onnxhzxrsdselcdnktyr.supabase.co'; // Sostituisci con il tuo URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ubnhoenhyc2RzZWxjZG5rdHlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1Mzk3MTksImV4cCI6MjA1OTExNTcxOX0.pShSWCBEttrRN539tMG05Eb8eTFg00Z2hDYM-Eb_jX4'; // Sostituisci con la tua chiave API

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
