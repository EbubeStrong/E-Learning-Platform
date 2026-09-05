// convex/auth.config.ts
//
// Wires Convex up to trust Clerk-issued session JWTs, so every query and
// mutation can call ctx.auth.getUserIdentity() to find out who is *actually*
// signed in — instead of trusting a userId the client happens to send.
//
// Requires:
//   1. In your Clerk dashboard: Configure > JWT Templates > New template,
//      name it exactly "convex" (the applicationID below must match).
//   2. Set CLERK_JWT_ISSUER_DOMAIN in your Convex deployment's environment:
//        npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-instance.clerk.accounts.dev
//      (find the exact value in Clerk dashboard > API Keys > Advanced, or in
//      the JWT template's "Issuer" field.)

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
