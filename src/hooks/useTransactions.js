// src/hooks/useTransactions.js
import { useEffect, useState } from "react"

const useTransactions = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("http://localhost:8080/api/transactions")
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch:", err)
        setLoading(false)
      })
  }, [])

  return { transactions, loading }
}

export default useTransactions
