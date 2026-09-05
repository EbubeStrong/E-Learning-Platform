"use client";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { ReactNode } from "react";
import Provider from "@/lib/provider";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// ConvexProviderWithClerk (not plain ConvexProvider) is what forwards the
// signed-in Clerk session to Convex as a verified JWT on every request.
// Without this, ctx.auth.getUserIdentity() in Convex functions is always
// null, no matter how many auth.config.ts files exist.
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <Provider>{children}</Provider>
    </ConvexProviderWithClerk>
  );
}
