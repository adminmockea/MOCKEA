import { useState } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import {
  UserIcon,
  Squares2X2Icon,
  DocumentChartBarIcon,
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon
} from '@heroicons/react/20/solid';
import { NavLink } from 'react-router';
import useAuth from '../../../hooks/useAuth';
import { toast } from 'react-toastify';
import ConfirmModal from '../../Common/ConfirmModal';

const Dropdown = () => {
  const { user, logOut } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logOut();
      toast.success("Logout successfully");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };
  return (
    <>
      <Menu as="div" className="relative inline-block text-left">
      <div>
        <MenuButton className="inline-flex w-full items-center justify-center gap-x-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-hover transition-colors">
          
          <div className="avatar">
            <div className="w-6 rounded-full bg-white/20 p-0.5">
              <UserIcon className="w-full h-full text-white" />
            </div>
          </div>
          Hello! {user?.displayName || user?.email?.split("@")[0]}
          <ChevronDownIcon aria-hidden="true" className="-mr-1 h-5 w-5 text-white/80" />
        </MenuButton>
      </div>

      <MenuItems
        transition
        className="absolute right-0 z-50 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
      >
        <div className="px-4 py-3">
          <p className="text-sm text-gray-400">Signed in as</p>
          <p className="truncate text-sm font-medium">{user?.email}</p>
        </div>
        <div className="px-1 py-1 text-gray-700">
          <MenuItem>
            <NavLink
              to="/dashboard/profile"
              className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary data-[focus]:bg-primary/10 data-[focus]:text-primary"
            >
              <UserIcon className="h-5 w-5 text-gray-400 group-hover:text-primary group-data-[focus]:text-primary" aria-hidden="true" />
              My Account
            </NavLink>
          </MenuItem>
          <MenuItem>
            <NavLink
              to="/dashboard"
              className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary data-[focus]:bg-primary/10 data-[focus]:text-primary"
            >
              <Squares2X2Icon className="h-5 w-5 text-gray-400 group-hover:text-primary group-data-[focus]:text-primary" aria-hidden="true" />
              My Dashboard
            </NavLink>
          </MenuItem>
        </div>

        <div className="px-1 py-1 text-gray-700">
          <MenuItem>
            <NavLink
              to="/dashboard/analytics"
              className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary data-[focus]:bg-primary/10 data-[focus]:text-primary"
            >
              <DocumentChartBarIcon className="h-5 w-5 text-gray-400 group-hover:text-primary group-data-[focus]:text-primary" aria-hidden="true" />
              My Results
            </NavLink>
          </MenuItem>
          <MenuItem>
            <NavLink
              to="/dashboard/trainer"
              className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary data-[focus]:bg-primary/10 data-[focus]:text-primary"
            >
              <AcademicCapIcon className="h-5 w-5 text-gray-400 group-hover:text-primary group-data-[focus]:text-primary" aria-hidden="true" />
              My IELTS Trainer
            </NavLink>
          </MenuItem>
        </div>

        <div className="px-1 py-1">
          <MenuItem
            as="button"
            onClick={() => setIsLogoutModalOpen(true)}
            className="group cursor-pointer flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 data-[focus]:bg-red-50 data-[focus]:text-red-700"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 text-red-500 group-hover:text-red-600 group-data-[focus]:text-red-600" aria-hidden="true" />
            Log Out
          </MenuItem>
        </div>
      </MenuItems>
    </Menu>

    <ConfirmModal
      isOpen={isLogoutModalOpen}
      title="Confirm Logout"
      message="Are you sure you want to log out of your account?"
      confirmText="Log Out"
      isDanger={true}
      loading={isLoggingOut}
      onConfirm={handleConfirmLogout}
      onClose={() => setIsLogoutModalOpen(false)}
    />
  </>
  );
};

export default Dropdown;
