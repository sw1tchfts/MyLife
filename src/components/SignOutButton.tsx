"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { btnSecondary } from "@/lib/styles";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button onClick={handleSignOut} className={btnSecondary}>
      Sign Out
    </button>
  );
}
