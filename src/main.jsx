import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AppProvider } from './context/AppContext'; // Import AppProvider
import './index.css'; // Import Tailwind CSS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider> {/* Wrap App with AppProvider */}
      <App />
    </AppProvider>
  </React.StrictMode>,
);
