import { useState } from "react";
import { signInWithCustomToken } from "firebase/auth";
import auth from "../../../../firebase.config";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import { toast } from "react-toastify";

const ImpersonationTool = () => {
  const [targetEmail, setTargetEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const axiosSecure = useAxiosSecure();

  const handleImpersonate = async (e) => {
    e.preventDefault();
    if (!targetEmail) return;

    setIsLoading(true);
    try {
      const response = await axiosSecure.post("/superadmin/impersonate", {
        email: targetEmail,
      });

      if (response.data?.success && response.data?.customToken) {
        const targetToken = response.data.customToken;
        const restoreTicket = response.data.restoreTicket;
        const adminEmail = auth.currentUser?.email;

        sessionStorage.setItem("isImpersonating", "true");
        sessionStorage.setItem("impersonatorEmail", adminEmail || "");
        if (restoreTicket) {
          sessionStorage.setItem("adminRestoreTicket", restoreTicket);
        }

        toast.info(`Switching session to ${targetEmail}...`);
        await signInWithCustomToken(auth, targetToken);
        toast.success(`Success! You are now logged in as ${targetEmail}`);
        window.location.href = "/dashboard";
      } else {
        toast.error("Failed to generate impersonation token.");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error generating impersonation token.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl rounded-[2rem] border border-base-300 p-6 md:p-8">
      <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">User Impersonation Tool</h2>
      <p className="text-sm text-slate-500 mb-6">
        Allows you to temporarily sign in as any student or instructor to diagnose account issues, score errors, or layout bugs.
      </p>

      <form onSubmit={handleImpersonate} className="flex flex-col md:flex-row gap-4 items-end">
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-semibold text-slate-600 dark:text-slate-300">Target Email Address</span>
          </label>
          <input
            type="email"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            placeholder="student@example.com"
            className="input input-bordered w-full rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`btn btn-primary rounded-2xl px-8 w-full md:w-auto font-bold shrink-0 ${
            isLoading ? "loading" : ""
          }`}
        >
          {isLoading ? "Generating Token..." : "Impersonate User"}
        </button>
      </form>
    </div>
  );
};

export default ImpersonationTool;
