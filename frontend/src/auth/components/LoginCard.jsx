import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function LoginCard() {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login logic here
  };

  return (
    <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300">
      <div className="card-body">
        <h2 className="card-title text-4xl font-bold text-center w-full my-4 justify-center">
          Login
        </h2>

        <form onSubmit={handleSubmit}>
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

          {/* Remember me & Forgot password */}
          <div className="flex justify-between items-center mb-6">
            <label className="label cursor-pointer gap-2">
              <input type="checkbox" className="checkbox checkbox-primary" />
              <span className="label-text">Remember me</span>
            </label>
            <a href="/forgot-password" className="link link-primary text-sm">
              Forgot password?
            </a>
          </div>

          {/* Login Button */}
          <div className="form-control mb-4">
            <button type="submit" className="btn btn-primary w-full">
              Login
            </button>
          </div>
        </form>

        {/* Sign up link */}
        <p className="text-center text-sm">
          Don't have an account?{" "}
          <a href="/signup" className="link link-primary">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}

export default LoginCard;
