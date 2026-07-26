import express from "express";
import verifyUserToken from "../middlewares/verifyUserToken.js";
import verifyUserRole from "../middlewares/verifyUserRole.js";
import { getWatchDemoConfig, updateWatchDemoConfig } from "../controllers/settings.controller.js";

const settingsRouter = express.Router();

// GET /api/settings/watch-demo
settingsRouter.get("/watch-demo", getWatchDemoConfig);

// PUT /api/settings/watch-demo (Admins & SuperAdmins)
settingsRouter.put("/watch-demo", verifyUserToken, verifyUserRole(["admin"]), updateWatchDemoConfig);

export default settingsRouter;
