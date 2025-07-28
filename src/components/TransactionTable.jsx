// src/components/TransactionTable.jsx
import { useState } from "react"

const TransactionTable = ({ transactions }) => {
  const [expandedId, setExpandedId] = useState(null)

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full border text-sm text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2">Txn ID</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Retries</th>
            <th>Timestamp</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(txn => (
            <tr key={txn.id} className="border-b">
              <td className="px-4 py-2 font-mono">{txn.id.slice(0, 8)}...</td>
              <td>₹{txn.amount}</td>
              <td>
                <span className={`px-2 py-1 rounded text-white ${statusColor(txn.status)}`}>
                  {txn.status}
                </span>
              </td>
              <td>{txn.retries || 0}</td>
              <td>{new Date(txn.createdAt).toLocaleString()}</td>
              <td>
                <button className="text-blue-600 hover:underline mr-2" onClick={() => toggleExpand(txn.id)}>Trace</button>
                <button className="text-red-600 hover:underline">Retry</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Expanded Trace Viewer */}
      {expandedId && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <h3 className="text-md font-semibold mb-2">Trace for {expandedId}</h3>
          {/* 👇 Replace with TraceTimeline once wired */}
          <p>Lifecycle steps and DTO payload will show here.</p>
        </div>
      )}
    </div>
  )
}

// 💡 Utility for status color
function statusColor(status) {
  switch (status) {
    case "SETTLED": return "bg-green-500"
    case "INITIATED": return "bg-yellow-500"
    case "RETRY PENDING": return "bg-red-500"
    default: return "bg-gray-400"
  }
}

export default TransactionTable
