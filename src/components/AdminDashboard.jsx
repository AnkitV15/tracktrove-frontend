import React, { useState, useEffect } from 'react';

// Main component for the Admin Dashboard
export default function AdminDashboard() {
  const [transactionForm, setTransactionForm] = useState({
    vendorId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    amount: 405.75,
    currency: 'USD',
    channel: 'VISA',
    simulatedSuccessRate: 95,
    initialPayloadJson: '{"item":"Bag","price":4450.75,"quantity":1}',
  });
  
  const [injectorForm, setInjectorForm] = useState({
    transactionId: '',
  });

  const [disputeForm, setDisputeForm] = useState({
    transactionId: '',
  });

  const [transactions, setTransactions] = useState([]);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Function to handle form changes for the transaction form
  const handleTransactionFormChange = (e) => {
    const { name, value } = e.target;
    setTransactionForm(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Function to display messages to the user
  const showMessage = (msg, success) => {
    setMessage(msg);
    setIsSuccess(success);
    // Automatically clear the message after 5 seconds
    setTimeout(() => {
      setMessage('');
    }, 5000);
  };
  
  // Function to fetch recent transactions from the API
  const fetchRecentTransactions = async () => {
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
        setTransactions(Array.isArray(result) ? result : []); // Ensure the result is an array
        showMessage('Transactions loaded successfully!', true);
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
  };

  // Fetch transactions when the component mounts
  useEffect(() => {
    fetchRecentTransactions();
  }, []);

  // Function to handle new transaction submission using the new API endpoint
  const handleInitiateTransaction = async (e) => {
    e.preventDefault();
    setMessage('Initiating transaction...');
    setIsSuccess(false);

    try {
      const payload = {
        ...transactionForm,
        amount: parseFloat(transactionForm.amount),
        simulatedSuccessRate: parseFloat(transactionForm.simulatedSuccessRate) / 100, // API expects a decimal
      };

      // Updated API endpoint based on your feedback
      const response = await fetch('http://localhost:8080/api/transactions/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        showMessage(`Transaction initiated successfully! ID: ${result.id}`, true);
        // Reset the form to its default values
        setTransactionForm({
          vendorId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          amount: 405.75,
          currency: 'USD',
          channel: 'VISA',
          simulatedSuccessRate: 95,
          initialPayloadJson: '{"item":"Bag","price":4450.75,"quantity":1}',
        });
        fetchRecentTransactions(); // Refresh the list of transactions
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to initiate transaction.');
      }
    } catch (error) {
      console.error('Error initiating transaction:', error);
      showMessage(`Error: ${error.message}`, false);
    }
  };

  // Function to handle failure injection
  const handleInjectFailure = async (failureType) => {
    if (!injectorForm.transactionId) {
      showMessage('Please enter a Transaction ID to inject a failure.', false);
      return;
    }
    setMessage(`Injecting ${failureType} failure...`);
    setIsSuccess(false);

    try {
      const response = await fetch(`http://localhost:8080/api/transactions/${injectorForm.transactionId}/inject-failure`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ failureType }),
      });

      if (response.ok) {
        showMessage(`Successfully injected ${failureType} failure into transaction ${injectorForm.transactionId}.`, true);
        fetchRecentTransactions(); // Refresh the list of transactions
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to inject failure.');
      }
    } catch (error) {
      console.error('Error injecting failure:', error);
      showMessage(`Error: ${error.message}`, false);
    }
  };

  // Function to handle dispute management
  const handleDisputeAction = async (action) => {
    if (!disputeForm.transactionId) {
      showMessage('Please enter a Transaction ID to manage disputes.', false);
      return;
    }
    setMessage(`${action === 'open' ? 'Opening' : 'Resolving'} dispute for transaction ${disputeForm.transactionId}...`);
    setIsSuccess(false);

    try {
      const response = await fetch(`http://localhost:8080/api/transactions/${disputeForm.transactionId}/${action}-dispute`, {
        method: 'PATCH',
      });

      if (response.ok) {
        showMessage(`Successfully ${action === 'open' ? 'opened' : 'resolved'} dispute for transaction ${disputeForm.transactionId}.`, true);
        fetchRecentTransactions(); // Refresh the list of transactions
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${action} dispute.`);
      }
    } catch (error) {
      console.error(`Error ${action}ing dispute:`, error);
      showMessage(`Error: ${error.message}`, false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'INITIATED':
        return 'bg-yellow-500 text-black';
      case 'DISPUTE_OPEN':
        return 'bg-amber-500 text-white';
      case 'DISPUTE_RESOLVED':
        return 'bg-green-500 text-white';
      case 'FAILED':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="flex bg-gray-100 min-h-screen font-sans text-gray-800">
      {/* Sidebar */}
      <aside className="w-1/4 bg-gray-800 text-white p-6 shadow-2xl overflow-y-auto hidden md:block">
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold text-white">Live Feed</h2>
            <button
              onClick={fetchRecentTransactions}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition duration-300 ease-in-out font-semibold"
            >
              Refresh
            </button>
          </div>
          <p className="text-sm text-gray-400 mb-6">Recent Transactions</p>
          <div className="flex-grow space-y-4">
            {loading ? (
              <div className="text-gray-400 text-center mt-8">Loading transactions...</div>
            ) : transactions.length > 0 ? (
              transactions.map(tx => (
                <div key={tx.id} className="bg-gray-700 p-4 rounded-xl shadow-lg border border-gray-600 hover:bg-gray-600 transition-colors duration-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-indigo-400">ID: {tx.id.substring(0, 8)}...</span>
                    {/* Added a check to prevent the TypeError */}
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${getStatusColor(tx.status || 'UNKNOWN')}`}>
                      {tx.status ? tx.status.toUpperCase() : 'UNKNOWN'}
                    </span>
                  </div>
                  <p className="text-lg font-bold">
                    {tx.currency} {tx.amount}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{tx.vendorId.substring(0,8)}... via {tx.channel}</p>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-center mt-8">No recent transactions.</div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Admin Dashboard</h1>

          {/* Status/Message Box */}
          {message && (
            <div className={`p-4 mb-6 rounded-lg font-medium text-lg ${isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}

          {/* Transaction Initiator Section */}
          <section className="bg-white shadow-xl rounded-2xl p-6 mb-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🚀 Initiate New Transaction</h2>
            <form onSubmit={handleInitiateTransaction} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="vendorId" className="block text-sm font-medium text-gray-700 mb-1">Vendor ID</label>
                  <input
                    type="text"
                    id="vendorId"
                    name="vendorId"
                    value={transactionForm.vendorId}
                    onChange={handleTransactionFormChange}
                    required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition duration-150 ease-in-out"
                  />
                </div>
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={transactionForm.amount}
                    onChange={handleTransactionFormChange}
                    step="0.01"
                    required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition duration-150 ease-in-out"
                  />
                </div>
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <input
                    type="text"
                    id="currency"
                    name="currency"
                    value={transactionForm.currency}
                    onChange={handleTransactionFormChange}
                    required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition duration-150 ease-in-out"
                  />
                </div>
                <div>
                  <label htmlFor="channel" className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                  <input
                    type="text"
                    id="channel"
                    name="channel"
                    value={transactionForm.channel}
                    onChange={handleTransactionFormChange}
                    required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition duration-150 ease-in-out"
                  />
                </div>
                <div>
                  <label htmlFor="simulatedSuccessRate" className="block text-sm font-medium text-gray-700 mb-1">Simulated Success Rate (%)</label>
                  <input
                    type="number"
                    id="simulatedSuccessRate"
                    name="simulatedSuccessRate"
                    value={transactionForm.simulatedSuccessRate}
                    onChange={handleTransactionFormChange}
                    min="0"
                    max="100"
                    required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition duration-150 ease-in-out"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="initialPayloadJson" className="block text-sm font-medium text-gray-700 mb-1">Initial Payload (JSON String)</label>
                <textarea
                  id="initialPayloadJson"
                  name="initialPayloadJson"
                  value={transactionForm.initialPayloadJson}
                  onChange={handleTransactionFormChange}
                  rows="6"
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono transition duration-150 ease-in-out"
                ></textarea>
              </div>
              
              <button
                type="submit"
                className="w-full py-3 px-6 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 font-semibold"
              >
                Initiate Transaction
              </button>
            </form>
          </section>

          {/* Failure Injector Section */}
          <section className="bg-white shadow-xl rounded-2xl p-6 mb-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🧪 Failure Injector</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="injectorTransactionId" className="block text-sm font-medium text-gray-700 mb-1">Transaction ID to Modify</label>
                <input
                  type="text"
                  id="injectorTransactionId"
                  name="transactionId"
                  value={injectorForm.transactionId}
                  onChange={(e) => setInjectorForm({ transactionId: e.target.value })}
                  placeholder="Enter Transaction UUID"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 transition duration-150 ease-in-out"
                />
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => handleInjectFailure('WEBHOOK_FAIL')}
                  className="flex-1 py-3 px-6 bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 font-semibold"
                >
                  Inject Webhook Failure
                </button>
                <button
                  onClick={() => handleInjectFailure('TTL_EXPIRE')}
                  className="flex-1 py-3 px-6 bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 font-semibold"
                >
                  Inject TTL Expiry
                </button>
              </div>
            </div>
          </section>

          {/* Dispute Manager Section */}
          <section className="bg-white shadow-xl rounded-2xl p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">⚖️ Dispute Manager</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="disputeTransactionId" className="block text-sm font-medium text-gray-700 mb-1">Transaction ID to Manage</label>
                <input
                  type="text"
                  id="disputeTransactionId"
                  name="transactionId"
                  value={disputeForm.transactionId}
                  onChange={(e) => setDisputeForm({ transactionId: e.target.value })}
                  placeholder="Enter Transaction UUID"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 transition duration-150 ease-in-out"
                />
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => handleDisputeAction('open')}
                  className="flex-1 py-3 px-6 bg-amber-500 text-white rounded-xl shadow-lg hover:bg-amber-600 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 font-semibold"
                >
                  Open Dispute
                </button>
                <button
                  onClick={() => handleDisputeAction('resolve')}
                  className="flex-1 py-3 px-6 bg-green-500 text-white rounded-xl shadow-lg hover:bg-green-600 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 font-semibold"
                >
                  Resolve Dispute
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
