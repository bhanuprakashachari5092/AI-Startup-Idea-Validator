import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, BrainCircuit, ShieldCheck, Zap, Globe, ArrowRight } from 'lucide-react';

const homeFeatures = [
  { 
    title: 'Instant Feasibility', 
    desc: 'Get immediate feedback on your startup idea\'s technical and market feasibility.', 
    icon: <ShieldCheck size={28} className="text-primary" /> 
  },
  { 
    title: 'Market Strategies', 
    desc: 'AI-driven insights on target audience and monetization models tailored for you.', 
    icon: <Zap size={28} className="text-blue-400" /> 
  },
  { 
    title: 'Multilingual Support', 
    desc: 'Validate in Telugu, Hindi, or English. Speak your native language to our AI.', 
    icon: <Globe size={28} className="text-green-400" /> 
  },
  { 
    title: 'Deep Logic Analysis', 
    desc: 'Go beyond simple keywords. Our AI understands complex business logic.', 
    icon: <BrainCircuit size={28} className="text-purple-400" /> 
  }
];

const Home = () => {
  const token = sessionStorage.getItem('token');

  return (
    <div className="min-h-screen relative overflow-hidden pt-20">
      
      {/* Hero Section */}
      <section className="relative z-10 py-20 px-8 max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 text-sm font-semibold text-primary mb-8 animate-pulse-glow"
        >
          <Sparkles size={16} />
          <span>The Next Generation of Idea Validation</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight text-white leading-tight"
        >
          Validate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">Startup Ideas</span> <br className="hidden md:block" /> with Artificial Intelligence
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-white/60 mb-12 max-w-3xl leading-relaxed"
        >
          Stop building what people don't want. Use AI to get instant feedback, market insights, and monetization strategies before you write a single line of code.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-6 mb-24"
        >
          <Link to={token ? "/dashboard" : "/register"} className="btn-primary py-4 px-10 text-lg font-bold flex items-center justify-center gap-3">
            {token ? "Go to Dashboard" : "Get Started Now"} <ArrowRight size={20} />
          </Link>
          {!token && (
            <Link to="/login" className="btn-secondary py-4 px-10 text-lg font-bold flex items-center justify-center gap-3">
              Sign In
            </Link>
          )}
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20 w-full">
          {homeFeatures.map((feat, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-10 group hover:bg-white/10 transition-colors border border-white/5"
            >
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6 inline-block group-hover:scale-110 group-hover:border-primary/50 transition-all">
                {feat.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4">{feat.title}</h3>
              <p className="text-white/50 text-lg leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Decorative Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
    </div>
  );
};

export default Home;
