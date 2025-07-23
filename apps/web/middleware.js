import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
    '/', // The homepage
    '/sign-in(.*)', // The sign-in page and its sub-routes
    '/sign-up(.*)', // The sign-up page and its sub-routes
]);

export default clerkMiddleware((auth, req) => {
  // If the route is not public, then protect it.
  if (!isPublicRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};