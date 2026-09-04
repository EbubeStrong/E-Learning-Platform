"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import { UserDetailContext } from "@/context/UserDetailContext";
import { UserDetails } from "@/types/user";

function Provider({ children }: Readonly<{ children: React.ReactNode }>) {
  const createUser = useMutation(api.users.createOrGetUser);
  const { user, isLoaded } = useUser();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  const createNewUser = useCallback(async () => {
    if (!user) return null;

    const result = await createUser({
      clerkUserId: user.id,
      email: user.primaryEmailAddress?.emailAddress ?? "",
      imageUrl: user.imageUrl,
      name: user.fullName ?? "",
      role:
        user.publicMetadata?.role === "admin" ||
        user.emailAddresses?.some((e) =>
          e.emailAddress.endsWith("samsparko121@gmail.com")
        )
          ? "admin"
          : "student",
    });

    return (result ?? null) as UserDetails | null;
  }, [user, createUser]);

  useEffect(() => {
    if (!isLoaded || !user) return;

    createNewUser().then((result) => {
      if (result) setUserDetails(result);
    });
  }, [isLoaded, user, createNewUser, setUserDetails]);

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
