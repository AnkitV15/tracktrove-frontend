import React from 'react';
import AdminDashboard from './components/AdminDashboard'; // Assuming you saved the file in src/components/

export function App(props) {
  return (
    <div className='App'>
      {/* The AdminDashboard component is rendered here. */}
      <AdminDashboard />
    </div>
  );
}

export default App;