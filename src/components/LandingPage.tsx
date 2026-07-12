import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, Zap, Globe, Coins, ArrowRight, Lock, Smartphone, ChevronRight } from 'lucide-react';
import heroBg from '../assets/images/crypto_hero_bg_1783840941384.jpg';
import dashboardMockup from '../assets/images/crypto_dashboard_mockup_1783840953343.jpg';
import globeNetwork from '../assets/images/crypto_globe_network_1783840964978.jpg';

export default function LandingPage() {
  return (
    <div className="bg-[#0b0e14] text-white min-h-screen font-sans selection:bg-blue-500/30">
      
      {/* Navbar (Landing Specific) */}
      <nav className="fixed w-full z-50 bg-[#0b0e14]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center">
              <Coins size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Safe Global</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#markets" className="hover:text-white transition">Markets</a>
            <a href="#security" className="hover:text-white transition">Security</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium hover:text-blue-400 transition">Log In</Link>
            <Link to="/login" className="text-sm font-medium bg-white text-black px-5 py-2.5 rounded-full hover:bg-gray-200 transition">Sign Up</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img src={heroBg} alt="Hero Background" className="w-full h-full object-cover opacity-40" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e14] via-[#0b0e14]/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0e14] via-transparent to-[#0b0e14]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center lg:text-left flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Safe Global V2 is now live
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl lg:text-7xl font-bold tracking-tight leading-tight"
            >
              Buy, trade, and hold <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                crypto & fiat.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto lg:mx-0"
            >
              The world's most trusted banking simulation platform. Manage your multi-currency accounts, trade crypto, and earn high yield all in one place.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-full text-lg font-bold transition flex items-center justify-center gap-2">
                Get Started <ArrowRight size={20} />
              </Link>
              <button className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-lg font-bold transition">
                View Markets
              </button>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:w-1/2 relative"
          >
             <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
             <img src={dashboardMockup} alt="App Interface" className="relative z-10 w-full max-w-lg mx-auto rounded-2xl shadow-2xl border border-white/10" referrerPolicy="no-referrer" />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Quarterly Trading Volume', value: '$120B+' },
              { label: 'Registered Users', value: '50M+' },
              { label: 'Supported Assets', value: '350+' },
              { label: 'Industry-low Fees', value: '< 0.1%' },
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <p className="text-3xl lg:text-4xl font-bold">{stat.value}</p>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl lg:text-5xl font-bold">Everything you need to trade.</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">Advanced tools, deep liquidity, and a sleek interface designed for both beginners and pro traders.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Zap size={24} />, title: 'Lightning Fast', desc: 'Execute trades in milliseconds with our high-performance matching engine.' },
            { icon: <Lock size={24} />, title: 'Bank-Grade Security', desc: 'Your assets are protected by industry-leading encryption and cold storage.' },
            { icon: <Smartphone size={24} />, title: 'Trade Anywhere', desc: 'Seamlessly manage your portfolio on our top-rated iOS and Android apps.' },
          ].map((feature, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              key={i} 
              className="bg-white/[0.03] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.05] transition"
            >
              <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Global Network Section */}
      <section className="py-24 border-t border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
             initial={{ opacity: 0, x: -30 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.8 }}
             className="relative z-10"
          >
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">A truly borderless financial network.</h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Send money across the globe instantly. Whether it's Fiat to Crypto, or P2P transfers, Safe Global ensures your transactions settle securely on-chain with near-zero fees.
            </p>
            <ul className="space-y-4 mb-10">
              {[
                'Instant cross-border settlements',
                'Multi-chain protocol support',
                'Real-time exchange rates'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Globe size={14} />
                  </div>
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
            <Link to="/login" className="inline-flex items-center gap-2 text-blue-400 font-bold hover:text-blue-300 transition">
              Explore our global coverage <ChevronRight size={18} />
            </Link>
          </motion.div>

          <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             transition={{ duration: 0.8 }}
             className="relative"
          >
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
            <img src={globeNetwork} alt="Global Network" className="relative z-10 w-full rounded-3xl border border-white/10 shadow-2xl" referrerPolicy="no-referrer" />
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-[#0b0e14]"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-4xl lg:text-6xl font-bold">Start your crypto journey.</h2>
          <p className="text-xl text-gray-400">Join millions of users worldwide who trust Safe Global for their digital asset management.</p>
          <div className="pt-4">
            <Link to="/login" className="px-10 py-5 bg-white text-black rounded-full text-lg font-bold hover:bg-gray-200 transition inline-block">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#0b0e14]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-gray-400">
            <Coins size={20} />
            <span className="font-bold text-lg text-white">Safe Global</span>
          </div>
          <div className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Safe Global Simulation. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm font-medium text-gray-500">
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Fees</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

