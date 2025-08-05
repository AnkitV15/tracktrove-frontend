import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import moment from 'moment';

// Custom hook for debouncing a value
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// AdminDashboard Component - Wrapped in React.memo for performance
const AdminDashboard = React.memo(({ transactions, fetchRecentTransactions, showMessage, loading }) => {
  const [transactionForm, setTransactionForm] = useState({
    vendorId: '', 
    amount: 405.75,
    currency: 'USD',
    channel: 'VISA',
    simulatedSuccessRate: 95,
    initialPayloadJson: '{"item":"Bag","price":4450.75,"quantity":1}',
  });
  
  const [simulationForm, setSimulationForm] = useState({
    numTransactions: 5,
  });

  const [injectorForm, setInjectorForm] = useState({
    transactionId: '',
  });

  const [disputeForm, setDisputeForm] = useState({
    transactionId: '',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [timelineStatus, setTimelineStatus] = useState(null);
  const [injectorIdError, setInjectorIdError] = useState(false);
  const [disputeIdError, setDisputeIdError] = useState(false);
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [animationInterval, setAnimationInterval] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Filter transactions based on search term and status filter
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(tx => (tx.currentStatus || 'UNKNOWN').toUpperCase() === statusFilter);
    }

    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.id.toLowerCase().includes(searchLower) ||
        tx.vendorId.toLowerCase().includes(searchLower)
      );
    }
    return filtered;
  }, [transactions, statusFilter, debouncedSearchTerm]);

  const handleTransactionFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setTransactionForm(prevState => ({
      ...prevState,
      [name]: value,
    }));
  }, []);
  
  const handleSimulationFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setSimulationForm(prevState => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  // A regex to validate a UUID string
  const isValidUUID = useCallback((uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }, []);
  
  // A function to generate a random UUID for demonstration purposes
  const generateRandomUUID = useCallback(() => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }, []);

  const fetchTimelineStatus = useCallback(async (transactionId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/transactions/${transactionId}/status`, {
        method: 'GET',
      });
      if (response.ok) {
        const statusResult = await response.text();
        setTimelineStatus(statusResult);
      } else {
        throw new Error('Failed to fetch transaction status.');
      }
    } catch (error) {
      console.error('Error fetching timeline status:', error);
      setTimelineStatus('UNKNOWN');
    }
  }, []);
  
  useEffect(() => {
    if (animationInterval) {
      clearInterval(animationInterval);
    }
    
    if (isModalOpen && selectedTransaction) {
      const interval = setInterval(() => {
        const now = Date.now();
        const createdAt = new Date(selectedTransaction.createdAt).getTime();
        const lastUpdatedAt = new Date(selectedTransaction.lastUpdatedAt || selectedTransaction.createdAt).getTime();
  
        let progress = 0;
        const totalDuration1 = 60 * 1000;
        const totalDuration2 = 5 * 60 * 1000;
  
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
          progress = 50;
        } else if (timelineStatus === 'SETTLED') {
          progress = 100;
        } else if (timelineStatus === 'DISPUTE_OPEN') {
          progress = 50;
        }
  
        setTimelineProgress(progress);
      }, 500);
  
      setAnimationInterval(interval);
    }

    return () => {
      if (animationInterval) {
        clearInterval(animationInterval);
        setAnimationInterval(null);
      }
    };
  }, [isModalOpen, selectedTransaction, timelineStatus, animationInterval],[]);

  const handleInitiateTransaction = useCallback(async (e) => {
    e.preventDefault();
    showMessage('Initiating transaction...', false);
    
    if (!isValidUUID(transactionForm.vendorId)) {
      showMessage('Invalid Vendor ID. Please enter a valid UUID.', false);
      return;
    }

    try {
      const payload = {
        ...transactionForm,
        amount: parseFloat(transactionForm.amount),
        simulatedSuccessRate: parseFloat(transactionForm.simulatedSuccessRate) / 100,
      };

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
        setTransactionForm({
          vendorId: '',
          amount: 405.75,
          currency: 'USD',
          channel: 'VISA',
          simulatedSuccessRate: 95,
          initialPayloadJson: '{"item":"Bag","price":4450.75,"quantity":1}',
        });
        fetchRecentTransactions();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to initiate transaction.');
      }
    } catch (error) {
      console.error('Error initiating transaction:', error);
      showMessage(`Error: ${error.message}`, false);
    }
  }, [transactionForm, fetchRecentTransactions, showMessage, isValidUUID]);
  
  const handleSimulateTransactions = useCallback(async (e) => {
    e.preventDefault();
    const num = parseInt(simulationForm.numTransactions, 10);
    if (isNaN(num) || num <= 0) {
      showMessage('Please enter a valid number of transactions to simulate.', false);
      return;
    }

    showMessage(`Starting simulation for ${num} transactions...`, false);
    const currencies = ['USD', 'EUR', 'GBP'];
    const channels = ['VISA', 'MASTERCARD', 'AMEX', 'PAYPAL'];
    const products = ['Laptop', 'Smartphone', 'Headphones', 'Tablet', 'Monitor'];

    try {
      for (let i = 0; i < num; i++) {
        const vendorId = generateRandomUUID();
        const amount = (Math.random() * 1000 + 10).toFixed(2);
        const currency = currencies[Math.floor(Math.random() * currencies.length)];
        const channel = channels[Math.floor(Math.random() * channels.length)];
        const simulatedSuccessRate = Math.random() * 100;
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const initialPayloadJson = JSON.stringify({ item: product, price: amount, quantity: quantity });

        const payload = {
          vendorId,
          amount: parseFloat(amount),
          currency,
          channel,
          simulatedSuccessRate,
          initialPayloadJson
        };

        const response = await fetch('http://localhost:8080/api/transactions/initiate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to initiate transaction ${i + 1}: ${errorData.message || 'Unknown error'}`);
        }
      }
      showMessage(`${num} transactions initiated successfully!`, true);
      setSimulationForm({ numTransactions: 5 });
      fetchRecentTransactions();
    } catch (error) {
      console.error('Error during simulation:', error);
      showMessage(`Error during simulation: ${error.message}`, false);
    }
  }, [simulationForm, fetchRecentTransactions, showMessage, generateRandomUUID]);

  const handleInjectFailure = useCallback(async (failureType) => {
    if (!isValidUUID(injectorForm.transactionId)) {
      showMessage('Invalid Transaction ID. Please enter a valid UUID.', false);
      setInjectorIdError(true);
      return;
    }
    setInjectorIdError(false);
    showMessage(`Injecting ${failureType} failure...`, false);

    try {
      const response = await fetch(`http://localhost:8080/api/transactions/${injectorForm.transactionId}/inject-failure`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ failureType }),
      });

      if (response.ok) {
        showMessage(`Successfully injected ${failureType} failure into transaction ${injectorForm.transactionId}.`, true);
        fetchRecentTransactions();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to inject failure.');
      }
    } catch (error) {
      console.error('Error injecting failure:', error);
      showMessage(`Error: ${error.message}`, false);
    }
  }, [injectorForm, fetchRecentTransactions, showMessage, isValidUUID]);

  const handleDisputeAction = useCallback(async (action) => {
    if (!isValidUUID(disputeForm.transactionId)) {
      showMessage('Invalid Transaction ID. Please enter a valid UUID.', false);
      setDisputeIdError(true);
      return;
    }
    setDisputeIdError(false);
    showMessage(`${action === 'open' ? 'Opening' : 'Resolving'} dispute for transaction ${disputeForm.transactionId}...`, false);

    try {
      const response = await fetch(`http://localhost:8080/api/transactions/${disputeForm.transactionId}/${action}-dispute`, {
        method: 'PATCH',
      });

      if (response.ok) {
        showMessage(`Successfully ${action === 'open' ? 'opened' : 'resolved'} dispute for transaction ${disputeForm.transactionId}.`, true);
        fetchRecentTransactions();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${action} dispute.`);
      }
    } catch (error) {
      console.error(`Error ${action}ing dispute:`, error);
      showMessage(`Error: ${error.message}`, false);
    }
  }, [disputeForm, fetchRecentTransactions, showMessage, isValidUUID]);
  
  const handleTransactionClick = useCallback((tx) => {
    setSelectedTransaction(tx);
    fetchTimelineStatus(tx.id);
    setIsModalOpen(true);
  }, [fetchTimelineStatus]);
  
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
    setTimelineStatus(null);
    setTimelineProgress(0);
    if (animationInterval) {
      clearInterval(animationInterval);
      setAnimationInterval(null);
    }
  }, [animationInterval]);

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'INITIATED':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'DISPUTE_OPEN':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'DISPUTE_RESOLVED':
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'FAILED':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'SETTLED':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'ESCROW':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
  }, []);

  const getTimelineColor = useCallback((currentStatus, stage) => {
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
    
    if (statusMap[currentStatus] >= stageMap[stage]) {
      return 'bg-indigo-500 text-white';
    }
    return 'bg-slate-600 text-slate-400';
  }, []);

  const cardBaseClasses = "bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl shadow-black/20";
  const inputClasses = "w-full rounded-md bg-slate-700 border-slate-600 text-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition duration-150 ease-in-out";
  const labelClasses = "block text-sm font-medium text-slate-300 mb-1";
  const buttonBaseClasses = "w-full py-3 px-6 text-white rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 font-semibold";

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 lg:items-start">
      {/* Left Column */}
      <div className="lg:col-span-1 flex flex-col gap-8">
        {/* Simulation Manager Section */}
        <section className={cardBaseClasses}>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 mb-4">🤖 Simulation Manager</h2>
            <form onSubmit={handleSimulateTransactions} className="space-y-4">
              <div>
                <label htmlFor="numTransactions" className={labelClasses}>Number of Transactions</label>
                <input type="number" id="numTransactions" name="numTransactions" value={simulationForm.numTransactions} onChange={handleSimulationFormChange} min="1" required className={inputClasses} />
              </div>
              <button type="submit" className={`${buttonBaseClasses} bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700`}>
                Start Simulation
              </button>
            </form>
          </div>
        </section>

        {/* Failure Injector Section */}
        <section className={cardBaseClasses}>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-400 mb-4">🧪 Failure Injector</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="injectorTransactionId" className={labelClasses}>Transaction ID to Modify</label>
                <input type="text" id="injectorTransactionId" name="transactionId" value={injectorForm.transactionId} onChange={(e) => { setInjectorForm({ transactionId: e.target.value }); setInjectorIdError(false); }} placeholder="Enter Transaction UUID" className={`${inputClasses} ${injectorIdError ? 'border-red-500 ring-red-500' : 'focus:border-red-500 focus:ring-red-500'}`} />
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <button onClick={() => handleInjectFailure('WEBHOOK_FAIL')} className={`${buttonBaseClasses} bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600`}>
                  Webhook Fail
                </button>
                <button onClick={() => handleInjectFailure('TTL_EXPIRE')} className={`${buttonBaseClasses} bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600`}>
                  TTL Expiry
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Dispute Manager Section */}
        <section className={cardBaseClasses}>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mb-4">⚖️ Dispute Manager</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="disputeTransactionId" className={labelClasses}>Transaction ID to Manage</label>
                <input type="text" id="disputeTransactionId" name="transactionId" value={disputeForm.transactionId} onChange={(e) => { setDisputeForm({ transactionId: e.target.value }); setDisputeIdError(false); }} placeholder="Enter Transaction UUID" className={`${inputClasses} ${disputeIdError ? 'border-amber-500 ring-amber-500' : 'focus:border-amber-500 focus:ring-amber-500'}`} />
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <button onClick={() => handleDisputeAction('open')} className={`${buttonBaseClasses} bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600`}>
                  Open Dispute
                </button>
                <button onClick={() => handleDisputeAction('resolve')} className={`${buttonBaseClasses} bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600`}>
                  Resolve Dispute
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Middle Column */}
      <div className="lg:col-span-1 flex flex-col gap-8">
        {/* Transaction Initiator Section */}
        <section className={`${cardBaseClasses}`}>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400 mb-4">🚀 Initiate New Transaction</h2>
            <form onSubmit={handleInitiateTransaction} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="vendorId" className={labelClasses}>Vendor ID</label>
                  <input type="text" id="vendorId" name="vendorId" value={transactionForm.vendorId} onChange={handleTransactionFormChange} placeholder="Enter Vendor ID (UUID)" required className={inputClasses} />
                </div>
                <div>
                  <label htmlFor="amount" className={labelClasses}>Amount</label>
                  <input type="number" id="amount" name="amount" value={transactionForm.amount} onChange={handleTransactionFormChange} step="0.01" required className={inputClasses} />
                </div>
                <div>
                  <label htmlFor="currency" className={labelClasses}>Currency</label>
                  <input type="text" id="currency" name="currency" value={transactionForm.currency} onChange={handleTransactionFormChange} required className={inputClasses} />
                </div>
                <div>
                  <label htmlFor="channel" className={labelClasses}>Channel</label>
                  <input type="text" id="channel" name="channel" value={transactionForm.channel} onChange={handleTransactionFormChange} required className={inputClasses} />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="simulatedSuccessRate" className={labelClasses}>Simulated Success Rate (%)</label>
                  <input type="number" id="simulatedSuccessRate" name="simulatedSuccessRate" value={transactionForm.simulatedSuccessRate} onChange={handleTransactionFormChange} min="0" max="100" required className={inputClasses} />
                </div>
              </div>
              <div>
                <label htmlFor="initialPayloadJson" className={labelClasses}>Initial Payload (JSON String)</label>
                <textarea id="initialPayloadJson" name="initialPayloadJson" value={transactionForm.initialPayloadJson} onChange={handleTransactionFormChange} rows="6" required className={`${inputClasses} font-mono`} ></textarea>
              </div>
              <button type="submit" className={`${buttonBaseClasses} bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700`}>
                Initiate Transaction
              </button>
            </form>
          </div>
        </section>
      </div>

      {/* Right Column */}
      <div className="lg:col-span-1 flex flex-col">
        {/* Recent Transactions Section */}
        <section className={`${cardBaseClasses} flex flex-col`}>
          <div className="p-6 pb-2 flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-100">📊 Recent Transactions</h2>
              <button onClick={fetchRecentTransactions} className="px-4 py-2 bg-slate-700/50 text-slate-200 rounded-lg shadow-lg hover:bg-slate-700 transition duration-300 ease-in-out font-semibold">
                Refresh
              </button>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
              <input type="text" placeholder="Search by ID or Vendor ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputClasses} flex-1`} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputClasses} w-full sm:w-1/3`} >
                <option value="ALL">All Statuses</option>
                <option value="INITIATED">Initiated</option>
                <option value="ESCROW">Escrow</option>
                <option value="SETTLED">Settled</option>
                <option value="FAILED">Failed</option>
                <option value="DISPUTE_OPEN">Dispute Open</option>
                <option value="DISPUTE_RESOLVED">Dispute Resolved</option>
                <option value="WEBHOOK_FAIL">Webhook Failed</option>
                <option value="TTL_EXPIRE">TTL Expired</option>
              </select>
            </div>
          </div>
          <div className="space-y-3 p-6 pt-2 overflow-y-auto max-h-[calc(100vh-22rem)]">
            {loading ? (
              <div className="text-slate-400 text-center mt-8">Loading transactions...</div>
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions.map(tx => (
                <div key={tx.id} className="bg-slate-900/70 p-4 rounded-xl shadow-lg border border-slate-700 hover:bg-slate-800/90 transition-colors duration-200 cursor-pointer" onClick={() => handleTransactionClick(tx)} >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-indigo-400 font-mono">ID: {tx.id.substring(0, 8)}...</span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(tx.status || 'UNKNOWN')}`}>
                      {tx.status ? tx.status.toUpperCase() : 'UNKNOWN'}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-slate-100">
                    {tx.currency} {tx.amount}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-mono">{tx.vendorId.substring(0,8)}... via {tx.channel}</p>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-center mt-8">No recent transactions matching your criteria.</div>
            )}
          </div>
        </section>
      </div>
      
      {/* Transaction Details Modal */}
      {isModalOpen && selectedTransaction && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 w-full max-w-2xl transform scale-100 transition-transform duration-300 ease-in-out">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-3xl font-bold text-slate-100">Transaction Details</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white text-4xl">
                &times;
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-lg">
                <span className="text-lg font-semibold text-slate-300">Transaction ID:</span>
                <span className="text-lg font-mono text-indigo-400">{selectedTransaction.id}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-lg">
                <span className="text-lg font-semibold text-slate-300">Vendor ID:</span>
                <span className="text-lg font-mono text-slate-100">{selectedTransaction.vendorId}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <span className="block text-sm font-medium text-slate-300">Amount:</span>
                  <span className="block text-xl font-bold text-slate-100 mt-1">{selectedTransaction.currency} {selectedTransaction.amount}</span>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <span className="block text-sm font-medium text-slate-300">Channel:</span>
                  <span className="block text-xl font-bold text-slate-100 mt-1">{selectedTransaction.channel}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
              <h4 className="text-xl font-bold text-slate-200 mb-4">Transaction Timeline</h4>
              {timelineStatus === null ? (
                <div className="text-center text-slate-400 py-4">Loading timeline status...</div>
              ) : (
                <div className="flex justify-between items-center relative">
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-700 -z-10">
                    <div className="h-full bg-indigo-500 transition-all duration-500 ease-out rounded-full" style={{ width: `${timelineProgress}%` }} ></div>
                  </div>
                  {['INITIATED', 'ESCROW', 'SETTLED'].map((stage, index) => (
                    <div key={stage} className="flex flex-col items-center z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${getTimelineColor(timelineStatus, stage)} ${getTimelineColor(timelineStatus, stage).includes('bg-indigo') ? 'scale-110 shadow-lg shadow-indigo-500/30' : ''}`}>
                        {index + 1}
                      </div>
                      <span className="text-sm mt-2 text-center sm:text-sm text-slate-300">{stage.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <pre className="mt-6 p-4 bg-slate-900 border border-slate-700 text-emerald-300 rounded-lg text-sm overflow-x-auto font-mono">
              {JSON.stringify(selectedTransaction, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
});

export default AdminDashboard;


// AnalyticsDashboard Component - Wrapped in React.memo for performance
export const AnalyticsDashboard = React.memo(({ transactions }) => {
  const analyticsData = useMemo(() => {
    const statusCountsMap = transactions.reduce((acc, tx) => {
      const status = tx.currentStatus || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    const statusCounts = Object.keys(statusCountsMap).map(status => ({ status, count: statusCountsMap[status] }));

    const channelDistributionMap = transactions.reduce((acc, tx) => {
      const channel = tx.channel || 'UNKNOWN';
      acc[channel] = (acc[channel] || 0) + 1;
      return acc;
    }, {});
    const channelDistribution = Object.keys(channelDistributionMap).map(channel => ({ channel, count: channelDistributionMap[channel] }));

    const timeSeriesMap = transactions.reduce((acc, tx) => {
      const date = moment(tx.createdAt).format('YYYY-MM-DD');
      if (!acc[date]) {
        acc[date] = { timestamp: date, volume: 0 };
      }
      acc[date].volume += 1;
      return acc;
    }, {});
    const timeSeries = Object.values(timeSeriesMap).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return { statusCounts, channelDistribution, timeSeries };
  }, [transactions]);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f', '#ffbb28', '#ff8042'];
  const cardBaseClasses = "bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl shadow-black/20";

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-4xl font-bold text-slate-100 mb-8 text-center">Interactive Analytics</h2>
      {transactions.length === 0 ? (
        <div className="text-slate-400 text-center py-16">No transactions available to generate analytics.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className={cardBaseClasses}>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-slate-100 mb-4">Transactions by Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.statusCounts} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="status" tick={{ fill: '#9ca3af' }} />
                  <YAxis tick={{ fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1' }} cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }} />
                  <Legend wrapperStyle={{ color: '#e2e8f0' }} />
                  <Bar dataKey="count" fill="url(#colorUv)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={cardBaseClasses}>
            <div className="p-6 flex flex-col items-center">
              <h3 className="text-xl font-semibold text-slate-100 mb-4">Transactions by Channel</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={analyticsData.channelDistribution} dataKey="count" nameKey="channel" cx="50%" cy="50%" outerRadius={120} fill="#8884d8" labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => { const RADIAN = Math.PI / 180; const radius = innerRadius + (outerRadius - innerRadius) * 0.5; const x = cx + radius * Math.cos(-midAngle * RADIAN); const y = cy + radius * Math.sin(-midAngle * RADIAN); return (<text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={14}>{`${(percent * 100).toFixed(0)}%`}</text>);}} >
                    {analyticsData.channelDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1' }} />
                  <Legend wrapperStyle={{ color: '#e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`${cardBaseClasses} lg:col-span-2`}>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-slate-100 mb-4">Transaction Volume Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.timeSeries} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="timestamp" tick={{ fill: '#9ca3af' }} />
                  <YAxis tick={{ fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1' }} cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }} />
                  <Legend wrapperStyle={{ color: '#e2e8f0' }} />
                  <Line type="monotone" dataKey="volume" stroke="#82ca9d" strokeWidth={2} activeDot={{ r: 8 }} dot={{ stroke: '#82ca9d', strokeWidth: 1, r: 4, fill: '#82ca9d' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2}/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
});