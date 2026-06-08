import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export function Register() {
  const [formData, setFormData] = useState({
    email: '', password: '', first_name: '', last_name: '', dob: '', preferences: '', email_opt_in: true
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/login');
      } else {
        setError(data.detail || 'Registration failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-4 py-12">
      <div className="max-w-xl w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Create your Account</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 font-medium">Set up your personalized news experience</p>
        </div>
        
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-200 font-medium text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">First Name</label>
              <input type="text" name="first_name" required value={formData.first_name} onChange={handleChange}
                placeholder="John"
                className="w-full p-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-slate-400 font-medium" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Last Name</label>
              <input type="text" name="last_name" required value={formData.last_name} onChange={handleChange}
                placeholder="Doe"
                className="w-full p-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-slate-400 font-medium" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Date of Birth</label>
            <input type="date" name="dob" required value={formData.dob} onChange={handleChange}
              className="w-full p-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-slate-400 font-medium" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Email Address</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange}
              placeholder="john.doe@example.com"
              className="w-full p-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-slate-400 font-medium" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Password</label>
            <input type="password" name="password" required value={formData.password} onChange={handleChange} minLength={6}
              placeholder="••••••••"
              className="w-full p-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-slate-400 font-medium" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">News Preferences</label>
            <input type="text" name="preferences" value={formData.preferences} onChange={handleChange}
              placeholder="e.g. Technology, AI, Space, Startups"
              className="w-full p-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-slate-400 font-medium" />
            <p className="text-xs text-slate-500 mt-2 font-medium">We'll use this to personalize your news feed.</p>
          </div>
          
          <div className="flex items-start gap-3 mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30">
            <input type="checkbox" name="email_opt_in" id="optin" checked={formData.email_opt_in} onChange={handleChange} 
              className="w-5 h-5 mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
            <label htmlFor="optin" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              Send me everyday personalized news emails based on my preferences
            </label>
          </div>
          
          <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md mt-8">
            Create Account
          </button>
        </form>

        <p className="text-center mt-8 text-sm font-medium text-slate-600 dark:text-slate-400">
          Already have an account? <Link to="/login" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
