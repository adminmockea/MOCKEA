import { useState, useMemo } from "react";
import { PiCalendarBlankFill, PiClockFill, PiUserCircleFill, PiLinkBold, PiTrashBold, PiSpinner, PiPlusBold } from "react-icons/pi";

const BookingModal = ({
  showBookingModal,
  setShowBookingModal,
  selectedDate,
  setSelectedDate,
  selectedSlotId,
  setSelectedSlotId,
  studentNotes,
  setStudentNotes,
  isSubmittingBooking,
  availableSlots,
  bookedSessions,
  handleConfirmBooking,
  handleCancelBooking,
}) => {
  const filteredSlotsForDate = useMemo(() => {
    if (!selectedDate) return [];
    const now = new Date();
    return availableSlots.filter((slot) => {
      const dateObj = new Date(slot.startTime);
      if (dateObj <= now) return false;
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      const slotDateStr = `${year}-${month}-${day}`;
      return slotDateStr === selectedDate;
    });
  }, [availableSlots, selectedDate]);

  return (
    <>
      {/* Existing Bookings & Book Button Header Banner */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-primary font-bold text-xs">Live 1-on-1 Sessions</span>
            <h3 className="text-lg font-black text-slate-800">Book Instructor Mock Exam</h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Schedule a live 15-minute 1-on-1 IELTS speaking mock test with a certified instructor.
          </p>
        </div>
        <button
          onClick={() => setShowBookingModal(true)}
          className="btn btn-primary rounded-2xl font-black text-xs uppercase tracking-wider px-6 shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <PiPlusBold className="text-base" /> Book Live Session
        </button>
      </div>

      {/* Student Booked Sessions Display */}
      {bookedSessions.length > 0 && (
        <div className="bg-slate-900 text-white rounded-[2.5rem] p-6 shadow-xl mb-6 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <PiCalendarBlankFill className="text-primary" /> Your Upcoming Live Sessions
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookedSessions.map((session) => (
              <div key={session._id} className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center text-xl font-black">
                      <PiUserCircleFill />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-white">
                        {session.instructorId?.name || "Certified Instructor"}
                      </h5>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(session.startTime).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <span className="badge badge-success text-[10px] font-black uppercase tracking-wider">
                    {session.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/40">
                  <PiClockFill className="text-primary shrink-0" />
                  <span>
                    {new Date(session.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(session.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {session.meetingLink ? (
                  <a
                    href={session.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-primary rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <PiLinkBold /> Join Live Meeting
                  </a>
                ) : (
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] text-slate-400 italic">Meeting link will appear before session</span>
                    <button
                      onClick={() => handleCancelBooking(session._id)}
                      className="btn btn-ghost btn-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
                    >
                      <PiTrashBold /> Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Modal Popup */}
      {showBookingModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg rounded-[2.5rem] p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-800">Book 1-on-1 Session</h3>
                <p className="text-xs text-slate-500 font-medium">Select a date and available instructor slot</p>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="btn btn-sm btn-circle btn-ghost text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlotId("");
                  }}
                  className="input input-bordered rounded-2xl w-full text-sm font-semibold focus:input-primary"
                />
              </div>

              {selectedDate && (
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2">
                    Available Time Slots ({filteredSlotsForDate.length})
                  </label>
                  {filteredSlotsForDate.length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                      No available instructor slots for this date.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {filteredSlotsForDate.map((slot) => {
                        const startTime = new Date(slot.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                        const endTime = new Date(slot.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                        const isSelected = selectedSlotId === slot._id;
                        return (
                          <button
                            key={slot._id}
                            type="button"
                            onClick={() => setSelectedSlotId(slot._id)}
                            className={`p-3 rounded-2xl border text-xs font-mono font-bold transition-all text-left flex flex-col gap-1 ${
                              isSelected
                                ? "bg-primary text-white border-primary shadow-md"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:border-primary/50"
                            }`}
                          >
                            <span className="font-sans text-[11px] font-bold opacity-80">
                              {slot.instructorId?.name || "Instructor"}
                            </span>
                            <span>{startTime} - {endTime}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2">
                  Notes for Instructor (Optional)
                </label>
                <textarea
                  value={studentNotes}
                  onChange={(e) => setStudentNotes(e.target.value)}
                  placeholder="e.g. Please focus on my Task 2 pronunciation and fluency..."
                  className="textarea textarea-bordered rounded-2xl w-full text-xs font-medium focus:textarea-primary h-20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="btn btn-ghost rounded-2xl text-xs font-bold text-slate-500"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedSlotId || isSubmittingBooking}
                onClick={handleConfirmBooking}
                className="btn btn-primary rounded-2xl font-black text-xs uppercase tracking-wider px-6"
              >
                {isSubmittingBooking ? <PiSpinner className="animate-spin text-lg" /> : "Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookingModal;
