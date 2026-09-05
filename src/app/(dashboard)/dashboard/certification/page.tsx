"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useUserDetails } from "@/lib/provider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Award } from "lucide-react";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function CertificationPage() {
  const { userDetails } = useUserDetails();
  const userId = userDetails?._id as Id<"users"> | undefined;
  const { isAuthenticated } = useConvexAuth();
  const certs = useQuery(
    api.certificates.list,
    userId && isAuthenticated ? {} : "skip"
  );

  if (certs === undefined) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className="h-52 rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Badge className="mb-3 rounded-full bg-mocha-300 text-mocha-500">
          Certification
        </Badge>
        <h1 className="text-2xl font-black tracking-tight text-mocha-500 md:text-3xl">
          Your certificates
        </h1>
        <p className="mt-1 text-sm text-mocha-400">
          Earn a certificate by scoring 75%+ on any course certification quiz.
        </p>
      </div>

      {certs.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-3xl border border-mocha-300/50 bg-mocha-100 px-6 text-center text-mocha-400">
          <Award className="h-12 w-12 text-mocha-300" />
          <p className="text-sm">
            You have not earned any certificates yet. Head to the{" "}
            <a href="/dashboard/quiz" className="font-semibold text-mocha-500 underline underline-offset-4">
              Quiz
            </a>{" "}
            tab and pass a certification quiz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certs.map((cert) => (
            <div
              key={String(cert._id)}
              className="relative overflow-hidden rounded-3xl border border-mocha-300/60 bg-gradient-to-br from-mocha-500 to-mocha-400 p-6 text-mocha-100"
            >
              <Award className="mb-4 h-10 w-10 text-yellow-300" />
              <p className="text-xs font-semibold uppercase tracking-wide text-mocha-100/70">
                Certificate of Completion
              </p>
              <h3 className="mt-1 text-lg font-bold leading-snug">
                {cert.title}
              </h3>
              <div className="mt-4 space-y-1 text-sm text-mocha-100/90">
                <p>
                  Issued:{" "}
                  {new Date(cert.issuedAt).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p>Score: {cert.score}%</p>
                <p className="font-mono text-xs opacity-80">
                  ID: {cert.certId}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
