"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 font-medium transition-colors w-full"
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </button>
  );
}
