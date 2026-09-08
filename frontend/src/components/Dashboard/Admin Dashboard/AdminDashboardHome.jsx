import useAxiosSecure from "../../../hooks/useAxiosSecure";
import useAdminQuery from "../../../hooks/useAdminQuery";
import { 
  FiUsers, 
  FiFileText, 
  FiTrendingUp, 
  FiUserPlus,
  FiActivity,
  FiCalendar,
  FiUser,
  FiClock
} from "react-icons/fi";
import { motion } from "framer-motion";
import Error from "../../Common/Error";
import PageHeader from "../../Common/PageHeader";
import StatCard from "../../Common/StatCard";
import TableSkeleton from "../../Common/Skeleton/TableSkeleton";

const AdminDashboardHome = () => {
  const axiosSecure = useAxiosSecure();

  const { data: analytics, isLoading, isError } = useAdminQuery(
    ["admin-analytics"],
    "/analytics/admin",
    "data"
  );

  if (isError && !isLoading) {
    return <Error/>;
  }

  // Destructure with fallbacks to prevent "undefined" crashes
  const { overview = {}, studentStats = [], recentActivity = [] } = analytics || {};

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 p-4 md:p-6"
    >
      {/* Header */}
      <PageHeader
        title="System Overview"
        subtitle='"Real-time platform metrics and student performance tracking."'
        className="!p-0 !bg-transparent !border-none !shadow-none !rounded-none"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Users"
          value={overview.totalUsers ?? 0}
          icon={<FiUsers />}
          color="blue"
          loading={isLoading}
          variants={itemVariants}
          description={
            <>
              <span className="text-green-500 flex items-center">
                <FiUserPlus className="mr-1" /> {overview.usersToday ?? 0}
              </span>
              <span className="ml-2 text-gray-400">New Today</span>
            </>
          }
        />

        <StatCard
          label="Tests Completed"
          value={overview.totalTests ?? 0}
          icon={<FiFileText />}
          color="purple"
          loading={isLoading}
          variants={itemVariants}
          description={
            <>
              <span className="text-green-500 flex items-center">
                <FiActivity className="mr-1" /> {overview.testsToday ?? 0}
              </span>
              <span className="ml-2 text-gray-400">Today</span>
            </>
          }
        />

        <StatCard
          label="Average/User"
          value={(overview.totalTests / (overview.totalUsers || 1)).toFixed(1)}
          icon={<FiTrendingUp />}
          color="orange"
          loading={isLoading}
          variants={itemVariants}
          description={
            <>
              <FiCalendar className="mr-1 text-slate-400" /> <span className="text-slate-400">Session Density</span>
            </>
          }
        />

        <StatCard
          label="Live Traffic"
          value={overview.testsToday ?? 0}
          icon={<FiActivity />}
          color="green"
          loading={isLoading}
          variants={itemVariants}
          description={
            <>
              <span className="text-green-500 animate-pulse">● Active</span>
              <span className="ml-2 text-slate-400">Monitoring</span>
            </>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-black tracking-tight text-gray-800 dark:text-white flex items-center gap-2">
                <FiClock className="text-primary" />
                Recent Test Attempts
            </h2>
            <button className="btn btn-ghost btn-xs font-black uppercase tracking-widest text-primary hover:bg-primary/5">
              Live Feed
            </button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[500px] overflow-y-auto">
            {isLoading ? (
              <div className="p-6">
                <TableSkeleton rows={4} columns={2} />
              </div>
            ) : recentActivity.length > 0 ? recentActivity.map((activity) => (
              <div key={activity._id} className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black uppercase text-xl">
                    {activity.userId?.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <div className="text-sm font-black text-gray-800 dark:text-white">{activity.userId?.name || "Unknown Student"}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status: {activity.status}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-[10px] font-black px-3 py-2 rounded-xl inline-block uppercase tracking-widest ${
                    activity.tabSwitchCount > 0 ? "bg-error/10 text-error" : "bg-success/10 text-success"
                  }`}>
                    {activity.tabSwitchCount} Violations
                  </div>
                  <div className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-tighter">
                    {new Date(activity.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )) : (
                <div className="p-20 text-center text-gray-400 italic">No recent activity detected.</div>
            )}
          </div>
        </motion.div>

        {/* Student Performance */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-black tracking-tight text-gray-800 dark:text-white flex items-center gap-2">
                <FiTrendingUp className="text-primary" />
                Top Performers
            </h2>
            <FiTrendingUp className="text-gray-400" />
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-6">
                <TableSkeleton rows={4} columns={3} />
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50">
                    <th className="px-8 py-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Student</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">Tests</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest text-right">Last Session</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {studentStats.length > 0 ? studentStats.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                            <FiUser className="text-gray-500 dark:text-gray-400" />
                          </div>
                          <div>
                            <div className="text-sm font-black text-gray-800 dark:text-white">{student.name || "Unknown"}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="text-lg font-black text-blue-600 dark:text-blue-400">{student.testCount}</span>
                      </td>
                      <td className="px-8 py-6 text-right text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                        {new Date(student.lastAttempt).toLocaleDateString()}
                      </td>
                    </tr>
                  )) : (
                      <tr><td colSpan="3" className="p-20 text-center italic text-gray-400">Awaiting student data...</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminDashboardHome;
