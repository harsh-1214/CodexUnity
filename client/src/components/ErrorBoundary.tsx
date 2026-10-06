import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router-dom";

export default function InternalErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  // Extract a clean message whether it's a JS Error object or Router Response
  let errorMessage = "An unexpected application error occurred.";
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorStatus = error.status;
    errorMessage = error.statusText || error.data?.message || errorMessage;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
        {/* Warning Icon */}
        <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100 mb-6">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        {/* Heading & Message */}
        <span className="text-xs font-semibold uppercase tracking-wider text-red-600 bg-red-50 px-3 py-1 rounded-full">
          Error {errorStatus}
        </span>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          We ran into an unexpected issue while rendering this page. Your data is safe, and you can try refreshing or returning home.
        </p>

        {/* Dev-Only Error Details (Hidden in Production) */}
        {import.meta.env?.DEV && (
          <div className="mt-6 text-left bg-slate-900 text-red-400 p-4 rounded-lg overflow-x-auto text-xs font-mono">
            <p className="font-bold text-red-300 mb-1">{errorMessage}</p>
            {error instanceof Error && error.stack && (
              <pre className="text-[11px] text-slate-400 leading-relaxed">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleReload}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-medium rounded-lg transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}