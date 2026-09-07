import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import axios from "axios";
import { API_BASE_URL } from "../utils/apiConfig";
import auth from "../../firebase.config";

/**
 * Non-blocking client visitor telemetry tracker.
 * Dispatches session and navigation beacons to /api/analytics/track-visit.
 */
export const useVisitorTracker = () => {
  const location = useLocation();
  const lastTrackedPath = useRef("");
  const lastTrackedTime = useRef(0);

  useEffect(() => {
    // Generate or retrieve persistent browser session ID
    let sessionId = sessionStorage.getItem("mockea_session_id");
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem("mockea_session_id", sessionId);
    }

    const currentPath = location.pathname + location.search;
    const now = Date.now();

    // Local debounce: avoid tracking exact same path if triggered within 3 seconds
    if (lastTrackedPath.current === currentPath && now - lastTrackedTime.current < 3000) {
      return;
    }

    lastTrackedPath.current = currentPath;
    lastTrackedTime.current = now;

    const reportVisit = async () => {
      try {
        const cleanBaseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

        // Try getting fresh ID token if user is signed in
        let token = null;
        if (auth.currentUser) {
          try {
            token = await auth.currentUser.getIdToken(false);
          } catch (e) {
            // Soft fail: proceed without token
          }
        }

        const headers = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";

        // Fire-and-forget visit telemetry beacon
        await axios.post(
          `${cleanBaseUrl}/analytics/track-visit`,
          {
            path: currentPath,
            referrer: document.referrer || "",
            sessionId,
            clientTimezone,
          },
          { headers, timeout: 5000 }
        );
      } catch (err) {
        // Completely non-blocking: swallow telemetry errors
      }
    };

    // Slight delay to avoid contending with critical page render resources
    const timer = setTimeout(reportVisit, 200);
    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);
};

export default useVisitorTracker;
