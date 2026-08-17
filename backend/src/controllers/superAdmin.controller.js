import User from "../model/user.js";
import AuditLog from "../model/auditLog.js";
import SystemConfig from "../model/systemConfig.js";
import ErrorLog from "../model/errorLog.js";
import Questions from "../model/questions.js";
import MockTest from "../model/mockTest.js";
import PracticeSubmission from "../model/practiceSubmission.js";
import BroadcastEmail from "../model/broadcastEmail.js";
import Notification from "../model/notification.js";
import { seedDatabase } from "../utils/seeder.js";
import XLSX from "xlsx";
import admin from "../lib/firebase.config.js";
import mongoose from "mongoose";
import { cache } from "../utils/cache.js";
import BlacklistedIp from "../model/blacklistedIp.js";
import crypto from "crypto";

const GET_TICKET_SECRET = () => process.env.IMPERSONATION_SECRET || process.env.JWT_SECRET || "mockea_superadmin_restore_secret_2026";

export const generateRestoreTicket = (impersonatorEmail, targetEmail) => {
  const payload = {
    impersonatorEmail: impersonatorEmail.toLowerCase().trim(),
    targetEmail: targetEmail.toLowerCase().trim(),
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours validity
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", GET_TICKET_SECRET()).update(data).digest("base64url");
  return `${data}.${signature}`;
};

export const verifyRestoreTicket = (ticket) => {
  if (!ticket || typeof ticket !== "string" || !ticket.includes(".")) return null;
  const [data, signature] = ticket.split(".");
  const expectedSignature = crypto.createHmac("sha256", GET_TICKET_SECRET()).update(data).digest("base64url");
  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch (err) {
    return null;
  }
};


// Log action helper
const logAction = async (actorEmail, actorRole, action, targetType, targetId, ipAddress, userAgent, details = {}) => {
  try {
    const audit = new AuditLog({
      actorEmail,
      actorRole,
      action,
      targetType,
      targetId,
      ipAddress,
      userAgent,
      details,
    });
    await audit.save();
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
};

// 1. Get System Configuration
export const getSystemConfig = async (req, res) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig();
      await config.save();
    }
    return res.status(200).json({ success: true, config });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Update System Configuration
export const updateSystemConfig = async (req, res) => {
  try {
    const { maintenanceMode, maintenanceMessage, featureFlags, systemNotice, rateLimits, watchDemoUrl, watchDemoEnabled } = req.body;

    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig();
    }

    if (maintenanceMode !== undefined) config.maintenanceMode = maintenanceMode;
    if (maintenanceMessage !== undefined) config.maintenanceMessage = maintenanceMessage;
    if (featureFlags !== undefined) config.featureFlags = { ...config.featureFlags, ...featureFlags };
    if (systemNotice !== undefined) config.systemNotice = { ...config.systemNotice, ...systemNotice };
    if (rateLimits !== undefined) config.rateLimits = { ...config.rateLimits, ...rateLimits };
    if (watchDemoUrl !== undefined) {
      let url = typeof watchDemoUrl === "string" ? watchDemoUrl.trim() : "";
      if (url && !/^https?:\/\//i.test(url) && !url.startsWith("/")) {
        url = `https://${url}`;
      }
      config.watchDemoUrl = url;
    }
    if (watchDemoEnabled !== undefined) config.watchDemoEnabled = Boolean(watchDemoEnabled);

    await config.save();

    await logAction(
      req.user.email,
      req.user.role,
      "UPDATE_SYSTEM_CONFIG",
      "SystemConfig",
      config._id.toString(),
      req.ip,
      req.headers["user-agent"],
      { maintenanceMode, featureFlags, systemNotice, rateLimits }
    );

    return res.status(200).json({ success: true, message: "System configuration updated successfully", config });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. User Impersonation
export const impersonateUser = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Target user email is required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const targetUser = await User.findOne({ email: cleanEmail });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "Target user not found in local database" });
    }

    // Call Firebase Admin auth to fetch Firebase user UID
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(cleanEmail);
    } catch (fbError) {
      return res.status(404).json({
        success: false,
        message: `User exists in MOCKEA, but no corresponding account was found in Firebase auth: ${fbError.message}`
      });
    }

    // Generate Firebase Custom Token for impersonation
    const customToken = await admin.auth().createCustomToken(firebaseUser.uid);
    const restoreTicket = generateRestoreTicket(req.user.email, cleanEmail);

    await logAction(
      req.user.email,
      req.user.role,
      "IMPERSONATE_USER",
      "User",
      targetUser._id.toString(),
      req.ip,
      req.headers["user-agent"],
      { targetEmail: cleanEmail }
    );

    return res.status(200).json({
      success: true,
      message: `Impersonation token generated for ${cleanEmail}`,
      customToken,
      restoreTicket,
      targetUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3.5. Restore Impersonation Session
export const restoreImpersonationSession = async (req, res) => {
  try {
    const { restoreTicket } = req.body;
    if (!restoreTicket) {
      return res.status(400).json({ success: false, message: "Restore ticket is required" });
    }

    const payload = verifyRestoreTicket(restoreTicket);
    if (!payload) {
      return res.status(401).json({ success: false, message: "Invalid or expired restore ticket" });
    }

    // Verify impersonator is still an active Super Admin
    const superAdmin = await User.findOne({ email: payload.impersonatorEmail, role: "superadmin" });
    if (!superAdmin) {
      return res.status(403).json({ success: false, message: "Super Admin account not found or privileges revoked" });
    }

    // Get Firebase user for Super Admin
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(payload.impersonatorEmail);
    } catch (fbError) {
      return res.status(404).json({ success: false, message: `Firebase user not found: ${fbError.message}` });
    }

    const customToken = await admin.auth().createCustomToken(firebaseUser.uid);

    await logAction(
      superAdmin.email,
      superAdmin.role,
      "RESTORE_SUPERADMIN_SESSION",
      "User",
      superAdmin._id.toString(),
      req.ip,
      req.headers["user-agent"],
      { impersonatedUser: payload.targetEmail }
    );

    return res.status(200).json({
      success: true,
      message: "Super Admin session token restored successfully",
      customToken,
    });
  } catch (error) {
    console.error("Error restoring impersonation session:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// 4. Fetch Audit Logs
export const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, action, actorEmail } = req.query;

    const query = {};
    if (action) query.action = action;
    if (actorEmail) query.actorEmail = { $regex: actorEmail, $options: "i" };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      logs,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get System Metrics (Real-life diagnostic tool)
export const getSystemMetrics = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const activeLogCount = await AuditLog.countDocuments();

    // Mongoose stats
    const dbState = mongoose.connection.readyState;
    const dbStatusMap = ["Disconnected", "Connected", "Connecting", "Disconnecting"];

    const memoryUsage = process.memoryUsage();

    return res.status(200).json({
      success: true,
      metrics: {
        database: {
          status: dbStatusMap[dbState] || "Unknown",
          collectionsCount: Object.keys(mongoose.connection.collections).length,
        },
        counts: {
          users: userCount,
          auditLogs: activeLogCount,
        },
        server: {
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform,
          memory: {
            rss: Math.round(memoryUsage.rss / 1024 / 1024) + " MB",
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + " MB",
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + " MB",
          }
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Get Public System Configuration (Exposed publicly for announcements/maintenance check)
export const getPublicSystemConfig = async (req, res) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig();
      await config.save();
    }
    return res.status(200).json({
      success: true,
      maintenanceMode: config.maintenanceMode,
      maintenanceMessage: config.maintenanceMessage,
      systemNotice: config.systemNotice,
      watchDemoUrl: config.watchDemoUrl || "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      watchDemoEnabled: config.watchDemoEnabled !== undefined ? config.watchDemoEnabled : true,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Get Error Analytics (clusters backend errors and aggregates similar stack traces)
export const getErrorAnalytics = async (req, res) => {
  try {
    const logs = await ErrorLog.find().sort({ createdAt: -1 }).limit(5000);

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const clusters = {};

    const getStackSignature = (stack, message, path, method) => {
      if (!stack || stack === "No stack trace provided") {
        const cleanMsg = (message || "unknown")
          .replace(/[0-9a-fA-F]{24}/g, "{MONGO_ID}")
          .replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, "{UUID}")
          .replace(/\b\d+\b/g, "{NUM}");
        return `msg:${method || ""}:${path || ""}:${cleanMsg}`;
      }

      const lines = stack.split("\n").map(line => line.trim());
      const signatureLines = [];

      if (lines[0]) {
        signatureLines.push(
          lines[0]
            .replace(/[0-9a-fA-F]{24}/g, "{MONGO_ID}")
            .replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, "{UUID}")
            .replace(/\b\d+\b/g, "{NUM}")
        );
      }

      for (let i = 1; i < Math.min(lines.length, 4); i++) {
        let line = lines[i];
        if (line.startsWith("at ")) {
          line = line.replace(/\\/g, "/");
          line = line.replace(/.*\/MOCKEA\//i, "");
          line = line.replace(/.*\/node_modules\//i, "node_modules/");
          line = line.replace(/[a-zA-Z]:\/[^\s]+?\/(src|node_modules|backend|frontend)/g, "$1");
        }
        signatureLines.push(line);
      }

      return signatureLines.join("\n");
    };

    for (const log of logs) {
      const sig = getStackSignature(log.stack, log.message, log.path, log.method);
      const isLastHour = log.createdAt >= oneHourAgo;
      const isLast24Hours = log.createdAt >= twentyFourHoursAgo;

      if (!clusters[sig]) {
        clusters[sig] = {
          signature: sig,
          message: log.message,
          stack: log.stack,
          count: 0,
          countLastHour: 0,
          countLast24Hours: 0,
          paths: {},
          methods: {},
          statuses: {},
          users: new Set(),
          firstSeen: log.createdAt,
          lastSeen: log.createdAt,
        };
      }

      const cluster = clusters[sig];
      cluster.count += 1;
      if (isLastHour) cluster.countLastHour += 1;
      if (isLast24Hours) cluster.countLast24Hours += 1;

      const routeKey = `${log.method || "UNKNOWN"} ${log.path || "unknown"}`;
      cluster.paths[routeKey] = (cluster.paths[routeKey] || 0) + 1;
      
      const methodKey = log.method || "UNKNOWN";
      cluster.methods[methodKey] = (cluster.methods[methodKey] || 0) + 1;

      const statusKey = log.status || 500;
      cluster.statuses[statusKey] = (cluster.statuses[statusKey] || 0) + 1;

      if (log.userEmail) {
        cluster.users.add(log.userEmail);
      }

      if (log.createdAt < cluster.firstSeen) {
        cluster.firstSeen = log.createdAt;
      }
      if (log.createdAt > cluster.lastSeen) {
        cluster.lastSeen = log.createdAt;
      }
    }

    const aggregated = Object.values(clusters).map(c => ({
      ...c,
      users: Array.from(c.users).slice(0, 10),
      uniqueUsersCount: c.users.size,
    }));

    return res.status(200).json({
      success: true,
      errorClusters: aggregated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Get Collections and Document Counts
export const getCollectionsList = async (req, res) => {
  try {
    const counts = {
      users: await User.countDocuments(),
      mockTests: await MockTest.countDocuments(),
      questions: await Questions.countDocuments(),
      submissions: await PracticeSubmission.countDocuments(),
      auditLogs: await AuditLog.countDocuments(),
      errorLogs: await ErrorLog.countDocuments(),
      broadcasts: await BroadcastEmail.countDocuments(),
    };
    return res.status(200).json({ success: true, counts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Export Collection (JSON / CSV)
export const exportCollection = async (req, res) => {
  try {
    const { collectionName } = req.params;
    const { format = "json" } = req.query;

    let Model;
    let query = {};
    let fields = [];

    if (collectionName === "students-info") {
      Model = User;
      query = { role: "student" };
      fields = ["email", "name", "plan", "lastActive", "targetExam", "gender", "isBanned", "createdAt"];
    } else {
      switch (collectionName) {
        case "users":
          Model = User;
          fields = ["email", "name", "role", "plan", "lastActive", "targetExam", "isBanned", "createdAt"];
          break;
        case "mocktests":
          Model = MockTest;
          fields = ["title", "description", "planType", "examType", "isPublic", "totalDuration", "createdAt"];
          break;
        case "questions":
          Model = Questions;
          fields = ["title", "testType", "examType", "forPlanType", "isMockOnly", "isPublic", "createdAt"];
          break;
        case "submissions":
          Model = PracticeSubmission;
          fields = ["title", "testType", "userEmail", "score", "status", "createdAt"];
          break;
        case "auditlogs":
          Model = AuditLog;
          fields = ["actorEmail", "actorRole", "action", "targetType", "ipAddress", "createdAt"];
          break;
        case "errorlogs":
          Model = ErrorLog;
          fields = ["message", "method", "path", "status", "userEmail", "createdAt"];
          break;
        default:
          return res.status(400).json({ success: false, message: "Invalid collection specified" });
      }
    }

    const data = await Model.find(query).sort({ createdAt: -1 }).lean();

    if (format === "xlsx" || format === "excel") {
      const headerFields = fields.length > 0 ? fields : (data.length > 0 ? Object.keys(data[0]) : []);

      const formattedData = data.map((item) => {
        const obj = {};
        for (const field of headerFields) {
          let val = item[field];
          if (val instanceof Date) {
            val = val.toISOString();
          } else if (typeof val === "object" && val !== null) {
            val = JSON.stringify(val);
          }
          obj[field] = val !== undefined && val !== null ? val : "";
        }
        return obj;
      });

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Export");

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      const filename = `${collectionName}_export_${Date.now()}.xlsx`;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
      return res.send(buffer);
    }

    if (format === "csv") {
      const ext = "csv";
      const filename = `${collectionName}_export_${Date.now()}.${ext}`;
      const bom = "\ufeff"; // UTF-8 BOM for Microsoft Excel compatibility

      if (data.length === 0) {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
        return res.send(bom + fields.join(",") + "\n");
      }

      // If fields list is empty, dynamically read keys from first object
      const headerFields = fields.length > 0 ? fields : Object.keys(data[0]);
      
      const csvRows = [];
      csvRows.push(headerFields.join(",")); // Headers

      for (const item of data) {
        const values = headerFields.map((field) => {
          let val = item[field];
          if (val instanceof Date) {
            val = val.toISOString();
          } else if (typeof val === "object" && val !== null) {
            val = JSON.stringify(val);
          }
          const valStr = val !== undefined && val !== null ? String(val) : "";
          // Escape quotes and wrap in quotes if contains commas or newlines
          const escaped = valStr.replace(/"/g, '""');
          return escaped.includes(",") || escaped.includes("\n") || escaped.includes('"') 
            ? `"${escaped}"` 
            : escaped;
        });
        csvRows.push(values.join(","));
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
      return res.send(bom + csvRows.join("\n"));
    }

    // Default to JSON format
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=${collectionName}_export.json`);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Run Mock Test Database Seeder
export const runDatabaseSeeder = async (req, res) => {
  try {
    const result = await seedDatabase();

    await logAction(
      req.user.email,
      req.user.role,
      "RUN_DATABASE_SEEDER",
      "MockTest",
      "SYSTEM",
      req.ip,
      req.headers["user-agent"],
      { result }
    );

    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 11. Send Cohort Notification Broadcast
export const sendNotificationBroadcast = async (req, res) => {
  try {
    const { subject, content, cohort } = req.body;

    if (!subject || !content || !cohort) {
      return res.status(400).json({ success: false, message: "Subject, content, and cohort are required" });
    }

    // Find users based on cohort selection
    let userFilter = { role: "student" };
    const now = new Date();
    if (cohort === "free") {
      userFilter.plan = "free";
    } else if (cohort === "standard") {
      userFilter.plan = "standard";
      userFilter.$or = [{ planExpiresAt: null }, { planExpiresAt: { $gt: now } }];
    } else if (cohort === "premium") {
      userFilter.plan = "premium";
      userFilter.$or = [{ planExpiresAt: null }, { planExpiresAt: { $gt: now } }];
    } else if (cohort === "inactive") {
      // Inactive: lastActive is older than 30 days, or is null
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      userFilter.$or = [
        { lastActive: { $lte: thirtyDaysAgo } },
        { lastActive: { $exists: false } },
        { lastActive: null }
      ];
    }

    const targetUsers = await User.find(userFilter);
    const emails = targetUsers.map((u) => u.email);

    // Save Broadcast log
    const broadcast = new BroadcastEmail({
      subject,
      content,
      cohort,
      recipientCount: emails.length,
      recipients: emails,
      sentBy: req.user.email,
    });
    await broadcast.save();

    // Create Notification document so it shows up for target cohort users in their inbox
    const notification = new Notification({
      title: subject,
      message: content,
      cohort,
      sentBy: req.user.email,
      broadcastId: broadcast._id,
    });
    await notification.save();

    await logAction(
      req.user.email,
      req.user.role,
      "SEND_NOTIFICATION_BROADCAST",
      "BroadcastEmail",
      broadcast._id.toString(),
      req.ip,
      req.headers["user-agent"],
      { cohort, recipientCount: emails.length }
    );

    return res.status(200).json({
      success: true,
      message: `Broadcast successfully sent to ${emails.length} users.`,
      recipientCount: emails.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 12. Get Past Broadcasts
export const getNotificationBroadcastHistory = async (req, res) => {
  try {
    const broadcasts = await BroadcastEmail.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, broadcasts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 12a. Update Notification Broadcast
export const updateNotificationBroadcast = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, content, cohort } = req.body;

    if (!subject || !content || !cohort) {
      return res.status(400).json({ success: false, message: "Subject, content, and cohort are required" });
    }

    const broadcast = await BroadcastEmail.findById(id);
    if (!broadcast) {
      return res.status(404).json({ success: false, message: "Broadcast not found" });
    }

    // Find users based on cohort selection
    let userFilter = { role: "student" };
    const now = new Date();
    if (cohort === "free") {
      userFilter.plan = "free";
    } else if (cohort === "standard") {
      userFilter.plan = "standard";
      userFilter.$or = [{ planExpiresAt: null }, { planExpiresAt: { $gt: now } }];
    } else if (cohort === "premium") {
      userFilter.plan = "premium";
      userFilter.$or = [{ planExpiresAt: null }, { planExpiresAt: { $gt: now } }];
    } else if (cohort === "inactive") {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      userFilter.$or = [
        { lastActive: { $lte: thirtyDaysAgo } },
        { lastActive: { $exists: false } },
        { lastActive: null }
      ];
    }

    const targetUsers = await User.find(userFilter);
    const emails = targetUsers.map((u) => u.email);

    const oldSubject = broadcast.subject;
    const oldCohort = broadcast.cohort;

    broadcast.subject = subject;
    broadcast.content = content;
    broadcast.cohort = cohort;
    broadcast.recipientCount = emails.length;
    broadcast.recipients = emails;
    await broadcast.save();

    // Find and update associated Notification
    let notification = await Notification.findOne({ broadcastId: broadcast._id });
    if (!notification) {
      notification = await Notification.findOne({ title: oldSubject, cohort: oldCohort });
    }

    if (notification) {
      notification.title = subject;
      notification.message = content;
      notification.cohort = cohort;
      if (!notification.broadcastId) {
        notification.broadcastId = broadcast._id;
      }
      await notification.save();
    }

    await logAction(
      req.user.email,
      req.user.role,
      "UPDATE_NOTIFICATION_BROADCAST",
      "BroadcastEmail",
      broadcast._id.toString(),
      req.ip,
      req.headers["user-agent"],
      { cohort, recipientCount: emails.length }
    );

    return res.status(200).json({
      success: true,
      message: "Broadcast successfully updated.",
      broadcast,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 12b. Delete Notification Broadcast
export const deleteNotificationBroadcast = async (req, res) => {
  try {
    const { id } = req.params;

    const broadcast = await BroadcastEmail.findById(id);
    if (!broadcast) {
      return res.status(404).json({ success: false, message: "Broadcast not found" });
    }

    const oldSubject = broadcast.subject;
    const oldCohort = broadcast.cohort;

    await BroadcastEmail.findByIdAndDelete(id);

    // Find and delete associated Notification
    let notification = await Notification.findOne({ broadcastId: id });
    if (!notification) {
      notification = await Notification.findOne({ title: oldSubject, cohort: oldCohort });
    }

    if (notification) {
      await Notification.findByIdAndDelete(notification._id);
    }

    await logAction(
      req.user.email,
      req.user.role,
      "DELETE_NOTIFICATION_BROADCAST",
      "BroadcastEmail",
      id,
      req.ip,
      req.headers["user-agent"]
    );

    return res.status(200).json({
      success: true,
      message: "Broadcast successfully deleted.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 13. Get Cache Stats
export const getCacheStats = async (req, res) => {
  try {
    const stats = await cache.getStats();
    return res.status(200).json({ success: true, stats });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 14. Clear Cache (Full or Selective Pattern)
export const clearCache = async (req, res) => {
  try {
    const { pattern } = req.body;

    if (pattern) {
      await cache.delPattern(pattern);
    } else {
      await cache.clear();
    }

    await logAction(
      req.user.email,
      req.user.role,
      "CLEAR_CACHE",
      "Cache",
      "global",
      req.ip,
      req.headers["user-agent"],
      { pattern: pattern || "ALL_KEYS" }
    );

    return res.status(200).json({
      success: true,
      message: pattern 
        ? `Cache keys matching pattern '${pattern}' cleared successfully.` 
        : "Entire cache database flushed successfully."
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 15. Get All Blacklisted IPs
export const getBlacklistedIps = async (req, res) => {
  try {
    const list = await BlacklistedIp.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 16. Blacklist an IP
export const blacklistIp = async (req, res) => {
  try {
    const { ip, reason } = req.body;
    if (!ip) {
      return res.status(400).json({ success: false, message: "IP address is required." });
    }

    const cleanIp = ip.trim();

    // Check if already exists
    const existing = await BlacklistedIp.findOne({ ip: cleanIp });
    if (existing) {
      return res.status(400).json({ success: false, message: `IP Address ${cleanIp} is already blacklisted.` });
    }

    const newBlock = new BlacklistedIp({
      ip: cleanIp,
      reason: reason || "Unspecified security reason",
      blockedBy: req.user.email
    });

    await newBlock.save();

    await logAction(
      req.user.email,
      req.user.role,
      "BLACKLIST_IP",
      "BlacklistedIp",
      newBlock._id.toString(),
      req.ip,
      req.headers["user-agent"],
      { ip: cleanIp, reason }
    );

    return res.status(200).json({ success: true, message: `IP Address ${cleanIp} blacklisted successfully.`, block: newBlock });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 17. Unban / Remove Blacklisted IP
export const removeBlacklistedIp = async (req, res) => {
  try {
    const { ipId } = req.params;
    if (!ipId) {
      return res.status(400).json({ success: false, message: "Blacklist record ID is required." });
    }

    const blockedDoc = await BlacklistedIp.findById(ipId);
    if (!blockedDoc) {
      return res.status(404).json({ success: false, message: "Blacklist record not found." });
    }

    await BlacklistedIp.findByIdAndDelete(ipId);

    await logAction(
      req.user.email,
      req.user.role,
      "REMOVE_BLACKLIST_IP",
      "BlacklistedIp",
      ipId,
      req.ip,
      req.headers["user-agent"],
      { ip: blockedDoc.ip }
    );

    return res.status(200).json({ success: true, message: `IP Address ${blockedDoc.ip} removed from blacklist.` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 18. Reset Daily Questions Cycle
export const resetDailyQuestionsCycle = async (req, res) => {
  try {
    const { email } = req.body;
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      await cache.delPattern(`user-daily-questions:${cleanEmail}:*`);
      await cache.delPattern(`user-seen-questions:${cleanEmail}:*`);
    } else {
      await cache.delPattern("user-daily-questions:*");
      await cache.delPattern("user-seen-questions:*");
    }

    await logAction(
      req.user.email,
      req.user.role,
      "RESET_DAILY_QUESTIONS_CYCLE",
      "Questions",
      email || "ALL_USERS",
      req.ip,
      req.headers["user-agent"],
      { targetEmail: email || "ALL_USERS" }
    );

    return res.status(200).json({
      success: true,
      message: email 
        ? `Daily questions cycle for user '${email}' has been reset.`
        : "Daily questions cycle for all users has been reset."
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

