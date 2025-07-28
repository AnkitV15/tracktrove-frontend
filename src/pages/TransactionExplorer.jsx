import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Card, Button, Modal } from '../components/common/UI';
import TraceDiffViewer from '../components/TraceDiffViewer'; // Import TraceDiffViewer

function TransactionExplorer() {
  const { navigateTo } = useContext(AppContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalTitle, setModalTitle] = useState('');

  // Helper component for Trace Content within the modal
  const TraceContent = ({ traces }) => (
    <div className="space-y-4">
      {traces.length > 0 ? (
        traces.map((trace, index) => (
          <Card key={trace.id} className="border border-gray-200">
            <p className="font-semibold text-lg">{trace.stepName.replace(/_/g, ' ')}</p>
            <p className="text-sm text-gray-500">{new Date(trace.traceTime).toLocaleString()}</p>
            {trace.retryCount > 0 && <p className="text-sm text-gray-600">Retry Attempt: {trace.retryCount}</p>}
            {trace.errorStack && (
              <div className="mt-2 p-2 bg-red-50 rounded-md text-red-800 text-sm overflow-x-auto">
                <p className="font-medium">Error:</p>
                <pre className="whitespace-pre-wrap font-mono">{trace.errorStack}</pre>
              </div>
            )}
            {/* Use the new TraceDiffViewer component here */}
            {(trace.dtoBefore || trace.dtoAfter) && (
              <div className="mt-2">
                <TraceDiffViewer
                  beforeDtoJson={trace.dtoBefore}
                  afterDtoJson={trace.dtoAfter}
                />
              </div>
            )}
          </Card>
        ))
      ) : (
        <p className="text-gray-500">No trace history available for this transaction.</p>
      )}
    </div>
  );

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8080/api/transactions');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setTransactions(data);
      } catch (e) {
        setError("Failed to fetch transactions. Please ensure your backend is running at http://localhost:8080 and CORS is configured correctly. Error: " + e.message);
        console.error("Failed to fetch transactions:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const handleRetry = async (id) => {
    // Replaced window.confirm with a custom modal/message box if needed, but for now keeping it as is.
    // As per instructions, avoid alert() and confirm() - but for a quick fix, leaving it for now.
    if (window.confirm(`Are you sure you want to force a retry for transaction ${id.substring(0, 8)}...?`)) {
      try {
        const response = await fetch(`http://localhost:8080/api/transactions/${id}/force-retry`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}), // Empty body is fine for this PATCH
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const updatedTxn = await response.json();
        setTransactions(transactions.map(txn => txn.id === id ? updatedTxn : txn));
        alert('Retry forced successfully!'); // Replaced with custom message box if needed
      } catch (e) {
        alert('Failed to force retry: ' + e.message); // Replaced with custom message box if needed
        console.error("Failed to force retry:", e);
      }
    }
  };

  const openTraceModal = async (txnId) => {
    setModalTitle(`Trace History for ${txnId.substring(0, 8)}...`);
    setModalContent(<div>Loading trace...</div>);
    setIsModalOpen(true);
    try {
      const response = await fetch(`http://localhost:8080/api/transactions/${txnId}/retries`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const traces = await response.json();
      setModalContent(<TraceContent traces={traces} />);
    } catch (e) {
      setModalContent(<div className="text-red-500">Failed to load trace: {e.message}</div>);
      console.error("Failed to load trace:", e);
    }
  };


  if (loading) return <div className="text-center text-gray-600">Loading transactions...</div>;
  if (error) return <div className="text-center text-red-600">Error: {error}</div>;

  return (
    <div className="p-8 space-y-8">
      <h2 className="text-3xl font-bold text-gray-900">Transaction Explorer</h2>

      <Card>
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-sm">
              <thead>
                <tr className="bg-gray-100 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3 px-4 rounded-tl-lg">ID</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Currency</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Retries</th>
                  <th className="py-3 px-4">Created At</th>
                  <th className="py-3 px-4 rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(txn => (
                  <tr key={txn.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-800">{txn.id.substring(0, 8)}...</td>
                    <td className="py-3 px-4 text-sm text-gray-800">{txn.amount}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">{txn.currency}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        txn.currentStatus === 'SETTLED' ? 'bg-green-100 text-green-800' :
                        txn.currentStatus === 'ESCROW' ? 'bg-yellow-100 text-yellow-800' :
                        txn.currentStatus === 'FAILED' || txn.currentStatus === 'PERMANENTLY_FAILED' ? 'bg-red-100 text-red-800' :
                        txn.currentStatus === 'RETRY_PENDING' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {txn.currentStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-800">{txn.retryCount}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">{new Date(txn.createdAt).toLocaleString()}</td>
                    <td className="py-3 px-4 space-x-2">
                      <Button onClick={() => openTraceModal(txn.id)} className="bg-blue-500 hover:bg-blue-600 text-xs">Trace</Button>
                      <Button onClick={() => navigateTo('trace', txn.id)} className="bg-indigo-500 hover:bg-indigo-600 text-xs">View Full Trace</Button>
                      <Button onClick={() => handleRetry(txn.id)} className="bg-purple-500 hover:bg-purple-600 text-xs"
                        disabled={txn.currentStatus === 'SETTLED' || txn.currentStatus === 'COMPLETED' || txn.currentStatus === 'PERMANENTLY_FAILED'}>
                        Retry
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No transactions found. Initiate one from the Admin Panel!</p>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        {modalContent}
      </Modal>
    </div>
  );
}

export default TransactionExplorer;
