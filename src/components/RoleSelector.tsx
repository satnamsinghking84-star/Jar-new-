import React from 'react';
import { motion } from 'motion/react';
import { Droplet, User, Truck, Banknote } from 'lucide-react';
import { UserRole } from '../types';

interface RoleSelectorProps {
  onSelectRole: (role: UserRole) => void;
}

export default function RoleSelector({ onSelectRole }: RoleSelectorProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-900 via-sky-700 to-sky-100">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="flex flex-col items-center text-center max-w-sm w-full"
      >
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-sky-400 rounded-full blur-xl opacity-40 animate-pulse"></div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-white/20 relative">
            <Droplet className="w-16 h-16 text-sky-200 fill-sky-300" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
          Jar Business
        </h1>
        <p className="text-sky-100 text-sm font-medium mt-1 mb-8 opacity-90">
          Aap kaun hain? Select karein
        </p>

        <div className="space-y-4 w-full">
          {/* Owner Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectRole('owner')}
            className="w-full bg-white text-blue-900 font-bold text-lg py-4 px-6 rounded-2xl shadow-xl flex items-center justify-between border border-white/20 hover:bg-sky-50 transition-all group"
            id="role-owner"
          >
            <span className="flex items-center gap-3">
              <span className="bg-blue-100 p-2.5 rounded-xl text-blue-700 group-hover:scale-110 transition-transform">
                <User className="w-5 h-5" />
              </span>
              <span>👔 Owner (Maalik)</span>
            </span>
            <span className="text-blue-400 font-normal text-xs bg-blue-50 px-2.5 py-1 rounded-full group-hover:bg-blue-100">
              Mera Board →
            </span>
          </motion.button>

          {/* Delivery Boy Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectRole('boy')}
            className="w-full bg-emerald-600 text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-xl flex items-center justify-between hover:bg-emerald-700 transition-all group"
            id="role-boy"
          >
            <span className="flex items-center gap-3">
              <span className="bg-emerald-500 p-2.5 rounded-xl text-white group-hover:scale-110 transition-transform shadow-inner">
                <Truck className="w-5 h-5" />
              </span>
              <span>🚚 Delivery Boy</span>
            </span>
            <span className="text-emerald-100 font-normal text-xs bg-emerald-700/40 px-2.5 py-1 rounded-full">
              Chalu Karein →
            </span>
          </motion.button>
        </div>

        <p className="text-sky-900/60 text-xs font-semibold mt-10">
          Sirf is device pe data yaad rahega
        </p>
      </motion.div>
    </div>
  );
}
