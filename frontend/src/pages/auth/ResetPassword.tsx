import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { authService } from "../../lib/authService";
import LoadingSpinner from "../../components/LoadingSpinner";
import Logo from "../../components/Logo";

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Get token from URL parameters
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError(
        "Invalid or missing reset token. Please request a new password reset."
      );
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!password.trim()) {
      setError("Please enter a new password");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.resetPassword(token, password);

      if (result.success) {
        setSuccess("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2000);
      } else {
        setError(result.message || "Password reset failed. Please try again.");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex">
        {/* Left Panel - Dark Blue Background */}
        <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col items-center justify-center px-8">
          <Logo className="mb-8" variant="dark" />
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">
              Welcome to EnviGuide Management Suite
            </h1>
            <p className="text-slate-300 text-lg">
              Manage your work, track progress, and collaborate with your team
              seamlessly.
            </p>
          </div>
        </div>

        {/* Right Panel - White Background */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 bg-white">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Invalid Reset Link
              </h2>
              <p className="text-gray-600">
                The password reset link is invalid or has expired
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">
                    Invalid or missing reset token. Please request a new
                    password reset.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => navigate("/forgot-password")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Request New Reset Link
              </button>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center text-green-600 hover:text-green-500 font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Dark Blue Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col items-center justify-center px-8">
        <Logo className="mb-8" variant="dark" />
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">
            Welcome to EnviGuide Management Suite
          </h1>
          <p className="text-slate-300 text-lg">
            Manage your work, track progress, and collaborate with your team
            seamlessly.
          </p>
        </div>
      </div>

      {/* Right Panel - White Background */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Reset Password
            </h2>
            <p className="text-gray-600">Enter your new password below</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters long
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg shadow-green-600/20 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" className="border-white" />
              ) : (
                "Reset Password"
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center text-green-600 hover:text-green-500 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
