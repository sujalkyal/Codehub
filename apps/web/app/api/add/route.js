// /pages/api/users/add.js
import prisma from "@repo/db/client";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { email, name } = req.body;
  if (!email) {
    return NextResponse.status(400).json({ message: 'Email is required' });
  }
  try {
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
      },
    });
    return NextResponse.status(201).json(newUser);
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.status(409).json({ message: 'Email already exists' });
    }

    console.error(error);
    return NextResponse.status(500).json({ message: 'Internal Server Error' });
  }
}
