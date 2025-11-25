export function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center p-8" role="status" aria-live="polite" aria-label="Loading">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );
  }