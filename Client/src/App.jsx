import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import DashboardPage from "./pages/DashboardPage";
import SdqPage from "./pages/SdqPage";
import VisionPage from "./pages/VisionPage";
import HealthTrackerPage from "./pages/HealthTrackerPage";
import DocumentLibraryPage from "./pages/DocumentLibraryPage";
import DashboardLayout from "./components/Layout/DashboardLayout";
import ProtectedRoute from "./components/Layout/ProtectedRoute";
import { ThemeProvider } from "./hooks/useTheme";
import { AuthProvider } from "./hooks/useAuth";
import ToastProvider from "./components/ui/toast";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/sdq" element={<SdqPage />} />
              <Route path="/vision" element={<VisionPage />} />
              <Route path="/health" element={<HealthTrackerPage />} />
              <Route path="/documents" element={<DocumentLibraryPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
