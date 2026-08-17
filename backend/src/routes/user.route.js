import express from "express";
import {
  getAllUser,
  getUserRole,
  postUser,
  updateUserRole,
  updateUserPlan,
  deleteUser,
  toggleBanUser,
  getUserProfile,
  verifyEmail,
  updateUserExamPreference,
  getUserNotifications,
  markNotificationsAsRead,
  saveFcmToken,
  removeFcmToken,
  joinInstitution,
  adminUpdateUserInstitution,
import { restoreImpersonationSession } from "../controllers/superAdmin.controller.js";
import verifyUserToken from "../middlewares/verifyUserToken.js";
import verifyUserRole from "../middlewares/verifyUserRole.js";
import apiRateLimiter from "../middlewares/apiRateLimiter.js";

const userRouter = express.Router();

userRouter.get("/verifyEmail/:email", verifyEmail);
userRouter.post("/auth/register", apiRateLimiter("authLimit", 60 * 1000), postUser);
userRouter.post("/auth/restore-impersonation", restoreImpersonationSession);

userRouter.use(verifyUserToken);


// Authenticated user routes
userRouter.patch("/join-institution", joinInstitution);
userRouter.get("/profile/notifications", getUserNotifications);
userRouter.put("/profile/notifications/read", markNotificationsAsRead);
userRouter.patch("/fcm-token", saveFcmToken);
userRouter.delete("/fcm-token", removeFcmToken);
userRouter.get("/all", verifyUserRole(["admin"]), getAllUser);
userRouter.get("/:email/role", getUserRole);
userRouter.get("/:email", getUserProfile);
userRouter.patch("/:id/exam-preference", updateUserExamPreference);

// Admin-only routes
userRouter.patch("/:id/institution", verifyUserRole(["admin"]), adminUpdateUserInstitution);
userRouter.patch("/:id/role", verifyUserRole(["admin"]), updateUserRole);
userRouter.patch("/:id/plan", verifyUserRole(["admin"]), updateUserPlan);
userRouter.delete("/:id", verifyUserRole(["admin"]), deleteUser);
userRouter.patch("/:id/ban", verifyUserRole(["admin"]), toggleBanUser);

export default userRouter;
