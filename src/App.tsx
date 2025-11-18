import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Import from shared package
import { Vehicle } from '@autoelite/shared';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Placeholder components
const Dashboard = () => <div>Dashboard</div>;
const Vehicles = () => <div>Vehicles</div>;
const Dealers = () => <div>Dealers</div>;

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/dealers" element={<Dealers />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
