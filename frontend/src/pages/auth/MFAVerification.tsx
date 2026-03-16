import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  QrCode,
  Download,
  Copy,
  Check,
} from "lucide-react";
import QRCode from "qrcode";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import Logo from "../../components/Logo";

interface MFAData {
  success: boolean;
  message: string;
  qrCode?: string;
  manualCode?: string;
  localIP?: string;
}

const MFAVerification: React.FC = () => {
  const [mfaToken, setMfaToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mfaData, setMfaData] = useState<MFAData | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [showQR, setShowQR] = useState(true);
  const [copied, setCopied] = useState(false);
  const [generatedQRCode, setGeneratedQRCode] = useState<string>("");
  const [isSetupDone, setIsSetupDone] = useState<boolean>(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { verifyMFA } = useAuth();

  useEffect(() => {
    console.log("MFA Verification - Location state:", location.state);
    // Get MFA data and email from location state
    if (location.state?.mfaData && location.state?.email) {
      console.log("MFA data received:", location.state.mfaData);
      console.log("User email:", location.state.email);
      setMfaData(location.state.mfaData);
      setUserEmail(location.state.email);

      // Determine if setup is already done. If the backend didn't send a secret, assume done.
      const setupKey = `mfaSetupDone:${location.state.email}`;
      const saved = localStorage.getItem(setupKey) === "true";
      const backendIndicatesDone = !location.state.mfaData.manualCode;
      console.log(
        "Setup status - saved:",
        saved,
        "backend indicates done:",
        backendIndicatesDone
      );
      setIsSetupDone(saved || backendIndicatesDone);
    } else {
      console.log("No MFA data found, redirecting to login");
      // If no MFA data, redirect to login
      navigate("/login");
    }
  }, [location.state, navigate]);

  // Generate QR code for Google Authenticator using otpauth URI when manual code changes
  useEffect(() => {
    if (!isSetupDone && mfaData?.manualCode && userEmail) {
      generateQRCode();
    }
  }, [mfaData?.manualCode, userEmail, isSetupDone]);

  const buildOtpAuthUri = (secret: string, email: string): string => {
    const issuer = "EnviGuide";
    // Use a simpler label format that Google Authenticator prefers
    const label = `${issuer}:${email}`;

    // Validate that the secret is base32-encoded
    const base32Regex = /^[A-Z2-7]+=*$/;
    if (!base32Regex.test(secret)) {
      console.warn("Secret may not be properly base32-encoded:", secret);
    }

    // Build the URI with proper formatting
    const uri = `otpauth://totp/${encodeURIComponent(
      label
    )}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(
      issuer
    )}&algorithm=SHA1&digits=6&period=30`;

    return uri;
  };

  const generateQRCode = async () => {
    if (!mfaData?.manualCode || !userEmail) return;
    try {
      const otpauth = buildOtpAuthUri(mfaData.manualCode, userEmail);

      // Validate the URI format
      if (!otpauth.startsWith("otpauth://totp/")) {
        console.error("Invalid otpauth URI format:", otpauth);
        return;
      }

      const qrDataURL = await QRCode.toDataURL(otpauth, {
        margin: 1, // Reduced margin for better scanning
        color: { dark: "#000000", light: "#FFFFFF" },
        errorCorrectionLevel: "H", // High error correction for better scanning
        type: "image/png",
      });

      setGeneratedQRCode(qrDataURL);
    } catch (err) {
      console.error("Error generating QR code:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (!mfaToken.trim()) {
      setError("Please enter the MFA token");
      setIsLoading(false);
      return;
    }

    try {
      const result = await verifyMFA(userEmail, mfaToken);
      console.log("MFA verification result:", result);

      if (result.success && result.user) {
        // Mark setup as done for this email so we don't show QR/manual code again
        const setupKey = `mfaSetupDone:${userEmail}`;
        localStorage.setItem(setupKey, "true");
        setIsSetupDone(true);

        setSuccess("MFA verified successfully! Redirecting to dashboard...");
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 1000);
      } else {
        setError(
          result.message || "MFA verification failed. Please try again."
        );
      }
    } catch (error) {
      console.error("MFA verification error:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (generatedQRCode) {
      const link = document.createElement("a");
      link.href = generatedQRCode;
      link.download = "mfa-qr-code.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const copyManualCode = async () => {
    if (mfaData?.manualCode) {
      try {
        await navigator.clipboard.writeText(mfaData.manualCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        const textArea = document.createElement("textarea");
        textArea.value = mfaData.manualCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  if (!mfaData) {
    return null; // Will redirect to login
  }

  const shouldShowSetup = !isSetupDone && !!mfaData.manualCode;

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
              MFA Verification
            </h2>
            <p className="text-gray-600">
              Enter the 6-digit code from your authenticator app
            </p>
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

          {/* MFA Setup (QR / Manual) only until completed */}
          {shouldShowSetup && (
            <div className="mb-6">
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  onClick={() => setShowQR(true)}
                  className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                    showQR
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <QrCode className="inline w-4 h-4 mr-2" />
                  QR Code
                </button>
                <button
                  onClick={() => setShowQR(false)}
                  className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                    !showQR
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Manual Code
                </button>
              </div>

              {/* QR Code Tab */}
              {showQR && generatedQRCode && (
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-4">
                    <img
                      src={generatedQRCode}
                      alt="MFA QR Code"
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Scan this QR code with Google Authenticator or any TOTP
                      app
                    </p>
                    <p className="text-xs text-green-600 font-medium">
                      ✓ Compatible with Google Authenticator, Authy, Microsoft
                      Authenticator
                    </p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={downloadQRCode}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download QR Code
                      </button>
                      {/* <button
                        onClick={generateQRCode}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        Regenerate QR
                      </button> */}
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Code Tab */}
              {!showQR && mfaData.manualCode && (
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Manual Setup Code
                  </h3>
                  <p className="text-xs text-gray-600 mb-3">
                    If you can't scan the QR code, use this manual code in your
                    authenticator app:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-3">
                    <div className="font-mono text-lg text-gray-800 break-all select-all">
                      {mfaData.manualCode}
                    </div>
                  </div>
                  <button
                    onClick={copyManualCode}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </button>
                  <div className="mt-3 text-xs text-gray-600 space-y-1">
                    <p>
                      <strong>Google Authenticator Setup:</strong>
                    </p>
                    <p>1. Open Google Authenticator app</p>
                    <p>2. Tap the + button</p>
                    <p>3. Choose "Enter a setup key"</p>
                    <p>
                      4. Enter account name:{" "}
                      <strong>EnviGuide:{userEmail}</strong>
                    </p>
                    <p>5. Enter the key above</p>
                    <p>6. Choose "Time based"</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Verification */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="mfaToken"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                MFA Token
              </label>
              <input
                id="mfaToken"
                name="mfaToken"
                type="text"
                autoComplete="one-time-code"
                required
                maxLength={6}
                pattern="[0-9]{6}"
                className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-center text-lg font-mono tracking-widest"
                placeholder="000000"
                value={mfaToken}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setMfaToken(value);
                }}
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500 text-center">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg shadow-green-600/20 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" className="border-white" />
              ) : (
                "Verify MFA"
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

          {/* Help Information */}
          <div className="mt-8 p-4 bg-gray-50 rounded-xl">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Need Help?
            </h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Make sure your device time is synchronized</li>
              <li>• Check that you're using the correct authenticator app</li>
              <li>• Ensure you're entering the current 6-digit code</li>
              <li>• The code refreshes every 30 seconds</li>
              <li>
                • Popular apps: Google Authenticator, Authy, Microsoft
                Authenticator
              </li>
            </ul>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                Lost access to your authenticator app?{" "}
                <Link
                  to="/forgot-mfa"
                  className="text-green-600 hover:text-green-500 font-medium"
                >
                  Reset MFA
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MFAVerification;
