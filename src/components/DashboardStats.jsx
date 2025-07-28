// components/DashboardStats.tsx
import React from "react"

const DashboardStats = ({ stats }) => (
  <div className="grid grid-cols-3 gap-4 mt-6">
    {stats.map((stat) => (
      <div key={stat.label} className="p-4 bg-white shadow rounded">
        <h3 className="text-sm text-gray-500">{stat.label}</h3>
        <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
      </div>
    ))}
  </div>
)

export default DashboardStats
