import { useState, useMemo, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  PiUsersThree,
  PiMagnifyingGlass,
  PiTrash,
  PiProhibit,
  PiCheckCircle,
  PiShieldStar,
  PiArrowClockwise,
  PiCaretDown
} from "react-icons/pi";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import useAdminQuery from "../../../hooks/useAdminQuery";
import { useRole } from "../../../hooks/useRole";
import TableShell from "../../Common/TableShell";
import PlanTimeframeModal from "./PlanTimeframeModal";

// ─── Utility ───────────────────────────────────────────────────────────────────

const ROLES = ["student", "admin", "instructor"];
const ROLE_COLORS = {
  admin: "badge-error",
  instructor: "badge-warning",
  student: "badge-info",
};

const PLAN_COLORS = {
  free: "badge-ghost",
  standard: "badge-success",
  premium: "badge-accent",
};

const roleIcon = (role) => {
  if (role === "admin") return "👑";
  if (role === "instructor") return "🛡️";
  return "🎓";
};

// ─── Role Dropdown ──────────────────────────────────────────────────────────────

const RoleDropdown = ({ user, onChangeRole, loading, disabled, currentUserRole }) => {
  const [open, setOpen] = useState(false);

  const availableRoles = ROLES.filter((r) => {
    if (r === user.role) return false;
    if (currentUserRole !== "superadmin" && (r === "admin" || r === "superadmin")) return false;
    return true;
  });

  return (
    <div className="relative">
      <button
        className="btn btn-ghost btn-xs gap-1 font-semibold"
        onClick={() => setOpen((v) => !v)}
        disabled={loading || disabled || availableRoles.length === 0}
      >
        <span>{roleIcon(user.role)}</span>
        <span className={`badge badge-sm ${ROLE_COLORS[user.role] ?? "badge-ghost"}`}>
          {user.role}
        </span>
        {!disabled && availableRoles.length > 0 && (
          <PiCaretDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && !disabled && availableRoles.length > 0 && (
        <div className="absolute left-0 top-full mt-1 z-30 min-w-[120px] rounded-xl border border-base-300 bg-base-100 shadow-xl overflow-hidden">
          {availableRoles.map((r) => (
            <button
              key={r}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-base-200 transition-colors"
              onClick={() => { onChangeRole(user._id, r); setOpen(false); }}
            >
              <span>{roleIcon(r)}</span>
              <span className={`badge badge-sm ${ROLE_COLORS[r]}`}>{r}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const PlanDropdown = ({ user, onChangePlan, loading, disabled }) => {
  const [open, setOpen] = useState(false);
  const PLANS = ["free", "standard", "premium"];

  const formatExpiryText = () => {
    if (user.plan === "free") return null;
    if (!user.planExpiresAt) return "Lifetime Access";
    const exp = new Date(user.planExpiresAt);
    return `Exp: ${exp.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };

  const expiryBadge = formatExpiryText();

  return (
    <div className="relative">
      <div className="flex flex-col items-start gap-0.5">
        <button
          className="btn btn-ghost btn-xs gap-1 font-semibold"
          onClick={() => setOpen((v) => !v)}
          disabled={loading || disabled}
        >
          <span className={`badge badge-sm ${PLAN_COLORS[user.plan] ?? "badge-ghost"}`}>
            {user.plan}
          </span>
          {!disabled && <PiCaretDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />}
        </button>
        {expiryBadge && (
          <span className="text-[10px] font-medium text-base-content/50 pl-1">
            {expiryBadge}
          </span>
        )}
      </div>

      {open && !disabled && (
        <div className="absolute left-0 top-full mt-1 z-30 min-w-[130px] rounded-xl border border-base-300 bg-base-100 shadow-xl overflow-hidden">
          {PLANS.filter((p) => p !== user.plan).map((p) => (
            <button
              key={p}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-base-200 transition-colors"
              onClick={() => {
                onChangePlan(user, p);
                setOpen(false);
              }}
            >
              <span className={`badge badge-sm ${PLAN_COLORS[p]}`}>{p}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const InstitutionDropdown = ({ user, institutions, onChangeInstitution, loading, disabled }) => {
  const [open, setOpen] = useState(false);
  const currentInstCode = user.institutionCode || user.institution?.code || null;

  return (
    <div className="relative">
      <button
        className="btn btn-ghost btn-xs gap-1 font-semibold"
        onClick={() => setOpen((v) => !v)}
        disabled={loading || disabled}
      >
        <span className={`badge badge-sm ${currentInstCode ? "badge-primary" : "badge-ghost"}`}>
          {currentInstCode ? currentInstCode : "B2C"}
        </span>
        {!disabled && <PiCaretDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />}
      </button>

      {open && !disabled && (
        <div className="absolute left-0 top-full mt-1 z-30 min-w-[170px] rounded-xl border border-base-300 bg-base-100 shadow-xl overflow-hidden max-h-48 overflow-y-auto">
          <button
            className="flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-base-200 transition-colors font-medium border-b border-base-200"
            onClick={() => {
              onChangeInstitution(user._id, "none");
              setOpen(false);
            }}
          >
            <span>Unassigned (B2C)</span>
            {!currentInstCode && <span>✓</span>}
          </button>
          {institutions.map((inst) => (
            <button
              key={inst._id}
              className="flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-base-200 transition-colors"
              onClick={() => {
                onChangeInstitution(user._id, inst._id);
                setOpen(false);
              }}
            >
              <div className="text-left">
                <p className="font-semibold text-slate-800">{inst.code}</p>
                <p className="text-[10px] text-slate-400 truncate max-w-[110px]">{inst.name}</p>
              </div>
              {currentInstCode === inst.code && <span className="text-success font-bold">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── User Row ───────────────────────────────────────────────────────────────────

const UserRow = ({ user, institutions, onChangeRole, onChangePlan, onChangeInstitution, onDelete, onToggleBan, loadingId, currentUserRole }) => {
  const isLoading = loadingId === user._id;
  const isEditingDisabled = currentUserRole !== "superadmin" && (user.role === "admin" || user.role === "superadmin");
  const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <tr className={`group transition-colors hover:bg-base-200/50 ${user.isBanned ? "opacity-60" : ""} ${isEditingDisabled ? "bg-base-200/20" : ""}`}>
      <td className="py-3 pl-4">
        <div className="flex items-center gap-3">
          <div className="avatar placeholder">
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary to-secondary text-white flex items-center justify-center text-sm font-bold">
              <span>{user.name?.[0]?.toUpperCase() ?? "?"}</span>
            </div>
          </div>
          <div>
            <p className="font-semibold text-sm leading-none">{user.name}</p>
            <p className="text-xs text-base-content/50 mt-0.5">{user.email}</p>
          </div>
        </div>
      </td>

      <td className="py-3">
        <RoleDropdown user={user} onChangeRole={onChangeRole} loading={isLoading} disabled={isEditingDisabled} currentUserRole={currentUserRole} />
      </td>

      <td className="py-3 hidden sm:table-cell">
        <InstitutionDropdown
          user={user}
          institutions={institutions}
          onChangeInstitution={onChangeInstitution}
          loading={isLoading}
          disabled={isEditingDisabled}
        />
      </td>

      <td className="py-3 hidden sm:table-cell">
        <PlanDropdown
          user={user}
          onChangePlan={onChangePlan}
          loading={isLoading}
          disabled={isEditingDisabled}
        />
      </td>

      <td className="py-3 hidden md:table-cell">
        {user.isBanned ? (
          <span className="badge badge-sm badge-error gap-1">
            <PiProhibit className="w-3 h-3" /> Banned
          </span>
        ) : (
          <span className="badge badge-sm badge-success gap-1">
            <PiCheckCircle className="w-3 h-3" /> Active
          </span>
        )}
      </td>

      <td className="py-3 hidden lg:table-cell">
        <span className="text-xs text-base-content/60">{joinDate}</span>
      </td>

      <td className="py-3 pr-4">
        {!isEditingDisabled && (
          <div className="flex items-center gap-1">
            <button
              className={`btn btn-ghost btn-xs tooltip ${user.isBanned ? "text-success" : "text-warning"}`}
              data-tip={user.isBanned ? "Unban" : "Ban"}
              onClick={() => onToggleBan(user)}
              disabled={isLoading}
            >
              {user.isBanned ? <PiCheckCircle className="w-4 h-4" /> : <PiProhibit className="w-4 h-4" />}
            </button>
            <button
              className="btn btn-ghost btn-xs text-error tooltip"
              data-tip="Delete"
              onClick={() => onDelete(user)}
              disabled={isLoading}
            >
              <PiTrash className="w-4 h-4" />
            </button>
          </div>
        )}
        {isLoading && <span className="loading loading-spinner loading-xs text-primary" />}
      </td>
    </tr>
  );
};

// ─── Stats Bar ──────────────────────────────────────────────────────────────────

const StatsBar = ({ users }) => {
  const total = users.length;
  const admins = users.filter((u) => u.role === "admin").length;
  const banned = users.filter((u) => u.isBanned).length;
  const standard = users.filter((u) => u.plan !== "free").length;

  const stats = [
    { label: "Total Users", value: total, icon: "👥", color: "text-primary" },
    { label: "Admins", value: admins, icon: "👑", color: "text-error" },
    { label: "Banned", value: banned, icon: "🚫", color: "text-warning" },
    { label: "Standard / Premium", value: standard, icon: "⭐", color: "text-success" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="card bg-base-100 border border-base-300 shadow-sm p-4 flex-row items-center gap-3">
          <span className="text-2xl">{s.icon}</span>
          <div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-base-content/60">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────

const ManageUsers = () => {
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();
  const { role: currentUserRole } = useRole();

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [loadingId, setLoadingId] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [institutions, setInstitutions] = useState([]);

  // Fetch institutions list for admin dropdown
  useEffect(() => {
    axiosSecure.get("/institutions").then((res) => {
      if (res.data.success) {
        setInstitutions(res.data.institutions || []);
      }
    }).catch((err) => console.error(err));
  }, []);

  // ── Timeframe Modal state ──────────────────────────────────────────────────
  const [timeframeModal, setTimeframeModal] = useState({
    open: false,
    user: null,
    targetPlan: null,
  });

  // ── useQuery: fetch all users (cached, auto-refetch on mount) ────────────────
  const {
    data: allUsers = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useAdminQuery(
    ["admin-users"],
    "/user/all",
    "users",
    {
      gcTime: 1000 * 60 * 10,
      retry: 2,
    }
  );

  // ── useMutation: change institution ──────────────────────────────────────────
  const institutionMutation = useMutation({
    mutationFn: ({ id, institutionId }) => axiosSecure.patch(`/user/${id}/institution`, { institutionId }),
    onSuccess: (res) => {
      Swal.fire({
        title: "Institution Updated!",
        text: res.data?.message || "User institution affiliation updated.",
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setLoadingId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update institution");
      setLoadingId(null);
    },
  });

  const handleChangeInstitution = (id, institutionId) => {
    setLoadingId(id);
    institutionMutation.mutate({ id, institutionId });
  };

  // ── useMutation: change role ──────────────────────────────────────────────────
  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => axiosSecure.patch(`/user/${id}/role`, { role }),
    onSuccess: (_, { role }) => {
        Swal.fire({
            title: "Updated!",
            text: `User role has been changed to ${role}.`,
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
            background: "#ffffff",
            customClass: { popup: "rounded-[2rem]" }
        });
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        setLoadingId(null);
    },
    onError: (err) => {
        toast.error(err.response?.data?.message || "Failed to update role");
        setLoadingId(null);
    }
  });

  // ── useMutation: toggle ban ───────────────────────────────────────────────────
  const banMutation = useMutation({
    mutationFn: ({ id }) => axiosSecure.patch(`/user/${id}/ban`),
    onSuccess: (data, { isBanned }) => {
        const nowBanned = data?.data?.user?.isBanned ?? !isBanned;
        Swal.fire({
            title: nowBanned ? "Banned!" : "Unbanned!",
            text: nowBanned ? "User has been restricted." : "User has regained access.",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
            background: "#ffffff",
            customClass: { popup: "rounded-[2rem]" }
        });
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        setLoadingId(null);
    },
    onError: (err) => {
        toast.error(err.response?.data?.message || "Failed to update status");
        setLoadingId(null);
    }
  });

  // ── useMutation: change plan ──────────────────────────────────────────────────
  const planMutation = useMutation({
    mutationFn: (payload) => axiosSecure.patch(`/user/${payload.id}/plan`, payload),
    onSuccess: (_, { plan }) => {
        setTimeframeModal({ open: false, user: null, targetPlan: null });
        Swal.fire({
            title: "Plan Updated!",
            text: `User plan has been successfully updated to ${plan.toUpperCase()}.`,
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
            background: "#ffffff",
            customClass: { popup: "rounded-[2rem]" }
        });
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        setLoadingId(null);
    },
    onError: () => {
        toast.error("Failed to update plan");
        setLoadingId(null);
    }
  });

  // ── useMutation: delete user ──────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: ({ id }) => axiosSecure.delete(`/user/${id}`),
    onSuccess: () => {
        Swal.fire({
            title: "Deleted!",
            text: "User account has been permanently removed.",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
            background: "#ffffff",
            customClass: { popup: "rounded-[2rem]" }
        });
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        setLoadingId(null);
    },
    onError: () => {
        toast.error("Failed to delete user");
        setLoadingId(null);
    }
  });

  const visibleUsers = useMemo(() => {
    return allUsers.filter((u) => u.role !== "superadmin");
  }, [allUsers]);

  // ── Client-side filtering (derived via useMemo) ───────────────────────────────
  const users = useMemo(() => {
    let filtered = [...visibleUsers];
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "all") filtered = filtered.filter((u) => u.role === roleFilter);
    if (planFilter !== "all") filtered = filtered.filter((u) => u.plan === planFilter);
    if (statusFilter === "banned") filtered = filtered.filter((u) => u.isBanned);
    if (statusFilter === "active") filtered = filtered.filter((u) => !u.isBanned);
    return filtered;
  }, [visibleUsers, search, roleFilter, planFilter, statusFilter]);

  // ── Action handlers (open SweetAlert or Timeframe modal, then fire mutation) ──
  const handleChangeRole = async (id, newRole) => {
    const result = await Swal.fire({
        title: "Change User Role?",
        text: `Are you sure you want to change this user to ${newRole}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3B82F6",
        cancelButtonColor: "#6B7280",
        confirmButtonText: "Yes, Change Role",
        background: "#ffffff",
        customClass: {
            popup: "rounded-[2rem]",
            confirmButton: "rounded-xl px-6 py-2.5 font-bold",
            cancelButton: "rounded-xl px-6 py-2.5 font-bold"
        }
    });

    if (result.isConfirmed) {
        setLoadingId(id);
        roleMutation.mutate({ id, role: newRole });
    }
  };

  const handleChangePlan = async (user, newPlan) => {
    if (newPlan === "free") {
      const result = await Swal.fire({
          title: "Downgrade to Free Plan?",
          text: `Are you sure you want to revert "${user.name}" to the Free plan? Active plan expiration will be cleared.`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#EF4444",
          cancelButtonColor: "#6B7280",
          confirmButtonText: "Yes, Downgrade to Free",
          background: "#ffffff",
          customClass: {
              popup: "rounded-[2rem]",
              confirmButton: "rounded-xl px-6 py-2.5 font-bold",
              cancelButton: "rounded-xl px-6 py-2.5 font-bold"
          }
      });

      if (result.isConfirmed) {
          setLoadingId(user._id);
          planMutation.mutate({ id: user._id, plan: "free" });
      }
      return;
    }

    // Launch timeframe modal for standard/premium plan assignment
    setTimeframeModal({ open: true, user, targetPlan: newPlan });
  };

  const handleToggleBan = async (user) => {
    const banning = !user.isBanned;
    const result = await Swal.fire({
        title: banning ? "Ban User?" : "Unban User?",
        text: banning 
            ? `Are you sure? "${user.name}" will lose all access to the platform.`
            : `Are you sure? "${user.name}" will regain access to the platform.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: banning ? "#EF4444" : "#10B981",
        cancelButtonColor: "#6B7280",
        confirmButtonText: banning ? "Yes, Ban User" : "Yes, Unban User",
        background: "#ffffff",
        customClass: {
            popup: "rounded-[2rem]",
            confirmButton: "rounded-xl px-6 py-2.5 font-bold",
            cancelButton: "rounded-xl px-6 py-2.5 font-bold"
        }
    });

    if (result.isConfirmed) {
        setLoadingId(user._id);
        banMutation.mutate({ id: user._id, isBanned: user.isBanned });
    }
  };

  const handleDelete = async (user) => {
    const result = await Swal.fire({
        title: "Delete User Permanently?",
        text: `Are you sure you want to delete "${user.name}"? This action is irreversible.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#EF4444",
        cancelButtonColor: "#6B7280",
        confirmButtonText: "Yes, Delete Permanently",
        background: "#ffffff",
        customClass: {
            popup: "rounded-[2rem]",
            confirmButton: "rounded-xl px-6 py-2.5 font-bold",
            cancelButton: "rounded-xl px-6 py-2.5 font-bold"
        }
    });

    if (result.isConfirmed) {
        setLoadingId(user._id);
        deleteMutation.mutate({ id: user._id });
    }
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-primary font-semibold">
              Administration
            </p>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <PiUsersThree className="text-primary" />
              Manage Users
            </h1>
            <p className="text-base-content/60 mt-1 text-sm">
              Control roles, access, and account status across the platform.
            </p>
          </div>
          <button
            className="btn btn-outline btn-sm gap-2 self-start sm:self-auto"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <PiArrowClockwise className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <StatsBar users={visibleUsers} />

        {/* Filters */}
        <div className="card bg-base-100 border border-base-300 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <label className="input input-bordered input-sm flex items-center gap-2 flex-1 min-w-[180px]">
              <PiMagnifyingGlass className="w-4 h-4 text-base-content/50" />
              <input
                type="text"
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="grow bg-transparent outline-none"
              />
            </label>

            <select
              className="select select-bordered select-sm min-w-[120px]"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r} className="capitalize">{r}</option>
              ))}
            </select>

            <select
              className="select select-bordered select-sm min-w-[120px]"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>

            <select
              className="select select-bordered select-sm min-w-[120px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <TableShell
          isLoading={isLoading}
          isError={isError}
          errorText="Failed to load users"
          onRetry={refetch}
          empty={users.length === 0}
          emptyTitle="No users found"
          emptyText="Try adjusting your search or filters"
          emptyIcon={<PiUsersThree />}
          loadingText="Loading users list..."
        >
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-base-200/70">
                <tr>
                  <th className="pl-4 text-xs font-semibold text-base-content/60 uppercase tracking-wider">User</th>
                  <th className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Role</th>
                  <th className="text-xs font-semibold text-base-content/60 uppercase tracking-wider hidden sm:table-cell">Institution</th>
                  <th className="text-xs font-semibold text-base-content/60 uppercase tracking-wider hidden sm:table-cell">Plan</th>
                  <th className="text-xs font-semibold text-base-content/60 uppercase tracking-wider hidden md:table-cell">Status</th>
                  <th className="text-xs font-semibold text-base-content/60 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                  <th className="pr-4 text-xs font-semibold text-base-content/60 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200">
                {users.map((user) => (
                  <UserRow
                    key={user._id}
                    user={user}
                    institutions={institutions}
                    onChangeRole={handleChangeRole}
                    onChangePlan={handleChangePlan}
                    onChangeInstitution={handleChangeInstitution}
                    onDelete={handleDelete}
                    onToggleBan={handleToggleBan}
                    loadingId={loadingId}
                    currentUserRole={currentUserRole}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {!isLoading && !isError && users.length > 0 && (
            <div className="flex items-center justify-between border-t border-base-200 px-4 py-3 text-xs text-base-content/50">
              <span>
                Showing <span className="font-medium text-base-content">{users.length}</span> of{" "}
                <span className="font-medium text-base-content">{visibleUsers.length}</span> users
              </span>
              <div className="flex items-center gap-1">
                <PiShieldStar className="w-3 h-3 text-primary" />
                <span>Admin Panel</span>
              </div>
            </div>
          )}
        </TableShell>

        {/* Timeframe Selection Modal */}
        <PlanTimeframeModal
          isOpen={timeframeModal.open}
          onClose={() => setTimeframeModal({ open: false, user: null, targetPlan: null })}
          user={timeframeModal.user}
          targetPlan={timeframeModal.targetPlan}
          loading={planMutation.isPending}
          onConfirm={({ userId, plan, timeframeType, monthsCount, customEndDate }) => {
            setLoadingId(userId);
            planMutation.mutate({
              id: userId,
              plan,
              timeframeType,
              monthsCount,
              customEndDate,
            });
          }}
        />
      </div>
  );
};

export default ManageUsers;
