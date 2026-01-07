import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        const { name, email, password, username } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { message: "User already exists" },
                { status: 400 }
            );
        }

        // Check if username already exists if provided
        if (username) {
            const existingUsername = await User.findOne({ username });
            if (existingUsername) {
                return NextResponse.json(
                    { message: "Username already taken" },
                    { status: 400 }
                );
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Prepare username: use provided username or generate one
        let finalUsername: string | undefined = undefined;

        const sanitize = (s: string) =>
            s
                .toLowerCase()
                .replace(/[^a-z0-9\.\-_]/g, '')
                .replace(/\.+/g, '.')
                .slice(0, 30);

        if (username) {
            finalUsername = sanitize(String(username));
        } else {
            // derive from name or email local part
            const namePart = name.split(' ')[0] || '';
            const emailLocal = email.split('@')[0] || '';
            let base = sanitize(namePart) || sanitize(emailLocal) || 'user';

            // ensure uniqueness by appending numbers if needed
            let candidate = base;
            let suffix = 0;
            // eslint-disable-next-line no-constant-condition
            while (true) {
                // check existence
                // Note: username is stored lowercase in schema
                // use findOne to check collisions
                // If sparse unique constraint allows nulls, but we set a value.
                // eslint-disable-next-line no-await-in-loop
                const exists = await User.findOne({ username: candidate });
                if (!exists) {
                    finalUsername = candidate;
                    break;
                }
                suffix += 1;
                candidate = `${base}${suffix}`;
                if (suffix > 1000) {
                    // fallback
                    finalUsername = `${base}${Date.now().toString().slice(-4)}`;
                    break;
                }
            }
        }

        // Create user
        const user = await User.create({
            name,
            username: finalUsername,
            email,
            password: hashedPassword,
        });

        return NextResponse.json(
            { message: "User created successfully", userId: user._id, username: user.username },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
