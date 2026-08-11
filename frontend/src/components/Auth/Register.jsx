import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate, useOutletContext } from "react-router";
import { getAuth, deleteUser } from "firebase/auth";
import useAuth from "../../hooks/useAuth";
import { toast } from "react-toastify";
import SocialLoginButton from "./SocialLoginButton";
import PasswordStrengthIndicator from "./PasswordStrengthIndicator";
import FreeBookRegisterCard from "./FreeBookRegisterCard";
import { PiEye, PiEyeSlash } from "react-icons/pi";
import useAxiosSecure from "../../hooks/useAxiosSecure";
import { getFileUrl } from "../../utils/apiConfig";

const Register = ({ onSuccess, isModal, onToggleAuth }) => {
  const { register: registerUser, setLoading } = useAuth();
  const outletContext = useOutletContext();
  const [show, isShow] = useState(false);
  const [show2, isShow2] = useState(false);
  
  const [localClaimBook, setLocalClaimBook] = useState(true);
  const [localFeaturedBook, setLocalFeaturedBook] = useState(null);

  const claimBook = isModal ? localClaimBook : (outletContext?.claimBook ?? localClaimBook);
  const setClaimBook = isModal ? setLocalClaimBook : (outletContext?.setClaimBook ?? setLocalClaimBook);
  const featuredBook = isModal ? localFeaturedBook : (outletContext?.featuredBook ?? localFeaturedBook);
  const setFeaturedBook = isModal ? setLocalFeaturedBook : (outletContext?.setFeaturedBook ?? setLocalFeaturedBook);
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const from = location.state?.from?.pathname || "/";

  const triggerBookDownload = async () => {
    if (!claimBook) return;
    const link = getFileUrl(featuredBook?.link || "/books/mockea-ultimate-prep-guide.pdf");
    window.open(link, '_blank', 'noopener,noreferrer');
    toast.info("📥 Free E-Book opening in a new tab!", { autoClose: 4000 });
  };

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");
  const institutionCode = watch("institutionCode");

  const [instStatus, setInstStatus] = useState({ loading: false, valid: null, name: "" });

  useEffect(() => {
    if (!institutionCode || !institutionCode.trim()) {
      setInstStatus({ loading: false, valid: null, name: "" });
      return;
    }
    const timer = setTimeout(async () => {
      setInstStatus({ loading: true, valid: null, name: "" });
      try {
        const res = await axiosInstance.get(
          `/institutions/validate-code/${institutionCode.trim()}`,
          { validateStatus: (status) => status < 500 }
        );
        if (res.data && res.data.valid) {
          setInstStatus({
            loading: false,
            valid: true,
            name: res.data.institution?.name || "Verified Institution",
          });
        } else {
          setInstStatus({ loading: false, valid: false, name: "" });
        }
      } catch (err) {
        setInstStatus({ loading: false, valid: false, name: "" });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [institutionCode, axiosInstance]);

  useEffect(() => {
    if (confirmPassword) {
      trigger("confirmPassword");
    }
  }, [password, confirmPassword, trigger]);

  const onSubmit = async (data) => {
    if (!agreeToTerms) {
      toast.error("Please agree to the Terms of Service and Privacy Policy");
      return;
    }
    setIsLoading(true);
    try {
      // 1. Verify if the email is already registered in the backend
      let emailInUse = false;
      try {
        const res = await axiosInstance.get(`/user/verifyEmail/${data.email}`);
        if (res.data.success) {
          emailInUse = true;
        }
      } catch (err) {
        // If the server returns 404 (Not Found), it means the email is NOT in use, which is what we want!
        if (err.response && err.response.status === 404) {
          emailInUse = false;
        } else {
          // If it is another network or server error, throw it so the outer catch can handle it
          throw err;
        }
      }

      if (emailInUse) {
        toast.error("Email Already in Use. Please Login");
        setIsLoading(false);
        return;
      }

      // 2. Register user in Firebase auth
      await registerUser(data.email, data.password);

      // 3. Register user in backend database
      try {
        await axiosInstance.post("/user/auth/register", data);
        toast.success("User Created Successfully");
        setIsLoading(false);

        // Trigger free book download if enabled
        if (claimBook) {
          triggerBookDownload();
        }

        if (onSuccess) {
          onSuccess();
        } else {
          navigate(from, { replace: true });
        }
      } catch (err) {
        // Rollback: delete the Firebase account if backend registration fails
        try {
          const auth = getAuth();
          if (auth.currentUser) {
            await deleteUser(auth.currentUser);
          }
        } catch (deleteErr) {
          console.error("Failed to rollback Firebase account:", deleteErr);
        }
        setLoading(false);
        setIsLoading(false);
        toast.error("User Creation Failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setLoading(false);
      setIsLoading(false);
      
      const message = error.message || "";
      toast.error(
        message === "Firebase: Error (auth/email-already-in-use)."
          ? "Email Already in Use. Please Login"
          : "Something Went Wrong. Please Try Again"
      );
    }
  };



  return (
    <div>
      {!isModal && (
        <div className="mb-4">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            Create an Account
          </h2>
          <p className="text-gray-600">Join us to start your listening practice.</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className={isModal ? "space-y-4" : "space-y-4.5 bg-white p-6 sm:p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100"}
      >
        {/* Free E-Book Registration Feature Card (only in modal view) */}
        {isModal && (
          <FreeBookRegisterCard 
            claimBook={claimBook} 
            setClaimBook={setClaimBook} 
            onBookLoaded={setFeaturedBook} 
          />
        )}

        {/* Social Login */}
        <SocialLoginButton onSuccess={(result) => {
          if (claimBook) triggerBookDownload();
          if (onSuccess) onSuccess(result);
        }} />

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider">
            <span className="px-3 bg-white text-slate-400 font-semibold">
              Or sign up with email
            </span>
          </div>
        </div>

        {/* Row 1: Full Name & Target Exam Program */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="John Doe"
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border-2 rounded-xl transition-all duration-200 focus:outline-none ${
                errors.name
                  ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 bg-rose-50/30"
                  : "border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 bg-slate-50/40 hover:bg-white focus:bg-white"
              }`}
              {...register("name", { required: "Full Name is required" })}
            />
            {errors.name && (
              <span className="text-rose-500 text-xs mt-1 block font-semibold">
                {errors.name.message}
              </span>
            )}
          </div>

          {/* Targeted Exam Preference */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
              Target Exam Program
            </label>
            <select
              className="w-full px-3 py-2.5 text-xs sm:text-sm font-semibold border-2 rounded-xl transition-all duration-200 focus:outline-none border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 bg-slate-50/40 hover:bg-white focus:bg-white cursor-pointer truncate"
              {...register("targetExam", { required: "Please select your target exam program" })}
            >
              <option value="IELTS">IELTS Preparation</option>
              <option value="PTE">PTE Academic Prep</option>
            </select>
            {errors.targetExam && (
              <span className="text-rose-500 text-xs mt-1 block font-semibold">
                {errors.targetExam.message}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Gender & Institution Code (Optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          {/* Gender */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
              Gender
            </label>
            <select
              className={`w-full px-3 py-2.5 text-xs sm:text-sm font-semibold border-2 rounded-xl transition-all duration-200 focus:outline-none cursor-pointer ${
                errors.gender
                  ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 bg-rose-50/30"
                  : "border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 bg-slate-50/40 hover:bg-white focus:bg-white"
              }`}
              defaultValue=""
              {...register("gender", { required: "Gender is required" })}
            >
              <option value="" disabled>Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
            {errors.gender && (
              <span className="text-rose-500 text-xs mt-1 block font-semibold">
                {errors.gender.message}
              </span>
            )}
          </div>

          {/* Institution Code (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1 min-h-[20px]">
              <label className="block text-xs sm:text-sm font-bold text-slate-700">
                Institution Code <span className="text-slate-400 font-normal text-xs">(Optional)</span>
              </label>
              {instStatus.loading && (
                <span className="text-[11px] text-blue-600 animate-pulse font-medium shrink-0">Validating...</span>
              )}
              {instStatus.valid === true && (
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 shrink-0">
                  ✓ {instStatus.name}
                </span>
              )}
              {instStatus.valid === false && (
                <span className="text-[11px] text-rose-600 font-medium shrink-0">✕ Invalid code</span>
              )}
            </div>
            <input
              type="text"
              placeholder="E.G. OXFORD2026"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border-2 rounded-xl transition-all duration-200 focus:outline-none uppercase font-mono font-bold border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 bg-slate-50/40 hover:bg-white focus:bg-white"
              {...register("institutionCode")}
            />
            <p className="text-[11px] text-slate-400 mt-1 leading-tight">
              If your institution gave you a code, enter it here.
            </p>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border-2 rounded-xl transition-all duration-200 focus:outline-none ${
              errors.email
                ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 bg-rose-50/30"
                : "border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 bg-slate-50/40 hover:bg-white focus:bg-white"
            }`}
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: "Invalid email address",
              },
            })}
          />
          {errors.email && (
            <span className="text-rose-500 text-xs mt-1 block font-semibold">
              {errors.email.message}
            </span>
          )}
        </div>

        {/* Row 3: Password & Confirm Password */}
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {/* Password */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border-2 rounded-xl transition-all duration-200 focus:outline-none pr-12 ${
                    errors.password
                      ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 bg-rose-50/30"
                      : "border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 bg-slate-50/40 hover:bg-white focus:bg-white"
                  }`}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => isShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {show ? (
                    <PiEyeSlash className="w-5 h-5" />
                  ) : (
                    <PiEye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="text-rose-500 text-xs mt-1 block font-semibold">
                  {errors.password.message}
                </span>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={show2 ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border-2 rounded-xl transition-all duration-200 focus:outline-none pr-12 ${
                    errors.confirmPassword
                      ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 bg-rose-50/30"
                      : "border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 bg-slate-50/40 hover:bg-white focus:bg-white"
                  }`}
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) =>
                      value === password || "Passwords do not match",
                  })}
                />
                <button
                  type="button"
                  onClick={() => isShow2(!show2)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {show2 ? (
                    <PiEyeSlash className="w-5 h-5" />
                  ) : (
                    <PiEye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="text-rose-500 text-xs mt-1 block font-semibold">
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>
          </div>
          <PasswordStrengthIndicator password={password} />
        </div>

        {/* Terms Agreement */}
        <div className="flex items-start gap-2.5 pt-1">
          <input
            type="checkbox"
            id="agreeToTermsCheck"
            checked={agreeToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
          />
          <label htmlFor="agreeToTermsCheck" className="text-xs text-slate-600 cursor-pointer leading-tight select-none">
            I agree to the{" "}
            <a href="#" className="text-blue-600 font-semibold hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-600 font-semibold hover:underline">
              Privacy Policy
            </a>
          </label>
        </div>

        {/* Sign Up Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base mt-2"
        >
          {isLoading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </button>

        {/* Sign In Link */}
        <div className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          {isModal ? (
            <button
              type="button"
              onClick={onToggleAuth}
              className="text-blue-600 font-bold hover:text-blue-700 hover:underline"
            >
              Sign in here
            </button>
          ) : (
            <Link
              to="/auth/login"
              className="text-blue-600 font-bold hover:text-blue-700 hover:underline"
            >
              Sign in here
            </Link>
          )}
        </div>

        {/* Footer Links */}
        {!isModal && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-center text-xs text-gray-500 space-y-2">
            <p>
              <a href="#" className="hover:text-gray-700 hover:underline">
                Terms of Service
              </a>
              {" • "}
              <a href="#" className="hover:text-gray-700 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default Register;
