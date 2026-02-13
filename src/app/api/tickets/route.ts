import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Ticket from "@/models/Ticket";
import Event from "@/models/Event";
import QRCode from 'qrcode';
import { randomBytes } from 'crypto';

// Generate unique ticket code
function generateTicketCode() {
    return `TKT-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

// GET - Get user's tickets or event tickets (for organizers)
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get('eventId');

        if (eventId) {
            // Check if user is organizer
            const event = await Event.findById(eventId);
            if (!event) {
                return NextResponse.json({ message: "Event not found" }, { status: 404 });
            }

            if (event.organizerId.toString() !== session.user.id) {
                return NextResponse.json({ message: "Forbidden" }, { status: 403 });
            }

            // Return all tickets for this event
            const tickets = await Ticket.find({ eventId })
                .populate('userId', 'name email image')
                .sort({ purchasedAt: -1 });
            
            return NextResponse.json(tickets);
        }

        // Return user's tickets
        const tickets = await Ticket.find({ userId: session.user.id })
            .populate('eventId', 'title date time location image eventType')
            .sort({ purchasedAt: -1 });

        return NextResponse.json(tickets);
    } catch (error) {
        console.error("Tickets GET error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

// POST - Generate ticket for event registration
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { eventId, attendeeInfo } = await req.json();

        if (!eventId) {
            return NextResponse.json({ message: "Event ID required" }, { status: 400 });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return NextResponse.json({ message: "Event not found" }, { status: 404 });
        }

        // Check if ticket already exists
        const existingTicket = await Ticket.findOne({ eventId, userId: session.user.id });
        if (existingTicket) {
            return NextResponse.json({ message: "Ticket already exists", ticket: existingTicket }, { status: 200 });
        }

        // Check capacity
        if (event.maxAttendees && event.registeredCount >= event.maxAttendees) {
            return NextResponse.json({ message: "Event is full" }, { status: 400 });
        }

        // Generate ticket code and QR
        const ticketCode = generateTicketCode();
        const qrCodeData = JSON.stringify({
            ticketCode,
            eventId,
            userId: session.user.id,
            timestamp: Date.now(),
        });
        
        const qrCode = await QRCode.toDataURL(qrCodeData, {
            errorCorrectionLevel: 'H',
            width: 300,
            margin: 2,
        });

        // Create ticket
        const ticket = await Ticket.create({
            eventId,
            userId: session.user.id,
            ticketCode,
            qrCode,
            paymentAmount: event.ticketPrice || 0,
            paymentStatus: event.eventType === 'free' ? 'completed' : 'pending',
            attendeeInfo: attendeeInfo || {
                name: session.user.name,
                email: session.user.email,
            },
        });

        // Update event
        await Event.findByIdAndUpdate(eventId, {
            $addToSet: { attendees: session.user.id },
            $inc: { registeredCount: 1 },
        });

        const populatedTicket = await Ticket.findById(ticket._id).populate('eventId', 'title date time location image');

        return NextResponse.json(populatedTicket, { status: 201 });
    } catch (error) {
        console.error("Ticket POST error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
