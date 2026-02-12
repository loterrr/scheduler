import { useState, useEffect } from 'react';
import Head from 'next/head';
import api from '../utils/api';
import { Building, Plus, Pencil, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import { useToast } from '../components/ToastContext';

export default function Rooms() {
    const { showToast } = useToast();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newRoom, setNewRoom] = useState({ name: '', capacity: 40, type: 'LECTURE', building: '' });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    useEffect(() => { fetchRooms(); }, []);

    const fetchRooms = async () => {
        try {
            const res = await api.get('/rooms');
            setRooms(res.data);
        } catch (err) {
            showToast('Failed to load rooms', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/rooms', newRoom);
            setNewRoom({ name: '', capacity: 40, type: 'LECTURE', building: '' });
            showToast('Room created!', 'success');
            fetchRooms();
        } catch (err) {
            showToast('Failed to create room', 'error');
        }
    };

    const handleUpdate = async (id) => {
        try {
            await api.put(`/rooms/${id}`, editForm);
            setEditingId(null);
            showToast('Room updated!', 'success');
            fetchRooms();
        } catch (err) {
            showToast('Failed to update room', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this room?')) return;
        try {
            await api.delete(`/rooms/${id}`);
            showToast('Room deleted', 'success');
            fetchRooms();
        } catch (err) {
            showToast('Failed to delete room', 'error');
        }
    };

    if (loading) return <Layout><Spinner /></Layout>;

    return (
        <Layout>
            <div className="p-8">
                <Head><title>Rooms - EduScheduler</title></Head>
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
                        <Building /> Room Management
                    </h1>

                    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                        <h2 className="text-xl font-semibold mb-4">Add New Room</h2>
                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input type="text" value={newRoom.name} onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Capacity</label>
                                <input type="number" value={newRoom.capacity} onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select value={newRoom.type} onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                                    <option value="LECTURE">Lecture</option>
                                    <option value="LAB">Lab</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Building</label>
                                <input type="text" value={newRoom.building} onChange={(e) => setNewRoom({ ...newRoom, building: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                            </div>
                            <div className="flex items-end md:col-span-2">
                                <button type="submit" className="bg-primary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2">
                                    <Plus size={18} /> Add Room
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Building</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {rooms.map((room) => (
                                    <tr key={room.id}>
                                        {editingId === room.id ? (
                                            <>
                                                <td className="px-6 py-4"><input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="border p-1 rounded w-full" /></td>
                                                <td className="px-6 py-4"><input type="number" value={editForm.capacity} onChange={e => setEditForm({ ...editForm, capacity: parseInt(e.target.value) })} className="border p-1 rounded w-20" /></td>
                                                <td className="px-6 py-4">
                                                    <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })} className="border p-1 rounded">
                                                        <option value="LECTURE">Lecture</option><option value="LAB">Lab</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4"><input value={editForm.building || ''} onChange={e => setEditForm({ ...editForm, building: e.target.value })} className="border p-1 rounded w-full" /></td>
                                                <td className="px-6 py-4 flex gap-2">
                                                    <button onClick={() => handleUpdate(room.id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm">Save</button>
                                                    <button onClick={() => setEditingId(null)} className="bg-gray-500 text-white px-3 py-1 rounded text-sm">Cancel</button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{room.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{room.capacity}</td>
                                                <td className="px-6 py-4 text-sm">
                                                    <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${room.type === 'LAB' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                                        {room.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{room.building || '—'}</td>
                                                <td className="px-6 py-4 flex gap-2">
                                                    <button onClick={() => { setEditingId(room.id); setEditForm({ ...room }); }} className="text-blue-600 hover:text-blue-800"><Pencil size={16} /></button>
                                                    <button onClick={() => handleDelete(room.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {rooms.length === 0 && (
                                    <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No rooms found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
