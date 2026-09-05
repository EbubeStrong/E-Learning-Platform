"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import { UserDetailContext } from "@/context/UserDetailContext";
import { UserDetails } from "@/types/user";

function Provider({ children }: Readonly<{ children: React.ReactNode }>) {
  const createUser = useMutation(api.users.createOrGetUser);
  const { user } = useUser();
  // isAuthenticated flips true once Convex has verified the Clerk JWT —
  // waiting on this (not just Clerk's isLoaded) avoids calling
  // createOrGetUser before ctx.auth.getUserIdentity() would resolve.
  const { isAuthenticated } = useConvexAuth();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  const createNewUser = useCallback(async () => {
    if (!user) return null;

    // Only display fields go to the server now — role and email are decided
    // there, from the verified session, not from anything the client sends.
    const result = await createUser({
      name: user.fullName ?? "",
      imageUrl: user.imageUrl,
    });

    return (result ?? null) as UserDetails | null;
  }, [user, createUser]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    createNewUser().then((result) => {
      if (result) setUserDetails(result);
    });
  }, [isAuthenticated, user, createNewUser]);

  return (
    <UserDetailContext.Provider value={{ userDetails, setUserDetails }}>
      {children}
    </UserDetailContext.Provider>
  );
}

export default Provider;

export const useUserDetails = () => {
  const context = useContext(UserDetailContext);
  if (!context) {
    throw new Error("useUserDetails must be used within a UserDetailContext.Provider");
  }
  return context;
};
