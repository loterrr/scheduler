import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import api from '../utils/api';
import { LayoutDashboard, Users, BookOpen, CalendarDays, AlertTriangle, X } from 'lucide-react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';

export default function Dashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({ teachers: 0, subjects: 0, scheduled: 0, conflicts: 0 });
    const [loading, setLoading] = useState(true);
    const [conflicts, setConflicts] = useState([]);
    const [showConflicts, setShowConflicts] = useState(false);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user || user.role !== 'ADMIN') {
            router.push('/');
            return;
        }
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/dashboard/stats');
            setStats(res.data);
        } catch (err) {
            console.error('Failed to fetch stats');
        } finally {
            setLoading(false);
        }
    };

    const fetchConflicts = async () => {
        try {
            const res = await api.get('/dashboard/conflicts');
            setConflicts(res.data);
            setShowConflicts(true);
        } catch (err) {
            console.error('Failed to fetch conflicts');
        }
    };

    const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
        <div onClick={onClick}
            className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${color} ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="text-3xl font-bold mt-1">{value}</p>
                </div>
                <Icon size={32} className="opacity-30" />
            </div>
        </div>
    );

    if (loading) return <Layout><Spinner /></Layout>;

    return (
        <Layout>
            <div className="p-8">
                <Head><title>Dashboard - Scheduler</title></Head>
                <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                    <LayoutDashboard /> Admin Dashboard
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard icon={Users} label="Total Teachers" value={stats.teachers} color="border-blue-500" />
                    <StatCard icon={BookOpen} label="Total Subjects" value={stats.subjects} color="border-green-500" />
                    <StatCard icon={CalendarDays} label="Scheduled Classes" value={stats.scheduled} color="border-indigo-500" />
                    <StatCard icon={AlertTriangle} label="Issues / Unscheduled" value={stats.conflicts} color="border-red-500"
                        onClick={fetchConflicts} />
                </div>

                {showConflicts && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <AlertTriangle className="text-red-500" /> Conflict & Issue Report
                            </h2>
                            <button onClick={() => setShowConflicts(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        {conflicts.length === 0 ? (
                            <p className="text-green-600 font-medium">✓ No conflicts detected! All subjects are scheduled.</p>
                        ) : (
                            <div className="space-y-3">
                                {conflicts.map((c, i) => (
                                    <div key={i} className={`p-3 rounded-lg border ${c.type === 'UNSCHEDULED' ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-300'}`}>
                                        {c.type === 'ROOM_OVERLAP' && (
                                            <p className="text-sm"><span className="font-bold text-red-700">Room Conflict:</span> {c.detail.room_name} on {c.detail.day_of_week} at {c.detail.start_time} — {c.detail.subject1} vs {c.detail.subject2}</p>
                                        )}
                                        {c.type === 'TEACHER_OVERLAP' && (
                                            <p className="text-sm"><span className="font-bold text-red-700">Teacher Conflict:</span> {c.detail.teacher_name} on {c.detail.day_of_week} at {c.detail.start_time} — {c.detail.subject1} vs {c.detail.subject2}</p>
                                        )}
                                        {c.type === 'UNSCHEDULED' && (
                                            <p className="text-sm"><span className="font-bold text-yellow-700">Unscheduled:</span> {c.detail.code} — {c.detail.name}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}
