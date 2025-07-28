// src/components/RetryTracker.jsx
import React from "react"

const RetryTracker = ({ retries }) => {
  if (!retries || retries.length === 0) {
    return <p className="text-gray-500 text-sm">No retries recorded.</p>
  }

  return (
    <div className="mt-4 space-y-4">
      <h3 className="text-md font-semibold">Retry History</h3>
      <ol className="list-decimal ml-4 space-y-2">
        {retries.map((retry, idx) => (
          <li key={idx}>
            <span className="text-gray-700 font-mono">
              Attempt #{retry.attempt} at {new Date(retry.timestamp).toLocaleString()}
            </span>
            {retry.reason && (
              <p className="text-sm text-red-500 mt-1">Reason: {retry.reason}</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

export default RetryTracker
