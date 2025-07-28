import { useState, useEffect } from 'react';

const useLedgerData = () => {
  const [ledger, setLedger] = useState(null);
  // fetch + logic
  return ledger;
}

export default useLedgerData;
