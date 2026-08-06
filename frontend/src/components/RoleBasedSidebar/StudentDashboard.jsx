import { NavLink, useLocation } from "react-router";
import { PiChartBar, PiPenNib, PiMagnifyingGlass, PiTrendUp, PiFiles, PiGraduationCap, PiNotebook } from "react-icons/pi";
import { useQueryClient } from "@tanstack/react-query";
import useAxiosSecure from "../../hooks/useAxiosSecure";

const StudentDashboard = ({ isDrawerOpen }) => {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const location = useLocation();
    const { pathname } = location;

    const isPracticeActive =
        pathname === "/dashboard/practice" ||
        pathname.startsWith("/dashboard/reading") ||
        pathname.startsWith("/dashboard/listening") ||
        pathname.startsWith("/dashboard/writing") ||
        pathname.startsWith("/dashboard/speaking");

    const isReviewActive = pathname.startsWith("/dashboard/review");

    const prefetchAnalytics = () => {
        queryClient.prefetchQuery({
            queryKey: ["analytics-summary"],
            queryFn: async () => {
                const res = await axiosSecure.get(`/analytics/summary`);
                return res.data.summary;
            },
            staleTime: 5 * 60 * 1000,
        });
    };

    const prefetchReview = () => {
        queryClient.prefetchQuery({
            queryKey: ["user-mock-results"],
            queryFn: async () => {
                const res = await axiosSecure.get("/mock-tests/results/user");
                return res.data.results ?? [];
            },
            staleTime: 5 * 60 * 1000,
        });
        queryClient.prefetchQuery({
            queryKey: ["user-lab-results"],
            queryFn: async () => {
                const res = await axiosSecure.get("/submissions/my-submissions");
                return res.data.submissions ?? [];
            },
            staleTime: 5 * 60 * 1000,
        });
    };

    const prefetchMockTests = () => {
        queryClient.prefetchQuery({
            queryKey: ["full-mock-tests"],
            queryFn: async () => {
                const res = await axiosSecure.get("/mock-tests");
                return {
                    tests: res.data.tests ?? [],
                    todayMockTestTaken: res.data.todayMockTestTaken ?? false
                };
            },
            staleTime: 5 * 60 * 1000,
        });
    };

    return (
        <>
            <li className={!isDrawerOpen ? "tooltip tooltip-right z-50" : ""} data-tip="Dashboard">
                <NavLink to="/dashboard" end className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}>
                    <PiChartBar className="w-5 h-5 shrink-0" />
                    {isDrawerOpen && <span>Dashboard</span>}
                </NavLink>
            </li>
            <li className={!isDrawerOpen ? "tooltip tooltip-right z-50" : ""} data-tip="Take a Test">
                <NavLink to="/dashboard/practice" className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive || isPracticeActive ? "active" : ""}`}>
                    <PiPenNib className="w-5 h-5 shrink-0" />
                    {isDrawerOpen && <span>Take a Test</span>}
                </NavLink>
            </li>
            <li className={!isDrawerOpen ? "tooltip tooltip-right z-50" : ""} data-tip="Full Mock Test">
                <NavLink 
                    to="/dashboard/full-mock-test" 
                    onMouseEnter={prefetchMockTests}
                    className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}
                >
                    <PiFiles className="w-5 h-5 shrink-0" />
                    {isDrawerOpen && <span>Full Mock Test</span>}
                </NavLink>
            </li>
            <li className={!isDrawerOpen ? "tooltip tooltip-right z-50" : ""} data-tip="Review">
                <NavLink 
                    to="/dashboard/review" 
                    onMouseEnter={prefetchReview}
                    className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive || isReviewActive ? "active" : ""}`}
                >
                    <PiMagnifyingGlass className="w-5 h-5 shrink-0" />
                    {isDrawerOpen && <span>Review</span>}
                </NavLink>
            </li>
            <li className={!isDrawerOpen ? "tooltip tooltip-right z-50" : ""} data-tip="Analytics">
                <NavLink 
                    to="/dashboard/analytics" 
                    onMouseEnter={prefetchAnalytics}
                    className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}
                >
                    <PiTrendUp className="w-5 h-5 shrink-0" />
                    {isDrawerOpen && <span>Analytics</span>}
                </NavLink>
            </li>
            <li className={!isDrawerOpen ? "tooltip tooltip-right z-50" : ""} data-tip="Trainers">
                <NavLink to="/dashboard/trainer" className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}>
                    <PiGraduationCap className="w-5 h-5 shrink-0" />
                    {isDrawerOpen && <span>Trainers</span>}
                </NavLink>
            </li>
            <li className={!isDrawerOpen ? "tooltip tooltip-right z-50" : ""} data-tip="Courses">
                <NavLink to="/dashboard/courses" className={({ isActive }) => `${!isDrawerOpen ? "justify-center" : ""} ${isActive ? "active" : ""}`}>
                    <PiNotebook className="w-5 h-5 shrink-0" />
                    {isDrawerOpen && <span>Courses</span>}
                </NavLink>
            </li>
        </>
    );
};

export default StudentDashboard;
