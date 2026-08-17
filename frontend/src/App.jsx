import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TestPage from './pages/TestPage'
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

export default function App() {
  return (
    <BrowserRouter>
      <meta name="viewport" content="initial-scale=1, width=device-width" />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/test" element={<TestPage />} />
      </Routes>
    </BrowserRouter>
  );
}
