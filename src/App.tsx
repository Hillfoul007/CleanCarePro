import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { NotificationProvider } from "@/contexts/NotificationContext";
import LaundryIndex from "@/pages/LaundryIndex";
import ErrorBoundary from "@/components/ErrorBoundary";
import InstallPrompt from "@/components/InstallPrompt";
import AddressSearchDemo from "@/components/AddressSearchDemo";
import CacheDebugPanel from "@/components/CacheDebugPanel";
import {
  initializeAuthPersistence,
  restoreAuthState,
} from "@/utils/authPersistence";
import { checkVersionAndReload } from "@/utils/cacheBusting";
import "./App.css";
import "./styles/mobile-fixes.css";

function App() {
  // Initialize authentication persistence and restore user session
  useEffect(() => {
    const initializeAuth = async () => {
      // Check for version mismatch and force reload if needed
      checkVersionAndReload();

      // Auto-clear cart on deploy (only once)
      const versionKey = "catalogue-version-v2";
      if (!localStorage.getItem(versionKey)) {
        localStorage.removeItem("cart");
        localStorage.setItem(versionKey, "true");
      }

      // Initialize auth persistence handlers (storage events, page lifecycle, etc.)
      initializeAuthPersistence();

      // Restore authentication state from localStorage
      await restoreAuthState();
    };

    initializeAuth();
  }, []);

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<LaundryIndex />} />
              <Route path="/address-demo" element={<AddressSearchDemo />} />
              <Route path="*" element={<LaundryIndex />} />
            </Routes>
            <Toaster />
            <InstallPrompt />
            {process.env.NODE_ENV === "development" && <CacheDebugPanel />}
          </div>
        </Router>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
