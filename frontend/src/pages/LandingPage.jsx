import React from "react";
import { ArrowRight, Play } from "lucide-react";

import Header2 from "../layouts/Header2";
import Footer from "../layouts/Footer";
import heroImage from "../assets/images/hero-img-1.png";

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header2 />
      <main className="flex-1">
        <section id="hero" className="app-page pb-14 pt-8 md:pb-18 md:pt-12">
          <div className="px-4 py-10 sm:px-6 md:px-8 md:py-14 lg:px-10">
            <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#fde5cf] bg-[#fff8f0] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#e89a52]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f7c08d]" />
                All-in-one scoring platform
              </div>

              <h1 className="mt-7 max-w-4xl text-5xl font-bold leading-[0.95] tracking-[-0.04em] text-slate-800 sm:text-6xl lg:text-[5.5rem]">
                Smart Competition
                <span className="block text-[#7d5c4b] mb-2">
                  Management Tool
                </span>
                <span className="block text-[#d2742f]">Made Simple</span>
              </h1>

              <p className="mt-20 max-w-3xl text-lg leading-8 text-slate-400 sm:text-xl">
                Manage events, judges, contestants, scoring, and rankings
                through one centralized system built for fast, accurate, and
                transparent results.
              </p>

              <div className="mt-10 flex w-full max-w-xl flex-col items-center justify-center gap-4 sm:flex-row">
                <a
                  href="#features"
                  className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-7 py-4 text-base font-semibold text-white shadow-[0_20px_35px_-22px_rgba(15,23,42,0.85)] transition hover:bg-slate-800 sm:w-auto sm:min-w-[235px]"
                >
                  Explore Features
                  <ArrowRight size={20} />
                </a>
                <a
                  href="#documentation"
                  className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-7 py-4 text-base font-medium text-slate-400 shadow-[0_14px_30px_-26px_rgba(15,23,42,0.35)] backdrop-blur transition hover:border-slate-300 hover:text-slate-700 sm:w-auto sm:min-w-[198px]"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-[#ff7d20]">
                    <Play size={12} fill="currentColor" />
                  </span>
                  Watch Demo
                </a>
              </div>

              <div className="mt-14 w-full max-w-5xl rounded-[32px] border border-white/70 bg-white/60 p-3 shadow-[0_40px_90px_-52px_rgba(15,23,42,0.45)] backdrop-blur-sm sm:p-4">
                <img
                  src={heroImage}
                  alt="Rankrite dashboard preview"
                  className="w-full rounded-[24px] border border-slate-200/60 object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;
