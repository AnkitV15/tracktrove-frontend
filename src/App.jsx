import React, { useContext } from 'react';
import { AppContext } from './context/AppContext'; // Import AppContext
import Navbar from './components/Navbar'; // Import Navbar
import Dashboard from './pages/Dashboard'; // Import Dashboard
import TransactionExplorer from './pages/TransactionExplorer'; // Import TransactionExplorer
import TraceViewer from './pages/TraceViewer'; // Import TraceViewer
import AdminPanel from './pages/AdminPanel'; // Import AdminPanel

function App() {
  const { currentPage } = useContext(AppContext); // Get currentPage from context

  // Render the current page based on currentPage state
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'explorer':
        return <TransactionExplorer />;
      case 'trace':
        return <TraceViewer />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <Dashboard />; // Fallback
    }
  };

  return (
    // Apply global layout classes directly to this div
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      {/* Navbar component for navigation */}
      <Navbar /> {/* Navbar will get navigate from its own context or props */}

      {/* Main Content Area */}
      <main className="container mx-auto py-8">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
