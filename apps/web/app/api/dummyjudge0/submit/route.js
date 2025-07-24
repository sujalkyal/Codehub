// apps/web/app/api/dummy-judge0/submissions/route.js
//
// This route acts as a fake Judge0 server for local development.
// It accepts a submission, waits for a moment, and then sends a
// hardcoded "Accepted" status to the provided callback URL.

import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req) {
  try {
    const body = await req.json();
    const { callback_url, expected_output } = body;

    if (!callback_url) {
      console.error("Dummy Judge0 Error: No callback_url provided.");
      return NextResponse.json({ error: "callback_url is required" }, { status: 400 });
    }

    // This is the fake "Accepted" payload that mimics the real Judge0 output.
    const fakeAcceptedResult = {
      stdout: expected_output, // We'll pretend the code's output was correct.
      stderr: null,
      compile_output: null,
      message: null,
      time: "0.001",
      memory: 2048,
      status: {
        id: 3,
        description: "Accepted",
      },
      token: `fake-token-${Date.now()}`
    };

    // Simulate a random processing delay (e.g., between 500ms and 2000ms)
    const delay = Math.random() * 1500 + 500;
    
    console.log(`Dummy Judge0: Received submission. Will send 'Accepted' to ${callback_url} in ${delay.toFixed(0)}ms.`);

    // Use setTimeout to send the callback after the delay.
    // We don't `await` this, so the function can return immediately.
    setTimeout(() => {
      axios.post(callback_url, fakeAcceptedResult)
        .then(() => console.log(`Dummy Judge0: Successfully sent callback to ${callback_url}`))
        .catch(err => console.error(`Dummy Judge0: Failed to send callback to ${callback_url}`, err.message));
    }, delay);

    // Immediately return a fake token, just like the real Judge0 does.
    return NextResponse.json({ token: `fake-token-${Date.now()}` }, { status: 201 });

  } catch (error) {
    console.error('Dummy Judge0 Error:', error);
    return NextResponse.json({ error: 'An internal server error occurred in Dummy Judge0.' }, { status: 500 });
  }
}
