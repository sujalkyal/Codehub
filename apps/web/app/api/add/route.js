// /pages/api/users/add.js
import prisma from "@repo/db/client";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { email, name } = await req.json();
  if (!email) {
    return NextResponse.json({ message: 'Email is required' },{ status: 400 });
  }
  try {
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
      },
    });
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Email already exists' }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
