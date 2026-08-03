import Institution from "../model/Institution.js";
import User from "../model/user.js";
import MockTestResult from "../model/mockTestResult.js";
import PracticeSubmission from "../model/practiceSubmission.js";

// Helper to escape special regex characters to prevent ReDoS
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Public: Validate institution code during registration or profile update
export const validateInstitutionCode = async (req, res) => {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ success: false, message: "Code is required" });
    }

    const cleanCode = code.toUpperCase().trim();
    const institution = await Institution.findOne({ code: cleanCode, status: "active" });

    if (!institution) {
      return res.status(200).json({
        success: true,
        valid: false,
        message: "Invalid or inactive institution code",
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      institution: {
        id: institution._id,
        name: institution.name,
        code: institution.code,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Create new institution with manual unique code
export const createInstitution = async (req, res) => {
  try {
    const { name, code, contactEmail, contactPhone, address, notes } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Institution name and code are required",
      });
    }

    const cleanCode = code.toUpperCase().trim();

    // Check code uniqueness
    const existing = await Institution.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Institution code '${cleanCode}' is already in use`,
      });
    }

    // Find admin user making request
    const adminUser = await User.findOne({ email: req.decoded_email });
    if (!adminUser) {
      return res.status(404).json({ success: false, message: "Admin user not found" });
    }

    const newInst = new Institution({
      name: name.trim(),
      code: cleanCode,
      contactEmail: contactEmail ? contactEmail.trim().toLowerCase() : "",
      contactPhone: contactPhone ? contactPhone.trim() : "",
      address: address ? address.trim() : "",
      notes: notes ? notes.trim() : "",
      createdBy: adminUser._id,
    });

    await newInst.save();

    return res.status(201).json({
      success: true,
      message: "Institution created successfully",
      institution: newInst,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get all institutions with summary stats
export const getAllInstitutions = async (req, res) => {
  try {
    const { search, status, page, limit } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { code: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const total = await Institution.countDocuments(filter);
    let query = Institution.find(filter)
      .populate("createdBy", "name email")
      .populate("assignedInstructors", "name email role")
      .sort({ createdAt: -1 });

    if (page || limit) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const skip = (pageNum - 1) * limitNum;
      query = query.skip(skip).limit(limitNum);
    }

    const rawInstitutions = await query;

    // Enhance institutions with student counts and submission counts
    const institutions = await Promise.all(
      rawInstitutions.map(async (inst) => {
        const studentCount = await User.countDocuments({
          institution: inst._id,
          role: "student",
        });
        const instructorCount = await User.countDocuments({
          institution: inst._id,
          role: { $in: ["instructor", "admin", "superadmin"] },
        });
        const mockTestCount = await MockTestResult.countDocuments({
          institution: inst._id,
        });
        const practiceCount = await PracticeSubmission.countDocuments({
          institution: inst._id,
        });

        return {
          ...inst.toObject(),
          studentCount,
          instructorCount,
          totalSubmissions: mockTestCount + practiceCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      institutions,
      total,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get single institution details
export const getInstitutionById = async (req, res) => {
  try {
    const { id } = req.params;
    const institution = await Institution.findById(id)
      .populate("createdBy", "name email")
      .populate("assignedInstructors", "name email role lastActive");

    if (!institution) {
      return res.status(404).json({ success: false, message: "Institution not found" });
    }

    const studentCount = await User.countDocuments({
      institution: institution._id,
      role: "student",
    });
    const instructorCount = await User.countDocuments({
      institution: institution._id,
      role: { $in: ["instructor", "admin", "superadmin"] },
    });
    const mockTestCount = await MockTestResult.countDocuments({
      institution: institution._id,
    });
    const practiceCount = await PracticeSubmission.countDocuments({
      institution: institution._id,
    });

    return res.status(200).json({
      success: true,
      institution: {
        ...institution.toObject(),
        studentCount,
        instructorCount,
        totalSubmissions: mockTestCount + practiceCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get students belonging to a specific institution
export const getInstitutionStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const { search, page, limit } = req.query;

    const filter = { institution: id, role: "student" };
    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(filter);
    let query = User.find(filter).select("-fcmTokens").sort({ createdAt: -1 });

    if (page || limit) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const skip = (pageNum - 1) * limitNum;
      query = query.skip(skip).limit(limitNum);
    }

    const students = await query;

    // Attach completed test count for each student
    const studentData = await Promise.all(
      students.map(async (st) => {
        const testCount = await MockTestResult.countDocuments({
          userId: st._id,
          status: "completed",
        });
        const practiceCount = await PracticeSubmission.countDocuments({
          userId: st._id,
          status: "reviewed",
        });

        return {
          ...st.toObject(),
          completedMockTests: testCount,
          completedPractices: practiceCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      students: studentData,
      total,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get analytics for a specific institution
export const getInstitutionAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const institution = await Institution.findById(id);

    if (!institution) {
      return res.status(404).json({ success: false, message: "Institution not found" });
    }

    const studentCount = await User.countDocuments({ institution: id, role: "student" });
    const instructorCount = await User.countDocuments({
      institution: id,
      role: { $in: ["instructor", "admin", "superadmin"] },
    });

    const mockResults = await MockTestResult.find({ institution: id, status: "completed" });
    const practiceResults = await PracticeSubmission.find({ institution: id });

    const pendingMockReviews = await MockTestResult.countDocuments({
      institution: id,
      status: "completed",
      "sectionResults.isGraded": false,
    });
    const pendingPracticeReviews = await PracticeSubmission.countDocuments({
      institution: id,
      status: "pending",
    });

    return res.status(200).json({
      success: true,
      analytics: {
        institutionName: institution.name,
        institutionCode: institution.code,
        studentCount,
        instructorCount,
        totalMockTests: mockResults.length,
        totalPracticeLabSubmissions: practiceResults.length,
        pendingReviews: pendingMockReviews + pendingPracticeReviews,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Manually assign a user to an institution
export const assignUserToInstitution = async (req, res) => {
  try {
    const { id } = req.params; // institution id
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const institution = await Institution.findById(id);
    if (!institution) {
      return res.status(404).json({ success: false, message: "Institution not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.institution = institution._id;
    user.institutionCode = institution.code;
    await user.save();

    // If user is instructor/admin, ensure they are added to assignedInstructors
    if (user.role === "instructor" || user.role === "admin" || user.role === "superadmin") {
      if (!institution.assignedInstructors.includes(user._id)) {
        institution.assignedInstructors.push(user._id);
        await institution.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: `User '${user.name}' successfully assigned to ${institution.name} (${institution.code})`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        institution: user.institution,
        institutionCode: user.institutionCode,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Remove a user from an institution
export const removeUserFromInstitution = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.institution = null;
    user.institutionCode = null;
    await user.save();

    await Institution.findByIdAndUpdate(id, {
      $pull: { assignedInstructors: userId },
    });

    return res.status(200).json({
      success: true,
      message: `User '${user.name}' unlinked from institution`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Update institution details or status
export const updateInstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, status, contactEmail, contactPhone, address, notes } = req.body;

    const institution = await Institution.findById(id);
    if (!institution) {
      return res.status(404).json({ success: false, message: "Institution not found" });
    }

    if (code && code.toUpperCase().trim() !== institution.code) {
      const cleanCode = code.toUpperCase().trim();
      const existing = await Institution.findOne({ code: cleanCode, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Institution code '${cleanCode}' is already in use`,
        });
      }
      institution.code = cleanCode;
      // Sync code to all linked users
      await User.updateMany({ institution: id }, { institutionCode: cleanCode });
    }

    if (name) institution.name = name.trim();
    if (status) institution.status = status;
    if (contactEmail !== undefined) institution.contactEmail = contactEmail.trim().toLowerCase();
    if (contactPhone !== undefined) institution.contactPhone = contactPhone.trim();
    if (address !== undefined) institution.address = address.trim();
    if (notes !== undefined) institution.notes = notes.trim();

    await institution.save();

    return res.status(200).json({
      success: true,
      message: "Institution updated successfully",
      institution,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Delete institution
export const deleteInstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const institution = await Institution.findByIdAndDelete(id);

    if (!institution) {
      return res.status(404).json({ success: false, message: "Institution not found" });
    }

    // Unlink users
    await User.updateMany({ institution: id }, { institution: null, institutionCode: null });

    return res.status(200).json({
      success: true,
      message: "Institution deleted and affiliated users updated to unassigned",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
