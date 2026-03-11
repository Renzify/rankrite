import { useState } from "react";
import { Link } from "react-router";
import { Eye, EyeOff } from "lucide-react";

function LoginCard() {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <div className="app-auth-card">
      <div className="card-body p-6 md:p-7">
        <h2 className="app-auth-title">Login</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label pb-1">
              <span className="label-text font-medium">Email address</span>
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="input input-bordered w-full"
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

          <div className="flex items-center justify-between pt-1">
            <label className="label cursor-pointer gap-2 p-0">
              <input type="checkbox" className="checkbox checkbox-primary" />
              <span className="label-text">Remember me</span>
            </label>
            <Link to="/auth/forgot-password" className="link link-primary text-sm">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary w-full">
            Login
          </button>
        </form>

        <p className="pt-2 text-center text-sm text-base-content/80">
          Don&apos;t have an account?{" "}
          <Link to="/auth/signup" className="link link-primary font-medium">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginCard;
