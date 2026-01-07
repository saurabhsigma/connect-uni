import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                identifier: { label: "Email or Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.identifier || !credentials?.password) {
                    throw new Error("Please enter an email/username and password");
                }

                await dbConnect();

                const identifier = String(credentials.identifier).toLowerCase();

                // Find user by email or username. Username is stored lowercase in schema.
                const user = await User.findOne({
                    $or: [{ email: identifier }, { username: identifier }],
                }).select("+password");

                if (!user) {
                    throw new Error("No user found with these credentials");
                }

                const isMatch = await bcrypt.compare(credentials.password, user.password);

                if (!isMatch) {
                    throw new Error("Incorrect password");
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    role: user.role,
                    avatar: user.avatar,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
                token.avatar = user.avatar;
                token.image = user.image;
            }
            // Handle session update
            if (trigger === "update") {
                if (session?.user?.avatar !== undefined) token.avatar = session.user.avatar;
                if (session?.user?.image !== undefined) token.image = session.user.image;
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                session.user.role = token.role;
                session.user.id = token.id;
                session.user.avatar = token.avatar;
                session.user.image = token.image;
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth/signin", // Custom sign-in page
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
