import { useState } from "react";
import { Link } from "react-router";
import { useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { signup } from "../../api/authApi";

function SignupCard() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!agreedToTerms) {
      toast.error("Please agree to the Terms of Service");
      return;
    }

    try {
      setIsSubmitting(true);

      const authenticatedUser = await signup({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });

      window.localStorage.removeItem("rankrite_user");
      window.sessionStorage.removeItem("rankrite_user");
      window.localStorage.setItem("rankrite_user", JSON.stringify(authenticatedUser));

      toast.success("Account created successfully");
      navigate("/", { replace: true });
    } catch (error) {
      const message =
        error?.response?.data?.message ?? "Failed to sign up. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-auth-card">
      <div className="card-body p-6 md:p-7">
        <h2 className="app-auth-title">Create Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label pb-1">
              <span className="label-text font-medium">Full name</span>
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              className="input input-bordered w-full"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </div>

          <div className="form-control">
            <label className="label pb-1">
              <span className="label-text font-medium">Email address</span>
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="input input-bordered w-full"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="form-control">
            <label className="label pb-1">
              <span className="label-text font-medium">Password</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="input input-bordered w-full pr-10"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-ghost btn-circle btn-sm absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-control">
            <label className="label pb-1">
              <span className="label-text font-medium">Confirm password</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                className="input input-bordered w-full pr-10"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-ghost btn-circle btn-sm absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-2 p-0">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={agreedToTerms}
                onChange={(event) => setAgreedToTerms(event.target.checked)}
              />
              <span className="label-text">
                I agree to the{" "}
                <a href="/terms" className="link link-primary">
                  Terms of Service
                </a>
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="pt-2 text-center text-sm text-base-content/80">
          Already have an account?{" "}
          <Link to="/auth/login" className="link link-primary font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignupCard;
