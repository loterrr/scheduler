import { useState, useEffect } from 'react';
import Head from 'next/head';
import api from '../utils/api';
import { Calendar, Plus, Pencil, Trash2, Check } from 'lucide-react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import { useToast } from '../components/ToastContext';

export default function Terms() {
    const { showToast } = useToast();
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTerm, setNewTerm] = useState({ name: '', start_date: '', end_date: '' });

    useEffect(() => { fetchTerms(); }, []);

    const fetchTerms = async () => {
        try {
            const res = await api.get('/terms');
            setTerms(res.data);
        } catch (err) {
            showToast('Failed to load terms', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/terms', newTerm);
            setNewTerm({ name: '', start_date: '', end_date: '' });
            showToast('Term created!', 'success');
            fetchTerms();
        } catch (err) {
            showToast('Failed to create term', 'error');
        }
    };

    const handleActivate = async (id) => {
        try {
            await api.put(`/terms/${id}/activate`);
            showToast('Term activated!', 'success');
            fetchTerms();
        } catch (err) {
            showToast('Failed to activate term', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this term? Schedules linked to it may be affected.')) return;
        try {
            await api.delete(`/terms/${id}`);
            showToast('Term deleted', 'success');
            fetchTerms();
        } catch (err) {
            showToast('Failed to delete term', 'error');
        }
    };

    if (loading) return <Layout><Spinner /></Layout>;

    return (
        <Layout>
            <div className="p-8">
                <Head><title>Terms - EduScheduler</title></Head>
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
                        <Calendar /> Academic Terms
                    </h1>

                    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                        <h2 className="text-xl font-semibold mb-4">Add New Term</h2>
                        <form onSubmit={handleCreate} className="flex gap-4 items-end flex-wrap">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Term Name</label>
                                <input type="text" value={newTerm.name} placeholder="e.g. Fall 2025"
                                    onChange={(e) => setNewTerm({ ...newTerm, name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                                <input type="date" value={newTerm.start_date}
                                    onChange={(e) => setNewTerm({ ...newTerm, start_date: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">End Date</label>
                                <input type="date" value={newTerm.end_date}
                                    onChange={(e) => setNewTerm({ ...newTerm, end_date: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
                            </div>
                            <button type="submit" className="bg-primary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2">
                                <Plus size={18} /> Add Term
                            </button>
                        </form>
                    </div>

                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {terms.map((term) => (
                                    <tr key={term.id}>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{term.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{term.start_date}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{term.end_date}</td>
                                        <td className="px-6 py-4 text-sm">
                                            {parseInt(term.is_active) ? (
                                                <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-gray-100 text-gray-600">Inactive</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 flex gap-2">
                                            {!parseInt(term.is_active) && (
                                                <button onClick={() => handleActivate(term.id)} className="text-green-600 hover:text-green-800" title="Set as Active">
                                                    <Check size={16} />
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(term.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                                {terms.length === 0 && (
                                    <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No terms found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
