import express from "express";
import {
  validateInstitutionCode,
  createInstitution,
  getAllInstitutions,
  getInstitutionById,
  getInstitutionStudents,
  getInstitutionAnalytics,
  assignUserToInstitution,
  removeUserFromInstitution,
  updateInstitution,
  deleteInstitution,
} from "../controllers/institution.controller.js";
import verifyUserToken from "../middlewares/verifyUserToken.js";
import verifyUserRole from "../middlewares/verifyUserRole.js";
import apiRateLimiter from "../middlewares/apiRateLimiter.js";

const institutionRouter = express.Router();

// Public route for checking institution code during registration/profile update
institutionRouter.get(
  "/validate-code/:code",
  apiRateLimiter("publicLimit", 60 * 1000),
  validateInstitutionCode
);

// Authenticated & Admin Protected Routes
institutionRouter.use(verifyUserToken);
institutionRouter.use(verifyUserRole(["admin"]));

institutionRouter.post("/", createInstitution);
institutionRouter.get("/", getAllInstitutions);
institutionRouter.get("/:id", getInstitutionById);
institutionRouter.get("/:id/students", getInstitutionStudents);
institutionRouter.get("/:id/analytics", getInstitutionAnalytics);
institutionRouter.post("/:id/assign-user", assignUserToInstitution);
institutionRouter.delete("/:id/users/:userId", removeUserFromInstitution);
institutionRouter.patch("/:id", updateInstitution);
institutionRouter.delete("/:id", deleteInstitution);

export default institutionRouter;
