import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
}

export default function Login({ users, onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = users.find(u => u.username === username && u.password === password);
    if (foundUser) {
      onLogin(foundUser);
    } else {
      setError('ឈ្មោះអ្នកប្រើប្រាស់ ឬលេខសម្ងាត់មិនត្រឹមត្រូវទេ!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans">
      <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-emerald-900/5 w-full max-w-md border border-slate-100">
        <div className="flex justify-center mb-6">
            <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-md shadow-emerald-600/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
        </div>
        <h2 className="text-2xl font-black text-center text-slate-800 mb-2">ចូលប្រព័ន្ធស្តុក</h2>
        <p className="text-slate-500 text-center mb-8 text-sm font-medium">ប្រព័ន្ធតាមដានស្តុក</p>
        
        {error && (
          <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm mb-4 border border-rose-100 text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ឈ្មោះអ្នកប្រើប្រាស់</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm md:text-base focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
              placeholder="បញ្ចូលឈ្មោះ"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">លេខសម្ងាត់</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm md:text-base focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition outline-none font-bold text-slate-800"
              placeholder="បញ្ចូលលេខសម្ងាត់"
              required
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              className="w-full hover:bg-emerald-700 bg-emerald-600 text-white font-bold text-sm md:text-base py-4 rounded-2xl shadow-lg shadow-emerald-600/30 active:scale-95 transition"
            >
              ចូលប្រើប្រាស់
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
