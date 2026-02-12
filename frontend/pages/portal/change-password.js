import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import api from '../../utils/api';
import { Lock, Shield } from 'lucide-react';
import Layout from '../../components/Layout';
import { useToast } from '../../components/ToastContext';

export default function ChangePassword() {
    const router = useRouter();
    const { showToast } = useToast();
    const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.new_password !== form.confirm_password) {
            showToast('Passwords do not match', 'error');
            return;
        }
        if (form.new_password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
        setLoading(true);
        try {
            await api.put('/auth/password', {
                current_password: form.current_password,
                new_password: form.new_password
            });
            showToast('Password changed successfully!', 'success');
            setForm({ current_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to change password', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="p-8">
                <Head><title>Change Password - EduScheduler</title></Head>
                <div className="max-w-md mx-auto">
                    <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
                        <Shield /> Change Password
                    </h1>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Current Password</label>
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="password" required
                                        value={form.current_password}
                                        onChange={(e) => setForm({ ...form, current_password: e.target.value })}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">New Password</label>
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="password" required
                                        value={form.new_password}
                                        onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                                        placeholder="Min 6 characters"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="password" required
                                        value={form.confirm_password}
                                        onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit" disabled={loading}
                                className={`w-full bg-primary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded ${loading ? 'opacity-50' : ''}`}
                            >
                                {loading ? 'Changing...' : 'Change Password'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
