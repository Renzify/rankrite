import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

function ForgotPasswordCard() {
  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <div className="app-auth-card">
      <div className="card-body p-6 md:p-7">
        <h2 className="app-auth-title">Forgot Password</h2>

        <p className="mb-1 text-center text-sm text-base-content/70">
          Enter your email and we&apos;ll send you a reset link.
        </p>

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

          <button type="submit" className="btn btn-primary w-full">
            Submit
          </button>
        </form>

        <div className="pt-1">
          <Link to="/auth/login" className="btn btn-ghost btn-sm gap-2 px-2">
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordCard;
