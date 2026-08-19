import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import { PiHouse, PiSignOut, PiUser, PiCaretLeft, PiCaretRight, PiBell } from "react-icons/pi";
import useAuth from "../hooks/useAuth";
import { useRole } from "../hooks/useRole";
import useAxiosSecure from "../hooks/useAxiosSecure";
import { AdminDashboard } from "../components/RoleBasedSidebar/AdminDashboard";
import { SuperAdminDashboard } from "../components/RoleBasedSidebar/SuperAdminDashboard";
import { InstructorDashboard } from "../components/RoleBasedSidebar/InstructorDashboard";
import StudentDashboard from "../components/RoleBasedSidebar/StudentDashboard";
import Loader from "../components/Loader/Loader";
import { Logo } from "../components/Home/Logo";
import useFullscreen from "../hooks/useFullscreen";
import StudyBuddyChatbot from "../components/Common/StudyBuddyChatbot";
import { registerPushNotifications, unregisterPushNotifications } from "../utils/fcm";

const DashboardLayout = () => {
  const { user, logOut } = useAuth();
  const { role, roleLoading, isError } = useRole();
  const navigate = useNavigate();
  const { isFullscreen } = useFullscreen();
  const [isDrawerOpen, setIsDrawerOpen] = useState(() => typeof window !== "undefined" && window.innerWidth >= 1024);
  const [notifications, setNotifications] = useState([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const axiosSecure = useAxiosSecure();

  const fetchNotifications = async () => {
    try {
      const res = await axiosSecure.get("/user/profile/notifications");
      const fetched = res.data?.notifications || [];
      const localLastRead = localStorage.getItem("lastNotificationsReadAt");
      
      const mapped = fetched.map(n => {
        const isReadLocally = localLastRead ? new Date(n.createdAt) <= new Date(localLastRead) : false;
        return {
          ...n,
          isRead: n.isRead || isReadLocally
        };
      });
      setNotifications(mapped);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      const now = new Date().toISOString();
      localStorage.setItem("lastNotificationsReadAt", now);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      await axiosSecure.put("/user/profile/notifications/read");
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      registerPushNotifications(axiosSecure);
    }
  }, [user, axiosSecure]);

  useEffect(() => {
    if (isError) {
      logOut()
        .then(() => {
          navigate("/auth/login");
        })
        .catch((err) => console.error(err));
    }
  }, [isError, logOut, navigate]);

  if (roleLoading) {
    return <Loader />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-base-200 p-8 text-center">
        <h2 className="text-2xl font-black text-error mb-4">Failed to load dashboard</h2>
        <p className="text-base-content/60 mb-6">We couldn't load your profile. Please try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary rounded-2xl px-8"
        >
          Retry
        </button>
      </div>
    );
  }

  const handleLogOut = () => {
    unregisterPushNotifications(axiosSecure)
      .finally(() => {
        logOut()
          .then(() => {
            navigate('/');
          })
          .catch((err) => console.error(err));
      });
  };

  const handleSidebarClick = (e) => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      const closestLink = e.target.closest("a, button");
      if (closestLink) {
        setIsDrawerOpen(false);
      }
    }
  };

  const renderSidebarLinks = () => {
    switch (role) {
      case "superadmin":
        return <SuperAdminDashboard isDrawerOpen={isDrawerOpen} />;
      case "admin":
        return <AdminDashboard isDrawerOpen={isDrawerOpen} />;
      case "instructor":
        return <InstructorDashboard isDrawerOpen={isDrawerOpen} />;
      case "student":
      default:
        return <StudentDashboard isDrawerOpen={isDrawerOpen} />;
    }
  };

  return (
    <div className={`drawer h-screen overflow-hidden ${isFullscreen ? "" : "lg:drawer-open"}`}>
      <input id="dashboard-drawer" type="checkbox" className="drawer-toggle" checked={isDrawerOpen} onChange={(e) => setIsDrawerOpen(e.target.checked)} />
      <div className="drawer-content flex flex-col h-full overflow-hidden bg-base-200">
        {/* Page content here */}
        {!isFullscreen && (
          <div className="w-full navbar bg-base-100 lg:hidden shadow-sm shrink-0">
            <div className="flex-none">
              <label
                htmlFor="dashboard-drawer"
                className="btn btn-square btn-ghost drawer-button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block w-6 h-6 stroke-current"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  ></path>
                </svg>
              </label>
            </div>
            <Logo />
          </div>
        )}

        <div className={`w-full flex-1 overflow-y-auto ${isFullscreen ? "p-0" : "p-4 md:p-8"}`}>
          <Outlet />
        </div>
      </div>

      {!isFullscreen && (
        <div className={`drawer-side z-50 transition-all duration-300 ${isDrawerOpen ? "" : "lg:w-20"}`}>
          <label htmlFor="dashboard-drawer" className="drawer-overlay"></label>
          <ul 
            onClick={handleSidebarClick}
            className={`menu flex-col flex-nowrap p-4 h-screen max-h-screen bg-base-100 text-base-content border-r border-base-200 transition-all duration-300 overflow-y-auto overflow-x-hidden ${
              isDrawerOpen ? "w-80" : "w-80 lg:w-20"
            }`}
          >
            {/* Sidebar content here */}
            {isDrawerOpen ? (
              <div className="flex items-center justify-between mb-8 px-4">
                <div>
                  <Logo />
                  <p className="text-xs text-base-content/50 mt-1">IELTS mock test dashboard</p>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="btn btn-ghost btn-sm btn-circle hidden lg:flex text-base-content/60 hover:text-primary transition-colors shrink-0"
                  title="Collapse Sidebar"
                >
                  <PiCaretLeft className="text-xl" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 mb-8">
                <button 
                  onClick={() => setIsDrawerOpen(true)}
                  className="btn btn-ghost btn-sm btn-circle hidden lg:flex text-base-content/60 hover:text-primary transition-colors"
                  title="Expand Sidebar"
                >
                  <PiCaretRight className="text-xl" />
                </button>
              </div>
            )}

            <div className={`flex items-center mb-6 transition-all duration-300 ${isDrawerOpen ? "gap-3 px-4" : "justify-center"}`}>
              <div className="avatar placeholder shrink-0">
                <div className="bg-neutral text-neutral-content rounded-full w-10">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} />
                  ) : (
                    <span className="text-xl">
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </span>
                  )}
                </div>
              </div>
              {isDrawerOpen && (
                <div className="overflow-hidden">
                  <h3 className="font-bold truncate">{user?.displayName || user?.email?.split('@')[0] || "User"}</h3>
                  <p className="text-xs capitalize text-base-content/60">{role || "student"}</p>
                </div>
              )}
            </div>

            {renderSidebarLinks()}

            <div className="divider my-4"></div>

            <li>
              <NavLink to="/" end title={!isDrawerOpen ? "Home" : undefined} className={!isDrawerOpen ? "justify-center" : ""}>
                <PiHouse className="w-5 h-5 shrink-0" />
                {isDrawerOpen && <span>Home</span>}
              </NavLink>
            </li>
            <li>
              <NavLink to="/dashboard/profile" title={!isDrawerOpen ? "My Profile" : undefined} className={!isDrawerOpen ? "justify-center" : ""}>
                <PiUser className="w-5 h-5 shrink-0" />
                {isDrawerOpen && <span>My Profile</span>}
              </NavLink>
            </li>
            <li>
              <button 
                onClick={() => {
                  setShowNotificationsModal(true);
                  markNotificationsAsRead();
                }} 
                title={!isDrawerOpen ? "Notifications" : undefined}
                className={`w-full flex items-center justify-between ${!isDrawerOpen ? "justify-center" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <PiBell className="w-5 h-5 shrink-0" />
                  {isDrawerOpen && <span>Notifications</span>}
                </div>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="badge badge-primary badge-sm font-bold font-mono">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>
            </li>
            <li>
              <button onClick={handleLogOut} title={!isDrawerOpen ? "Logout" : undefined} className={`w-full flex items-center ${!isDrawerOpen ? "justify-center" : ""}`}>
                <PiSignOut className="w-5 h-5 shrink-0" />
                {isDrawerOpen && <span>Logout</span>}
              </button>
            </li>
          </ul>
        </div>
      )}
      <StudyBuddyChatbot />

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <div className="modal modal-open z-50">
          <div className="modal-box rounded-3xl max-w-lg bg-base-100">
            <h3 className="font-black text-xl mb-4 flex items-center gap-2">
              <PiBell className="text-primary w-6 h-6" /> Your Inbox & Announcements
            </h3>
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center italic">No new announcements or broadcast messages.</p>
            ) : (
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                {notifications.map((n) => (
                  <div key={n._id} className="border border-base-200 p-4 rounded-2xl bg-base-50/50 space-y-2 hover:border-primary transition">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-sm text-slate-800 dark:text-white">{n.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div
                      className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: n.message
                          .replace(/^#\s+(.+)$/gm, '<h3 class="text-sm font-black mt-3 mb-1 text-primary">$1</h3>')
                          .replace(/^##\s+(.+)$/gm, '<h4 class="text-xs font-bold mt-2.5 mb-1 text-secondary">$1</h4>')
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                          .replace(/\n/g, "<br />")
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="modal-action">
              <button onClick={() => setShowNotificationsModal(false)} className="btn btn-sm rounded-xl">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;

