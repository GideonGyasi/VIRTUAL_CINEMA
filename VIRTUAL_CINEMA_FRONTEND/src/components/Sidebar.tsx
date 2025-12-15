import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Film,
  Tv,
  Sparkles,
  Trophy,
  TrendingUp,
  Globe,
  Download,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Popcorn,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedLanguage, setSelectedLanguage] = useState('EN');

  const navItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: Film, label: 'Movies', path: '/home' },
    { icon: Tv, label: 'TV Shows', path: '/home' },
    { icon: Sparkles, label: 'Animation', path: '/home' },
    { icon: Trophy, label: 'Sport Live', path: '/home' },
    { icon: TrendingUp, label: 'Most Watched', path: '/home' },
  ];

  const languages = ['EN', 'ES', 'FR', 'DE', 'IT', 'PT'];

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: isOpen ? 0 : -280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`fixed left-0 top-0 h-full w-[280px] bg-gradient-to-b from-black via-[#0a0a0a] to-black border-r border-[#00bfa6]/20 z-50 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-[#00bfa6]/20">
        <motion.div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate('/home')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00bfa6] to-[#00d1b0] flex items-center justify-center shadow-lg shadow-[#00bfa6]/30">
            <Popcorn size={24} className="text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Virtual</h1>
            <p className="text-xs text-[#00bfa6] font-semibold">Cinema</p>
          </div>
        </motion.div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <motion.li
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <motion.button
                  onClick={() => {
                    navigate(item.path);
                    onClose?.();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-[#00bfa6]/20 text-[#00bfa6] border border-[#00bfa6]/30'
                      : 'text-gray-300 hover:bg-[#00bfa6]/10 hover:text-[#00bfa6]'
                  }`}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon size={20} className={active ? 'text-[#00bfa6]' : ''} />
                  <span className="font-medium text-sm">{item.label}</span>
                </motion.button>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      {/* Language Selector */}
      <div className="px-4 py-3 border-t border-[#00bfa6]/20">
        <div className="flex items-center gap-2 mb-2">
          <Globe size={16} className="text-gray-400" />
          <span className="text-xs text-gray-400 font-medium">Language</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedLanguage === lang
                  ? 'bg-[#00bfa6] text-black'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Social Icons */}
      <div className="px-4 py-3 border-t border-[#00bfa6]/20">
        <div className="flex items-center justify-center gap-4">
          <motion.a
            href="#"
            whileHover={{ scale: 1.2, y: -2 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-[#00bfa6] hover:bg-[#00bfa6]/20 transition-colors"
          >
            <Facebook size={16} />
          </motion.a>
          <motion.a
            href="#"
            whileHover={{ scale: 1.2, y: -2 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-[#00bfa6] hover:bg-[#00bfa6]/20 transition-colors"
          >
            <Twitter size={16} />
          </motion.a>
          <motion.a
            href="#"
            whileHover={{ scale: 1.2, y: -2 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-[#00bfa6] hover:bg-[#00bfa6]/20 transition-colors"
          >
            <Instagram size={16} />
          </motion.a>
          <motion.a
            href="#"
            whileHover={{ scale: 1.2, y: -2 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-[#00bfa6] hover:bg-[#00bfa6]/20 transition-colors"
          >
            <Youtube size={16} />
          </motion.a>
        </div>
      </div>

      {/* Download Button */}
      <div className="p-4 border-t border-[#00bfa6]/20">
        <motion.button
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#00bfa6] to-[#00d1b0] text-black font-semibold text-sm shadow-lg shadow-[#00bfa6]/30"
          whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(0, 191, 166, 0.4)' }}
          whileTap={{ scale: 0.98 }}
        >
          <Download size={18} />
          <span>Download App</span>
        </motion.button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;

