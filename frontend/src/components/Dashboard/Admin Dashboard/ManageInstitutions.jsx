import React, { useState, useEffect } from "react";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import { Link } from "react-router";
import Swal from "sweetalert2";
import {
  PiBuildings,
  PiPlus,
  PiMagnifyingGlass,
  PiUsersThree,
  PiGraduationCap,
  PiFileText,
  PiCheckCircle,
  PiXCircle,
  PiEye,
  PiUserPlus,
  PiPencil,
  PiTrash,
  PiArrowsCounterClockwise,
} from "react-icons/pi";

const ManageInstitutions = () => {
  const axiosSecure = useAxiosSecure();
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    notes: "",
  });

  // Assign User Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedInst, setSelectedInst] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [assigningUserId, setAssigningUserId] = useState(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: "",
    name: "",
    code: "",
    status: "active",
    contactEmail: "",
    contactPhone: "",
    address: "",
    notes: "",
  });

  const fetchInstitutions = async () => {
    setLoading(true);
    try {
      let url = `/institutions?search=${encodeURIComponent(searchQuery)}`;
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }
      const response = await axiosSecure.get(url);
      if (response.data.success) {
        setInstitutions(response.data.institutions || []);
      }
    } catch (error) {
      console.error("Error fetching institutions:", error);
      Swal.fire("Error", error.response?.data?.message || "Failed to fetch institutions", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, [searchQuery, statusFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      Swal.fire("Error", "Institution Name and Code are required", "warning");
      return;
    }

    setCreateLoading(true);
    try {
      const response = await axiosSecure.post("/institutions", {
        ...formData,
        code: formData.code.toUpperCase().trim(),
      });

      if (response.data.success) {
        Swal.fire("Success", `Institution '${formData.name}' created!`, "success");
        setShowCreateModal(false);
        setFormData({
          name: "",
          code: "",
          contactEmail: "",
          contactPhone: "",
          address: "",
          notes: "",
        });
        fetchInstitutions();
      }
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Failed to create institution", "error");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosSecure.patch(`/institutions/${editFormData.id}`, {
        name: editFormData.name,
        code: editFormData.code.toUpperCase().trim(),
        status: editFormData.status,
        contactEmail: editFormData.contactEmail,
        contactPhone: editFormData.contactPhone,
        address: editFormData.address,
        notes: editFormData.notes,
      });

      if (response.data.success) {
        Swal.fire("Updated!", "Institution updated successfully", "success");
        setShowEditModal(false);
        fetchInstitutions();
      }
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Failed to update institution", "error");
    }
  };

  const handleDelete = async (inst) => {
    const confirm = await Swal.fire({
      title: `Delete ${inst.name}?`,
      text: "This will unlink all affiliated students and instructors to B2C unassigned.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, Delete",
    });

    if (confirm.isConfirmed) {
      try {
        const response = await axiosSecure.delete(`/institutions/${inst._id}`);
        if (response.data.success) {
          Swal.fire("Deleted", "Institution deleted successfully", "success");
          fetchInstitutions();
        }
      } catch (error) {
        Swal.fire("Error", error.response?.data?.message || "Failed to delete institution", "error");
      }
    }
  };

  // Assign user modal search
  const fetchUsersForAssign = async (query = "") => {
    setUsersLoading(true);
    try {
      const res = await axiosSecure.get(`/user/all?search=${encodeURIComponent(query)}&limit=15`);
      if (res.data.success) {
        setUsersList(res.data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  const openAssignModal = (inst) => {
    setSelectedInst(inst);
    setShowAssignModal(true);
    setUserSearch("");
    fetchUsersForAssign("");
  };

  const handleAssignUser = async (userId) => {
    if (!selectedInst) return;
    setAssigningUserId(userId);
    try {
      const response = await axiosSecure.post(`/institutions/${selectedInst._id}/assign-user`, {
        userId,
      });
      if (response.data.success) {
        Swal.fire("Assigned!", response.data.message, "success");
        fetchInstitutions();
        fetchUsersForAssign(userSearch);
      }
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Failed to assign user", "error");
    } finally {
      setAssigningUserId(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <PiBuildings className="w-8 h-8 text-indigo-400" />
            <h1 className="text-2xl font-bold">Manage Institutions</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Create partner institutes with unique codes, assign users, and monitor institutional analytics.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition shadow-lg shadow-indigo-600/30"
        >
          <PiPlus className="w-5 h-5" />
          Create Institution
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <PiMagnifyingGlass className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by institute name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={fetchInstitutions}
            className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg transition"
            title="Refresh list"
          >
            <PiArrowsCounterClockwise className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-2">
            <PiArrowsCounterClockwise className="w-8 h-8 animate-spin text-indigo-600" />
            <p>Loading Institutions...</p>
          </div>
        ) : institutions.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <PiBuildings className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No Institutions Found</p>
            <p className="text-xs text-slate-400 mt-1">Try broadening your search or create a new institute.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                  <th className="py-3.5 px-4">Institute Details</th>
                  <th className="py-3.5 px-4">Institute Code</th>
                  <th className="py-3.5 px-4 text-center">Students</th>
                  <th className="py-3.5 px-4 text-center">Instructors</th>
                  <th className="py-3.5 px-4 text-center">Submissions</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {institutions.map((inst) => (
                  <tr key={inst._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-4">
                      <div>
                        <Link
                          to={`/dashboard/admin/manage-institutions/${inst._id}`}
                          className="font-bold text-slate-900 hover:text-indigo-600 transition"
                        >
                          {inst.name}
                        </Link>
                        {inst.contactEmail && (
                          <p className="text-xs text-slate-400 mt-0.5">{inst.contactEmail}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {inst.code}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        <PiGraduationCap className="w-4 h-4 text-emerald-500" />
                        {inst.studentCount || 0}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        <PiUsersThree className="w-4 h-4 text-blue-500" />
                        {inst.instructorCount || 0}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        <PiFileText className="w-4 h-4 text-purple-500" />
                        {inst.totalSubmissions || 0}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {inst.status === "active" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <PiCheckCircle className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                          <PiXCircle className="w-3.5 h-3.5" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/dashboard/admin/manage-institutions/${inst._id}`}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                          title="View Details & Analytics"
                        >
                          <PiEye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => openAssignModal(inst)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition"
                          title="Assign Users"
                        >
                          <PiUserPlus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditFormData({
                              id: inst._id,
                              name: inst.name,
                              code: inst.code,
                              status: inst.status,
                              contactEmail: inst.contactEmail || "",
                              contactPhone: inst.contactPhone || "",
                              address: inst.address || "",
                              notes: inst.notes || "",
                            });
                            setShowEditModal(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Institution"
                        >
                          <PiPencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(inst)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                          title="Delete Institution"
                        >
                          <PiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Institution Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PiBuildings className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-lg">Create New Institution</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Institution Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oxford IELTS Academy"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Manual Unique Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OXFORD2026"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase().trim() })
                  }
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Students will input this code during registration or on their profile to link to this institution.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="contact@oxford.edu"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+1 555-0192"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="123 Education St, London"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition shadow-md shadow-indigo-600/30"
                >
                  {createLoading ? "Saving..." : "Create Institution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Institution Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-lg">Edit Institution</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Institution Name
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Institute Code
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.code}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        code: e.target.value.toUpperCase().trim(),
                      })
                    }
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, status: e.target.value })
                    }
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign User Modal */}
      {showAssignModal && selectedInst && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Assign User to {selectedInst.name}</h3>
                <p className="text-xs text-indigo-300 font-mono mt-0.5">Code: {selectedInst.code}</p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <PiMagnifyingGlass className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    fetchUsersForAssign(e.target.value);
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
              {usersLoading ? (
                <div className="py-10 text-center text-slate-400 text-sm">Searching users...</div>
              ) : usersList.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm">No matching users found.</div>
              ) : (
                usersList.map((u) => {
                  const isAlreadyAssigned = u.institution === selectedInst._id;
                  return (
                    <div key={u._id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email} • <span className="capitalize font-semibold text-slate-600">{u.role}</span></p>
                        {u.institutionCode && (
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            Current: {u.institutionCode}
                          </span>
                        )}
                      </div>

                      <button
                        disabled={isAlreadyAssigned || assigningUserId === u._id}
                        onClick={() => handleAssignUser(u._id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isAlreadyAssigned
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                        }`}
                      >
                        {isAlreadyAssigned ? "Assigned" : assigningUserId === u._id ? "Assigning..." : "Assign User"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageInstitutions;
