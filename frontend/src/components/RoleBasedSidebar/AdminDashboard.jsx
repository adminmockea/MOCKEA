import { NavLink, useLocation } from "react-router";
import {
  PiChartBar,
  PiUsersThree,
  PiFiles,
  PiGear,
  PiBookOpen,
  PiCurrencyDollar,
  PiGraduationCap,
  PiFileText,
  PiHouseLine,
} from "react-icons/pi";

export const AdminDashboard = ({ isDrawerOpen }) => {
  const location = useLocation();
  const { pathname } = location;

  const isMockTestsActive =
    pathname.startsWith("/dashboard/admin/manage-mock-tests") ||
    pathname.startsWith("/dashboard/admin/create-mock-test") ||
    pathname.startsWith("/dashboard/admin/edit-mock-test");

  const isQuestionsActive =
    pathname.startsWith("/dashboard/admin/manage-questions") ||
    pathname.startsWith("/dashboard/admin/add-questions") ||
    pathname.startsWith("/dashboard/admin/edit-questions");

  return (
    <>
      <li>
        <NavLink to="/dashboard" end title={!isDrawerOpen ? "Dashboard Home" : undefined} className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}>
          <PiChartBar className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Dashboard Home</span>}
        </NavLink>
      </li>
      <li>
        <NavLink to="/dashboard/admin/manage-institutions" title={!isDrawerOpen ? "Manage Institutions" : undefined} className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}>
          <PiHouseLine className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Manage Institutions</span>}
        </NavLink>
      </li>
      <li>
        <NavLink to="/dashboard/admin/manage-users" title={!isDrawerOpen ? "Manage Users" : undefined} className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}>
          <PiUsersThree className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Manage Users</span>}
        </NavLink>
      </li>
      <li>
        <NavLink to="/dashboard/admin/manage-submissions" title={!isDrawerOpen ? "Manage Submissions" : undefined} className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}>
          <PiFileText className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Manage Submissions</span>}
        </NavLink>
      </li>
      <li>
        <NavLink to="/dashboard/admin/manage-questions" title={!isDrawerOpen ? "Manage Questions" : undefined} className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive || isQuestionsActive ? "active" : ""}`}>
          <PiBookOpen className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Manage Questions</span>}
        </NavLink>
      </li>
      <li>
        <NavLink to="/dashboard/admin/manage-mock-tests" title={!isDrawerOpen ? "Manage Mock Tests" : undefined} className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive || isMockTestsActive ? "active" : ""}`}>
          <PiFiles className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Manage Mock Tests</span>}
        </NavLink>
      </li>
      <li>
        <NavLink to="/dashboard/admin/manage-pricing" title={!isDrawerOpen ? "Manage Pricing" : undefined} className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}>
          <PiCurrencyDollar className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Manage Pricing</span>}
        </NavLink>
      </li>
      <li>
        <NavLink to="/dashboard/admin/manage-resources" title={!isDrawerOpen ? "Manage Resources" : undefined} className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}>
          <PiBookOpen className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Manage Resources</span>}
        </NavLink>
      </li>
      <li>
        <NavLink to="/dashboard/admin/manage-trainers" title={!isDrawerOpen ? "Manage Trainers" : undefined} className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}>
          <PiGraduationCap className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Manage Trainers</span>}
        </NavLink>
      </li>
      <li>
        <NavLink to="/dashboard/admin/instructor-performance" title={!isDrawerOpen ? "Tutor Performance" : undefined} className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}>
          <PiGraduationCap className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Tutor Performance</span>}
        </NavLink>
      </li>
      <li>
        <NavLink to="/dashboard/admin/booking-analytics" title={!isDrawerOpen ? "Booking Analytics" : undefined} className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}>
          <PiBookOpen className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Booking Analytics</span>}
        </NavLink>
      </li>
      <li>
        <NavLink to="/dashboard/admin/settings" title={!isDrawerOpen ? "Settings" : undefined} className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}>
          <PiGear className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Settings</span>}
        </NavLink>
      </li>
    </>
  );
};
