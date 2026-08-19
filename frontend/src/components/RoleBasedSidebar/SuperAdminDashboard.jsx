import { NavLink } from "react-router";
import {
  PiShieldWarning,
  PiChartBar,
  PiUsersThree,
  PiCurrencyDollar,
  PiGear,
} from "react-icons/pi";

export const SuperAdminDashboard = ({ isDrawerOpen }) => {
  return (
    <>
      <li>
        <NavLink to="/dashboard/superadmin/console" title={!isDrawerOpen ? "Super Admin Console" : undefined} className={!isDrawerOpen ? "justify-center" : ""}>
          <PiShieldWarning className="w-5 h-5 shrink-0 text-red-500 font-bold" />
          {isDrawerOpen && <span className="font-extrabold text-red-600 dark:text-red-400">Super Admin Console</span>}
        </NavLink>
      </li>
      <li>
        <NavLink to="/dashboard" end title={!isDrawerOpen ? "Dashboard Home" : undefined} className={!isDrawerOpen ? "justify-center" : ""}>
          <PiChartBar className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Dashboard Home</span>}
        </NavLink>
      </li>
      <div className="divider my-1 text-xs opacity-50">System Management</div>
      <li>
        <NavLink to="/dashboard/admin/manage-users" title={!isDrawerOpen ? "Manage Users" : undefined} className={!isDrawerOpen ? "justify-center" : ""}>
          <PiUsersThree className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Manage Users</span>}
        </NavLink>
      </li>
      <li>
        <NavLink to="/dashboard/admin/manage-pricing" title={!isDrawerOpen ? "Manage Pricing" : undefined} className={!isDrawerOpen ? "justify-center" : ""}>
          <PiCurrencyDollar className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Manage Pricing</span>}
        </NavLink>
      </li>
      <li>
        <NavLink to="/dashboard/admin/settings" title={!isDrawerOpen ? "Settings" : undefined} className={!isDrawerOpen ? "justify-center" : ""}>
          <PiGear className="w-5 h-5 shrink-0" />
          {isDrawerOpen && <span>Settings</span>}
        </NavLink>
      </li>
    </>
  );
};
