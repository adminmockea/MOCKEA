import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import PrivateRoute from "../context/PrivateRoute";
import Loader from "../components/Loader/Loader";
import Error from "../components/Common/Error";
import { AdminRoutes } from "../context/Role Based Routes/AdminRoutes";
import { SuperAdminRoutes } from "../context/Role Based Routes/SuperAdminRoutes";
import { InstructorRoutes } from "../context/Role Based Routes/InstructorRoutes";
import { StudentRoutes } from "../context/Role Based Routes/StudentRoutes";
import FreePracticeLayout from "../Layout/FreePracticeLayout";
import RootLayout from "../Layout/RootLayout";
import TrackGuard from "../context/TrackGuard";

// Helper for Suspense wrapper
const withSuspense = (Component) => (
  <Suspense fallback={<Loader />}>
    <Component />
  </Suspense>
);

// Lazy Loaded Pages & Layouts
const Home = lazy(() => import("../components/Home/Home"));
const Login = lazy(() => import("../components/Auth/Login"));
const Register = lazy(() => import("../components/Auth/Register"));
const HomeLayout = lazy(() => import("../Layout/HomeLayout"));
const AuthLayout = lazy(() => import("../components/Auth/AuthLayout"));
const ExamPreferenceRedirect = lazy(() => import("../components/Common/ExamPreferenceRedirect"));
const DashboardLayout = lazy(() => import("../Layout/DashboardLayout"));
const Profile = lazy(() => import("../components/Dashboard/Profile"));
const Review = lazy(() => import("../components/Dashboard/Student Dashboard/Review/Review"));
const ReviewDetail = lazy(() => import("../components/Dashboard/Student Dashboard/Review/ReviewDetail"));
const Analytics = lazy(() => import("../components/Dashboard/Student Dashboard/Analytics/Analytics"));
const Practice = lazy(() => import("../components/Dashboard/Student Dashboard/Practice/Practice"));
const TakeTest = lazy(() => import("../components/Dashboard/Student Dashboard/TakeTest/TakeTest"));
const Reading = lazy(() => import("../components/Dashboard/Student Dashboard/Reading/Reading"));
const Listening = lazy(() => import("../components/Dashboard/Student Dashboard/Listening/Listening"));
const Writing = lazy(() => import("../components/Dashboard/Student Dashboard/Writing/Writing"));
const Speaking = lazy(() => import("../components/Dashboard/Student Dashboard/Speaking/Speaking"));
const DashboardIndex = lazy(() => import("../components/Dashboard/DashboardIndex"));
const ManageUsers = lazy(() => import("../components/Dashboard/Admin Dashboard/ManageUsers"));
const ManageInstitutions = lazy(() => import("../components/Dashboard/Admin Dashboard/ManageInstitutions"));
const InstitutionDetail = lazy(() => import("../components/Dashboard/Admin Dashboard/InstitutionDetail"));
const ManageSubmissions = lazy(() => import("../components/Dashboard/Admin Dashboard/ManageSubmissions"));
const AdminSettings = lazy(() => import("../components/Dashboard/Admin Dashboard/AdminSettings"));
const FullMockTestLibrary = lazy(() => import("../components/Dashboard/Student Dashboard/FullMockTest/FullMockTestLibrary"));
const AddQuestionForm = lazy(() => import("../components/Dashboard/Admin Dashboard/AddQuestionForm"));
const EditQuestionForm = lazy(() => import("../components/Dashboard/Admin Dashboard/EditQuestionForm"));
const ManageQuestions = lazy(() => import("../components/Dashboard/Admin Dashboard/ManageQuestions"));
const CreateMockTest = lazy(() => import("../components/Dashboard/Admin Dashboard/CreateMockTest"));
const ManageMockTests = lazy(() => import("../components/Dashboard/Admin Dashboard/ManageMockTests"));
const ManagePricing = lazy(() => import("../components/Dashboard/Admin Dashboard/ManagePricing"));
const ManageResources = lazy(() => import("../components/Dashboard/Admin Dashboard/ManageResources"));
const TestEnvironment = lazy(() => import("../components/Dashboard/Student Dashboard/FullMockTest/TestEnvironment"));
const TrainerLibrary = lazy(() => import("../components/Dashboard/Student Dashboard/TrainerLibrary"));
const ManageTrainers = lazy(() => import("../components/Dashboard/Admin Dashboard/ManageTrainers"));
const InstructorPerformance = lazy(() => import("../components/Dashboard/Admin Dashboard/InstructorPerformance"));
const SuperAdminConsole = lazy(() => import("../components/Dashboard/SuperAdminConsole/SuperAdminConsole"));
const GradeSubmissions = lazy(() => import("../components/Dashboard/Instructor Dashboard/GradeSubmissions"));
const ManageAvailability = lazy(() => import("../components/Dashboard/Instructor Dashboard/ManageAvailability"));
const BookingAnalytics = lazy(() => import("../components/Dashboard/Admin Dashboard/BookingAnalytics"));
const GuestTestLibrary = lazy(() => import("../components/Guest/GuestTestLibrary"));
const GuestTestEnvironment = lazy(() => import("../components/Guest/GuestTestEnvironment"));
const PricingPage = lazy(() => import("../components/PricingPage/PricingPage"));
const FreeResourcesPage = lazy(() => import("../components/FreeResources/FreeResourcesPage"));
const CoursesPage = lazy(() => import("../components/Home/CoursesPage"));
const StudentCourses = lazy(() => import("../components/Dashboard/Student Dashboard/StudentCourses"));
const AboutPage = lazy(() => import("../components/AboutPage/AboutPage"));
const PteHome = lazy(() => import("../pte/PteHome"));
const MaintenancePage = lazy(() => import("../components/Common/MaintenancePage"));

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <Error />,
    children: [
      {
        path: "/maintenance",
        element: withSuspense(MaintenancePage),
      },
      {
        path: "/",
        element: withSuspense(HomeLayout),
        hydrateFallbackElement: <Loader />,
        children: [
          {
            index: true,
            element: withSuspense(ExamPreferenceRedirect),
          },
          {
            path: "ielts",
            children: [
              {
                index: true,
                element: (
                  <TrackGuard expectedTrack="IELTS">
                    {withSuspense(Home)}
                  </TrackGuard>
                ),
              },
              {
                path: "about",
                element: (
                  <TrackGuard expectedTrack="IELTS">
                    {withSuspense(AboutPage)}
                  </TrackGuard>
                ),
              },
              {
                path: "courses",
                element: (
                  <TrackGuard expectedTrack="IELTS">
                    {withSuspense(CoursesPage)}
                  </TrackGuard>
                ),
              },
              {
                path: "practice",
                element: (
                  <PrivateRoute>
                    <TrackGuard expectedTrack="IELTS">
                      {withSuspense(Practice)}
                    </TrackGuard>
                  </PrivateRoute>
                ),
              },
            ]
          },
          {
            path: "pte",
            children: [
              {
                index: true,
                element: (
                  <TrackGuard expectedTrack="PTE">
                    {withSuspense(PteHome)}
                  </TrackGuard>
                ),
              },
              {
                path: "about",
                element: (
                  <TrackGuard expectedTrack="PTE">
                    {withSuspense(AboutPage)}
                  </TrackGuard>
                ),
              },
              {
                path: "courses",
                element: (
                  <TrackGuard expectedTrack="PTE">
                    {withSuspense(CoursesPage)}
                  </TrackGuard>
                ),
              },
              {
                path: "practice",
                element: (
                  <PrivateRoute>
                    <TrackGuard expectedTrack="PTE">
                      {withSuspense(Practice)}
                    </TrackGuard>
                  </PrivateRoute>
                ),
              },
            ]
          },
          {
            path: "pricing",
            element: withSuspense(PricingPage),
          },
          {
            path: "free-resources",
            element: withSuspense(FreeResourcesPage),
          },
        ],
      },
      {
        path: "/auth",
        element: withSuspense(AuthLayout),
        children: [
          {
            path: "login",
            element: withSuspense(Login),
          },
          {
            path: "register",
            element: withSuspense(Register),
          },
        ],
      },
      {
        path: "/test/:id",
        element: (
          <PrivateRoute>
            <StudentRoutes>
              {withSuspense(TestEnvironment)}
            </StudentRoutes>
          </PrivateRoute>
        ),
      },
      {
        path: "/dashboard",
        element: (
          <PrivateRoute>
            {withSuspense(DashboardLayout)}
          </PrivateRoute>
        ),
        children: [
          {
            index: true,
            element: withSuspense(DashboardIndex),
          },
          {
            path: "practice",
            element: (
              <StudentRoutes>
                {withSuspense(TakeTest)}
              </StudentRoutes>
            ),
          },
          {
            path: "full-mock-test",
            element: (
              <StudentRoutes>
                {withSuspense(FullMockTestLibrary)}
              </StudentRoutes>
            ),
          },
          {
            path: "review",
            element: (
              <StudentRoutes>
                {withSuspense(Review)}
              </StudentRoutes>
            ),
          },
          {
            path: "review/:id",
            element: (
              <StudentRoutes>
                {withSuspense(ReviewDetail)}
              </StudentRoutes>
            ),
          },
          {
            path: "analytics",
            element: (
              <StudentRoutes>
                {withSuspense(Analytics)}
              </StudentRoutes>
            ),
          },
          {
            path: "profile",
            element: withSuspense(Profile),
          },
          {
            path: "trainer",
            element: (
              <StudentRoutes>
                {withSuspense(TrainerLibrary)}
              </StudentRoutes>
            ),
          },
          {
            path: "reading",
            element: (
              <StudentRoutes>
                {withSuspense(Reading)}
              </StudentRoutes>
            ),
          },
          {
            path: "listening",
            element: (
              <StudentRoutes>
                {withSuspense(Listening)}
              </StudentRoutes>
            ),
          },
          {
            path: "writing",
            element: (
              <StudentRoutes>
                {withSuspense(Writing)}
              </StudentRoutes>
            ),
          },
          {
            path: "speaking",
            element: (
              <StudentRoutes>
                {withSuspense(Speaking)}
              </StudentRoutes>
            ),
          },
          {
            path: "courses",
            element: (
              <StudentRoutes>
                {withSuspense(StudentCourses)}
              </StudentRoutes>
            ),
          },
          {
            path: "admin/manage-institutions",
            element: (
              <AdminRoutes>
                {withSuspense(ManageInstitutions)}
              </AdminRoutes>
            ),
          },
          {
            path: "admin/manage-institutions/:id",
            element: (
              <AdminRoutes>
                {withSuspense(InstitutionDetail)}
              </AdminRoutes>
            ),
          },
          {
            path: "admin/manage-users",
            element: (
              <AdminRoutes>
                {withSuspense(ManageUsers)}
              </AdminRoutes>
            ),
          },
          {
            path: "admin/manage-submissions",
            element: (
              <AdminRoutes>
                {withSuspense(ManageSubmissions)}
              </AdminRoutes>
            ),
          },
          {
            path: "admin/manage-questions",
            element: (
              <AdminRoutes>
                {withSuspense(ManageQuestions)}
              </AdminRoutes>
            ),
          },
          {
            path: "admin/manage-mock-tests",
            element: (
              <AdminRoutes>
                {withSuspense(ManageMockTests)}
              </AdminRoutes>
            ),
          },
          {
            path: "admin/manage-pricing",
            element: (
              <AdminRoutes>
                {withSuspense(ManagePricing)}
              </AdminRoutes>
            ),
          },
          {
            path: "admin/manage-resources",
            element: (
              <AdminRoutes>
                {withSuspense(ManageResources)}
              </AdminRoutes>
            ),
          },
          {
            path: "admin/manage-trainers",
            element: (
              <AdminRoutes>
                {withSuspense(ManageTrainers)}
              </AdminRoutes>
            ),
          },
          {
            path: "admin/instructor-performance",
            element: (
              <AdminRoutes>
                {withSuspense(InstructorPerformance)}
              </AdminRoutes>
            ),
          },
          {
            path: "admin/booking-analytics",
            element: (
              <AdminRoutes>
                {withSuspense(BookingAnalytics)}
              </AdminRoutes>
            ),
          },
          {
            path: "admin/create-mock-test",
            element: (
              <AdminRoutes>
                {withSuspense(CreateMockTest)}
              </AdminRoutes>
            ),
          },
          {
            path: "admin/edit-mock-test/:id",
            element: (
              <AdminRoutes>
                {withSuspense(CreateMockTest)}
              </AdminRoutes>
            ),
          },
          {
            path: "admin/add-questions",
            element: (
              <AdminRoutes>
                {withSuspense(AddQuestionForm)}
              </AdminRoutes>
            ),
          },
          {
            path: "admin/edit-questions/:id",
            element: (
              <AdminRoutes>
                {withSuspense(EditQuestionForm)}
              </AdminRoutes>
            ),
          },
          {
            path: "instructor/grade-submissions",
            element: (
              <InstructorRoutes>
                {withSuspense(GradeSubmissions)}
              </InstructorRoutes>
            ),
          },
          {
            path: "instructor/manage-resources",
            element: (
              <InstructorRoutes>
                {withSuspense(ManageResources)}
              </InstructorRoutes>
            ),
          },
          {
            path: "instructor/slots",
            element: (
              <InstructorRoutes>
                {withSuspense(ManageAvailability)}
              </InstructorRoutes>
            ),
          },
          {
            path: "admin/settings",
            element: (
              <AdminRoutes>
                {withSuspense(AdminSettings)}
              </AdminRoutes>
            ),
          },
          {
            path: "superadmin/console",
            element: (
              <SuperAdminRoutes>
                {withSuspense(SuperAdminConsole)}
              </SuperAdminRoutes>
            ),
          },
          {
            path: "*",
            element: <Error />,
          },
        ],
      },
      {
        path: "free-practice",
        element: <FreePracticeLayout />,
        children: [
          { index: true, element: withSuspense(GuestTestLibrary) },
          { path: "tests/:id", element: withSuspense(GuestTestEnvironment) },
        ],
      },
      {
        path: "*",
        element: <Error />,
      },
    ],
  },
]);

export default router;
