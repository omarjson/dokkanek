"use client";

export function LogoutButton() {
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth", { method: "DELETE" });
        window.location.href = "/login";
      }}
      className="bg-white/20 rounded-lg px-3 py-1 text-sm hover:bg-white/30"
    >
      خروج
    </button>
  );
}
