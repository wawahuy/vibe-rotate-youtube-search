'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  function logout() {
    localStorage.removeItem('token');
    router.push('/login');
  }

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/api-keys', label: 'API Keys' },
    { href: '/user-keys', label: 'User Keys' },
    { href: '/report', label: 'Report' },
  ];

  return (
    <nav className="bg-white shadow px-6 py-4 flex items-center justify-between">
      <div className="flex gap-6 text-sm font-medium">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`hover:text-blue-600 ${
              pathname?.startsWith(l.href) ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-700'
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <button onClick={logout} className="text-sm text-red-500 hover:text-red-700">
        Logout
      </button>
    </nav>
  );
}
