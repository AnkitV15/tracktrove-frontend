import React, { useState, useEffect } from 'react';
import { Card } from './common/UI'; // Assuming Card is imported from common UI

// Helper function for status colors - moved outside to be accessible by both components
const getStatusColorClass = (stepName) => {
  switch (stepName) {
    case 'INITIATED':
      return 'bg-blue-500';
    case 'INITIAL_FAILURE':
    case 'RETRIED_FAILURE':
    case 'RETRY_LIMIT_EXCEEDED':
    case 'RETRY_EXCEPTION':
      return 'bg-red-500';
    case 'ESCROW':
      return 'bg-yellow-500';
    case 'RETRIED_SUCCESS':
    case 'COMPLETED':
    case 'SETTLED':
      return 'bg-green-500';
    case 'RETRY_PENDING':
      return 'bg-orange-500';
    case 'PERMANENTLY_FAILED': // Ensure this is also handled
      return 'bg-red-700';
    default:
      return 'bg-gray-500';
  }
};


// A simple component to display a single timeline item
const TimelineItem = ({ trace }) => {
  // Use the external getStatusColorClass helper
  const colorClass = getStatusColorClass(trace.stepName);

  return (
    <div className="flex items-center space-x-4">
      <div className={`w-3 h-3 rounded-full ${colorClass} flex-shrink-0`}></div>
      <div>
        <p className="font-semibold text-gray-800">{trace.stepName.replace(/_/g, ' ')}</p>
        <p className="text-sm text-gray-500">{new Date(trace.traceTime).toLocaleString()}</p>
        {trace.errorStack && (
          <p className="text-xs text-red-600 italic">Error: {trace.errorStack.substring(0, 50)}...</p>
        )}
      </div>
    </div>
  );
};

// Main TimelineCarousel Component
const TimelineCarousel = ({ transactions, onSelectTransaction }) => {
  const [expandedTxnId, setExpandedTxnId] = useState(null); // This state is not currently used but can be for future expansion
  const [txnTraces, setTxnTraces] = useState({}); // Stores traces for each transaction

  useEffect(() => {
    const fetchTracesForTransactions = async () => {
      const newTxnTraces = {};
      for (const txn of transactions) {
        try {
          const response = await fetch(`http://localhost:8080/api/transactions/${txn.id}/retries`);
          if (response.ok) {
            const traces = await response.json();
            newTxnTraces[txn.id] = traces;
          } else {
            console.error(`Failed to fetch traces for ${txn.id}: ${response.status}`);
            newTxnTraces[txn.id] = []; // Store empty array on failure
          }
        } catch (e) {
          console.error(`Error fetching traces for ${txn.id}:`, e);
          newTxnTraces[txn.id] = [];
        }
      }
      setTxnTraces(newTxnTraces);
    };

    if (transactions.length > 0) {
      fetchTracesForTransactions();
    }
  }, [transactions]); // Re-fetch when transactions prop changes

  if (!transactions || transactions.length === 0) {
    return <p className="text-gray-500">No recent transactions to display a timeline.</p>;
  }

  return (
    <div className="space-y-4">
      {transactions.map(txn => (
        <Card key={txn.id} className="border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-lg text-gray-800">Txn ID: {txn.id.substring(0, 8)}...</h4>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              // Use the external getStatusColorClass helper here as well for the main status badge
              getStatusColorClass(txn.currentStatus)
            }`}>
              {txn.currentStatus.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Timeline Visualization */}
          <div className="relative pl-6 py-2">
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-300 rounded-full"></div> {/* Vertical line */}
            {txnTraces[txn.id] && txnTraces[txn.id].length > 0 ? (
              txnTraces[txn.id]
                .sort((a, b) => new Date(a.traceTime) - new Date(b.traceTime)) // Sort chronologically
                .map((trace, index) => (
                  <div key={trace.id} className="mb-4 relative">
                    {/* Use the external getStatusColorClass helper for the dot */}
                    <div className={`absolute left-[-10px] top-0 w-4 h-4 rounded-full ${getStatusColorClass(trace.stepName)} border-2 border-white z-10`}></div> {/* Dot */}
                    <div className="ml-4">
                      <p className="font-medium text-gray-700">{trace.stepName.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-500">{new Date(trace.traceTime).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-gray-500 text-sm italic">No detailed trace available.</p>
            )}
          </div>

          {/* View Full Trace Button */}
          <div className="mt-4 text-right">
            <button
              onClick={() => onSelectTransaction(txn.id)}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              View Full Trace &rarr;
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default TimelineCarousel;
