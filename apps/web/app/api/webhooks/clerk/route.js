// app/api/webhooks/clerk/route.js
import { Webhook } from 'svix';
// We no longer need to import 'headers' from 'next/headers'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Get the headers directly from the 'req' object
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', { status: 400 });
  }

  const eventType = evt.type;

  // --- Start of Database Operations ---
  try {
    if (eventType === 'user.created') {
      const { id, email_addresses, username } = evt.data;
      await prisma.user.create({
        data: {
          id: id,
          email: email_addresses[0].email_address,
          username: username,
        },
      });
    }

    if (eventType === 'user.updated') {
      const { id, username } = evt.data;
      await prisma.user.update({
        where: { id: id },
        data: { username: username },
      });
    }

    if (eventType === 'user.deleted') {
      const { id } = evt.data;
      const existingUser = await prisma.user.findUnique({
        where: { id: id },
      });

      if (existingUser) {
        await prisma.user.delete({
          where: { id: id },
        });
      }
    }

    return new Response('', { status: 200 });

  } catch (err) {
    console.error('Error processing webhook:', err);
    return new Response('Error occured', {
      status: 500,
    });
  }
}
