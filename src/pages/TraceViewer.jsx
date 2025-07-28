import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Card, Button } from '../components/common/UI';
import TraceDiffViewer from '../components/TraceDiffViewer'; // Import the new diff viewer component

function TraceViewer() {
  const { selectedTransactionId, navigateTo } = useContext(AppContext);
  const [transaction, setTransaction] = useState(null);
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastErrorStack, setLastErrorStack] = useState(null);

  useEffect(() => {
    if (!selectedTransactionId) {
      setError("No transaction selected for trace viewing.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch transaction details
        const txnResponse = await fetch(`http://localhost:8080/api/transactions/${selectedTransactionId}`);
        if (!txnResponse.ok) throw new Error(`Failed to fetch transaction details: ${txnResponse.status}`);
        const txnData = await txnResponse.json();
        setTransaction(txnData);

        // Fetch traces
        const tracesResponse = await fetch(`http://localhost:8080/api/transactions/${selectedTransactionId}/retries`);
        if (!tracesResponse.ok) throw new Error(`Failed to fetch traces: ${tracesResponse.status}`);
        const tracesData = await tracesResponse.json();
        setTraces(tracesData);

        // Fetch last error stack
        const errorStackResponse = await fetch(`http://localhost:8080/api/transactions/${selectedTransactionId}/error-stack`);
        if (errorStackResponse.ok) {
          const errorStackData = await errorStackResponse.text(); // text() because it's plain text
          setLastErrorStack(errorStackData);
        } else if (errorStackResponse.status === 404) {
          setLastErrorStack("No error stack found for this transaction.");
        } else {
          throw new Error(`Failed to fetch error stack: ${errorStackResponse.status}`);
        }

      } catch (e) {
        setError("Failed to load trace viewer data. Please ensure your backend is running at http://localhost:8080 and CORS is configured correctly. Error: " + e.message);
        console.error("TraceViewer fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedTransactionId]);

  if (!selectedTransactionId) {
    return (
      <div className="p-8 text-center text-gray-600">
        Please select a transaction from the <Button onClick={() => navigateTo('explorer')} className="bg-indigo-500 hover:bg-indigo-600">Transaction Explorer</Button> to view its trace.
      </div>
    );
  }

  if (loading) return <div className="text-center text-gray-600">Loading trace details...</div>;
  if (error) return <div className="text-center text-red-600">Error: {error}</div>;

  return (
    <div className="p-8 space-y-8">
      <h2 className="text-3xl font-bold text-gray-900">Trace Viewer</h2>
      <Button onClick={() => navigateTo('explorer')} className="bg-gray-500 hover:bg-gray-600 text-sm mb-4">
        &larr; Back to Explorer
      </Button>

      <Card title={`Transaction ID: ${transaction?.id.substring(0, 8)}...`} className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
        <p className="text-lg font-semibold">Current Status: <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            transaction?.currentStatus === 'SETTLED' ? 'bg-green-100 text-green-800' :
            transaction?.currentStatus === 'ESCROW' ? 'bg-yellow-100 text-yellow-800' :
            transaction?.currentStatus === 'FAILED' || transaction?.currentStatus === 'PERMANENTLY_FAILED' ? 'bg-red-100 text-red-800' :
            transaction?.currentStatus === 'RETRY_PENDING' ? 'bg-orange-100 text-orange-800' :
            'bg-gray-100 text-gray-800'
          }`}>
          {transaction?.currentStatus.replace(/_/g, ' ')}
        </span></p>
        <p className="text-md text-gray-700 mt-2">Amount: {transaction?.amount} {transaction?.currency}</p>
        <p className="text-md text-gray-700">Retries: {transaction?.retryCount}</p>
        <p className="text-md text-gray-700">Simulated Success Rate: {transaction?.simulatedSuccessRate * 100}%</p>
      </Card>

      <Card title="Last Error Stack" className="bg-red-50 border border-red-200">
        <pre className="whitespace-pre-wrap font-mono text-sm bg-red-100 p-4 rounded-md overflow-x-auto">{lastErrorStack}</pre>
      </Card>

      <Card title="Transaction Step Timeline" className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
        {traces.length > 0 ? (
          <div className="relative pl-8">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 rounded-full"></div>
            {traces.map((trace, index) => (
              <div key={trace.id} className="mb-6 relative">
                <div className="absolute left-[-11px] top-0 w-5 h-5 bg-blue-500 rounded-full border-2 border-white z-10"></div>
                <div className="ml-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                  <p className="font-semibold text-lg text-gray-800">{trace.stepName.replace(/_/g, ' ')}</p>
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
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No step traces available for this transaction.</p>
        )}
      </Card>
    </div>
  );
}

export default TraceViewer;
