import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router";
import { getAuth, deleteUser } from "firebase/auth";
import useAuth from "../../hooks/useAuth";
import { toast } from "react-toastify";
import SocialLoginButton from "./SocialLoginButton";
import PasswordStrengthIndicator from "./PasswordStrengthIndicator";
import { PiEye, PiEyeSlash } from "react-icons/pi";
import useAxiosSecure from "../../hooks/useAxiosSecure";

const Register = ({ onSuccess, isModal, onToggleAuth }) => {
  const { register: registerUser, setLoading } = useAuth();
  const [show, isShow] = useState(false);
  const [show2, isShow2] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const axiosInstance = useAxiosSecure();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

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
        className={isModal ? "space-y-4" : "space-y-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200"}
      >
        {/* Social Login */}
        <SocialLoginButton onSuccess={onSuccess} />

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500 font-medium">
              Or sign up with email
            </span>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            placeholder="John Doe"
            className={`w-full px-4 py-2.5 border-2 rounded-lg transition-colors focus:outline-none ${
              errors.name
                ? "border-red-500 focus:border-red-500 focus:bg-red-50"
                : "border-gray-200 focus:border-blue-600 focus:bg-blue-50"
            }`}
            {...register("name", { required: "Full Name is required" })}
          />
          {errors.name && (
            <span className="text-red-500 text-xs mt-2 block font-semibold">
              {errors.name.message}
            </span>
          )}
        </div>

        {/* Targeted Exam Preference */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Target Exam Program
          </label>
          <select
            className="w-full px-4 py-2.5 border-2 rounded-lg border-gray-200 focus:border-blue-600 focus:bg-blue-50 focus:outline-none text-sm font-semibold"
            {...register("targetExam", { required: "Please select your target exam program" })}
          >
            <option value="IELTS">IELTS Preparation</option>
            <option value="PTE">PTE Academic Preparation</option>
          </select>
          {errors.targetExam && (
            <span className="text-red-500 text-xs mt-2 block font-semibold">
              {errors.targetExam.message}
            </span>
          )}
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Gender
          </label>
          <select
            className={`w-full px-4 py-2.5 border-2 rounded-lg transition-colors focus:outline-none text-sm font-semibold ${
              errors.gender
                ? "border-red-500 focus:border-red-500 focus:bg-red-50"
                : "border-gray-200 focus:border-blue-600 focus:bg-blue-50"
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
            <span className="text-red-500 text-xs mt-2 block font-semibold">
              {errors.gender.message}
            </span>
          )}
        </div>

        {/* Institution Code (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-bold text-gray-700">
              Institution Code <span className="text-gray-400 text-xs font-normal">(Optional)</span>
            </label>
            {instStatus.loading && (
              <span className="text-xs text-blue-600 animate-pulse font-medium">Validating code...</span>
            )}
            {instStatus.valid === true && (
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ✓ {instStatus.name}
              </span>
            )}
            {instStatus.valid === false && (
              <span className="text-xs text-rose-600 font-medium">✕ Invalid or inactive code</span>
            )}
          </div>
          <input
            type="text"
            placeholder="e.g. OXFORD2026"
            className="w-full px-4 py-2.5 border-2 rounded-lg transition-colors focus:outline-none uppercase font-mono font-semibold border-gray-200 focus:border-blue-600 focus:bg-blue-50"
            {...register("institutionCode")}
          />
          <p className="text-[11px] text-gray-400 mt-1">
            If your institution or academy gave you a code, enter it here so your instructors can review your tests.
          </p>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            className={`w-full px-4 py-2.5 border-2 rounded-lg transition-colors focus:outline-none ${
              errors.email
                ? "border-red-500 focus:border-red-500 focus:bg-red-50"
                : "border-gray-200 focus:border-blue-600 focus:bg-blue-50"
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
            <span className="text-red-500 text-xs mt-2 block font-semibold">
              {errors.email.message}
            </span>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              placeholder="••••••••"
              className={`w-full px-4 py-2.5 border-2 rounded-lg transition-colors focus:outline-none pr-12 ${
                errors.password
                  ? "border-red-500 focus:border-red-500 focus:bg-red-50"
                  : "border-gray-200 focus:border-blue-600 focus:bg-blue-50"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
            >
              {show ? (
                <PiEyeSlash className="w-5 h-5" />
              ) : (
                <PiEye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <span className="text-red-500 text-xs mt-2 block font-semibold">
              {errors.password.message}
            </span>
          )}
          <PasswordStrengthIndicator password={password} />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={show2 ? "text" : "password"}
              placeholder="••••••••"
              className={`w-full px-4 py-3 border-2 rounded-lg transition-colors focus:outline-none pr-12 ${
                errors.confirmPassword
                  ? "border-red-500 focus:border-red-500 focus:bg-red-50"
                  : "border-gray-200 focus:border-blue-600 focus:bg-blue-50"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
            >
              {show2 ? (
                <PiEyeSlash className="w-5 h-5" />
              ) : (
                <PiEye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="text-red-500 text-xs mt-2 block font-semibold">
              {errors.confirmPassword.message}
            </span>
          )}
        </div>

        {/* Terms Agreement */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={agreeToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
          />
          <label className="text-sm text-gray-600 cursor-pointer">
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
          className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition duration-200 ease-out transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
