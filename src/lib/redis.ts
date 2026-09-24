import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

/* Keys:
   waitlist               set   every email on the list
   waitlist:timestamps    hash  email → when they joined
   waitlist:locale        hash  email → language they signed up in
   waitlist:specs_sent    hash  email → when the specs email went out */

/* "added" for a new signup, "exists" if already listed.
   Throws when Redis is unreachable, so callers never report a failure as
   "already on the list". */
export async function addToWaitlist(email: string, locale: string): Promise<"added" | "exists"> {
  const added = await redis.sadd("waitlist", email);
  if (added === 0) return "exists";

  await Promise.all([
    redis.hset("waitlist:timestamps", { [email]: new Date().toISOString() }),
    redis.hset("waitlist:locale", { [email]: locale }),
  ]);
  return "added";
}

export async function markSpecsSent(email: string) {
  await redis.hset("waitlist:specs_sent", { [email]: new Date().toISOString() });
}

export async function getWaitlistCount(): Promise<number> {
  try {
    const count = await redis.scard("waitlist");
    return count as number;
  } catch (error) {
    console.error("Error getting waitlist count:", error);
    return 0;
  }
}
