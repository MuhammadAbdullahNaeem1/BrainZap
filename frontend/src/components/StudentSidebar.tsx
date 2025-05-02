// src/components/StudentSidebar.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const StudentSidebar: React.FC = () => {
  return (
    <div className="w-64 bg-gray-800 text-white p-6">
      <h2 className="text-xl font-bold mb-8">Student Dashboard</h2>
      <ul className="space-y-4">
        <li>
          <Link to="/student/dashboard" className="hover:text-blue-400">Dashboard</Link>
        </li>
        <li>
          <Link to="/student/results" className="hover:text-blue-400">My Results</Link>
        </li>
        <li>
          <Link to="/student/practice" className="hover:text-blue-400">Practice Mode</Link>
        </li>
      </ul>
    </div>
  );
};

export default StudentSidebar;
