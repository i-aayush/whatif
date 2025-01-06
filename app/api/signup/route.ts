import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    let body;
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      body = await request.json();
    } else if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData);
    } else {
      return NextResponse.json(
        { error: 'Unsupported content type' },
        { status: 415 }
      );
    }

    console.log('Received signup request:', body);

    const { email, password } = body;

    if (!email || !password) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Here you would typically add code to create the user in your database
    // For demonstration purposes, we'll just return a success message
    console.log('Creating user:', email);

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: { email }
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
} 