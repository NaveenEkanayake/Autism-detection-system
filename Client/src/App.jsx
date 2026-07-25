import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import DashboardPage from "./pages/DashboardPage";
import SdqPage from "./pages/SdqPage";
import VisionPage from "./pages/VisionPage";
import HealthTrackerPage from "./pages/HealthTrackerPage";
import DocumentLibraryPage from "./pages/DocumentLibraryPage";
import VisionAnalysisPage from "./pages/VisionAnalysisPage";
import AIChatPage from "./pages/AIChatPage";
import DashboardLayout from "./components/Layout/DashboardLayout";
import { PatientsProvider } from "./hooks/usePatients";
import ToastProvider from "./components/ui/toast";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeProvider } from "./hooks/useTheme";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PatientsProvider>
          <ToastProvider />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/sdq" element={<SdqPage />} />
              <Route path="/vision" element={<VisionPage />} />
              <Route path="/vision-analysis" element={<VisionAnalysisPage />} />
              <Route path="/ai-chat" element={<AIChatPage />} />
              <Route path="/health" element={<HealthTrackerPage />} />
              <Route path="/documents" element={<DocumentLibraryPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PatientsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
