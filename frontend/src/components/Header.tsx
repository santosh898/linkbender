import React from 'react';
import { Link2, Search, Settings, User } from 'lucide-react';
import { motion } from 'framer-motion';

export const Header: React.FC = () => (
  <motion.div 
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-12"
  >
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <h1 className="text-4xl font-heading font-bold tracking-tight flex items-center gap-2">
          <Link2 className="text-accent-blue" />
          LinkBender
        </h1>
        <nav className="hidden md:flex items-center gap-6 ml-12">
          <a href="#" className="text-white/80 hover:text-white transition-colors">Dashboard</a>
          <a href="#" className="text-white/80 hover:text-white transition-colors">Intercom</a>
          <a href="#" className="text-white/80 hover:text-white transition-colors">Tags</a>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by URL, tags, or grade..."
            className="pl-10 pr-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 w-64 text-sm"
          />
        </div>
        <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <Settings size={20} className="text-gray-400" />
        </button>
        <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <User size={20} className="text-gray-400" />
        </button>
      </div>
    </div>
    
    <p className="text-gray-400 text-center max-w-2xl mx-auto">
      Transform any webpage into actionable insights with our advanced content analysis
    </p>
  </motion.div>
);