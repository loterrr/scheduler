import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, BookOpen, Calendar as CalendarIcon, Building, Clock, Shield, Moon, Sun, LogOut } from 'lucide-react';

export default function Layout({ children }) {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [dark, setDark] = useState(false);

    const isActive = (path) => router.pathname === path ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white';

    const NavItem = ({ href, icon: Icon, label }) => (
        <Link href={href} className={`flex items-center space-x-2 p-2 rounded transition-colors ${isActive(href)}`}>
            <Icon size={20} />
            <span>{label}</span>
        </Link>
    );

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || 'null');
        setUser(userData);
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setDark(true);
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }, []);

    const toggleDark = () => {
        const newDark = !dark;
        setDark(newDark);
        if (newDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-dark text-white flex-shrink-0 flex flex-col">
                <div className="p-4 border-b border-gray-700">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        Scheduler
                    </h1>
                    {user && <p className="text-xs text-gray-400 mt-1">Welcome, {user.username}</p>}
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {(!user || user.role !== 'TEACHER') && (
                        <>
                            <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                            <NavItem href="/teachers" icon={Users} label="Teachers" />
                            <NavItem href="/subjects" icon={BookOpen} label="Subjects" />
                            <NavItem href="/rooms" icon={Building} label="Rooms" />
                            <NavItem href="/terms" icon={CalendarIcon} label="Terms" />
                            <NavItem href="/schedule" icon={CalendarIcon} label="Schedules" />
                        </>
                    )}

                    {user?.role === 'TEACHER' && (
                        <>
                            <NavItem href="/portal/schedule" icon={CalendarIcon} label="My Schedule" />
                            <NavItem href="/portal/availability" icon={Clock} label="My Availability" />
                        </>
                    )}

                    {user && (
                        <NavItem href="/portal/change-password" icon={Shield} label="Change Password" />
                    )}
                </nav>

                <div className="p-4 border-t border-gray-700 space-y-2">
                    <button onClick={toggleDark} className="flex items-center space-x-2 text-gray-300 hover:text-white w-full p-2 rounded hover:bg-gray-700">
                        {dark ? <Sun size={20} /> : <Moon size={20} />}
                        <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                    {user ? (
                        <button onClick={handleLogout} className="flex items-center space-x-2 text-gray-300 hover:text-white w-full p-2 rounded hover:bg-gray-700">
                            <LogOut size={20} />
                            <span>Logout</span>
                        </button>
                    ) : (
                        <Link href="/" className="flex items-center space-x-2 text-gray-300 hover:text-white w-full p-2 rounded hover:bg-gray-700">
                            <LogOut size={20} />
                            <span>Login</span>
                        </Link>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
