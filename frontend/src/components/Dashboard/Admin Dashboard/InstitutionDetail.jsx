import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import Swal from "sweetalert2";
import {
  PiBuildings,
  PiArrowLeft,
  PiGraduationCap,
  PiUsersThree,
  PiFileText,
  PiMagnifyingGlass,
  PiUserMinus,
  PiEnvelopeSimple,
  PiPhone,
  PiMapPin,
  PiCalendarBlank,
  PiCheckCircle,
  PiXCircle,
  PiArrowsCounterClockwise,
} from "react-icons/pi";

const InstitutionDetail = () => {
  const { id } = useParams();
  const axiosSecure = useAxiosSecure();

  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("students"); // students | instructors | analytics

  // Students roster state
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  // Analytics state
  const [analytics, setAnalytics] = useState(null);

  const fetchInstitutionDetails = async () => {
    setLoading(true);
    try {
      const res = await axiosSecure.get(`/institutions/${id}`);
      if (res.data.success) {
        setInstitution(res.data.institution);
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to fetch institution details", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const res = await axiosSecure.get(
        `/institutions/${id}/students?search=${encodeURIComponent(studentSearch)}`
      );
      if (res.data.success) {
        setStudents(res.data.students || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axiosSecure.get(`/institutions/${id}/analytics`);
      if (res.data.success) {
        setAnalytics(res.data.analytics);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInstitutionDetails();
    fetchAnalytics();
  }, [id]);

  useEffect(() => {
    if (activeTab === "students") {
      fetchStudents();
    }
  }, [id, activeTab, studentSearch]);

  const handleUnassignUser = async (userId, userName) => {
    const confirm = await Swal.fire({
      title: `Unlink ${userName}?`,
      text: "This user will be set to Global B2C unassigned.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Unlink",
    });

    if (confirm.isConfirmed) {
      try {
        const res = await axiosSecure.delete(`/institutions/${id}/users/${userId}`);
        if (res.data.success) {
          Swal.fire("Unlinked", `${userName} has been removed from this institution`, "success");
          fetchInstitutionDetails();
          fetchStudents();
        }
      } catch (err) {
        Swal.fire("Error", err.response?.data?.message || "Failed to unlink user", "error");
      }
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-2">
        <PiArrowsCounterClockwise className="w-8 h-8 animate-spin text-indigo-600" />
        <p>Loading Institution Details...</p>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <p className="text-rose-600 font-semibold">Institution Not Found</p>
        <Link
          to="/dashboard/admin/manage-institutions"
          className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:underline"
        >
          <PiArrowLeft className="w-4 h-4" /> Back to Institutions
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <Link
        to="/dashboard/admin/manage-institutions"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium text-sm transition"
      >
        <PiArrowLeft className="w-4 h-4" /> Back to Institutions
      </Link>

      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/30">
              <PiBuildings className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{institution.name}</h1>
                <span className="px-3 py-1 rounded-md text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {institution.code}
                </span>
                {institution.status === "active" ? (
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    Active
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-slate-400 bg-slate-500/10 px-2.5 py-0.5 rounded-full border border-slate-500/20">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Created: {new Date(institution.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info Pills */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
          {institution.contactEmail && (
            <div className="flex items-center gap-1.5">
              <PiEnvelopeSimple className="w-4 h-4 text-indigo-400" />
              <span>{institution.contactEmail}</span>
            </div>
          )}
          {institution.contactPhone && (
            <div className="flex items-center gap-1.5">
              <PiPhone className="w-4 h-4 text-indigo-400" />
              <span>{institution.contactPhone}</span>
            </div>
          )}
          {institution.address && (
            <div className="flex items-center gap-1.5">
              <PiMapPin className="w-4 h-4 text-indigo-400" />
              <span>{institution.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <PiGraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Enrolled Students</p>
            <p className="text-2xl font-bold text-slate-900">{institution.studentCount || 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <PiUsersThree className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Assigned Instructors</p>
            <p className="text-2xl font-bold text-slate-900">{institution.instructorCount || 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <PiFileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Submissions</p>
            <p className="text-2xl font-bold text-slate-900">{institution.totalSubmissions || 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <PiArrowsCounterClockwise className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Pending Reviews</p>
            <p className="text-2xl font-bold text-slate-900">{analytics?.pendingReviews || 0}</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("students")}
          className={`pb-3 transition border-b-2 ${
            activeTab === "students"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Enrolled Students Roster ({institution.studentCount || 0})
        </button>
        <button
          onClick={() => setActiveTab("instructors")}
          className={`pb-3 transition border-b-2 ${
            activeTab === "instructors"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Assigned Instructors ({institution.instructorCount || 0})
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`pb-3 transition border-b-2 ${
            activeTab === "analytics"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Performance Analytics
        </button>
      </div>

      {/* Tab 1: Students Roster */}
      {activeTab === "students" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <PiMagnifyingGlass className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search student by name or email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <button
              onClick={fetchStudents}
              className="p-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-600"
            >
              <PiArrowsCounterClockwise className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {studentsLoading ? (
              <div className="py-12 text-center text-slate-400">Loading student roster...</div>
            ) : students.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                No students enrolled under this institution code yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                      <th className="py-3.5 px-4">Student</th>
                      <th className="py-3.5 px-4">Target Exam</th>
                      <th className="py-3.5 px-4 text-center">Mock Tests Taken</th>
                      <th className="py-3.5 px-4 text-center">Practices Completed</th>
                      <th className="py-3.5 px-4">Joined Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {students.map((st) => (
                      <tr key={st._id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-900">{st.name}</p>
                          <p className="text-xs text-slate-500">{st.email}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {st.targetExam || "IELTS"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                          {st.completedMockTests || 0}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                          {st.completedPractices || 0}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {new Date(st.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleUnassignUser(st._id, st.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Unlink from Institution"
                          >
                            <PiUserMinus className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Assigned Instructors */}
      {activeTab === "instructors" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">Assigned Evaluators</h3>
          {institution.assignedInstructors && institution.assignedInstructors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {institution.assignedInstructors.map((instUser) => (
                <div
                  key={instUser._id}
                  className="p-4 border border-slate-200 rounded-xl flex items-center justify-between gap-4 bg-slate-50/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-base">
                      {instUser.name ? instUser.name.charAt(0).toUpperCase() : "I"}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{instUser.name}</p>
                      <p className="text-xs text-slate-500">{instUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnassignUser(instUser._id, instUser.name)}
                    className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition border border-rose-200"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              No instructors assigned specifically to this institution yet. Use the "Assign User" button on the main Institutions page to assign evaluators.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Performance Analytics */}
      {activeTab === "analytics" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <h3 className="font-bold text-slate-900 text-lg">Institution Activity & Performance Metrics</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50">
              <p className="text-xs font-semibold text-slate-500 uppercase">Mock Tests Created by Students</p>
              <p className="text-3xl font-extrabold text-indigo-600 mt-2">
                {analytics?.totalMockTests || 0}
              </p>
            </div>

            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50">
              <p className="text-xs font-semibold text-slate-500 uppercase">Practice Laboratory Submissions</p>
              <p className="text-3xl font-extrabold text-purple-600 mt-2">
                {analytics?.totalPracticeLabSubmissions || 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionDetail;
