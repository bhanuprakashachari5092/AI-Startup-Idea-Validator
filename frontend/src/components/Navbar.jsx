import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BrainCircuit, LogOut, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass sticky top-0 z-50 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-lg bg-primary/20 text-primary group-hover:bg-primary/30 transition-colors">
            <BrainCircuit size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-white/90 transition-colors">
            AI Validator
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {!token ? (
            <>
              <Link to="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="text-sm font-medium btn-secondary py-2 px-5 hidden sm:block">
                Register
              </Link>
            </>
          ) : (
            <>
              {location.pathname !== '/dashboard' && (
                <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
                  <LayoutDashboard size={18} />
                  Dashboard
                </Link>
              )}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white/50 hidden md:block">{user?.name}</span>
                <div 
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer"
                  title="Logout"
                >
                  <LogOut size={18} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
