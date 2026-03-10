import { Outlet } from "react-router";

function Auth() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-8">
      <Outlet />
    </div>
  );
}

export default Auth;