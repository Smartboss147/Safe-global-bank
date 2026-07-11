import { Link } from 'react-router-dom';
import hero1 from '../assets/images/bank_hero_1_1783808893582.jpg';
import hero2 from '../assets/images/bank_hero_2_1783808906210.jpg';
import hero3 from '../assets/images/bank_hero_3_1783808916854.jpg';
import award from '../assets/images/bank_award_1783809311875.jpg';
import app from '../assets/images/bank_app_1783809324597.jpg';
import team from '../assets/images/bank_team_1783809336520.jpg';
import investment from '../assets/images/investment_concept_1783810385372.jpg';
import loan from '../assets/images/loan_concept_1783810398978.jpg';
import education from '../assets/images/education_concept_1783810410519.jpg';
import trading from '../assets/images/trading_concept_1783810422396.jpg';

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <section className="bg-blue-900 text-white p-16 text-center">
        <h1 className="text-5xl font-extrabold mb-6">Welcome to Safe Global Bank</h1>
        <p className="text-xl mb-10 max-w-2xl mx-auto opacity-90">Experience the future of secure, intelligent, and borderless financial management.</p>
        <Link to="/login" className="px-10 py-4 bg-white text-blue-900 rounded-lg text-lg font-bold hover:bg-gray-100 transition">
          Get Started
        </Link>
      </section>

      {/* Services Section */}
      <section className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl font-bold mb-12 text-center">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { img: investment, title: 'Investment', desc: 'Grow your wealth with our curated portfolios.' },
            { img: loan, title: 'Personal Loans', desc: 'Flexible loan options for your personal needs.' },
            { img: education, title: 'Financial Education', desc: 'Learn to manage your money like a pro.' },
            { img: trading, title: 'Trading', desc: 'Real-time stock market data and tools.' },
          ].map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <img src={s.img} alt={s.title} className="rounded-lg mb-4 h-40 w-full object-cover" />
              <h3 className="text-xl font-bold mb-2">{s.title}</h3>
              <p className="text-gray-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center px-4">
        <img src={app} alt="Mobile App" className="rounded-2xl shadow-2xl w-full" />
        <div>
          <h2 className="text-3xl font-bold mb-6">Advanced Banking at Your Fingertips</h2>
          <p className="text-gray-600 mb-4">Our simulation provides a seamless interface to manage your transactions, simulate deposits, and track your financial growth with professional precision.</p>
          <ul className="space-y-2 text-gray-700">
            <li>✅ Instant Transaction Processing</li>
            <li>✅ Secure Account Management</li>
            <li>✅ Real-time Analytics Dashboard</li>
          </ul>
        </div>
      </section>

      {/* Awards Section */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-6">Award Winning Excellence</h2>
            <p className="text-gray-600">We are recognized globally for our commitment to security, innovation, and client satisfaction in the digital banking space.</p>
          </div>
          <img src={award} alt="Award" className="rounded-2xl shadow-xl w-full md:w-1/2" />
        </div>
      </section>

      {/* Team/Philosophy Section */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center px-4">
        <img src={team} alt="Our Team" className="rounded-2xl shadow-lg w-full" />
        <div>
          <h2 className="text-3xl font-bold mb-6">Dedicated to Your Security</h2>
          <p className="text-gray-600">Our team of experts works around the clock to ensure your simulation experience is as realistic, secure, and educational as possible.</p>
        </div>
      </section>
      
      {/* Final CTA */}
      <section className="text-center p-16 bg-gray-900 text-white">
        <h2 className="text-3xl font-bold mb-6">Ready to Experience the Next Level?</h2>
        <Link to="/login" className="px-10 py-4 bg-blue-600 text-white rounded-lg text-lg font-bold hover:bg-blue-700 transition">
          Open Your Demo Account
        </Link>
      </section>
    </div>
  );
}
