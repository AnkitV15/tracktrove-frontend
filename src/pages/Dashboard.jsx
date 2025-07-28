import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Card, Button } from '../components/common/UI';
import TimelineCarousel from '../components/TimelineCarousel'; // Import the new component

function Dashboard() {
  const { navigateTo } = useContext(AppContext);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8080/api/transactions');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Sort by createdAt descending to get most recent
        const sortedTransactions = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setTransactions(sortedTransactions);

        // Calculate summary
        const statusSummary = sortedTransactions.reduce((acc, txn) => {
          acc[txn.currentStatus] = (acc[txn.currentStatus] || 0) + 1;
          return acc;
        }, {});
        setSummary(statusSummary);
      } catch (e) {
        setError("Failed to fetch transactions. Please ensure your backend is running at http://localhost:8080 and CORS is configured correctly. Error: " + e.message);
        console.error("Failed to fetch transactions:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const handleViewTrace = (txnId) => {
    navigateTo('trace', txnId);
  };

  if (loading) return <div className="text-center text-gray-600">Loading dashboard...</div>;
  if (error) return <div className="text-center text-red-600">Error: {error}</div>;

  return (
    <div className="p-8 space-y-8">
      <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(summary).map(([status, count]) => (
          <Card key={status} title={status.replace(/_/g, ' ')} className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
            <p className="text-4xl font-extrabold text-blue-700">{count}</p>
          </Card>
        ))}
        {Object.keys(summary).length === 0 && (
            <p className="text-gray-500 col-span-full">No transactions found. Initiate one from the Admin Panel!</p>
        )}
      </div>

      {/* Recent Transactions Timeline Carousel */}
      <Card title="Recent Transactions Timeline" className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
        <TimelineCarousel
          transactions={transactions.slice(0, 5)} // Pass only the top 5 recent transactions
          onSelectTransaction={handleViewTrace}
        />
      </Card>

      {/* CTA Buttons */}
      <div className="flex justify-center space-x-4 pt-4">
        <Button onClick={() => navigateTo('admin')} className="bg-green-600 hover:bg-green-700">
          Start New Simulation
        </Button>
        <Button onClick={() => navigateTo('explorer')} className="bg-indigo-600 hover:bg-indigo-700">
          View All Transactions
        </Button>
      </div>
    </div>
  );
}

export default Dashboard;
