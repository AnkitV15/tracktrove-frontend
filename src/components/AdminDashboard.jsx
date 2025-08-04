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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [timelineStatus, setTimelineStatus] = useState(null); // State for live timeline status
  const [injectorIdError, setInjectorIdError] = useState(false);
  const [disputeIdError, setDisputeIdError] = useState(false);
  const [timelineProgress, setTimelineProgress] = useState(0); // State for timeline animation
  const [animationInterval, setAnimationInterval] = useState(null);

  // A regex to validate a UUID string
  const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

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
        // Sort transactions in reverse chronological order (newest first)
        const sortedTransactions = Array.isArray(result) ? result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : [];
        setTransactions(sortedTransactions);
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

  // Function to fetch the live status of a single transaction for the timeline
  const fetchTimelineStatus = async (transactionId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/transactions/${transactionId}/status`, {
        method: 'GET',
      });
      if (response.ok) {
        const statusResult = await response.text(); // Status API returns plain text
        setTimelineStatus(statusResult);
      } else {
        throw new Error('Failed to fetch transaction status.');
      }
    } catch (error) {
      console.error('Error fetching timeline status:', error);
      setTimelineStatus('UNKNOWN');
    }
  };

  // Fetch transactions when the component mounts
  useEffect(() => {
    fetchRecentTransactions();
  }, []);

  // Effect to manage the timeline animation
  useEffect(() => {
    // Clear any existing interval to prevent multiple animations
    if (animationInterval) {
      clearInterval(animationInterval);
    }
    
    if (isModalOpen && selectedTransaction) {
      const interval = setInterval(() => {
        const now = Date.now();
        const createdAt = new Date(selectedTransaction.createdAt).getTime();
        const lastUpdatedAt = new Date(selectedTransaction.lastUpdatedAt || selectedTransaction.createdAt).getTime();

        let progress = 0;
        const totalDuration1 = 60 * 1000; // 1 minute for initiated -> escrow
        const totalDuration2 = 5 * 60 * 1000; // 5 minutes for escrow -> settled

        if (timelineStatus === 'INITIATED' && now >= createdAt) {
          const elapsedTime = now - createdAt;
          progress = Math.min(1, elapsedTime / totalDuration1) * 50;
        } else if (timelineStatus === 'ESCROW' && now >= lastUpdatedAt) {
          const elapsedTime = now - lastUpdatedAt;
          progress = 50 + Math.min(1, elapsedTime / totalDuration2) * 50;
        } else if (timelineStatus === 'SETTLED' || timelineStatus === 'FAILED' || timelineStatus === 'DISPUTE_RESOLVED') {
          progress = 100;
          clearInterval(interval);
        } else if (timelineStatus === 'ESCROW') {
          progress = 50; // Lock the progress at 50% if the transaction is in escrow but not yet settled
        } else if (timelineStatus === 'SETTLED') {
          progress = 100; // Lock the progress at 100%
        } else if (timelineStatus === 'DISPUTE_OPEN') {
          progress = 50;
        }

        setTimelineProgress(progress);
      }, 500); // Update every half second

      setAnimationInterval(interval);
    }

    return () => {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
    };
  }, [isModalOpen, selectedTransaction, timelineStatus]);

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
    // Validate UUID before sending
    if (!isValidUUID(injectorForm.transactionId)) {
      showMessage('Invalid Transaction ID. Please enter a valid UUID.', false);
      setInjectorIdError(true);
      return;
    }
    setInjectorIdError(false);

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
    // Validate UUID before sending
    if (!isValidUUID(disputeForm.transactionId)) {
      showMessage('Invalid Transaction ID. Please enter a valid UUID.', false);
      setDisputeIdError(true);
      return;
    }
    setDisputeIdError(false);

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
  
  // Function to handle clicking on a transaction in the sidebar
  const handleTransactionClick = (tx) => {
    setSelectedTransaction(tx);
    fetchTimelineStatus(tx.id); // Fetch the live status for the timeline
    setIsModalOpen(true);
  };
  
  // Function to close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
    setTimelineStatus(null); // Reset timeline status when closing
    setTimelineProgress(0); // Reset animation progress
    if (animationInterval) {
      clearInterval(animationInterval);
      setAnimationInterval(null);
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

  const getTimelineColor = (currentStatus, stage) => {
    // This function determines the color for the timeline blocks based on the live status
    const statusMap = {
      INITIATED: 1,
      ESCROW: 2,
      SETTLED: 3,
      DISPUTE_OPEN: 2,
      DISPUTE_RESOLVED: 3,
      FAILED: 1,
      UNKNOWN: 0
    };
    const stageMap = {
      INITIATED: 1,
      ESCROW: 2,
      SETTLED: 3
    };
    
    // Check if the current stage is reached or passed
    if (statusMap[currentStatus] >= stageMap[stage]) {
      return 'bg-indigo-600 text-white';
    }
    return 'bg-gray-200 text-gray-400';
  }

  return (
    // The main container is now a single column layout
    <div className="bg-gray-100 font-sans text-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Admin Dashboard</h1>

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
                onChange={(e) => {
                  setInjectorForm({ transactionId: e.target.value });
                  setInjectorIdError(false); // Clear error on change
                }}
                placeholder="Enter Transaction UUID"
                className={`w-full rounded-md shadow-sm transition duration-150 ease-in-out ${
                  injectorIdError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-red-500 focus:ring-red-500'
                }`}
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
        <section className="bg-white shadow-xl rounded-2xl p-6 border border-gray-200 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">⚖️ Dispute Manager</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="disputeTransactionId" className="block text-sm font-medium text-gray-700 mb-1">Transaction ID to Manage</label>
              <input
                type="text"
                id="disputeTransactionId"
                name="transactionId"
                value={disputeForm.transactionId}
                onChange={(e) => {
                  setDisputeForm({ transactionId: e.target.value });
                  setDisputeIdError(false); // Clear error on change
                }}
                placeholder="Enter Transaction UUID"
                className={`w-full rounded-md shadow-sm transition duration-150 ease-in-out ${
                  disputeIdError ? 'border-red-500 focus:border-amber-500 focus:ring-amber-500' : 'border-gray-300 focus:border-amber-500 focus:ring-amber-500'
                }`}
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

        {/* Recent Transactions Section (Moved from sidebar) */}
        <section className="bg-white shadow-xl rounded-2xl p-6 mb-8 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">📊 Recent Transactions</h2>
            <button
              onClick={fetchRecentTransactions}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition duration-300 ease-in-out font-semibold"
            >
              Refresh
            </button>
          </div>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {loading ? (
              <div className="text-gray-400 text-center mt-8">Loading transactions...</div>
            ) : transactions.length > 0 ? (
              transactions.map(tx => (
                <div 
                  key={tx.id} 
                  className="bg-gray-100 p-4 rounded-xl shadow-lg border border-gray-200 hover:bg-gray-200 transition-colors duration-200 cursor-pointer"
                  onClick={() => handleTransactionClick(tx)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-indigo-700">ID: {tx.id.substring(0, 8)}...</span>
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${getStatusColor(tx.status || 'UNKNOWN')}`}>
                      {tx.status ? tx.status.toUpperCase() : 'UNKNOWN'}
                    </span>
                  </div>
                  <p className="text-lg font-bold">
                    {tx.currency} {tx.amount}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{tx.vendorId.substring(0,8)}... via {tx.channel}</p>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center mt-8">No recent transactions.</div>
            )}
          </div>
        </section>
      </div>

      {/* Transaction Details Modal */}
      {isModalOpen && selectedTransaction && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl transform scale-100 transition-transform duration-300 ease-in-out">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-3xl font-bold text-gray-900">Transaction Details</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-900 text-4xl">
                &times;
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg">
                <span className="text-lg font-semibold text-gray-700">Transaction ID:</span>
                <span className="text-lg font-mono text-gray-900">{selectedTransaction.id}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg">
                <span className="text-lg font-semibold text-gray-700">Vendor ID:</span>
                <span className="text-lg font-mono text-gray-900">{selectedTransaction.vendorId}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <span className="block text-sm font-medium text-gray-700">Amount:</span>
                  <span className="block text-xl font-bold text-gray-900 mt-1">{selectedTransaction.currency} {selectedTransaction.amount}</span>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <span className="block text-sm font-medium text-gray-700">Channel:</span>
                  <span className="block text-xl font-bold text-gray-900 mt-1">{selectedTransaction.channel}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h4 className="text-xl font-bold text-gray-800 mb-4">Transaction Timeline</h4>
              {timelineStatus === null ? (
                <div className="text-center text-gray-500 py-4">Loading timeline status...</div>
              ) : (
                <div className="flex justify-between items-center relative">
                  {/* Progress bar animation */}
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-10">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-500 ease-out rounded-full"
                      style={{ width: `${timelineProgress}%` }}
                    ></div>
                  </div>
                  
                  {['INITIATED', 'ESCROW', 'SETTLED'].map((stage, index) => (
                    <div key={stage} className="flex flex-col items-center z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors duration-300 ${getTimelineColor(timelineStatus, stage)} ${getTimelineColor(timelineStatus, stage).includes('bg-indigo') ? 'scale-110 shadow-lg' : ''}`}>
                        {index + 1}
                      </div>
                      <span className="text-sm mt-2 text-center sm:text-sm">{stage.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <pre className="mt-6 p-4 bg-gray-800 text-green-300 rounded-lg text-sm overflow-x-auto font-mono">
              {JSON.stringify(selectedTransaction, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
