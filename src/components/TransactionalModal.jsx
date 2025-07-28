// src/components/TransactionModal.jsx
import React from "react"
import TraceTimeline from "./TraceTimeline"
import RetryTracker from "./RetryTracker"
import JsonDiffViewer from "./JsonDiffViewer"

const TransactionModal = ({ txn, onClose }) => {
  if (!txn) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 overflow-y-auto max-h-[80vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Trace History for {txn.id}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">×</button>
        </div>

        {/* Step-by-step trace */}
        <TraceTimeline trace={txn.traceSteps} />

        {/* DTO diff between INITIATED and SETTLED */}
        {txn.dtoDiff && (
          <>
            <h3 className="mt-6 text-md font-semibold">DTO Changes</h3>
            <JsonDiffViewer prevDTO={txn.dtoDiff.from} nextDTO={txn.dtoDiff.to} />
          </>
        )}

        {/* Retry Attempts */}
        <RetryTracker retries={txn.retries} />
      </div>
    </div>
  )
}

export default TransactionModal
