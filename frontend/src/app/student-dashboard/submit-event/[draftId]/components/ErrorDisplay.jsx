import Link from 'next/link';

export default function ErrorDisplay({ message, details, actionLabel, actionHref }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12">
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-8 max-w-lg w-full text-center shadow">
                <div className="flex flex-col items-center mb-4">
                    <svg className="h-10 w-10 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12A9 9 0 11 3 12a9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-xl font-bold text-red-700 dark:text-red-200">{message || 'An error occurred'}</h2>
                </div>
                {details && (
                    <div className="text-sm text-red-600 dark:text-red-300 mb-4 whitespace-pre-line">
                        {details}
                    </div>
                )}
                {actionLabel && actionHref && (
                    <Link href={actionHref} legacyBehavior>
                        <a className="inline-block mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">
                            {actionLabel}
                        </a>
                    </Link>
                )}
            </div>
        </div>
    );
}