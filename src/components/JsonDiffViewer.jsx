// src/components/JsonDiffViewer.jsx
import React from "react"

const JsonDiffViewer = ({ prevDTO, nextDTO }) => {
  const diffLines = generateDiff(prevDTO, nextDTO)

  return (
    <div className="bg-gray-100 rounded p-4 text-sm font-mono overflow-x-auto max-w-3xl space-y-1">
      {diffLines.map((line, idx) => (
        <div key={idx} className={getColorClass(line.type)}>
          {line.text}
        </div>
      ))}
    </div>
  )
}

// 🔍 Diff engine (basic for JSON flat structures)
function generateDiff(prev, next) {
  const prevKeys = Object.keys(prev || {})
  const nextKeys = Object.keys(next || {})

  const allKeys = new Set([...prevKeys, ...nextKeys])
  const lines = []

  for (const key of allKeys) {
    if (!(key in prev)) {
      lines.push({ type: "added", text: `+ ${key}: ${JSON.stringify(next[key])}` })
    } else if (!(key in next)) {
      lines.push({ type: "removed", text: `- ${key}: ${JSON.stringify(prev[key])}` })
    } else if (JSON.stringify(prev[key]) !== JSON.stringify(next[key])) {
      lines.push({ type: "changed", text: `~ ${key}: ${JSON.stringify(prev[key])} → ${JSON.stringify(next[key])}` })
    } else {
      lines.push({ type: "unchanged", text: `  ${key}: ${JSON.stringify(prev[key])}` })
    }
  }

  return lines
}

function getColorClass(type) {
  return {
    added: "text-green-700",
    removed: "text-red-700",
    changed: "text-yellow-700",
    unchanged: "text-gray-600"
  }[type]
}

export default JsonDiffViewer
