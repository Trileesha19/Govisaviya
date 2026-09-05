import React from 'react';
import { Sprout, TrendingUp, ShieldCheck, MapPin, Truck, Coins, HeartHandshake } from 'lucide-react';

export default function SDG2Banner({ stats }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-950 border border-emerald-500/20 p-6 md:p-8 shadow-2xl mb-8">
      {/* Background Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Mission Statement */}
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sprout className="w-3.5 h-3.5" />
            <span>UN Sustainable Development Goal 2: Zero Hunger</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Direct Sri Lankan <span className="gradient-text-emerald">Farmer-to-Buyer</span> Marketplace
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            Bypassing middlemen to connect farmers in Nuwara Eliya, Dambulla, Polonnaruwa, and Jaffna directly with buyers. Reducing post-harvest food waste, stabilizing crop prices, and securing local food access.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <div className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Stock Updates</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>0% Middleman Commission</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <Truck className="w-4 h-4 text-cyan-400" />
              <span>Direct Farm Pickup</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Impact Cards */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
          <div className="glass-panel p-4 rounded-xl border-emerald-500/20 bg-slate-900/90 shadow-md">
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Produce Listed</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-outfit">
              {(stats?.totalListedQuantity || 0).toLocaleString()} <span className="text-sm font-medium text-emerald-400">kg</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Available across Sri Lanka</p>
          </div>

          <div className="glass-panel p-4 rounded-xl border-amber-500/20 bg-slate-900/90 shadow-md">
            <div className="flex items-center justify-between text-amber-400 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Food Saved</span>
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-outfit">
              {(stats?.totalReservedQuantity || 0).toLocaleString()} <span className="text-sm font-medium text-amber-400">kg</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Directly reserved by buyers</p>
          </div>

          <div className="glass-panel p-4 rounded-xl border-teal-500/20 bg-slate-900/90 shadow-md">
            <div className="flex items-center justify-between text-teal-400 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Farmers</span>
              <Sprout className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-outfit">
              {stats?.totalFarmers || 0} <span className="text-sm font-medium text-teal-400">farmers</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Local producers connected</p>
          </div>

          <div className="glass-panel p-4 rounded-xl border-cyan-500/20 bg-slate-900/90 shadow-md">
            <div className="flex items-center justify-between text-cyan-400 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Districts</span>
              <MapPin className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-outfit">
              {stats?.activeLocationsCount || 0} <span className="text-sm font-medium text-cyan-400">regions</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Agricultural hubs covered</p>
          </div>
        </div>

      </div>
    </div>
  );
}
