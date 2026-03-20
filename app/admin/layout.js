import AdminNavbar from '../../components/AdminNavbar';

export default function AdminLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <AdminNavbar />
      {children}
    </div>
  );
}
