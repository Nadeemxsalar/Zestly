"use client";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function ProfileTab({ user }: { user: any }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="bg-white/[0.03] border border-white/10 p-6 rounded-[2rem] flex items-center gap-5">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-orange-500/20">
          {user?.user_metadata?.full_name?.charAt(0) || "C"}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{user?.user_metadata?.full_name || "Chef"}</h2>
          <p className="text-orange-400 text-sm font-bold mt-1">⭐ Level 1 Rookie</p>
        </div>
      </div>
      
      <div className="bg-white/[0.03] border border-white/10 p-6 rounded-[2rem]">
        <h3 className="text-lg font-bold text-white mb-4">🤖 AI Chef Bot</h3>
        <div className="bg-black/30 h-32 rounded-2xl p-4 mb-4 flex flex-col justify-end">
          <div className="bg-white/10 text-white text-sm p-3 rounded-2xl rounded-bl-none self-start max-w-[80%]">
            Hi! Ask me for quick cooking tips.
          </div>
        </div>
        <div className="flex gap-3">
          <input type="text" placeholder="e.g., Too much salt?" className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none" />
          <button className="bg-white/10 text-white px-5 rounded-2xl font-bold text-sm">Send</button>
        </div>
      </div>

      <button onClick={handleLogout} className="w-full bg-red-500/10 border border-red-500/20 text-red-400 font-bold py-4 rounded-2xl hover:bg-red-500/20 transition-all">Log Out</button>
    </div>
  );
}