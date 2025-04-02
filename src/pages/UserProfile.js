import React from 'react';
import { Link } from 'react-router-dom';

const UserProfile: React.FC = () => {
  return (
    <div>
      {/* Existing code */}
      <Link to="/workout-management" className="text-blue-500 hover:text-blue-700">
        Gestisci Allenamenti
      </Link>
      <Link to="/statistics" className="text-blue-500 hover:text-blue-700">
        Statistiche Allenamenti
      </Link>
      {/* Existing code */}
    </div>
  );
};

export default UserProfile; 