import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext'; // Import AppContext
import { Button } from './common/UI'; // Import Button from common UI

function Navbar() {
  const { navigateTo, currentPage } = useContext(AppContext); // Get navigateTo and currentPage from context

  const navItems = [
    { name: 'Dashboard', page: 'dashboard' },
    { name: 'Explorer', page: 'explorer' }, // Add Explorer to Navbar
    { name: 'Admin', page: 'admin' },
  ];

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-blue-700">TrackTrove</h1>
      <div className="space-x-4">
        {navItems.map((item) => (
          <Button
            key={item.page}
            onClick={() => navigateTo(item.page)}
            className={`
              ${currentPage === item.page ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
            `}
          >
            {item.name}
          </Button>
        ))}
      </div>
    </nav>
  );
}

export default Navbar;
