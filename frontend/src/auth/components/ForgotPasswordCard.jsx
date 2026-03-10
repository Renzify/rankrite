import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

function ForgotPasswordCard() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle forgot password logic here
  };

  return (
    <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300">
      <div className="card-body">
        <h2 className="card-title text-3xl font-bold text-center w-full my-4 justify-center">
          Forgot Password
        </h2>

        <p className="text-center text-base-content/70 mb-6">
          Enter your email and we&apos;ll send you a link to reset your password
        </p>

        <form onSubmit={handleSubmit}>
          {/* Email Address */}
          <div className="form-control mb-6">
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

          {/* Submit Button */}
          <div className="form-control mb-4">
            <button type="submit" className="btn btn-primary w-full">
              Submit
            </button>
          </div>
        </form>

        {/* Back to Login */}
        <div className="form-control">
          <Link to="/auth/login" className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordCard;