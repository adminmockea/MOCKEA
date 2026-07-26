import BookingSlot from "../model/bookingSlot.js";
import User from "../model/user.js";
import { sendPushNotification } from "../utils/push.js";

const runSelfHealingCleanup = async () => {
  try {
    const now = new Date();
    // 1. Keep unbooked available slots in the past so instructors can view/delete them. (Removed deleteMany)
    // 2. Auto-complete booked slots that are in the past
    await BookingSlot.updateMany({ status: "booked", endTime: { $lt: now } }, { $set: { status: "completed" } });
  } catch (error) {
    console.error("[Self Healing Cleanup] Error:", error);
  }
};

// @desc    Create new availability slots (Instructor Only)
// @route   POST /api/bookings/slots
export const createSlots = async (req, res, next) => {
  try {
    const { email } = req.user; // from verifyUserRole
    const { startTime, endTime, meetingLink } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({ success: false, message: "Start time and End time are required." });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ success: false, message: "End time must be after start time." });
    }

    // Overlap Check (Senior Dev Improvement)
    const overlap = await BookingSlot.findOne({
      instructor: req.user._id,
      status: { $in: ["available", "booked"] },
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } },
      ],
    });

    if (overlap) {
      return res.status(409).json({ success: false, message: "This slot overlaps with an existing availability slot." });
    }

    const newSlot = await BookingSlot.create({
      instructor: req.user._id,
      startTime: start,
      endTime: end,
      meetingLink: meetingLink || "",
    });

    res.status(201).json({ success: true, slot: newSlot });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all slots created by the logged-in instructor
// @route   GET /api/bookings/instructor/slots
export const getInstructorSlots = async (req, res, next) => {
  try {
    await runSelfHealingCleanup();
    const slots = await BookingSlot.find({ instructor: req.user._id })
      .populate("bookedBy", "name email plan")
      .sort({ startTime: 1 });

    res.status(200).json({ success: true, slots });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a slot (Instructor Only)
// @route   PUT /api/bookings/slots/:id
export const updateSlot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, meetingLink } = req.body;

    const slot = await BookingSlot.findOne({ _id: id, instructor: req.user._id });
    if (!slot) {
      return res.status(404).json({ success: false, message: "Slot not found or unauthorized." });
    }

    if (slot.status === "booked" && (startTime || endTime)) {
      return res.status(400).json({ success: false, message: "Cannot edit slot timings once a student has booked it." });
    }

    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (start >= end) {
        return res.status(400).json({ success: false, message: "End time must be after start time." });
      }

      // Check overlap excluding this slot itself
      const overlap = await BookingSlot.findOne({
        _id: { $ne: id },
        instructor: req.user._id,
        status: { $in: ["available", "booked"] },
        $or: [
          { startTime: { $lt: end }, endTime: { $gt: start } },
        ],
      });

      if (overlap) {
        return res.status(409).json({ success: false, message: "Overlaps with another scheduled slot." });
      }

      slot.startTime = start;
      slot.endTime = end;
    }

    let meetingLinkUpdated = false;
    if (meetingLink !== undefined && meetingLink !== slot.meetingLink) {
      slot.meetingLink = meetingLink;
      meetingLinkUpdated = true;
    }

    await slot.save();

    if (meetingLinkUpdated && slot.status === "booked" && slot.bookedBy) {
      await sendPushNotification(
        slot.bookedBy,
        "Meeting Link Updated",
        `The instructor has updated the meeting link for your speaking session scheduled on ${new Date(slot.startTime).toLocaleDateString()}.`
      );
    }

    res.status(200).json({ success: true, slot });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a slot (Instructor Only)
// @route   DELETE /api/bookings/slots/:id
export const deleteSlot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const slot = await BookingSlot.findOne({ _id: id, instructor: req.user._id });

    if (!slot) {
      return res.status(404).json({ success: false, message: "Slot not found or unauthorized." });
    }

    // If it was already booked, notify the student via push
    if (slot.status === "booked" && slot.bookedBy) {
      await sendPushNotification(
        slot.bookedBy,
        "Session Cancelled by Instructor",
        `Your booked session scheduled for ${new Date(slot.startTime).toLocaleDateString()} has been cancelled.`
      );
    }

    await BookingSlot.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Slot deleted successfully." });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all available slots for students
// @route   GET /api/bookings/slots/available
export const getAvailableSlots = async (req, res, next) => {
  try {
    await runSelfHealingCleanup();
    // Only fetch upcoming available slots (with a 1-minute buffer to prevent clock skews)
    const slots = await BookingSlot.find({
      status: "available",
      startTime: { $gt: new Date(Date.now() + 60 * 1000) },
    })
      .populate("instructor", "name email specialty bio rating imageUrl")
      .sort({ startTime: 1 });

    res.status(200).json({ success: true, slots });
  } catch (error) {
    next(error);
  }
};

// @desc    Book a slot (Student Only)
// @route   POST /api/bookings/slots/:id/book
export const bookSlot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { studentNotes } = req.body;
    const student = req.user; // from verifyUserRole

    // Premium/Standard gating (Safety Check)
    if (student.plan === "free") {
      return res.status(403).json({
        success: false,
        message: "Booking mock speaking sessions with certified instructors is a premium feature. Please upgrade your plan.",
      });
    }

    // Atomic Booking Update (Senior Dev Improvement to avoid double-bookings)
    const slot = await BookingSlot.findOneAndUpdate(
      { _id: id, status: "available", startTime: { $gt: new Date() } },
      {
        $set: {
          status: "booked",
          bookedBy: student._id,
          studentNotes: studentNotes || "",
        },
      },
      { returnDocument: 'after' }
    ).populate("instructor", "name");

    if (!slot) {
      return res.status(409).json({
        success: false,
        message: "This slot is no longer available or has already been booked.",
      });
    }

    // Dispatch push notification reminder to the instructor
    await sendPushNotification(
      slot.instructor._id,
      "New Speaking Session Booked!",
      `${student.name} has scheduled a session for ${new Date(slot.startTime).toLocaleDateString()} at ${new Date(slot.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
    );

    res.status(200).json({ success: true, message: "Booking confirmed successfully!", slot });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings for the logged-in student
// @route   GET /api/bookings/student/bookings
export const getStudentBookings = async (req, res, next) => {
  try {
    await runSelfHealingCleanup();
    const bookings = await BookingSlot.find({ bookedBy: req.user._id })
      .populate("instructor", "name email specialty imageUrl")
      .sort({ startTime: 1 });

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a booked session (Student or Instructor)
// @route   POST /api/bookings/slots/:id/cancel
export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const slot = await BookingSlot.findById(id).populate("instructor").populate("bookedBy");

    if (!slot) {
      return res.status(404).json({ success: false, message: "Slot not found." });
    }

    if (slot.status !== "booked") {
      return res.status(400).json({ success: false, message: "This slot is not booked." });
    }

    // Verify authorized user (must be student who booked, or the instructor)
    const isStudent = slot.bookedBy && String(slot.bookedBy._id) === String(userId);
    const isInstructor = slot.instructor && String(slot.instructor._id) === String(userId);

    if (!isStudent && !isInstructor) {
      return res.status(403).json({ success: false, message: "Unauthorized to cancel this booking." });
    }

    const originalStartTime = new Date(slot.startTime);

    // Reset slot back to available and clear booking details
    slot.status = "available";
    slot.bookedBy = null;
    slot.studentNotes = "";
    await slot.save();

    // Trigger push notification to the opposite party
    if (isStudent) {
      await sendPushNotification(
        slot.instructor._id,
        "Student Cancelled Booking",
        `${slot.bookedBy ? slot.bookedBy.name : "A student"} cancelled the session scheduled for ${originalStartTime.toLocaleDateString()}.`
      );
    } else if (slot.bookedBy) {
      await sendPushNotification(
        slot.bookedBy._id,
        "Instructor Cancelled Booking",
        `${slot.instructor ? slot.instructor.name : "The instructor"} has cancelled the session scheduled for ${originalStartTime.toLocaleDateString()}.`
      );
    }

    res.status(200).json({ success: true, message: "Booking cancelled successfully.", slot });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a booked slot as completed (Instructor Only)
// @route   POST /api/bookings/slots/:id/complete
export const completeBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const instructorId = req.user._id;

    const slot = await BookingSlot.findOne({ _id: id, instructor: instructorId });

    if (!slot) {
      return res.status(404).json({ success: false, message: "Slot not found or unauthorized." });
    }

    if (slot.status !== "booked") {
      return res.status(400).json({ success: false, message: "Only booked sessions can be marked as completed." });
    }

    slot.status = "completed";
    await slot.save();

    // Trigger push notification to student
    if (slot.bookedBy) {
      await sendPushNotification(
        slot.bookedBy,
        "Mock Interview Completed",
        `Your IELTS speaking mock session with ${req.user.name} has been marked completed.`
      );
    }

    res.status(200).json({ success: true, message: "Session marked as completed successfully.", slot });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Booking Analytics for Admin
// @route   GET /api/bookings/admin/analytics
export const getAdminBookingAnalytics = async (req, res, next) => {
  try {
    await runSelfHealingCleanup();

    // 1. Available Instructors (instructors with upcoming available slots)
    const availableSlots = await BookingSlot.find({ status: "available", startTime: { $gt: new Date() } })
      .populate("instructor", "name email specialty");
    const availableInstructorsMap = new Map();
    availableSlots.forEach(s => {
      if (s.instructor) {
        availableInstructorsMap.set(String(s.instructor._id), s.instructor);
      }
    });
    const availableInstructors = Array.from(availableInstructorsMap.values());

    // 2. Instructor Session Metrics (completed session counts)
    const completedSessionCounts = await BookingSlot.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: "$instructor", sessionCount: { $sum: 1 } } }
    ]);

    // Populate instructor details for the metrics
    const instructorMetrics = await Promise.all(completedSessionCounts.map(async (metric) => {
      const instructorInfo = await User.findById(metric._id, "name email specialty imageUrl");
      return {
        instructor: instructorInfo,
        sessionCount: metric.sessionCount
      };
    }));

    // 3. Meeting Logs (all booked and completed meetings)
    const meetingLogs = await BookingSlot.find({ status: { $in: ["booked", "completed"] } })
      .populate("instructor", "name email specialty")
      .populate("bookedBy", "name email plan")
      .sort({ startTime: -1 });

    res.status(200).json({
      success: true,
      availableInstructors,
      instructorMetrics,
      meetingLogs
    });
  } catch (error) {
    next(error);
  }
};
