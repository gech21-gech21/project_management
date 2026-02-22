import React from "react";
import Link from "next/link";

function Header() {
  return (
    <div className="p-0 font-bold">
      <div className="flex items-center justify-end">
        <Link
          href="/auth"
          className="text-blue-600 hover:text-blue-800 transition-colors"
        >
          Login
        </Link>
      </div>
    </div>
  );
}

export default Header;
