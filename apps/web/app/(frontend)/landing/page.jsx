"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B192C] flex flex-col">
      {/* Hero Section */}
      <section className="flex flex-1 flex-col md:flex-row items-center justify-center px-8 py-16 gap-12">
        <div className="max-w-xl">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            Welcome to <span className="text-[#FF6500]">CODEHUB</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8">
            The ultimate platform for coding enthusiasts to solve, contribute, and discuss algorithmic problems. Sharpen your skills, challenge yourself, and join a vibrant community of problem setters and solvers.
          </p>
          <div className="flex gap-4">
            <Link href="/(frontend)/problems" className="bg-[#FF6500] text-[#0B192C] px-6 py-3 rounded font-bold text-lg hover:bg-[#ff7f32] transition">
              Solve Problems
            </Link>
            <Link href="/(frontend)/contribute" className="border-2 border-[#FF6500] text-[#FF6500] px-6 py-3 rounded font-bold text-lg hover:bg-[#FF6500] hover:text-[#0B192C] transition">
              Contribute Problem
            </Link>
          </div>
        </div>
        <div className="hidden md:block">
          <img
            src="/public/globe.svg"
            alt="Codehub Globe"
            className="w-80 h-80 object-contain drop-shadow-2xl"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-[#1E3E62] py-12 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="bg-[#0B192C] rounded-xl p-6 shadow text-center">
            <h3 className="text-xl font-bold text-[#FF6500] mb-2">Solve</h3>
            <p className="text-gray-200">Tackle a wide range of algorithmic and data structure problems, from easy to hard, and track your progress.</p>
          </div>
          <div className="bg-[#0B192C] rounded-xl p-6 shadow text-center">
            <h3 className="text-xl font-bold text-[#FF6500] mb-2">Contribute</h3>
            <p className="text-gray-200">Share your own problems with the community, help others learn, and get recognized for your contributions.</p>
          </div>
          <div className="bg-[#0B192C] rounded-xl p-6 shadow text-center">
            <h3 className="text-xl font-bold text-[#FF6500] mb-2">Discuss</h3>
            <p className="text-gray-200">Engage in discussions, share solutions, and learn new techniques from fellow coders worldwide.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-gray-400 text-center py-4 mt-auto">
        © {new Date().getFullYear()} CODEHUB. All rights reserved.
      </footer>
    </div>
  );
}