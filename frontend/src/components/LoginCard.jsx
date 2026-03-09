function LoginCard() {
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
            <label className="label">
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
            <label className="label">
              <span className="label-text">Password</span>
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              className="input input-bordered w-full"
              required
            />
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
