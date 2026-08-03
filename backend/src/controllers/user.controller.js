import User from "../model/user.js";
import Institution from "../model/Institution.js";
import Notification from "../model/notification.js";
import { activateUserPlan, checkAndAutoExpirePlan } from "../utils/subscriptionService.js";

// Helper function to check if requesting user is the owner or an admin/superadmin
const isOwnerOrAdmin = async (decodedEmail, targetEmail) => {
    if (!decodedEmail || !targetEmail) return false;
    if (decodedEmail.toLowerCase().trim() === targetEmail.toLowerCase().trim()) {
        return true;
    }
    const requestor = await User.findOne({ email: decodedEmail.toLowerCase().trim() });
    return !!(requestor && (requestor.role === 'admin' || requestor.role === 'superadmin'));
};

// Helper to escape special regex characters to prevent ReDoS
const escapeRegex = (str) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const postUser = async (req, res) => {
    try {
        const { email, name, targetExam, gender, institutionCode } = req.body;

        if (!email || !name) {
            return res.status(400).json({ success: false, message: "Please provide email and name" });
        }

        const cleanEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: cleanEmail });

        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email already exists" });
        }

        let institutionId = null;
        let matchedCode = null;

        if (institutionCode) {
            const cleanCode = institutionCode.toUpperCase().trim();
            const inst = await Institution.findOne({ code: cleanCode, status: "active" });
            if (!inst) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or inactive institution code",
                });
            }
            institutionId = inst._id;
            matchedCode = inst.code;
        }

        const user = new User({
            name,
            email: cleanEmail,
            targetExam: targetExam || "IELTS",
            gender: gender || null,
            institution: institutionId,
            institutionCode: matchedCode
        });
        await user.save();

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                institution: user.institution,
                institutionCode: user.institutionCode
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllUser = async (req, res) => {
    try {
        const { search, role, plan, status, institutionId, page, limit } = req.query;

        const filter = {};

        if (search) {
            const safeSearch = escapeRegex(search);
            filter.$or = [
                { name: { $regex: safeSearch, $options: "i" } },
                { email: { $regex: safeSearch, $options: "i" } },
                { institutionCode: { $regex: safeSearch, $options: "i" } },
            ];
        }
        if (role && role !== "all") filter.role = role;
        if (plan && plan !== "all") filter.plan = plan;
        if (status === "banned") filter.isBanned = true;
        if (status === "active") filter.isBanned = { $ne: true };
        if (institutionId) {
            if (institutionId === "none" || institutionId === "b2c") {
                filter.institution = null;
            } else {
                filter.institution = institutionId;
            }
        }

        // Hide superadmins from non-superadmin callers
        const requester = req.user;
        if (!requester || requester.role !== "superadmin") {
            if (filter.role === "superadmin") {
                return res.status(403).json({ success: false, message: "Access denied" });
            }
            if (!filter.role) {
                filter.role = { $ne: "superadmin" };
            }
        }

        const total = await User.countDocuments(filter);
        res.set("X-Total-Count", total.toString());
        res.set("Access-Control-Expose-Headers", "X-Total-Count");

        let query = User.find(filter)
            .populate("institution", "name code status")
            .sort({ createdAt: -1 });

        if (page || limit) {
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 10;
            const skip = (pageNum - 1) * limitNum;
            query = query.skip(skip).limit(limitNum);

            const users = await query;
            return res.status(200).json({
                success: true,
                message: "Users fetched successfully",
                users,
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            });
        }

        const users = await query;
        return res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            users,
            total
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getUserRole = async (req, res) => {
    try {
        const { email } = req.params;
        const cleanEmail = email.toLowerCase().trim();

        const authorized = await isOwnerOrAdmin(req.decoded_email, cleanEmail);
        if (!authorized) {
            return res.status(403).json({ success: false, message: "Access denied: cannot fetch role of another user" });
        }

        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, message: "User role fetched successfully", role: user.role });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const { email } = req.params;
        const cleanEmail = email.toLowerCase().trim();

        const authorized = await isOwnerOrAdmin(req.decoded_email, cleanEmail);
        if (!authorized) {
            return res.status(403).json({ success: false, message: "Access denied: cannot access another user's profile" });
        }

        let user = await User.findOne({ email: cleanEmail }).populate("institution", "name code status contactEmail contactPhone address");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Lazy-evaluate plan expiration
        user = await checkAndAutoExpirePlan(user);

        res.status(200).json({ success: true, message: "User profile fetched successfully", user });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const cleanEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, message: "Email verified successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const allowedRoles = ["student", "admin", "instructor", "superadmin"];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role specified" });
        }

        const targetUser = await User.findById(id);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const requester = req.user;
        if (requester.role !== "superadmin") {
            if (targetUser.role === "admin" || targetUser.role === "superadmin") {
                return res.status(403).json({ success: false, message: "Access denied. Cannot modify admin or superadmin access." });
            }
            if (role === "admin" || role === "superadmin") {
                return res.status(403).json({ success: false, message: "Access denied. Cannot grant admin or superadmin role." });
            }
        }

        targetUser.role = role;
        await targetUser.save();

        res.status(200).json({ success: true, message: `User role updated to ${role}`, user: targetUser });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateUserPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { plan, timeframeType, monthsCount, customEndDate } = req.body;

        const allowedPlans = ["free", "standard", "premium"];
        if (!allowedPlans.includes(plan)) {
            return res.status(400).json({ success: false, message: "Invalid plan specified" });
        }

        const targetUser = await User.findById(id);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const requester = req.user;
        if (requester.role !== "superadmin") {
            if (targetUser.role === "admin" || targetUser.role === "superadmin") {
                return res.status(403).json({ success: false, message: "Access denied. Cannot modify admin or superadmin access." });
            }
        }

        const updatedUser = await activateUserPlan({
            userId: id,
            plan,
            timeframeType: timeframeType || "infinite",
            monthsCount: monthsCount || 1,
            customEndDate: customEndDate || null,
            source: "admin_manual",
            actorEmail: requester.email,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        res.status(200).json({ success: true, message: `User plan updated to ${plan}`, user: updatedUser });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const targetUser = await User.findById(id);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const requester = req.user;
        if (requester.role !== "superadmin") {
            if (targetUser.role === "admin" || targetUser.role === "superadmin") {
                return res.status(403).json({ success: false, message: "Access denied. Cannot modify admin or superadmin access." });
            }
        }

        await User.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleBanUser = async (req, res) => {
    try {
        const { id } = req.params;

        const targetUser = await User.findById(id);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const requester = req.user;
        if (requester.role !== "superadmin") {
            if (targetUser.role === "admin" || targetUser.role === "superadmin") {
                return res.status(403).json({ success: false, message: "Access denied. Cannot modify admin or superadmin access." });
            }
        }

        targetUser.isBanned = !targetUser.isBanned;
        await targetUser.save();

        res.status(200).json({
            success: true,
            message: targetUser.isBanned ? "User has been banned" : "User has been unbanned",
            user: targetUser,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateUserExamPreference = async (req, res) => {
    try {
        const { id } = req.params;
        const { targetExam } = req.body;

        const allowedExams = ["IELTS", "PTE", "BOTH"];
        if (!allowedExams.includes(targetExam)) {
            return res.status(400).json({ success: false, message: "Invalid exam preference specified" });
        }

        const userToUpdate = await User.findById(id);
        if (!userToUpdate) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Verify ownership/admin permissions
        const authorized = await isOwnerOrAdmin(req.decoded_email, userToUpdate.email);
        if (!authorized) {
            return res.status(403).json({ success: false, message: "Access denied: cannot update another user's preferences" });
        }

        userToUpdate.targetExam = targetExam;
        await userToUpdate.save();

        res.status(200).json({ success: true, message: `Exam preference updated to ${targetExam}`, user: userToUpdate });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUserNotifications = async (req, res) => {
    try {
        const email = req.decoded_email;
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const isUserInactive = !user.lastActive || user.lastActive <= thirtyDaysAgo;

        const query = {
            cohort: {
                $in: ["all", user.plan, ...(isUserInactive ? ["inactive"] : [])]
            }
        };

        const notifications = await Notification.find(query).sort({ createdAt: -1 });
        const lastRead = user.lastNotificationsReadAt ? new Date(user.lastNotificationsReadAt).getTime() : 0;
        console.log(`[getUserNotifications] User: ${email}, lastNotificationsReadAt: ${user.lastNotificationsReadAt} (${lastRead})`);

        const mappedNotifications = notifications.map(n => {
            const nTime = new Date(n.createdAt).getTime();
            const isRead = lastRead ? nTime <= lastRead : false;
            console.log(`[getUserNotifications] Notif: ${n.title}, CreatedAt: ${n.createdAt} (${nTime}), isRead: ${isRead}`);
            return {
                ...n.toObject(),
                isRead
            };
        });

        return res.status(200).json({ success: true, notifications: mappedNotifications });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const markNotificationsAsRead = async (req, res) => {
    try {
        const email = req.decoded_email;
        console.log(`[markNotificationsAsRead] Marking for User: ${email}`);
        const user = await User.findOneAndUpdate(
            { email: email.toLowerCase().trim() },
            { $set: { lastNotificationsReadAt: new Date() } },
            { returnDocument: 'after' }
        );
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        console.log(`[markNotificationsAsRead] User ${email} updated lastNotificationsReadAt to: ${user.lastNotificationsReadAt}`);
        return res.status(200).json({ success: true, message: "Notifications marked as read" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const saveFcmToken = async (req, res) => {
    try {
        const email = req.decoded_email;
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ success: false, message: "Token is required" });
        }

        const user = await User.findOneAndUpdate(
            { email: email.toLowerCase().trim() },
            { $addToSet: { fcmTokens: token } },
            { returnDocument: 'after' }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, message: "FCM token saved successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const removeFcmToken = async (req, res) => {
    try {
        const email = req.decoded_email;
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ success: false, message: "Token is required" });
        }

        const user = await User.findOneAndUpdate(
            { email: email.toLowerCase().trim() },
            { $pull: { fcmTokens: token } },
            { returnDocument: 'after' }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, message: "FCM token removed successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const joinInstitution = async (req, res) => {
    try {
        const { institutionCode } = req.body;
        if (!institutionCode) {
            return res.status(400).json({ success: false, message: "Institution code is required" });
        }

        const cleanCode = institutionCode.toUpperCase().trim();
        const inst = await Institution.findOne({ code: cleanCode, status: "active" });
        if (!inst) {
            return res.status(400).json({ success: false, message: "Invalid or inactive institution code" });
        }

        const user = await User.findOne({ email: req.decoded_email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.institution = inst._id;
        user.institutionCode = inst.code;
        await user.save();

        const updatedUser = await User.findById(user._id).populate("institution", "name code status");

        return res.status(200).json({
            success: true,
            message: `Successfully joined ${inst.name} (${inst.code})`,
            user: updatedUser
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const adminUpdateUserInstitution = async (req, res) => {
    try {
        const { id } = req.params; // User ID
        const { institutionId } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!institutionId || institutionId === "none" || institutionId === "b2c") {
            // Unlink institution
            if (user.institution) {
                await Institution.findByIdAndUpdate(user.institution, {
                    $pull: { assignedInstructors: user._id }
                });
            }
            user.institution = null;
            user.institutionCode = null;
            await user.save();

            return res.status(200).json({
                success: true,
                message: `User '${user.name}' institution removed (Global B2C)`,
                user
            });
        }

        const inst = await Institution.findById(institutionId);
        if (!inst) {
            return res.status(404).json({ success: false, message: "Institution not found" });
        }

        // If switching from old institution, remove from old assignedInstructors
        if (user.institution && user.institution.toString() !== inst._id.toString()) {
            await Institution.findByIdAndUpdate(user.institution, {
                $pull: { assignedInstructors: user._id }
            });
        }

        user.institution = inst._id;
        user.institutionCode = inst.code;
        await user.save();

        if (user.role === "instructor" || user.role === "admin" || user.role === "superadmin") {
            if (!inst.assignedInstructors.includes(user._id)) {
                inst.assignedInstructors.push(user._id);
                await inst.save();
            }
        }

        const updatedUser = await User.findById(id).populate("institution", "name code status");

        return res.status(200).json({
            success: true,
            message: `User '${user.name}' institution set to ${inst.name} (${inst.code})`,
            user: updatedUser
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
