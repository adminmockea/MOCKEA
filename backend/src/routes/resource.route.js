import express from "express";
import verifyUserToken from "../middlewares/verifyUserToken.js";
import verifyUserRole from "../middlewares/verifyUserRole.js";
import upload from "../middlewares/upload.js";
import {
  getAllResources,
  getFeaturedBook,
  incrementDownload,
  createResource,
  updateResource,
  deleteResource,
  getAllResourcesForManagement,
  uploadResourceFile,
  downloadResourceFileStream,
} from "../controllers/resource.controller.js";

const resourceRouter = express.Router();

// Public routes
resourceRouter.get("/", getAllResources);
resourceRouter.get("/featured-book", getFeaturedBook);
resourceRouter.get("/:id/file", downloadResourceFileStream);
resourceRouter.post("/:id/download", incrementDownload);

// Secure admin/instructor routes
resourceRouter.use(verifyUserToken);
resourceRouter.use(verifyUserRole(["admin", "instructor"]));

resourceRouter.get("/manage", getAllResourcesForManagement);
resourceRouter.post("/upload", upload.any(), (req, res, next) => {
  if (!req.file && req.files && req.files.length > 0) {
    req.file = req.files[0];
  }
  next();
}, uploadResourceFile);
resourceRouter.post("/", createResource);
resourceRouter.put("/:id", updateResource);
resourceRouter.delete("/:id", deleteResource);

export default resourceRouter;

