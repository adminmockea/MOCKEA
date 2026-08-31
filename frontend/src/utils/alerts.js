import Swal from "sweetalert2";

const BASE_SWAL_CONFIG = {
  background: "#ffffff",
  customClass: {
    container: "z-[99999]",
    popup: "rounded-[2rem] shadow-2xl border border-slate-100",
    confirmButton: "rounded-xl px-8 py-3 font-bold btn btn-primary text-white border-none mx-2",
    cancelButton: "rounded-xl px-8 py-3 font-bold btn btn-ghost text-slate-500 mx-2 hover:bg-slate-50"
  },
  buttonsStyling: false
};

export const alerts = {
  success: (title, text = "") => {
    return Swal.fire({
      ...BASE_SWAL_CONFIG,
      icon: "success",
      title,
      text,
      timer: 2000,
      showConfirmButton: false
    });
  },

  error: (title, text = "Something went wrong. Please try again.") => {
    return Swal.fire({
      ...BASE_SWAL_CONFIG,
      icon: "error",
      title,
      text
    });
  },

  confirmDelete: (itemName = "item") => {
    return Swal.fire({
      ...BASE_SWAL_CONFIG,
      icon: "warning",
      title: "Are you sure?",
      text: `This ${itemName} will be permanently removed. This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      customClass: {
        ...BASE_SWAL_CONFIG.customClass,
        confirmButton: "rounded-xl px-8 py-3 font-bold btn btn-error text-white border-none mx-2"
      }
    });
  },

  confirmAction: ({ title, text, confirmText = "Confirm", danger = false }) => {
    return Swal.fire({
      ...BASE_SWAL_CONFIG,
      icon: "warning",
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: "Cancel",
      customClass: {
        ...BASE_SWAL_CONFIG.customClass,
        confirmButton: `rounded-xl px-8 py-3 font-bold btn ${
          danger ? "btn-error" : "btn-primary"
        } text-white border-none mx-2`
      }
    });
  },

  confirmExitPractice: (testType = "practice test") => {
    return Swal.fire({
      ...BASE_SWAL_CONFIG,
      icon: "warning",
      title: "Exit and Auto-Submit?",
      text: `Are you sure? This will finalize your ${testType} and automatically evaluate your current progress.`,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Yes, Exit and Submit",
      denyButtonText: "Cancel & Discard",
      cancelButtonText: "Resume Practice",
      customClass: {
        ...BASE_SWAL_CONFIG.customClass,
        denyButton: "rounded-xl px-6 py-3 font-bold btn btn-error text-white border-none mx-2",
        confirmButton: "rounded-xl px-6 py-3 font-bold btn btn-primary text-white border-none mx-2",
        cancelButton: "rounded-xl px-6 py-3 font-bold btn btn-ghost text-slate-500 mx-2 hover:bg-slate-50"
      }
    });
  },

  confirmExitMockTest: () => {
    return Swal.fire({
      ...BASE_SWAL_CONFIG,
      icon: "warning",
      title: "Terminate Exam Session?",
      text: "Are you sure? This will discard your current mock exam progress and you cannot resume this attempt.",
      showCancelButton: true,
      confirmButtonText: "Yes, Exit Exam",
      cancelButtonText: "Resume Exam",
      customClass: {
        ...BASE_SWAL_CONFIG.customClass,
        confirmButton: "rounded-xl px-8 py-3 font-bold btn btn-error text-white border-none mx-2"
      }
    });
  },

  confirmTerminateMockTest: () => {
    return Swal.fire({
      ...BASE_SWAL_CONFIG,
      icon: "warning",
      title: "Terminate Mock Test Early?",
      text: "Are you sure you want to terminate the test now? Your current answers will be submitted for grading, and any unanswered questions will be marked as blank.",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Yes, Terminate and Submit",
      denyButtonText: "Cancel & Exit",
      cancelButtonText: "Resume Test",
      customClass: {
        ...BASE_SWAL_CONFIG.customClass,
        denyButton: "rounded-xl px-6 py-3 font-bold btn btn-error text-white border-none mx-2",
        confirmButton: "rounded-xl px-6 py-3 font-bold btn btn-primary text-white border-none mx-2",
        cancelButton: "rounded-xl px-6 py-3 font-bold btn btn-ghost text-slate-500 mx-2 hover:bg-slate-50"
      }
    });
  },

  confirmCancelPractice: (testType = "practice test") => {
    return Swal.fire({
      ...BASE_SWAL_CONFIG,
      icon: "warning",
      title: "Cancel Practice?",
      text: `You haven't answered any questions yet. Are you sure you want to cancel and exit this ${testType}?`,
      showCancelButton: true,
      confirmButtonText: "Yes, Cancel and Exit",
      cancelButtonText: "Resume Practice",
      customClass: {
        ...BASE_SWAL_CONFIG.customClass,
        confirmButton: "rounded-xl px-8 py-3 font-bold btn btn-error text-white border-none mx-2"
      }
    });
  },

  confirmCancelMockTest: () => {
    return Swal.fire({
      ...BASE_SWAL_CONFIG,
      icon: "warning",
      title: "Cancel Exam Session?",
      text: "You haven't answered any questions. Are you sure you want to cancel and exit? Your progress will not be saved.",
      showCancelButton: true,
      confirmButtonText: "Yes, Cancel and Exit",
      cancelButtonText: "Resume Exam",
      customClass: {
        ...BASE_SWAL_CONFIG.customClass,
        confirmButton: "rounded-xl px-8 py-3 font-bold btn btn-error text-white border-none mx-2"
      }
    });
  },
  promptTimer: (currentCount = 1) => {
    return Swal.fire({
      ...BASE_SWAL_CONFIG,
      title: "Set Time Limit",
      text: `Set time limit (in minutes) for ${currentCount} selected question set(s). Enter 0 or leave blank to reset to system section default.`,
      input: "number",
      inputAttributes: {
        min: 0,
        max: 300,
        step: 1,
        placeholder: "Duration in minutes (e.g. 20)"
      },
      showCancelButton: true,
      confirmButtonText: "Save Timer",
      cancelButtonText: "Cancel",
      customClass: {
        ...BASE_SWAL_CONFIG.customClass,
        input: "input input-bordered rounded-xl w-3/4 text-center font-bold text-lg my-3"
      }
    });
  }
};

export default alerts;
