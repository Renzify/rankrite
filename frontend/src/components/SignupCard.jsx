import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function SignupCard() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle signup logic here
  };

  return (
    <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300">
      <div className="card-body">
        <h2 className="card-title text-4xl font-bold text-center w-full my-4 justify-center">
          Create Account
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Fullname */}
          <div className="form-control mb-4">
            <label className="label mb-2">
              <span className="label-text">Full name</span>
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              className="input input-bordered w-full"
              required
            />
          </div>

          {/* Email Address */}
          <div className="form-control mb-4">
            <label className="label mb-2">
              <span className="label-text">Email address</span>
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="input input-bordered w-full"
              required
            />
          </div>

          {/* Password */}
          <div className="form-control mb-4">
            <label className="label mb-2">
              <span className="label-text">Password</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="input input-bordered w-full pr-10"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-control mb-4">
            <label className="label mb-2">
              <span className="label-text">Confirm Password</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                className="input input-bordered w-full pr-10"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Terms of Service */}
          <div className="form-control mb-6">
            <label className="label cursor-pointer justify-start gap-2">
              <input type="checkbox" className="checkbox checkbox-primary" />
              <span className="label-text">
                I agree to the{" "}
                <a href="/terms" className="link link-primary">
                  Terms of Service
                </a>
              </span>
            </label>
          </div>

          {/* Sign up Button */}
          <div className="form-control mb-4">
            <button type="submit" className="btn btn-primary w-full">
              Sign Up
            </button>
          </div>
        </form>

        {/* Login link */}
        <p className="text-center text-sm">
          Already have an account?{" "}
          <a href="/login" className="link link-primary">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}

export default SignupCard;
