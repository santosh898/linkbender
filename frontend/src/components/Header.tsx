import React from "react";
import { Link2, Settings, User } from "lucide-react";
import { motion } from "framer-motion";

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
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <Settings size={20} className="text-gray-400" />
        </button>
        <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <User size={20} className="text-gray-400" />
        </button>
      </div>
    </div>

    <p className="text-gray-400 text-center max-w-2xl mx-auto">
      Transform any webpage into actionable insights with our advanced content
      analysis
    </p>
  </motion.div>
);
