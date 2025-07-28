// src/components/TraceTimeline.jsx
import React from "react"

const TraceTimeline = ({ trace }) => {
  return (
    <div className="border-l-2 border-blue-400 pl-4 space-y-6">
      {trace.map((step, idx) => (
        <div key={idx} className="relative">
          {/* Dot indicator */}
          <div className="absolute -left-[9px] top-1 w-4 h-4 bg-blue-400 rounded-full border-2 border-white" />
          <div className="ml-2">
            <p className="text-sm font-semibold text-gray-700">
              {step.status} <span className="text-xs text-gray-500">at {new Date(step.timestamp).toLocaleString()}</span>
            </p>
            {step.dto && (
              <pre className="bg-gray-100 text-xs mt-1 p-2 rounded whitespace-pre-wrap max-w-2xl overflow-x-auto">
                {JSON.stringify(step.dto, null, 2)}
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default TraceTimeline
