import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, History, User, Menu, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  onMenuClick?: () => void;
  onAuthClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onAuthClick }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results or filter movies
      console.log('Searching for:', searchQuery);
    }
  };

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    navigate('/');
  };

  const handleLogin = () => {
    setShowProfileMenu(false);
    if (onAuthClick) {
      onAuthClick();
    } else {
      navigate('/login');
    }
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-md border-b border-[#00bfa6]/20 z-30">
      <div className="h-full flex items-center justify-between px-4 md:px-6">
        {/* Left: Hamburger Menu Button (Always visible) */}
        <motion.button
          onClick={onMenuClick}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-300 hover:text-[#00bfa6] hover:bg-[#00bfa6]/10 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Menu size={24} />
        </motion.button>

        {/* Center: Search Bar */}
        <motion.form
          onSubmit={handleSearch}
          className="flex-1 max-w-2xl mx-4 md:mx-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for movies, TV shows..."
              className="w-full h-10 pl-12 pr-4 bg-gray-900/50 border border-gray-800 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-[#00bfa6] focus:ring-2 focus:ring-[#00bfa6]/20 transition-all"
            />
          </div>
        </motion.form>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Download App Button */}
          <motion.button
            onClick={() => console.log('Download app')}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900/50 text-gray-300 hover:text-[#00bfa6] hover:bg-[#00bfa6]/10 border border-gray-800 hover:border-[#00bfa6]/30 transition-all text-sm font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download size={18} />
            <span>Download</span>
          </motion.button>

          {/* Watch History Button */}
          {isAuthenticated && (
            <motion.button
              onClick={() => console.log('Watch history')}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900/50 text-gray-300 hover:text-[#00bfa6] hover:bg-[#00bfa6]/10 border border-gray-800 hover:border-[#00bfa6]/30 transition-all text-sm font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <History size={18} />
              <span className="hidden lg:inline">History</span>
            </motion.button>
          )}

          {/* Profile Button with Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            {isAuthenticated ? (
              <motion.button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00bfa6] to-[#00d1b0] flex items-center justify-center text-black font-semibold shadow-lg shadow-[#00bfa6]/30 hover:shadow-[#00bfa6]/50 transition-shadow"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name || 'User'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User size={20} />
                )}
              </motion.button>
            ) : (
              <motion.button
                onClick={handleLogin}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#00bfa6] to-[#00d1b0] text-black font-semibold text-sm shadow-lg shadow-[#00bfa6]/30 hover:shadow-[#00bfa6]/50 transition-shadow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign In
              </motion.button>
            )}

            {/* Profile Dropdown Menu */}
            <AnimatePresence>
              {showProfileMenu && isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg border border-[#00bfa6]/20 shadow-xl overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-[#00bfa6]/10">
                    <p className="text-white font-semibold text-sm truncate">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-gray-400 text-xs truncate">
                      {user?.email || ''}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-300 hover:bg-gray-800 transition-colors text-sm"
                    >
                      <LogOut size={16} className="text-red-400" />
                      <span>Logout</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
