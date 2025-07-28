// src/pages/Dashboard.jsx
import React from "react"
import DashboardStats from "../components/DashboardStats"
import TransactionTable from "../components/TransactionTable"
import LedgerBarChart from "../components/LedgerBarChart"
import useLedgerData from "../hooks/useLedgerData"
import useTransactions from "../hooks/useTransactions"

const Dashboard = () => {
  // ⛑️ Correct: Hooks now live inside the component
  const { ledgerData = null, loading: ledgerLoading = false } = useLedgerData() || {}

  const { transactions, loading } = useTransactions()

  const settled = transactions?.filter(txn => txn.status === "SETTLED") || []

  const stats = [
    { label: "Total Transactions", value: transactions?.length || 0 },
    { label: "Retry Pending", value: transactions?.filter(t => t.status === "RETRY PENDING").length || 0 },
    { label: "Amount Settled (₹)", value: settled.reduce((sum, t) => sum + t.amount, 0).toFixed(2) }
  ]

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">📊 TrackTrove Dashboard</h1>

      {loading ? (
        <p className="text-sm text-gray-500">Loading transactions...</p>
      ) : (
        <>
          <DashboardStats stats={stats} />
          <TransactionTable transactions={transactions} />
        </>
      )}

      {ledgerLoading ? (
        <p className="text-sm text-gray-500">Loading ledger data...</p>
      ) : (
        <LedgerBarChart ledgerData={ledgerData} />
      )}
    </div>
  )
}

export default Dashboard
