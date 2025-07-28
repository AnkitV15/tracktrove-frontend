import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Card, Button, Input, Select } from '../components/common/UI';

function AdminPanel() {
  const { navigateTo } = useContext(AppContext);
  const [vendorId, setVendorId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [channel, setChannel] = useState('WEB');
  const [initialPayload, setInitialPayload] = useState('{}'); // Default to empty JSON
  const [simulatedSuccessRate, setSimulatedSuccessRate] = useState(0.8); // Default 80%
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleInitiateTransaction = async () => {
    setLoading(true);
    setMessage('');
    setMessageType('');
    try {
      const payload = {
        vendorId: vendorId || generateUuid(), // Generate if not provided
        amount: parseFloat(amount),
        currency,
        channel,
        initialPayloadJson: initialPayload,
        simulatedSuccessRate: parseFloat(simulatedSuccessRate),
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
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const newTxn = await response.json();
      setMessage(`Transaction initiated successfully! ID: ${newTxn.id.substring(0, 8)}... Status: ${newTxn.currentStatus.replace(/_/g, ' ')}`);
      setMessageType('success');
      // Optionally clear form or navigate
      setAmount('');
      setInitialPayload('{}');
      setSimulatedSuccessRate(0.8);
    } catch (e) {
      setMessage("Failed to initiate transaction. Please ensure your backend is running at http://localhost:8080 and CORS is configured correctly. Error: " + e.message);
      setMessageType('error');
      console.error("Initiate transaction error:", e);
    } finally {
      setLoading(false);
    }
  };

  // Helper to generate a UUID (for vendorId if not provided)
  const generateUuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  return (
    <div className="p-8 space-y-8">
      <h2 className="text-3xl font-bold text-gray-900">Admin Panel</h2>

      {/* Initiate New Transaction */}
      <Card title="Initiate New Transaction" className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Vendor ID (Optional, auto-generated if empty)</label>
            <Input placeholder="e.g., a1b2c3d4-..." value={vendorId} onChange={(e) => setVendorId(e.target.value)} />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Amount</label>
            <Input type="number" placeholder="e.g., 150.75" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Currency</label>
            <Select value={currency} onChange={(e) => setCurrency(e.target.value)} options={[{value: 'INR', label: 'INR'}, {value: 'USD', label: 'USD'}, {value: 'EUR', label: 'EUR'}]} />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Channel</label>
            <Select value={channel} onChange={(e) => setChannel(e.target.value)} options={[{value: 'WEB', label: 'WEB'}, {value: 'MOBILE', label: 'MOBILE'}, {value: 'API', label: 'API'}]} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2">Initial Payload (JSON String)</label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-24 font-mono text-sm"
              placeholder='{"key": "value"}'
              value={initialPayload}
              onChange={(e) => setInitialPayload(e.target.value)}
            ></textarea>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Simulated Success Rate (0.0 - 1.0)</label>
            <Input type="number" step="0.01" min="0" max="1" value={simulatedSuccessRate} onChange={(e) => setSimulatedSuccessRate(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleInitiateTransaction} disabled={loading || !amount || !initialPayload} className="w-full bg-green-600 hover:bg-green-700">
          {loading ? 'Initiating...' : 'Initiate Transaction'}
        </Button>
        {message && (
          <div className={`mt-4 p-3 rounded-md text-center ${messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}
      </Card>

      {/* Failure Injector & Dispute Manager (Placeholders for now) */}
      <Card title="Advanced Controls" className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
        <p className="text-gray-600 mb-4">
          Features like "Simulate Webhook Failure" or "Dispute Manager" would require more specific backend APIs and complex UI,
          which are beyond the scope of this initial setup.
          However, you can use the "Force Manual Retry" button in the <Button onClick={() => navigateTo('explorer')} className="bg-indigo-500 hover:bg-indigo-600 text-xs">Transaction Explorer</Button> to manually trigger retries.
        </p>
        <p className="text-gray-600">
          The automatic retry mechanism is already active via the Quartz `RetryJob` for transactions that initially fail.
        </p>
      </Card>
    </div>
  );
}

export default AdminPanel;
