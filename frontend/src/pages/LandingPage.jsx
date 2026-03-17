import React, { useEffect } from "react";
import { ArrowRight, Play } from "lucide-react";

import Header from "../layouts/Header";
import Footer from "../layouts/Footer";
import heroImage from "../assets/images/hero-img-1.png";
import feature1Image from "../assets/images/feature-1-img.png";
import eventBuilderIcon from "../assets/svg/hero-footer/event-builder-icon.png";
import judgeGeneratorIcon from "../assets/svg/hero-footer/judge-generator-icon.png";
import liveDisplayIcon from "../assets/svg/hero-footer/live-display-icon.png";
import contestantJudgeManagementIcon from "../assets/svg/hero-footer/contestant-judge-management-icon.png";
import pencilCircleIcon from "../assets/svg/feature-1/pencil-circle-icon.png";
import checkCircleIcon from "../assets/svg/feature-1/check-cirlce-icon.png";
import orangeArrowIcon from "../assets/svg/feature-1/orange-arrow-icon.png";
import feature2Image from "../assets/images/feature-2-img.png";
import configureIcon from "../assets/svg/feature-2/configure-icon.png";
import starCircleIcon from "../assets/svg/feature-2/star-circle-icon.png";
import feature3Image from "../assets/images/live-display-img.png";
import lightningIcon from "../assets/svg/feature-3/lightning-icon.png";
import feature3ArrowIcon from "../assets/svg/feature-3/arrow-icon.png";
import feature4JudgesImage from "../assets/images/feature-4.1-img.png";
import feature4ContestantsImage from "../assets/images/feature-4.2-img.png";
import manageIcon from "../assets/svg/feature-4/manage-icon.png";
import keyCircleIcon from "../assets/svg/feature-4/key-circle-icon.png";
import documentCircleIcon from "../assets/svg/feature-4/document-circle-icon.png";
import pricingCheckIcon from "../assets/svg/pricing/check-icon-price.png";

const heroFooterItems = [
  { label: "Event Builder", icon: eventBuilderIcon },
  { label: "Judge Link Generator", icon: judgeGeneratorIcon },
  { label: "Live Results Display", icon: liveDisplayIcon },
  {
    label: "Contestant & Judge Management",
    icon: contestantJudgeManagementIcon,
  },
];

const firstFeatureHighlights = [
  "Comprehensive Event Draft Creation",
  "Judge Assignment and Management",
  "Contestant Registration and Management",
];

const secondFeatureHighlights = [
  "Role-based judge score tables",
  "QR and link access for each judge",
  "Real-time scoring monitor view",
];

const thirdFeatureStats = [
  { value: "0", label: "Ongoing Events" },
  { value: "12", label: "Completed Events" },
];

const fourthFeatureHighlights = [
  {
    title: "Bulk Import",
    description: "Upload CSV/Excel for instant onboarding",
    icon: documentCircleIcon,
    bgClassName: "bg-[#fff4e9]",
  },
  {
    title: "Role-Based Judging",
    description: "Set judge roles and access to score tables",
    icon: keyCircleIcon,
    bgClassName: "bg-[#e9efff]",
  },
];

const starterPlanFeatures = [
  "1 Active Event",
  "Up to 50 Contestants",
  "Maximum of 3 Judges",
];

const professionalPlanFeatures = [
  "Unlimited Events",
  "Unlimited Contestants",
  "Unlimited Judges",
];

function LandingPage() {
  useEffect(() => {
    const revealElements = Array.from(
      document.querySelectorAll(".reveal-on-scroll"),
    );

    if (!revealElements.length) {
      return undefined;
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    revealElements.forEach((element) => revealObserver.observe(element));

    return () => {
      revealObserver.disconnect();
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section
          id="hero"
          className="app-page pb-14 pt-8 md:pb-18 md:pt-12 reveal-on-scroll"
        >
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

        <section
          id="hero-footer"
          className="border-y border-base-300/80 bg-[#FFFFFF] reveal-on-scroll"
        >
          <div className="app-page py-4 md:py-5">
            <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4 md:gap-x-8">
              {heroFooterItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-center gap-2.5"
                >
                  <img
                    src={item.icon}
                    alt={`${item.label} icon`}
                    className="h-4 w-4 object-contain grayscale opacity-55"
                  />
                  <span className="text-sm font-medium text-slate-400">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="feature-1st"
          className="app-page app-page-wide py-16 md:py-20 mt-20 mb-50 reveal-on-scroll"
        >
          <div className="mx-auto grid w-full max-w-[1280px] items-center gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,560px)] lg:gap-20">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 rounded-lg border border-[#ffe2cf] bg-[#fff4ea] px-4 py-2 text-sm font-medium text-[#ed8739]">
                <img
                  src={pencilCircleIcon}
                  alt=""
                  aria-hidden="true"
                  className="h-4 w-4 object-contain"
                />
                Guided Event Setup
              </div>

              <h2 className="mt-7 text-4xl font-bold tracking-tight text-[#474c56] sm:text-[3.05rem]">
                Modular Event Builder
              </h2>

              <p className="mt-7 max-w-[640px] text-[16px] leading-10 text-slate-400 sm:text-[1.3rem]">
                Create events through a guided workflow from event draft to
                judge and contestant setup. Manage event details, scoring, and
                display controls in one organized process.
              </p>

              <ul className="mt-10 space-y-5">
                {firstFeatureHighlights.map((item) => (
                  <li key={item} className="flex items-center gap-4">
                    <img
                      src={checkCircleIcon}
                      alt=""
                      aria-hidden="true"
                      className="h-8 w-8 shrink-0 object-contain"
                    />
                    <span className="text-[1rem] text-slate-400">{item}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#"
                className="mt-10 inline-flex items-center gap-3 text-[1rem] font-medium text-[#f07e2a] transition hover:text-[#e36b1e]"
              >
                Learn more about building events
                <img
                  src={orangeArrowIcon}
                  alt=""
                  aria-hidden="true"
                  className="h-5 w-5 object-contain"
                />
              </a>
            </div>

            <div className="order-1 hidden lg:order-2 lg:block">
              <div className="mx-auto w-full max-w-[560px] rounded-[42px] border border-[#d6d8dc] bg-[#f8f9fa] p-3 shadow-[0_28px_60px_-42px_rgba(33,39,55,0.6)] sm:p-4">
                <img
                  src={feature1Image}
                  alt="Dynamic Template Form preview"
                  className="w-full rounded-[22px] border border-[#dfd7cc] object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section
          id="feature-2nd"
          className="app-page app-page-wide pb-16 pt-4 md:pb-20 md:pt-6 my-50 reveal-on-scroll"
        >
          <div className="mx-auto grid w-full max-w-[1240px] items-center gap-10 lg:grid-cols-[minmax(0,560px)_minmax(0,1.08fr)] lg:gap-20">
            <div className="hidden lg:block">
              <div className="mx-auto w-full max-w-[560px] rounded-[42px] border border-[#d6d8dc] bg-[#f8f9fa] p-3 shadow-[0_28px_60px_-42px_rgba(33,39,55,0.6)] sm:p-4">
                <img
                  src={feature2Image}
                  alt="Score Table QR and Link Generator preview"
                  className="w-full rounded-[22px] border border-[#dfd7cc] object-cover"
                />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-[#dbe8ff] bg-[#eef4ff] px-4 py-2 text-sm font-medium text-[#7ca8ff]">
                <img
                  src={configureIcon}
                  alt=""
                  aria-hidden="true"
                  className="h-4 w-4 object-contain"
                />
                Exclusive Judge Access
              </div>

              <h2 className="mt-7 text-4xl font-bold tracking-tight text-[#474c56] sm:text-[3.05rem]">
                Score Table
                <span className="block">QR &amp; Link Generator</span>
              </h2>

              <p className="mt-7 max-w-[640px] text-[16px] leading-10 text-slate-400 sm:text-[1.3rem]">
                Provide each judge with a dedicated scoring page based on their
                assigned role. Generate direct links or QR codes for score table
                access and monitor scoring activity in real time from a separate
                page.
              </p>

              <ul className="mt-10 space-y-5">
                {secondFeatureHighlights.map((item) => (
                  <li key={item} className="flex items-center gap-4">
                    <img
                      src={starCircleIcon}
                      alt=""
                      aria-hidden="true"
                      className="h-8 w-8 shrink-0 object-contain"
                    />
                    <span className="text-[1rem] text-slate-400">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section
          id="feature-3rd"
          className="app-page app-page-wide pb-16 pt-4 md:pb-20 md:pt-6 my-50 reveal-on-scroll"
        >
          <div className="mx-auto grid w-full max-w-[1280px] items-center gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,560px)] lg:gap-20">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 rounded-lg border border-[#eadbff] bg-[#f4ecff] px-4 py-2 text-sm font-medium text-[#a07ef4]">
                <img
                  src={lightningIcon}
                  alt=""
                  aria-hidden="true"
                  className="h-4 w-4 object-contain"
                />
                Live Ranking Monitor
              </div>

              <h2 className="mt-7 text-4xl font-bold tracking-tight text-[#474c56] sm:text-[3.05rem]">
                Real-Time
                <span className="block">Leaderboard View</span>
              </h2>

              <p className="mt-7 max-w-[640px] text-[16px] leading-10 text-slate-400 sm:text-[1.3rem]">
                Track event rankings and score progress as results are updated.
                Monitor ongoing and completed events through a live ranking
                display built for fast and clear viewing.
              </p>

              <div className="mt-10 grid max-w-[640px] grid-cols-1 gap-4 sm:grid-cols-2">
                {thirdFeatureStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-sm bg-[#FFFFFF] px-6 py-5"
                  >
                    <p className="text-4xl font-semibold text-slate-500">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-[1rem] text-slate-400">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              <a
                href="#"
                className="mt-10 inline-flex items-center gap-3 text-[1rem] font-medium text-[#f07e2a] transition hover:text-[#e36b1e]"
              >
                View Live Ranking
                <img
                  src={feature3ArrowIcon}
                  alt=""
                  aria-hidden="true"
                  className="h-5 w-5 object-contain"
                />
              </a>
            </div>

            <div className="order-1 hidden lg:order-2 lg:block">
              <div className="mx-auto w-full max-w-[560px] rounded-[42px] border border-[#d6d8dc] bg-[#f8f9fa] p-3 shadow-[0_28px_60px_-42px_rgba(33,39,55,0.6)] sm:p-4">
                <img
                  src={feature3Image}
                  alt="Live leaderboard preview"
                  className="w-full rounded-[22px] border border-[#d9dce2] object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section
          id="feature-4th"
          className="app-page app-page-wide pb-16 pt-4 md:pb-20 md:pt-6 my-50 reveal-on-scroll"
        >
          <div className="mx-auto grid w-full max-w-[1280px] items-center gap-10 lg:grid-cols-[minmax(0,560px)_minmax(0,1.08fr)] lg:gap-20">
            <div className="hidden lg:block">
              <div className="mx-auto w-full max-w-[560px]">
                <div className="relative md:pb-24">
                  <div className="relative z-10 w-full rounded-[42px] border border-[#d6d8dc] bg-[#f8f9fa] p-3 shadow-[0_28px_60px_-42px_rgba(33,39,55,0.6)] sm:p-4">
                    <img
                      src={feature4JudgesImage}
                      alt="Manage judges preview"
                      className="w-full rounded-[22px] border border-[#dfd7cc] object-cover"
                    />
                  </div>

                  <div className="relative z-20 mt-4 w-full rounded-[38px] border border-[#d6d8dc] bg-[#f8f9fa] p-2.5 shadow-[0_24px_55px_-44px_rgba(33,39,55,0.65)] sm:p-3 md:absolute md:-bottom-16 md:left-[28%] md:mt-0 md:w-[72%]">
                    <img
                      src={feature4ContestantsImage}
                      alt="Manage contestants preview"
                      className="w-full rounded-[18px] border border-[#dfd7cc] object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-[#d9f1de] bg-[#ecf9ef] px-4 py-2 text-sm font-medium text-[#66b981]">
                <img
                  src={manageIcon}
                  alt=""
                  aria-hidden="true"
                  className="h-4 w-4 object-contain"
                />
                User Management
              </div>

              <h2 className="mt-7 text-4xl font-bold tracking-tight text-[#474c56] sm:text-[3.05rem]">
                Manage Judges
                <span className="block">&amp; Contestants</span>
              </h2>

              <p className="mt-7 max-w-[640px] text-[16px] leading-10 text-slate-400 sm:text-[1.3rem]">
                Organize judges and user access in one place. Add judges, assign
                roles, and manage permissions for smooth event operations.
              </p>

              <div className="mt-10 space-y-4">
                {fourthFeatureHighlights.map((item, index) => (
                  <article
                    key={item.title}
                    className="reveal-on-scroll flex items-center gap-4 rounded-sm bg-[#FFFFFF] px-4 py-4 sm:px-5"
                    style={{ transitionDelay: `${100 + index * 90}ms` }}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${item.bgClassName}`}
                    >
                      <img
                        src={item.icon}
                        alt=""
                        aria-hidden="true"
                        className="h-6 w-6 object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="text-[1.15rem] font-semibold leading-tight text-slate-500">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-[0.95rem] text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-16 md:py-22 my-50 reveal-on-scroll">
          <div className="app-page app-page-wide py-0">
            <div className="mx-auto w-full max-w-[1280px]">
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.1em] text-[#63d28a]">
                  Flexible Pricing
                </p>
                <h2 className="mt-5 text-4xl font-bold tracking-tight text-[#444b62] sm:text-[3.1rem]">
                  Plan For Every Event Size
                </h2>
              </div>

              <div className="mx-auto mt-12 grid w-full max-w-[920px] grid-cols-1 gap-5 lg:grid-cols-2">
                <article className="relative flex min-h-[460px] flex-col rounded-sm bg-[#FFFFFF] px-8 py-10 shadow-[0_18px_40px_-28px_rgba(5,10,20,0.85)] sm:px-10">
                  <h3 className="text-[2rem] font-medium text-slate-500">
                    Starter
                  </h3>
                  <p className="mb-5 text-[1.3rem] text-slate-300">
                    For small school events
                  </p>

                  <p className="mt-6 flex items-end gap-2">
                    <span className="text-4xl font-bold leading-none text-[#3c4458]">
                      Free
                    </span>
                    <span className="text-[1.45rem] text-slate-300">
                      | forever
                    </span>
                  </p>

                  <ul className="mt-9 space-y-4">
                    {starterPlanFeatures.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <img
                          src={pricingCheckIcon}
                          alt=""
                          aria-hidden="true"
                          className="h-[15px] w-[15px] object-contain"
                        />
                        <span className="text-[1.5rem] text-slate-400">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className="mt-auto h-14 rounded-2xl border border-slate-200 bg-[#eceef1] text-[1.95rem] font-medium text-slate-500 transition hover:bg-[#e5e7eb]"
                  >
                    Get Started
                  </button>
                </article>

                <article className="relative flex min-h-[460px] flex-col rounded-sm border-2 border-[#29bd61] bg-[#FFFFFF] px-8 py-10 shadow-[0_0_0_1px_rgba(41,189,97,0.2),0_24px_50px_-28px_rgba(41,189,97,0.55)] sm:px-10">
                  <div className="absolute right-0 top-0 rounded-bl-xl bg-[#29bd61] px-5 py-2 text-[1.1rem] font-semibold uppercase tracking-[0.06em] text-white">
                    Popular
                  </div>

                  <h3 className="text-[2rem] font-semibold text-slate-500">
                    Professional
                  </h3>
                  <p className="mb-5 text-[1.3rem] text-slate-300">
                    For growing institutions
                  </p>

                  <p className="mt-6 flex items-end gap-2">
                    <span className="text-4xl font-bold leading-none text-[#3c4458]">
                      ₱69
                    </span>
                    <span className="text-[1.45rem] text-slate-300">
                      / month
                    </span>
                  </p>

                  <ul className="mt-9 space-y-4">
                    {professionalPlanFeatures.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <img
                          src={pricingCheckIcon}
                          alt=""
                          aria-hidden="true"
                          className="h-[15px] w-[15px] object-contain"
                        />
                        <span className="text-[1.5rem] text-slate-400">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className="mt-30 h-14 rounded-xl bg-[#1ea84a] text-[1.95rem] font-semibold text-white shadow-[0_16px_28px_-22px_rgba(30,168,74,0.85)] transition hover:bg-[#1b9843]"
                  >
                    Start Free Trial
                  </button>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section
          id="signup-login"
          className="app-page app-page-wide pb-20 pt-8 md:pb-24 md:pt-10 my-50"
        >
          <div className="mx-auto w-full max-w-[1280px]">
            <div className="rounded-[34px] bg-[linear-gradient(135deg,#10223f_0%,#0d1a30_55%,#0b1629_100%)] px-6 py-14 text-center shadow-[0_28px_60px_-38px_rgba(9,20,42,0.9)] sm:px-10 md:py-18">
              <h2 className="text-[2rem] font-bold tracking-tight text-[#c9d0db] sm:text-[3.15rem]">
                Ready to streamline your next event?
              </h2>

              <p className="mx-auto mt-5 max-w-4xl text-[1.15rem] leading-8 text-[#7f8999] sm:text-[1.55rem]">
                Get started with Rankrite today and experience the future of
                event management and scoring.
              </p>

              <div className="mx-auto mt-10 flex w-full max-w-[540px] flex-col gap-4 sm:flex-row">
                <button
                  type="button"
                  className="h-14 flex-1 rounded-xl bg-[#25c360] px-6 text-[1.3rem] font-semibold text-white shadow-[0_16px_30px_-22px_rgba(37,195,96,0.95)] transition hover:bg-[#1fb356]"
                >
                  Get Started Now!
                </button>
                <button
                  type="button"
                  className="h-14 flex-1 rounded-xl border border-[#24334d] bg-[#111d32]/40 px-6 text-[1.3rem] font-semibold text-[#b2b9c3] transition hover:border-[#31415f] hover:text-white"
                >
                  Log In
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <div className="reveal-on-scroll">
        <Footer />
      </div>
    </div>
  );
}

export default LandingPage;
