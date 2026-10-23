import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldCheck, Building2, Globe2, ArrowRight, Landmark, CheckCircle2, FileText, Users, Award, Shield, FileCheck, Cpu } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import heroBg from '../assets/images/crypto_hero_bg_1783840941384.jpg';
import dashboardMockup from '../assets/images/crypto_dashboard_mockup_1783840953343.jpg';
import globeNetwork from '../assets/images/crypto_globe_network_1783840964978.jpg';

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <div className="bg-[#0a131f] text-white min-h-screen font-sans selection:bg-blue-500/30">
      
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-[#0a131f]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/40 border border-blue-400/20">
              <Landmark size={20} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight block">{t('safeGlobalBank')}</span>
              <span className="text-[10px] text-blue-400 font-semibold tracking-widest uppercase block -mt-1">{t('govAffiliated')}</span>
            </div>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-300">
            <a href="#services" className="hover:text-white transition">{t('services')}</a>
            <a href="#institution" className="hover:text-white transition">{t('institutionalStandards')}</a>
            <a href="#community" className="hover:text-white transition">{t('communityImpact')}</a>
            <a href="#security" className="hover:text-white transition">{t('securityAndCompliance')}</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold hover:text-blue-400 transition">{t('recipientSignIn')}</Link>
            <Link to="/login" className="text-sm font-bold bg-blue-600 text-white px-6 py-2.5 rounded-md hover:bg-blue-500 transition shadow-md shadow-blue-600/30">
              {t('recipientPortal')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-36 overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0">
          <img src={heroBg} alt="Institutional Banking Background" className="w-full h-full object-cover opacity-15 scale-105" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a131f] via-[#0a131f]/90 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a131f] via-transparent to-[#0a131f]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center lg:text-left flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/15 border border-blue-400/30 text-blue-300 text-xs font-semibold tracking-wider uppercase"
            >
              <Award size={14} className="text-blue-400" />
              {t('heroBadge')}
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
            >
              {t('heroTitle1')} <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-200">
                {t('heroTitle2')}
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg lg:text-xl text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal"
            >
              {t('heroDesc')}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-2"
            >
              <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-base font-bold transition flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30">
                {t('accessRecipientPortal')} <ArrowRight size={18} />
              </Link>
              <a href="#services" className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/15 rounded-md text-base font-semibold transition text-center">
                {t('exploreInstitutional')}
              </a>
            </motion.div>

            <div className="pt-6 grid grid-cols-3 gap-6 border-t border-white/10 text-left">
              <div>
                <p className="text-2xl font-bold text-blue-400">100%</p>
                <p className="text-xs text-gray-400 mt-1">{t('stat1Desc') || 'Government Affiliated Standard'}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">Institutional</p>
                <p className="text-xs text-gray-400 mt-1">{t('stat2Desc') || 'Grade Security & Compliance'}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">Nationwide</p>
                <p className="text-xs text-gray-400 mt-1">{t('stat3Desc') || 'Public & Private Infrastructure'}</p>
              </div>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:w-1/2 relative"
          >
             <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-indigo-600/10 blur-3xl rounded-full"></div>
             <div className="relative z-10 bg-gradient-to-b from-white/10 to-white/5 p-3 rounded-2xl border border-white/15 shadow-2xl backdrop-blur-md">
               <img src={dashboardMockup} alt="Secure Banking Interface" className="w-full rounded-xl shadow-inner" referrerPolicy="no-referrer" />
             </div>
          </motion.div>
        </div>
      </section>

      {/* Government-Affiliated Trust Section */}
      <section id="community" className="py-24 bg-[#070e17] border-y border-white/10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-semibold tracking-widest uppercase">
              {t('communityImpact')}
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold tracking-tight">{t('communityTitle')}</h2>
            <p className="text-gray-300 text-lg leading-relaxed font-normal">
              {t('communityDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: t('indivTitle'),
                desc: t('indivDesc'),
                icon: <Users size={24} className="text-blue-400" />
              },
              {
                title: t('bizTitle'),
                desc: t('bizDesc'),
                icon: <Building2 size={24} className="text-blue-400" />
              },
              {
                title: t('instTitle'),
                desc: t('instDesc'),
                icon: <Landmark size={24} className="text-blue-400" />
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white/[0.03] border border-white/10 p-8 rounded-2xl space-y-4 hover:border-blue-500/40 transition">
                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Institutional Services Section */}
      <section id="services" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl lg:text-5xl font-bold">{t('standardsTitle')}</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">{t('standardsDesc')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              icon: <ShieldCheck size={26} />, 
              title: t('feature1Title'), 
              desc: t('feature1Desc') 
            },
            { 
              icon: <Globe2 size={26} />, 
              title: t('feature2Title'), 
              desc: t('feature2Desc') 
            },
            { 
              icon: <FileText size={26} />, 
              title: t('feature3Title'), 
              desc: t('feature3Desc') 
            },
          ].map((feature, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              key={i} 
              className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 p-8 rounded-2xl hover:border-blue-500/40 transition group"
            >
              <div className="w-14 h-14 bg-blue-600/10 text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600/20 transition">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Infrastructure & National Development */}
      <section id="institution" className="py-24 border-t border-white/10 relative overflow-hidden bg-gradient-to-b from-transparent via-blue-950/20 to-transparent">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
             initial={{ opacity: 0, x: -30 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.8 }}
             className="relative z-10 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider">
              {t('infraTitle')}
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold leading-tight">{t('infraHeading')}</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              {t('infraDesc')}
            </p>
            <ul className="space-y-3 pt-2">
              {[
                t('infraBullet1'),
                t('infraBullet2'),
                t('infraBullet3')
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-200 font-medium">
                  <div className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400">
                    <CheckCircle2 size={14} />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             transition={{ duration: 0.8 }}
             className="relative"
          >
            <div className="absolute inset-0 bg-blue-600/20 blur-3xl rounded-full"></div>
            <img src={globeNetwork} alt="National Financial Infrastructure" className="relative z-10 w-full rounded-2xl border border-white/15 shadow-2xl" referrerPolicy="no-referrer" />
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 relative overflow-hidden text-center bg-[#070e17] border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 space-y-8 relative z-10">
          <h2 className="text-4xl lg:text-6xl font-bold tracking-tight">{t('heroDesc')}</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">{t('recipientPortal')}</p>
          <div className="pt-4">
            <Link to="/login" className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-lg font-bold transition inline-block shadow-2xl shadow-blue-600/30">
              {t('accessRecipientPortal')}
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Compliance Footer Section */}
      <section id="security" className="bg-[#070e17] border-t border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12 pb-12 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">
                {t('securityAndCompliance')}
              </div>
              <h3 className="text-2xl font-bold">{t('footerTrust')}</h3>
              <p className="text-gray-400 text-sm mt-1">{t('footerTrustDesc')}</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-gray-300 bg-white/5 border border-white/10 px-4 py-2.5 rounded-lg">
              <ShieldCheck size={18} className="text-emerald-400" />
              <span>{t('govAffiliated')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                title: t('govAffiliated'),
                desc: "Operating under national statutory authority and central regulatory frameworks.",
                icon: <Landmark size={22} className="text-blue-400" />
              },
              {
                title: "ISO 27001 Certified",
                desc: "Highest international benchmark for information security management systems.",
                icon: <Shield size={22} className="text-indigo-400" />
              },
              {
                title: "SOC 2 Type II Audited",
                desc: "Continuous independent verification of security, availability, and confidentiality.",
                icon: <FileCheck size={22} className="text-teal-400" />
              },
              {
                title: "Basel III & SWIFT Compliant",
                desc: "Adhering to global capital adequacy, liquidity, and secure messaging standards.",
                icon: <Cpu size={22} className="text-sky-400" />
              }
            ].map((badge, idx) => (
              <div key={idx} className="bg-white/[0.02] border border-white/10 p-6 rounded-xl space-y-3 hover:border-blue-500/30 transition">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                  {badge.icon}
                </div>
                <h4 className="font-bold text-sm text-white">{badge.title}</h4>
                <p className="text-gray-400 text-xs leading-relaxed">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 bg-[#050910]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center">
              <Landmark size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg text-white">{t('safeGlobalBank')}</span>
          </div>
          <div className="text-gray-400 text-xs text-center md:text-left">
            © {new Date().getFullYear()} {t('safeGlobalBank')}. {t('govAffiliated')}. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm font-medium text-gray-400">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Service</a>
            <a href="#" className="hover:text-white transition">Regulatory Compliance</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
