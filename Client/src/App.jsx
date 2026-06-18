import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import DashboardPage from "./pages/DashboardPage";
import SdqPage from "./pages/SdqPage";
import VisionPage from "./pages/VisionPage";
import HealthTrackerPage from "./pages/HealthTrackerPage";
import DocumentLibraryPage from "./pages/DocumentLibraryPage";
import DashboardLayout from "./components/Layout/DashboardLayout";
import { ThemeProvider } from "./hooks/useTheme";

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/sdq" element={<SdqPage />} />
          <Route path="/vision" element={<VisionPage />} />
          <Route path="/health" element={<HealthTrackerPage />} />
          <Route path="/documents" element={<DocumentLibraryPage />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
