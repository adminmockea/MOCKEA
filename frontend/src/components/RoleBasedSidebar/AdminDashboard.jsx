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
      <li className={!isDrawerOpen ? "tooltip tooltip-right z-50" : ""} data-tip="Dashboard Home">
        <NavLink to="/dashboard" end className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}>
          <PiChartBar className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Dashboard Home</span>}
        </NavLink>
      </li>
      <li className={!isDrawerOpen ? "tooltip tooltip-right z-50" : ""} data-tip="Manage Institutions">
        <NavLink to="/dashboard/admin/manage-institutions" className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}>
          <PiHouseLine className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Manage Institutions</span>}
        </NavLink>
      </li>
      <li className={!isDrawerOpen ? "tooltip tooltip-right z-50" : ""} data-tip="Manage Users">
        <NavLink to="/dashboard/admin/manage-users" className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}>
          <PiUsersThree className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Manage Users</span>}
        </NavLink>
      </li>
      <li className={!isDrawerOpen ? "tooltip tooltip-right z-50" : ""} data-tip="Manage Submissions">
        <NavLink to="/dashboard/admin/manage-submissions" className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}>
          <PiFileText className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Manage Submissions</span>}
        </NavLink>
      </li>
      <li className={!isDrawerOpen ? "tooltip tooltip-right z-50" : ""} data-tip="Manage Questions">
        <NavLink to="/dashboard/admin/manage-questions" className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive || isQuestionsActive ? "active" : ""}`}>
          <PiBookOpen className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Manage Questions</span>}
        </NavLink>
      </li>
      <li className={!isDrawerOpen ? "tooltip tooltip-right z-50" : ""} data-tip="Manage Mock Tests">
        <NavLink to="/dashboard/admin/manage-mock-tests" className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive || isMockTestsActive ? "active" : ""}`}>
          <PiFiles className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Manage Mock Tests</span>}
        </NavLink>
      </li>
      <li className={!isDrawerOpen ? "tooltip tooltip-right z-50" : ""} data-tip="Manage Pricing">
        <NavLink to="/dashboard/admin/manage-pricing" className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}>
          <PiCurrencyDollar className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Manage Pricing</span>}
        </NavLink>
      </li>
      <li className={!isDrawerOpen ? "tooltip tooltip-right z-50" : ""} data-tip="Manage Resources">
        <NavLink to="/dashboard/admin/manage-resources" className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}>
          <PiBookOpen className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Manage Resources</span>}
        </NavLink>
      </li>
      <li className={!isDrawerOpen ? "tooltip tooltip-right z-50" : ""} data-tip="Manage Trainers">
        <NavLink to="/dashboard/admin/manage-trainers" className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}>
          <PiGraduationCap className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Manage Trainers</span>}
        </NavLink>
      </li>
      <li className={!isDrawerOpen ? "tooltip tooltip-right z-50" : ""} data-tip="Tutor Performance">
        <NavLink to="/dashboard/admin/instructor-performance" className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}>
          <PiGraduationCap className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Tutor Performance</span>}
        </NavLink>
      </li>
      <li className={!isDrawerOpen ? "tooltip tooltip-right z-50" : ""} data-tip="Booking Analytics">
        <NavLink to="/dashboard/admin/booking-analytics" className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}>
          <PiBookOpen className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Booking Analytics</span>}
        </NavLink>
      </li>
      <li className={!isDrawerOpen ? "tooltip tooltip-right z-50" : ""} data-tip="Settings">
        <NavLink to="/dashboard/admin/settings" className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}>
          <PiGear className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Settings</span>}
        </NavLink>
      </li>
    </>
  );
};
