/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as attempts from "../attempts.js";
import type * as attemptsLib from "../attemptsLib.js";
import type * as certificates from "../certificates.js";
import type * as constants from "../constants.js";
import type * as courses from "../courses.js";
import type * as lib_authz from "../lib/authz.js";
import type * as questions from "../questions.js";
import type * as quizData from "../quizData.js";
import type * as quizzes from "../quizzes.js";
import type * as ranking from "../ranking.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";
import type * as watchProgress from "../watchProgress.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  attempts: typeof attempts;
  attemptsLib: typeof attemptsLib;
  certificates: typeof certificates;
  constants: typeof constants;
  courses: typeof courses;
  "lib/authz": typeof lib_authz;
  questions: typeof questions;
  quizData: typeof quizData;
  quizzes: typeof quizzes;
  ranking: typeof ranking;
  seed: typeof seed;
  users: typeof users;
  watchProgress: typeof watchProgress;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
