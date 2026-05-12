import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">
          Task<span className="text-purple-400">Flow</span>
        </h1>
        <p className="text-gray-400 text-xl mb-8">
          Smart Task Reminder & Deadline Tracker
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="border border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white px-8 py-3 rounded-lg font-semibold transition"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}