// src/components/LedgerBarChart.jsx
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js"

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const LedgerBarChart = ({ ledgerData }) => {
  const safeData = ledgerData ?? [] // fallback to empty array
  const labels = safeData.map((entry) => entry.label)

  const data = {
    labels,
    datasets: [
      {
        label: "Escrowed",
        data: safeData.map((entry) => entry.escrow ?? 0),
        backgroundColor: "#3b82f6", // blue
      },
      {
        label: "Settled",
        data: safeData.map((entry) => entry.settled ?? 0),
        backgroundColor: "#10b981", // green
      },
    ],
  }

  const isEmpty = safeData.length === 0

  return (
    <div className="bg-white p-4 rounded shadow mt-6 max-w-2xl">
      <h3 className="text-lg font-semibold mb-2">Ledger Amounts</h3>

      {isEmpty ? (
        <p className="text-sm text-gray-500">No ledger data available.</p>
      ) : (
        <Bar
          data={data}
          options={{
            responsive: true,
            plugins: { legend: { position: "top" } },
            scales: {
              y: { beginAtZero: true, ticks: { precision: 0 } },
            },
          }}
        />
      )}
    </div>
  )
}

export default LedgerBarChart