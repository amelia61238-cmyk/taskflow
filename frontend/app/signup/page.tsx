'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignUp() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('https://taskflow-production-aed1.up.railway.app/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err) {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="bg-[#111118] border border-white/10 rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-2">
          Task<span className="text-purple-400">Flow</span>
        </h1>
        <p className="text-gray-400 mb-8">Create your account</p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
              required
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Email</label>
            <input
              type="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
              required
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Password</label>
            <input
              type="password"
              placeholder="Min 8 characters"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-gray-400 text-center mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-purple-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}