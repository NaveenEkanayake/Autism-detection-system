import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import DashboardPage from "./pages/DashboardPage";
import SdqPage from "./pages/SdqPage";
import HealthTrackerPage from "./pages/HealthTrackerPage";
import DocumentLibraryPage from "./pages/DocumentLibraryPage";
import EventManagementPage from "./pages/EventManagementPage";
import VisionAnalysisPage from "./pages/VisionAnalysisPage";
import VisionPage from "./pages/VisionPage";
import AIChatPage from "./pages/AIChatPage";
import UserProfilePage from "./pages/UserProfilePage";
import ChildProfilePage from "./pages/ChildProfilePage";
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
              <Route path="/events" element={<EventManagementPage />} />
              <Route path="/profile" element={<UserProfilePage />} />
              <Route path="/child/:childId" element={<ChildProfilePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PatientsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
