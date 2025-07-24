import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware(() => {
  // No auth.protect(); — all routes are public
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
