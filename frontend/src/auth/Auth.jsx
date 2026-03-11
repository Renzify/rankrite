import { Outlet } from "react-router";

function Auth() {
  return (
    <div className="app-page">
      <div className="app-auth-shell">
        <div className="pointer-events-none absolute -left-8 -top-6 h-44 w-44 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -right-8 h-52 w-52 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="relative w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Auth;
