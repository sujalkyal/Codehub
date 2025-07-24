import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-[#1E3E62] shadow">
      <Link href="/landing" className="text-3xl font-extrabold text-[#FF6500] tracking-tight">CODEHUB</Link>
      <div className="flex items-center space-x-4">
        <Link href="/contribute" className="text-white hover:text-[#FF6500] font-medium transition">Contribute</Link>
        <Link href="/problems" className="text-white hover:text-[#FF6500] font-medium transition">Problems</Link>
        <SignedIn>
          <UserButton afterSignOutUrl="/landing" />
        </SignedIn>
        <SignedOut>
          <Link href="/sign-in" className="bg-[#FF6500] text-[#0B192C] px-4 py-2 rounded font-bold hover:bg-[#ff7f32] transition">Sign In</Link>
        </SignedOut>
      </div>
    </nav>
  );
}
