'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Key, BookOpen, LogOut } from 'lucide-react';
import api from '@/lib/api';

const links = [
  { href: '/dashboard',          label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/dashboard/api-keys', label: 'API Keys',   icon: Key },
  { href: '/docs',               label: 'Docs',       icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    router.push('/login');
  };

  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-800">
        <Link href="/" className="font-bold text-base tracking-tight">⚡ AI API Platform</Link>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href} href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-gray-800">
        <button
          onClick={logout}
          className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
