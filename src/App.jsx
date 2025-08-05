import React, { useState, useEffect, useCallback } from 'react';

// Correctly import the default and named exports
import AdminDashboard, { AnalyticsDashboard } from './components/AdminDashboard.jsx';

// Main App component that handles routing and layout
export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Function to display messages to the user, wrapped in useCallback
  const showMessage = useCallback((msg, success) => {
    setMessage(msg);
    setIsSuccess(success);
    setTimeout(() => {
      setMessage('');
    }, 5000);
  }, []);
  
  // Function to fetch recent transactions from the API, wrapped in useCallback
  const fetchRecentTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/transactions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const sortedTransactions = Array.isArray(result) ? result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : [];
        setTransactions(sortedTransactions);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch transactions.');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showMessage(`Error fetching transactions: ${error.message}`, false);
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  // Effect to re-fetch transactions on initial load
  useEffect(() => {
    fetchRecentTransactions();
  }, [fetchRecentTransactions]);

  return (
    <div className="bg-slate-900 font-sans text-slate-300 p-4 sm:p-8 min-h-screen">
      <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-900/50"></div>
      
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-extrabold text-slate-100 mb-4 text-center">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-sky-400">
            TrackTrove Admin Console
          </span>
        </h1>

        <nav className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-lg rounded-full p-2 mb-8 max-w-sm mx-auto sticky top-4 z-40">
          <ul className="flex justify-center space-x-2">
            <li>
              <button 
                onClick={() => setCurrentPage('dashboard')} 
                className={`font-semibold text-base py-2 px-6 rounded-full transition-all duration-300 ${currentPage === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700/50'}`}
              >
                Dashboard
              </button>
            </li>
            <li>
              <button 
                onClick={() => setCurrentPage('analytics')} 
                className={`font-semibold text-base py-2 px-6 rounded-full transition-all duration-300 ${currentPage === 'analytics' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700/50'}`}
              >
                Analytics
              </button>
            </li>
          </ul>
        </nav>

        {message && (
          <div className={`p-4 mb-6 rounded-lg font-medium text-lg max-w-4xl mx-auto border ${isSuccess ? 'bg-green-900/50 text-green-300 border-green-500/30' : 'bg-red-900/50 text-red-300 border-red-500/30'}`}>
            {message}
          </div>
        )}
        
        {currentPage === 'dashboard' ? (
          <AdminDashboard 
            transactions={transactions}
            fetchRecentTransactions={fetchRecentTransactions}
            showMessage={showMessage}
            loading={loading}
          />
        ) : (
          <AnalyticsDashboard transactions={transactions} />
        )}
      </div>
    </div>
  );
}