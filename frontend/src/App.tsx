import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { MeetingPrepPage } from './components/pages/MeetingPrepPage';
import { CustomerResearchPage } from './components/pages/CustomerResearchPage';
import { CalendarPage } from './components/pages/CalendarPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={
            <Layout>
              <MeetingPrepPage />
            </Layout>
          } />
          <Route path="/research" element={<CustomerResearchPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
