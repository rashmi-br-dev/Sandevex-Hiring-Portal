"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    if (!password) {
      message.warning("Please enter password");
      return;
    }

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      message.success("Login successful");
      router.push("/dashboard");
    } else {
      message.error("Wrong password");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <div className="border bg-card p-6 rounded-xl w-80 space-y-4 shadow-sm">
        <h1 className="text-xl font-semibold text-center">Admin Login</h1>

        <input
          type="password"
          placeholder="Enter password"
          className="w-full border p-2 rounded-md bg-background"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-black text-white p-2 rounded-md hover:opacity-90"
        >
          Login
        </button>
      </div>
    </div>
  );
}
