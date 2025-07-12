/**
 * Authentication persistence utility to handle session restoration
 * and prevent automatic logouts on page refresh/browser events
 */

import { DVHostingSmsService } from "@/services/dvhostingSmsService";
import { validateAuthConsistency } from "@/utils/authDebug";

let authCheckInitialized = false;

export const initializeAuthPersistence = () => {
  if (authCheckInitialized) return;
  authCheckInitialized = true;

  const authService = DVHostingSmsService.getInstance();

  // Handle page visibility changes (user switching tabs, minimizing browser)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      // User returned to the tab - ensure auth is still valid and refresh it
      const user = authService.getCurrentUser();
      if (user) {
        console.log("✅ User returned to tab - refreshing auth state");
        // Refresh auth state to prevent any timeouts
        authService.setCurrentUser(user);
        // Dispatch auth event to update UI
        window.dispatchEvent(
          new CustomEvent("auth-login", {
            detail: { user: user },
          }),
        );
      }
    }
  });

  // Handle storage events (syncing auth across tabs)
  window.addEventListener("storage", (event) => {
    if (
      event.key === "current_user" ||
      event.key === "cleancare_user" ||
      event.key === "auth_token" ||
      event.key === "cleancare_auth_token"
    ) {
      console.log("🔄 Auth storage change detected - syncing auth state");

      // Auth change detected in another tab
      if (event.newValue === null) {
        // User logged out in another tab
        console.log("🚪 User logged out in another tab");
        window.dispatchEvent(new CustomEvent("auth-logout"));
      } else if (event.oldValue === null && event.newValue) {
        // User logged in in another tab
        console.log("🎉 User logged in in another tab");
        window.dispatchEvent(
          new CustomEvent("auth-login", {
            detail: { user: authService.getCurrentUser() },
          }),
        );
      }
    }
  });

  // Prevent accidental navigation away from the app
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    // Don't show the confirmation dialog anymore - users want seamless experience
    // Just ensure auth state is preserved
    const user = authService.getCurrentUser();
    if (user) {
      console.log("💾 Preserving auth state before page unload");
      // Ensure user data is saved to localStorage
      authService.setCurrentUser(user);
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  // Handle page hide (iOS Safari and mobile browsers)
  const handlePageHide = () => {
    const user = authService.getCurrentUser();
    if (user) {
      console.log("💾 Preserving auth state on page hide (mobile)");
      authService.setCurrentUser(user);
    }
  };

  window.addEventListener("pagehide", handlePageHide);

  // More frequent auth refresh every 2 minutes to prevent any timeouts
  const refreshInterval = setInterval(
    () => {
      const user = authService.getCurrentUser();
      if (user) {
        console.log("🔄 Periodic auth refresh - maintaining session");
        authService.setCurrentUser(user);

        // Ensure both storage keys are synchronized
        const token =
          localStorage.getItem("auth_token") ||
          localStorage.getItem("cleancare_auth_token");
        if (token) {
          localStorage.setItem("auth_token", token);
          localStorage.setItem("cleancare_auth_token", token);
        }

        // Dispatch auth event to keep UI updated
        window.dispatchEvent(
          new CustomEvent("auth-refresh", {
            detail: { user: user },
          }),
        );
      }
    },
    2 * 60 * 1000,
  ); // 2 minutes

  // Clear interval on page unload
  window.addEventListener("beforeunload", () => {
    clearInterval(refreshInterval);
  });

  console.log("✅ Authentication persistence initialized");
};

/**
 * Check and restore authentication state on app startup
 */
export const restoreAuthState = async (): Promise<boolean> => {
  try {
    const authService = DVHostingSmsService.getInstance();

    // Check multiple storage locations for auth data
    const token =
      localStorage.getItem("auth_token") ||
      localStorage.getItem("cleancare_auth_token");
    const userStr =
      localStorage.getItem("current_user") ||
      localStorage.getItem("cleancare_user");

    // More lenient checking - prioritize user data over token
    if (!userStr || !userStr.trim()) {
      console.log("ℹ️ No user data found for restoration");
      return false;
    }

    let user;
    try {
      user = JSON.parse(userStr);
    } catch (parseError) {
      console.warn("⚠️ Corrupted user data found - attempting recovery");
      // Try to create a minimal user object to preserve session
      try {
        user = {
          rawData: userStr,
          name: "User",
          phone: "unknown",
          isRecovered: true,
        };
        console.log("✅ Created recovery user object");
      } catch {
        return false;
      }
    }

    if (!user || typeof user !== "object") {
      console.warn("⚠️ Invalid user data found - attempting recovery");
      return false;
    }

    // Restore user session (token is optional for user experience)
    const finalToken = token || `persistent_${Date.now()}`;
    authService.setCurrentUser(user, finalToken);

    console.log("✅ Authentication state restored:", {
      phone: user.phone || "unknown",
      name: user.name || "User",
      hasToken: !!token,
      isRecovered: user.isRecovered || false,
    });

    // Dispatch auth restoration event
    window.dispatchEvent(
      new CustomEvent("auth-restored", {
        detail: { user: user },
      }),
    );

    // Try to sync with backend (but never fail if it doesn't work)
    try {
      await authService.restoreSession();
      console.log("✅ Backend session synchronized");
    } catch (error) {
      console.warn(
        "⚠️ Backend sync failed, continuing with local auth:",
        error,
      );
      // Continue anyway - local auth is sufficient
    }

    return true;
  } catch (error) {
    console.error("❌ Error restoring auth state:", error);
    // Never fail completely - preserve user sessions
    console.warn("🔒 Continuing with existing auth state");

    // Try to preserve any existing data
    const userStr =
      localStorage.getItem("current_user") ||
      localStorage.getItem("cleancare_user");
    if (userStr && userStr.trim()) {
      console.log("✅ Found user data during error recovery");
      return true;
    }
    return false;
  }
};

/**
 * Ensure auth state is consistent across all storage keys
 */
export const syncAuthStorage = () => {
  const authService = DVHostingSmsService.getInstance();
  const user = authService.getCurrentUser();

  if (user) {
    // Ensure all storage keys are in sync
    const token =
      localStorage.getItem("auth_token") ||
      localStorage.getItem("cleancare_auth_token");
    if (token) {
      authService.setCurrentUser(user, token);
      console.log("🔄 Auth storage synchronized");
    }
  }
};
