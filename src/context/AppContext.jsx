import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard', 'explorer', 'trace', 'admin'
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);

  const navigateTo = (page, txnId = null) => {
    setCurrentPage(page);
    setSelectedTransactionId(txnId);
  };

  return (
    <AppContext.Provider value={{ currentPage, navigateTo, selectedTransactionId }}>
      {children}
    </AppContext.Provider>
  );
};
