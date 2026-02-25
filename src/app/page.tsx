'use client';

import { useState, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import Link from 'next/link';
import {
    Search,
    Zap,
    ShieldCheck,
    BarChart3,
    ChevronRight,
    CheckCircle2
} from 'lucide-react';

function MagneticButton({ children, className }: { children: React.ReactNode, className?: string }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
    const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set((e.clientX - centerX) * 0.2);
        y.set((e.clientY - centerY) * 0.2);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.button
            style={{ x: springX, y: springY }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={className}
        >
            {children}
        </motion.button>
    );
}

function TiltCard({ children, className, variants }: { children: React.ReactNode, className?: string, variants?: any }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div variants={variants} className={`perspective-1000 ${className}`}>
            <motion.div
                style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="relative group w-full h-full transition-shadow duration-500 hover:shadow-[0_30px_60px_-15px_rgba(99,102,241,0.3)] rounded-3xl"
            >
                <div
                    className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_auto] animate-shimmer"
                    style={{ transform: "translateZ(-1px)" }}
                />
                <div className="absolute inset-0 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-sm group-hover:bg-white/[0.04] transition-colors" />
                <div className="relative z-10 h-full p-8" style={{ transform: "translateZ(20px)" }}>
                    {children}
                </div>
            </motion.div>
        </motion.div>
    );
}

function CircularProgress({ value }: { value: number }) {
    return (
        <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="url(#gradient)"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray="251.2"
                    strokeDashoffset="251.2"
                    initial={{ strokeDashoffset: 251.2 }}
                    whileInView={{ strokeDashoffset: 251.2 - (251.2 * value) / 100 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                    strokeLinecap="round"
                />
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white tracking-tighter">{value}</span>
            </div>
        </div>
    );
}

export default function Home() {
    const [isYearly, setIsYearly] = useState(true);
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    const yParallax = useTransform(scrollYProgress, [0, 1], [0, -150]);
    const opacityParallax = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    const staggerContainer = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const springItem = {
        hidden: { opacity: 0, y: 20 },
        show: {
            opacity: 1,
            y: 0,
            transition: { type: "spring" as const, duration: 0.8, bounce: 0.4 }
        }
    };

    return (
        <div className="min-h-screen bg-[#030303] text-white overflow-hidden selection:bg-indigo-500/30 font-sans tracking-tight" ref={containerRef}>
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen animate-blob" />
                <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-violet-600/20 blur-[120px] mix-blend-screen animate-blob animation-delay-2000" />
                <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-cyan-500/10 blur-[120px] mix-blend-screen animate-blob animation-delay-4000" />
            </div>

            <motion.header
                className="fixed top-0 inset-x-0 z-50 bg-[#030303]/60 backdrop-blur-xl border-b border-white/5"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", duration: 0.8, bounce: 0.4 }}
            >
                <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                            <Search size={16} className="text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tighter">CreatorRadar</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                        <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                    </div>
                    <Link href="/dashboard" className="px-4 py-2 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors backdrop-blur-md">
                        Get Access
                    </Link>
                </nav>
            </motion.header>

            <main className="relative z-10 pt-24">
                <section className="pt-20 pb-20 px-6 text-center max-w-5xl mx-auto">
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="show"
                        style={{ opacity: opacityParallax }}
                    >
                        <motion.div variants={springItem} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Scouting Engine Live
                        </motion.div>

                        <motion.h1 variants={springItem} className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 leading-[1.1]">
                            Find your next <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-300 to-slate-600">
                                100x Growth Ambassador.
                            </span>
                        </motion.h1>

                        <motion.p variants={springItem} className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed tracking-tight">
                            Data-driven scouting for the MyPal ecosystem. Stop guessing and start scaling with AI-powered creator discovery and deep engagement analytics.
                        </motion.p>

                        <motion.div variants={springItem} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/dashboard" className="w-full sm:w-auto">
                                <MagneticButton className="group relative w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-semibold rounded-full transition-all duration-300 overflow-hidden shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:shadow-[0_0_60px_rgba(99,102,241,0.8)]">
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 transition-transform duration-300 ease-in-out"></div>
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                    <span className="relative flex items-center gap-2 tracking-tight">
                                        Start Scouting <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </MagneticButton>
                            </Link>
                            <button className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-full border border-white/10 transition-colors tracking-tight">
                                View Demo
                            </button>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        style={{ y: yParallax }}
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", duration: 1, bounce: 0.3, delay: 0.4 }}
                        className="mt-24 relative max-w-4xl mx-auto perspective-1000"
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none"></div>

                        <div className="relative rounded-2xl border border-white/10 bg-[#0a0a0a]/60 backdrop-blur-2xl p-2 shadow-2xl overflow-hidden transform-gpu rotate-x-2">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none"></div>

                            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                </div>
                                <div className="mx-auto px-4 py-1 rounded-md bg-white/5 text-xs text-slate-400 flex items-center gap-2 font-mono">
                                    <Search className="w-3 h-3" /> app.creatorradar.com/scout
                                </div>
                            </div>

                            <div className="p-6 md:p-8">
                                <div className="flex flex-col md:flex-row gap-6 items-start">
                                    <div className="flex-1 w-full bg-white/[0.03] border border-white/5 rounded-2xl p-6 shadow-inner">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 p-[2px] shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                                                    <div className="w-full h-full rounded-full bg-[#111] flex items-center justify-center">
                                                        <span className="font-bold text-xl tracking-tighter">CK</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-white flex items-center gap-2 text-lg tracking-tight">
                                                        CryptoKing India
                                                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                                                    </h3>
                                                    <p className="text-sm text-slate-400 font-mono">@cryptoking_in</p>
                                                </div>
                                            </div>
                                            <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                                High Match
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 mt-8">
                                            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                                                <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Subscribers</p>
                                                <p className="font-semibold text-2xl tracking-tighter">12.4k</p>
                                            </div>
                                            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 relative overflow-hidden">
                                                <div className="absolute inset-0 bg-cyan-500/5"></div>
                                                <p className="text-xs text-cyan-500/70 mb-1 font-medium uppercase tracking-wider relative z-10">Engagement</p>
                                                <p className="font-semibold text-2xl text-cyan-400 tracking-tighter relative z-10">8.4%</p>
                                            </div>
                                            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                                                <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Avg. Views</p>
                                                <p className="font-semibold text-2xl tracking-tighter">4.2k</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full md:w-72 bg-[#0a0a0a] border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.15)]">
                                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 blur-[60px] rounded-full pointer-events-none"></div>
                                        <div className="relative z-10 flex flex-col items-center">
                                            <div className="flex items-center justify-between w-full mb-6">
                                                <p className="text-sm text-indigo-200 font-medium tracking-tight">Priority Score</p>
                                                <Zap className="w-4 h-4 text-indigo-400" />
                                            </div>

                                            <CircularProgress value={94} />

                                            <div className="w-full space-y-3 mt-8">
                                                <div className="flex justify-between text-xs font-medium">
                                                    <span className="text-slate-400">Recency Weight</span>
                                                    <span className="text-white">High</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: "90%" }}
                                                        viewport={{ once: true }}
                                                        transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
                                                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>

                <section className="py-12 border-y border-white/5 bg-white/[0.01] relative z-20">
                    <div className="max-w-7xl mx-auto px-6">
                        <p className="text-center text-xs text-slate-500 font-medium mb-8 uppercase tracking-widest">Trusted by top Web3 & SaaS teams</p>
                        <div className="flex flex-wrap justify-center gap-10 md:gap-20">
                            {['POLYGON', 'SOLANA', 'BINANCE', 'VERCEL', 'STRIPE'].map((brand, i) => (
                                <motion.div
                                    key={brand}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="text-xl font-bold tracking-tighter text-slate-500 flex items-center gap-2 opacity-40 grayscale hover:text-white hover:opacity-100 hover:grayscale-0 transition-all duration-500 cursor-default"
                                >
                                    <div className="w-6 h-6 rounded bg-current"></div>
                                    {brand}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="features" className="py-32 px-6 max-w-7xl mx-auto relative z-20">
                    <div className="text-center mb-20">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-bold tracking-tighter mb-6"
                        >
                            Everything you need to scout.
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-slate-400 text-lg max-w-2xl mx-auto tracking-tight"
                        >
                            Powerful tools designed to find high-signal creators before they blow up.
                        </motion.p>
                    </div>

                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-100px" }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        <TiltCard variants={springItem} className="md:col-span-2 min-h-[400px]">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/20 transition-colors duration-700"></div>
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-8 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                <Search size={24} className="text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-4 tracking-tight">Regex Social Scraping</h3>
                            <p className="text-slate-400 leading-relaxed max-w-md tracking-tight">
                                Automatically extract Telegram, Twitter/X, and Discord handles from YouTube descriptions and bios. No more manual hunting.
                            </p>

                            <div className="mt-10 p-5 bg-[#050505] rounded-xl border border-white/5 font-mono text-sm text-slate-300 shadow-inner relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 text-indigo-400 mb-3">
                                        <Search size={16} className="animate-pulse" /> Scanning description...
                                    </div>
                                    <div className="text-slate-500">...join my community at</div>
                                    <div className="bg-indigo-500/10 text-indigo-300 px-2 py-1 rounded inline-block my-2 border border-indigo-500/20">
                                        t.me/cryptoking_official
                                    </div>
                                    <div className="text-slate-500">for daily updates...</div>
                                </div>
                            </div>
                        </TiltCard>

                        <TiltCard variants={springItem} className="min-h-[400px]">
                            <div className="absolute bottom-0 right-0 w-48 h-48 bg-cyan-500/10 blur-[80px] rounded-full group-hover:bg-cyan-500/20 transition-colors duration-700"></div>
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-8 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                                <BarChart3 size={24} className="text-cyan-400" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-4 tracking-tight">The Priority Score</h3>
                            <p className="text-slate-400 leading-relaxed tracking-tight">
                                Our proprietary algorithm weighs engagement rates and recency to surface creators who are actively growing, not just sitting on dead subs.
                            </p>

                            <div className="mt-10 flex items-end gap-2 h-24">
                                {[40, 65, 45, 80, 55, 95].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        whileInView={{ height: `${h}%` }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.8, delay: 0.2 + i * 0.1, type: "spring" }}
                                        className="flex-1 bg-gradient-to-t from-cyan-500/20 to-cyan-400/50 rounded-t-sm"
                                    />
                                ))}
                            </div>
                        </TiltCard>

                        <TiltCard variants={springItem} className="md:col-span-3">
                            <div className="flex flex-col md:flex-row items-center gap-12">
                                <div className="flex-1">
                                    <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-8 border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                                        <ShieldCheck size={24} className="text-violet-400" />
                                    </div>
                                    <h3 className="text-2xl font-semibold mb-4 tracking-tight">Quota Shield</h3>
                                    <p className="text-slate-400 leading-relaxed max-w-xl tracking-tight">
                                        Smart API management that prevents rate limits. We distribute requests intelligently so you never hit a wall while scraping thousands of profiles.
                                    </p>
                                </div>

                                <div className="w-full md:w-auto flex-1">
                                    <div className="bg-[#050505] border border-white/5 rounded-2xl p-6 shadow-inner relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent"></div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-center mb-6">
                                                <span className="text-sm font-medium text-slate-300 tracking-tight">API Health</span>
                                                <span className="px-2.5 py-1 rounded bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                                    99.9% Uptime
                                                </span>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: "30%" }}
                                                        viewport={{ once: true }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                        className="bg-violet-500 h-full rounded-full"
                                                    />
                                                </div>
                                                <div className="flex justify-between text-xs text-slate-500 font-medium">
                                                    <span>3,420 / 10,000 reqs</span>
                                                    <span className="text-violet-400">Safe Zone</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TiltCard>
                    </motion.div>
                </section>

                <section id="pricing" className="py-32 px-6 relative z-20">
                    <div className="absolute inset-0 bg-indigo-900/5 blur-[100px] pointer-events-none"></div>

                    <div className="max-w-3xl mx-auto text-center mb-16">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-bold tracking-tighter mb-8"
                        >
                            Simple, transparent pricing.
                        </motion.h2>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center p-1 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-sm"
                        >
                            <button
                                onClick={() => setIsYearly(false)}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${!isYearly ? 'bg-white text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setIsYearly(true)}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isYearly ? 'bg-white text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}
                            >
                                Yearly <span className="ml-1 text-indigo-500 font-bold">-20%</span>
                            </button>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ type: "spring", duration: 0.8, bounce: 0.4 }}
                        className="max-w-lg mx-auto bg-gradient-to-b from-white/[0.04] to-[#030303] border border-white/10 rounded-3xl p-8 md:p-10 relative overflow-hidden shadow-2xl"
                    >
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-32 bg-indigo-500/10 blur-[50px] pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-2xl font-bold mb-2 tracking-tight">Pro Scout</h3>
                                    <p className="text-slate-400 text-sm tracking-tight">Everything you need to scale.</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-5xl font-bold tracking-tighter">${isYearly ? '79' : '99'}</span>
                                    <span className="text-slate-500 text-sm font-medium">/mo</span>
                                </div>
                            </div>

                            <Link href="/dashboard" className="block w-full text-center py-4 bg-white text-black hover:bg-slate-200 font-semibold rounded-xl transition-colors mb-10 tracking-tight shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                Start 7-Day Free Trial
                            </Link>

                            <div className="space-y-5">
                                {[
                                    'Unlimited Creator Searches',
                                    'Regex Social Scraping (TG, X, Discord)',
                                    'Priority Score Analytics',
                                    'Quota Shield API Protection',
                                    'Export to CSV / CRM',
                                    '24/7 Priority Support'
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                                        <span className="text-slate-300 text-sm tracking-tight">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </section>

                <footer className="border-t border-white/5 py-12 px-6 mt-20 relative z-20 bg-[#030303]">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
                                <Search className="w-3 h-3 text-white" />
                            </div>
                            <span className="font-bold tracking-tighter">CreatorRadar</span>
                        </div>

                        <div className="flex items-center gap-8 text-sm font-medium text-slate-500">
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <a href="#" className="hover:text-white transition-colors">Twitter</a>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-slate-400 font-medium tracking-tight">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            System Status: Optimal
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
