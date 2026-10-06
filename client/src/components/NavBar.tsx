import { Link } from "react-router-dom";
import { CodeBracketSquareIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { logout } from "../app/slices/authSlice";

export default function Navbar() {
  const token = useAppSelector((state) => state.auth.token);
  const dispatch = useAppDispatch();

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between">
        
        {/* Left: Brand Identity + Workspace Context */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-white hover:opacity-90 transition"
          >
            <CodeBracketSquareIcon className="h-6 w-6 text-[#6366F1]" />
            <span>
              Codex<span className="text-[#6366F1]">Unity</span>
            </span>
          </Link>

          {/* Subtle breadcrumb / badge to fill left-side space naturally */}
          {token && (
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-slate-700 text-lg">/</span>
              <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 border border-slate-700/60">
                My Workspace
              </span>
            </div>
          )}
        </div>

        {/* Right: User Status & Sign Out */}
        <div className="flex items-center gap-4">
          {token && (
            <>
              {/* Online / Ready status indicator */}
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Connected</span>
              </div>

              <button
                onClick={() => dispatch(logout())}
                type="button"
                className="rounded-lg border border-red-500/80 px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400 transition"
              >
                Sign Out
              </button>
            </>
          )}
        </div>

      </div>
    </header>
  );
}