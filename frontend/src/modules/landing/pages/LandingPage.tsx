import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Lock,
  Search,
  Layers,
  Play,
  ArrowRight,
  CheckCircle2,
  FileText,
  RefreshCcw,
  Cpu,
  Key,
  Globe,
  Share2,
  Check,
} from 'lucide-react';
import { ROUTES } from '../../../config/routes.config';
import { ENV } from '../../../config/env.config';
import emblemImg from '../../../assets/emblem.png';

const LinkedinIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

interface TeamMember {
  name: string;
  role: string;
  linkedin: string;
  avatar: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'Masir Jafri',
    role: 'Backend & DevOps',
    linkedin: 'https://www.linkedin.com/in/masirjafri/',
    avatar: '/masir.png',
  },
  {
    name: 'Jeenal Patel',
    role: 'Frontend Developer',
    linkedin: 'https://www.linkedin.com/in/jeenalpatel2007/',
    avatar: '/jeenal.png',
  },
  {
    name: 'Khushi Surti',
    role: 'UI/UX & Frontend',
    linkedin: 'https://www.linkedin.com/in/khushi-surti-938962336/',
    avatar: '/khushi.png',
  },
  {
    name: 'Harshit Agarwal',
    role: 'Backend Developer',
    linkedin: 'https://www.linkedin.com/in/harshit-agarwal-20b52231b/',
    avatar: '/harshit.png',
  },
  {
    name: 'Shrey Data',
    role: 'AI/ML & Search',
    linkedin: 'https://www.linkedin.com/in/shreydata/',
    avatar: '/shrey.jpg',
  },
  {
    name: 'Kapil Jangid',
    role: 'Blockchain & Security',
    linkedin: 'https://www.linkedin.com/in/kapil31jangid/',
    avatar: '/kapil.png',
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-slate-800 selection:text-white">
      {/* 1. HEADER / NAVBAR */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo & Emblem Branding */}
          <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 border border-slate-700 p-1 flex items-center justify-center shadow-xs">
              <img src={emblemImg} alt="Government Emblem Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">{ENV.APP_NAME}</span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-semibold tracking-wide block">
                EVIDENCE SYSTEM
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
            <button onClick={() => scrollToSection('hero')} className="hover:text-slate-900 transition-colors cursor-pointer">
              Home
            </button>
            <button onClick={() => scrollToSection('problem')} className="hover:text-slate-900 transition-colors cursor-pointer">
              Problem
            </button>
            <button onClick={() => scrollToSection('solution')} className="hover:text-slate-900 transition-colors cursor-pointer">
              Solution
            </button>
            <button onClick={() => scrollToSection('architecture')} className="hover:text-slate-900 transition-colors cursor-pointer">
              Architecture
            </button>
            <button onClick={() => scrollToSection('tech-stack')} className="hover:text-slate-900 transition-colors cursor-pointer">
              Tech Stack
            </button>
            <button onClick={() => scrollToSection('team')} className="hover:text-slate-900 transition-colors cursor-pointer">
              Team
            </button>
          </nav>

          {/* Use System / Login Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(ROUTES.PUBLIC.LOGIN)}
              className="px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center gap-1.5 sm:gap-2 cursor-pointer"
            >
              <span>Use System</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section id="hero" className="relative pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-20 overflow-hidden bg-gradient-to-b from-slate-100/70 via-slate-50 to-white border-b border-slate-200">
        {/* Background Image Overlay - Zoomed out & Neatly Aligned on the Right (PC view) */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden hidden lg:flex items-center justify-end pr-4 lg:pr-12">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-1/2 right-[15%] -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-slate-300/20 via-slate-200/10 to-transparent rounded-full blur-3xl opacity-60" />

          {/* Hero Image - Dissolved Left Edge & Borderless Blended Linear Mask */}
          <div className="relative w-full max-w-3xl transform scale-90 lg:scale-95 translate-x-4 lg:translate-x-8 [mask-image:linear-gradient(to_right,transparent_0%,black_25%,black_85%,transparent_100%)]">
            <img
              src="/hero-image.png"
              alt="SDEMS Platform Visual"
              className="w-full h-auto object-contain object-right opacity-95 mix-blend-multiply transition-transform duration-500 hover:scale-[1.01]"
            />
          </div>
        </div>

        {/* Foreground Hero Content (Text & Clean Minimalist System) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl text-left space-y-4 sm:space-y-6">
            {/* Eyebrow Badge - Neutral Slate */}
            <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold tracking-wide text-slate-700 bg-slate-100 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-slate-200 shadow-2xs">
              <span className="w-4 h-4 rounded-full bg-slate-800 text-white flex items-center justify-center text-[9px] font-black">
                🇮🇳
              </span>
              <span>Smart India Hackathon 2026 · Problem Statement 26190</span>
            </div>

            {/* Main Headline - High-Contrast Slate-900 */}
            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Secure Digital Document <br className="hidden sm:inline" />
              Management System for <br className="hidden sm:inline" />
              <span className="text-slate-700">Legal & Investigation Documents</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 font-normal leading-relaxed max-w-xl">
              A secure, traceable and tamper-evident platform for managing legal, investigative and forensic evidence across authorised government and law-enforcement organisations.
            </p>

            {/* Hero Action Buttons - Clean Slate Primary */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3.5">
              <button
                onClick={() => navigate(ROUTES.PUBLIC.LOGIN)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2.5 cursor-pointer group"
              >
                <span>Use System</span>
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => scrollToSection('video-showcase')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-sm transition-all shadow-2xs flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Play className="w-4 h-4 text-slate-700 fill-slate-700" />
                <span>Watch Demo Video</span>
              </button>
            </div>

            {/* Bottom Metadata Stats Row - Clean Slate Theme */}
            <div className="pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-slate-200 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-4 sm:gap-8 text-left">
              <div>
                <div className="text-[11px] sm:text-xs text-slate-500 font-medium mb-0.5">Problem Statement ID</div>
                <div className="text-sm sm:text-base font-bold text-slate-900">26190</div>
              </div>

              <div>
                <div className="text-[11px] sm:text-xs text-slate-500 font-medium mb-0.5">Theme</div>
                <div className="text-sm sm:text-base font-bold text-slate-900">Blockchain & Cybersecurity</div>
              </div>

              <div>
                <div className="text-[11px] sm:text-xs text-slate-500 font-medium mb-0.5">Category</div>
                <div className="text-sm sm:text-base font-bold text-slate-900">Software</div>
              </div>

              <div>
                <div className="text-[11px] sm:text-xs text-slate-500 font-medium mb-0.5">Team</div>
                <div className="text-sm sm:text-base font-bold text-slate-900">ThreeSixNine</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE PROBLEM SECTION */}
      <section id="problem" className="relative py-12 sm:py-16 lg:py-20 bg-white border-b border-slate-200 overflow-hidden">
        {/* Side Image 1 - Light Decorative Vector Accent */}
        <div className="absolute -right-16 top-1/2 -translate-y-1/2 pointer-events-none hidden xl:block opacity-15">
          <img src="/side-img-1.png" alt="Decorative System Accent" className="w-[400px] h-auto object-contain mix-blend-multiply filter grayscale" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-4 sm:gap-6 text-left">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 mb-3">
                <Globe className="w-3.5 h-3.5 text-slate-700" />
                <span>The Problem</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                Key Challenges in Managing <br className="hidden sm:inline" />
                Legal & Investigative Documents
              </h2>
              <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm lg:text-base text-slate-600 font-normal leading-relaxed">
                Legal and investigation departments handle large volumes of sensitive documents and evidence. Traditional systems face several challenges.
              </p>
            </div>

            <button
              onClick={() => scrollToSection('solution')}
              className="px-4 py-2 rounded-full border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs transition-all flex items-center gap-1.5 self-start md:self-auto shadow-2xs cursor-pointer"
            >
              <span>Know More</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 6 Problem Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Card 1 */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50/70 border border-slate-200 text-left hover:border-slate-400 hover:bg-white transition-all shadow-2xs flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-200/70 text-slate-700 flex items-center justify-center mb-3 sm:mb-3.5">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5 leading-snug">Fragmented Records</h3>
                <p className="text-xs text-slate-600 font-normal leading-relaxed">
                  Case documents and evidence are distributed across departments and repositories.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50/70 border border-slate-200 text-left hover:border-slate-400 hover:bg-white transition-all shadow-2xs flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-200/70 text-slate-700 flex items-center justify-center mb-3 sm:mb-3.5">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5 leading-snug">Unauthorized Access</h3>
                <p className="text-xs text-slate-600 font-normal leading-relaxed">
                  Sensitive legal records require more than a simple application login.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50/70 border border-slate-200 text-left hover:border-slate-400 hover:bg-white transition-all shadow-2xs flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-200/70 text-slate-700 flex items-center justify-center mb-3 sm:mb-3.5">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5 leading-snug">Tampering Risk</h3>
                <p className="text-xs text-slate-600 font-normal leading-relaxed">
                  A stored file alone does not prove that the current bytes are the original bytes.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50/70 border border-slate-200 text-left hover:border-slate-400 hover:bg-white transition-all shadow-2xs flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-200/70 text-slate-700 flex items-center justify-center mb-3 sm:mb-3.5">
                  <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5 leading-snug">Version Confusion</h3>
                <p className="text-xs text-slate-600 font-normal leading-relaxed">
                  Multiple copies make it difficult to identify the evidence version being relied upon.
                </p>
              </div>
            </div>

            {/* Card 5 */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50/70 border border-slate-200 text-left hover:border-slate-400 hover:bg-white transition-all shadow-2xs flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-200/70 text-slate-700 flex items-center justify-center mb-3 sm:mb-3.5">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5 leading-snug">Slow Retrieval</h3>
                <p className="text-xs text-slate-600 font-normal leading-relaxed">
                  Information may be buried in scanned PDFs, reports or large repositories.
                </p>
              </div>
            </div>

            {/* Card 6 */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50/70 border border-slate-200 text-left hover:border-slate-400 hover:bg-white transition-all shadow-2xs flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-200/70 text-slate-700 flex items-center justify-center mb-3 sm:mb-3.5">
                  <RefreshCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5 leading-snug">Broken Evidence Trail</h3>
                <p className="text-xs text-slate-600 font-normal leading-relaxed">
                  Transfers between authorized institutions need an auditable chronological record.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. OUR SOLUTION SECTION */}
      <section id="solution" className="relative py-12 sm:py-16 lg:py-20 bg-slate-50 border-b border-slate-200 overflow-hidden">
        {/* Side Image 2 - Light Decorative Vector Accent */}
        <div className="absolute -left-20 top-1/2 -translate-y-1/2 pointer-events-none hidden xl:block opacity-15">
          <img src="/side-img-2.png" alt="Decorative Solution Accent" className="w-[440px] h-auto object-contain mix-blend-multiply filter grayscale" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

            {/* Left Solution Details */}
            <div className="lg:col-span-6 text-left space-y-4 sm:space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                <Shield className="w-3.5 h-3.5 text-slate-700" />
                <span>Our Solution</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                SDEMS - Secure, Traceable and Tamper-Evident
              </h2>

              <p className="text-xs sm:text-sm lg:text-base text-slate-600 font-normal leading-relaxed">
                SDEMS addresses these challenges through a centralized yet organization-aware evidence management platform with strong security, integrity verification and complete chain-of-custody tracking.
              </p>

              {/* 6 Feature Rows */}
              <div className="space-y-3 sm:space-y-4 pt-1 sm:pt-2">
                <div className="flex items-start gap-3 sm:gap-3.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">Centralised Case Vaults</h4>
                    <p className="text-xs text-slate-600 font-normal">Structured storage for documents, media, reports and evidence.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-3.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">RBAC + ABAC Authorization</h4>
                    <p className="text-xs text-slate-600 font-normal">Controls user, organization, case and action-level permissions.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-3.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Key className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">Cryptographic Fingerprinting</h4>
                    <p className="text-xs text-slate-600 font-normal">SHA-256 creates a deterministic fingerprint for every evidence version.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-3.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">Permissioned Blockchain</h4>
                    <p className="text-xs text-slate-600 font-normal">Hyperledger Fabric / Hardhat EVM records integrity proofs and critical lifecycle events.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-3.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">OCR + Elasticsearch / OpenSearch</h4>
                    <p className="text-xs text-slate-600 font-normal">Makes scanned documents, extracted text and metadata searchable.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-3.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">Integrity Verification</h4>
                    <p className="text-xs text-slate-600 font-normal">Recalculates the hash and compares it with the trusted ledger record.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Solution Image Display (Blended with linear gradient mask on PC) */}
            <div className="lg:col-span-6 relative flex items-center justify-center mt-6 lg:mt-0">
              {/* Subtle Backlight Glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-200/30 via-slate-100/20 to-transparent rounded-full blur-3xl opacity-50 pointer-events-none" />

              <div className="relative w-full max-w-xl lg:[mask-image:linear-gradient(to_right,transparent_0%,black_15%,black_85%,transparent_100%)]">
                <img
                  src="/our-solution.png"
                  alt="SDEMS Solution Architecture Visual"
                  className="w-full h-auto object-contain opacity-95 mix-blend-multiply filter drop-shadow-sm transition-transform duration-500 hover:scale-[1.01]"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. PROJECT DEMONSTRATION SHOWCASE */}
      <section id="video-showcase" className="py-12 sm:py-16 lg:py-24 bg-white border-b border-slate-200 overflow-hidden relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 mb-3 sm:mb-4 shadow-2xs">
            <Play className="w-3.5 h-3.5 text-slate-700 fill-slate-700" />
            <span>Project Demonstration</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
            Watch SDEMS in Action
          </h2>

          <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm lg:text-base text-slate-600 max-w-xl mx-auto font-normal leading-relaxed">
            See the complete workflow - from document upload to blockchain anchoring, search, verification and custody transfer.
          </p>

          {/* LANDSCAPE TABLET / MONITOR SHOWCASE FRAME (KEEP THIS TABLET) */}
          <div className="mt-8 sm:mt-12 relative mx-auto max-w-4xl w-full group">
            {/* Ambient Backlight Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-slate-200/40 via-slate-300/30 to-slate-200/40 rounded-3xl blur-2xl opacity-60 pointer-events-none" />

            {/* Tablet Frame Header */}
            <div className="relative bg-slate-900 rounded-t-2xl sm:rounded-t-3xl p-2.5 sm:p-4 border border-slate-800 sm:border-2 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-2 sm:pb-3 px-1.5 sm:px-2 border-b border-slate-800 mb-2 sm:mb-3 text-[10px] sm:text-xs font-mono text-slate-400">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-600" />
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-600" />
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-600" />
                </div>
                <span className="truncate max-w-[140px] sm:max-w-md text-slate-300 font-medium">SDEMS Platform Demo | Smart India Hackathon 2026</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 font-semibold hidden sm:inline">LIVE HD</span>
                </div>
              </div>

              {/* YOUTUBE IFRAME EMBEDDED INSIDE TABLET SCREEN */}
              <div className="relative w-full aspect-video rounded-lg sm:rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
                <iframe
                  src="https://www.youtube.com/embed/9Bb6slWITno?rel=0&modestbranding=1&autoplay=0"
                  title="SDEMS Platform Demo Video"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Stand Stem & Base */}
            <div className="relative mx-auto w-28 sm:w-52 h-4 sm:h-6 bg-gradient-to-b from-slate-800 to-slate-900 rounded-b-xl border-x border-b border-slate-700 shadow-sm" />
            <div className="relative mx-auto w-40 sm:w-80 h-2 sm:h-3 bg-gradient-to-b from-slate-900 to-slate-950 rounded-lg border border-slate-800 shadow-md" />

            {/* Bottom 3 Feature Pills */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 sm:gap-6 text-xs sm:text-sm font-medium text-slate-700 font-sans">
              <div className="px-4 py-2 rounded-full bg-slate-50 border border-slate-200 flex items-center gap-2 shadow-2xs w-full sm:w-auto justify-center">
                <Check className="w-4 h-4 text-slate-700" />
                <span>Complete Workflow</span>
              </div>
              <div className="px-4 py-2 rounded-full bg-slate-50 border border-slate-200 flex items-center gap-2 shadow-2xs w-full sm:w-auto justify-center">
                <Check className="w-4 h-4 text-slate-700" />
                <span>Real-time Demo</span>
              </div>
              <div className="px-4 py-2 rounded-full bg-slate-50 border border-slate-200 flex items-center gap-2 shadow-2xs w-full sm:w-auto justify-center">
                <Check className="w-4 h-4 text-slate-700" />
                <span>Key Features Showcase</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DECOUPLED ARCHITECTURE SECTION */}
      <section id="architecture" className="relative py-12 sm:py-16 lg:py-20 bg-slate-50 border-b border-slate-200 overflow-hidden">
        {/* Side Image 3 - Light Decorative Vector Accent */}
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 pointer-events-none hidden xl:block opacity-15">
          <img src="/side-img-3.png" alt="Decorative Architecture Accent" className="w-[440px] h-auto object-contain mix-blend-multiply filter grayscale" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 mb-3">
            <Cpu className="w-3.5 h-3.5 text-slate-700" />
            <span>System Architecture</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Decoupled Data & Trust Architecture
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 font-normal max-w-xl mx-auto">
            Each component handles a specific responsibility to ensure security, scalability and verifiability.
          </p>

          <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-left">
            <div className="p-4 sm:p-6 rounded-xl bg-white border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 shadow-2xs">
                  <img src="/PostgreSQL_logo.png" alt="PostgreSQL Logo" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-base font-bold text-slate-900">PostgreSQL</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 font-normal">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-slate-600" /> Relational case metadata</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-slate-600" /> User accounts & ABAC policies</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-slate-600" /> Physical custody records</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-slate-600" /> Audit trails</li>
              </ul>
            </div>

            <div className="p-4 sm:p-6 rounded-xl bg-white border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 shadow-2xs">
                  <img src="/Amazon_S3_logo.png" alt="Amazon S3 Logo" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Amazon S3</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 font-normal">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-slate-600" /> Original evidence storage</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-slate-600" /> Versioning + Object Lock</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-slate-600" /> Encryption & legal hold</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-slate-600" /> Large file storage</li>
              </ul>
            </div>

            <div className="p-4 sm:p-6 rounded-xl bg-white border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 shadow-2xs">
                  <img src="/Elasticsearch_logo.png" alt="Elasticsearch Logo" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Elasticsearch</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 font-normal">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-slate-600" /> OCR text and metadata</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-slate-600" /> Full-text search index</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-slate-600" /> Scalable search</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-slate-600" /> Decoupled from application</li>
              </ul>
            </div>

            <div className="p-4 sm:p-6 rounded-xl bg-white border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 shadow-2xs">
                  <img src="/Hyperledger_logo.png" alt="Hyperledger EVM Logo" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Hyperledger / EVM</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 font-normal">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-slate-600" /> Permissioned blockchain</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-slate-600" /> Evidence hashes</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-slate-600" /> Custody events</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-slate-600" /> Integrity proofs</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 7. TECH STACK BADGES */}
      <section id="tech-stack" className="relative py-12 sm:py-16 bg-white border-b border-slate-200 overflow-hidden">
        {/* Side Image 1 - Light Decorative Vector Accent */}
        <div className="absolute -left-16 top-1/2 -translate-y-1/2 pointer-events-none hidden xl:block opacity-12">
          <img src="/side-img-1.png" alt="Decorative Tech Accent" className="w-[360px] h-auto object-contain mix-blend-multiply filter grayscale" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 mb-3">
            <Cpu className="w-3.5 h-3.5 text-slate-700" />
            <span>Technology Stack</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-6 sm:mb-8">
            Tools & Technologies
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-4xl mx-auto">
            {[
              'React',
              'TypeScript',
              'Vite',
              'Tailwind CSS',
              'Node.js',
              'Express',
              'PostgreSQL',
              'Prisma',
              'Elasticsearch',
              'Groq',
              'Tesseract',
              'AWS S3',
              'Hyperledger / EVM',
              'Docker',
              'Nginx',
            ].map((tech, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] sm:text-xs font-mono font-medium text-slate-700 shadow-2xs hover:border-slate-400 transition-colors"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 8. TEAM THREESIXNINE SECTION */}
      <section id="team" className="py-12 sm:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 mb-3">
            <Share2 className="w-3.5 h-3.5 text-slate-700" />
            <span>Our Team</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Team ThreeSixNine
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 font-normal max-w-xl mx-auto">
            A team of passionate developers building secure and impactful solutions for a safer India.
          </p>

          {/* 6 Team Member Cards */}
          <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {TEAM_MEMBERS.map((member, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 flex items-center justify-between hover:border-slate-400 transition-all shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-slate-200 bg-slate-50 p-0.5 object-cover"
                  />
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-slate-900">{member.name}</h3>
                  </div>
                </div>

                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
                  title="Connect on LinkedIn"
                >
                  <LinkedinIcon className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. PRE-FOOTER CALL TO ACTION BANNER */}
      <section className="relative py-12 sm:py-16 bg-white border-b border-slate-200 text-center overflow-hidden">
        {/* Side Image Decorative Watermarks */}
        <div className="absolute -left-20 top-1/2 -translate-y-1/2 pointer-events-none hidden lg:block opacity-12">
          <img src="/side-img-2.png" alt="Decorative Banner Accent Left" className="w-[380px] h-auto object-contain mix-blend-multiply filter grayscale" />
        </div>
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 pointer-events-none hidden lg:block opacity-12">
          <img src="/side-img-3.png" alt="Decorative Banner Accent Right" className="w-[380px] h-auto object-contain mix-blend-multiply filter grayscale" />
        </div>

        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
            Ready to build a more secure and accountable evidence ecosystem?
          </h2>
          <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm text-slate-600 font-normal">
            Launch the SDEMS platform directly or watch our complete real-time workflow demo.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate(ROUTES.PUBLIC.LOGIN)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Use System</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => scrollToSection('video-showcase')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-sm transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 text-slate-700 fill-slate-700" />
              <span>Watch Demo Video</span>
            </button>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="py-6 sm:py-8 bg-white text-slate-600 text-xs font-medium border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 border border-slate-700 p-1 flex items-center justify-center shadow-xs">
              <img src={emblemImg} alt="Government Emblem Logo" className="w-full h-full object-contain" />
            </div>
            <div className="text-left">
              <span className="font-bold text-slate-900 block">SDEMS</span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 block">Secure Digital Document & Evidence Management System</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-medium text-slate-600">
            <button onClick={() => scrollToSection('hero')} className="hover:text-slate-900 transition-colors">
              Home
            </button>
            <button onClick={() => scrollToSection('problem')} className="hover:text-slate-900 transition-colors">
              Problem
            </button>
            <button onClick={() => scrollToSection('solution')} className="hover:text-slate-900 transition-colors">
              Solution
            </button>
            <button onClick={() => scrollToSection('architecture')} className="hover:text-slate-900 transition-colors">
              Architecture
            </button>
            <button onClick={() => scrollToSection('tech-stack')} className="hover:text-slate-900 transition-colors">
              Tech Stack
            </button>
            <button onClick={() => scrollToSection('team')} className="hover:text-slate-900 transition-colors">
              Team
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
            <span>Built for a Safer and More Accountable India</span>
            <span>🇮🇳</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
