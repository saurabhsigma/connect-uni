import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Ticket from "@/models/Ticket";
import Event from "@/models/Event";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { ticketCode } = await req.json();

        if (!ticketCode) {
            return NextResponse.json({ message: "Ticket code required" }, { status: 400 });
        }

        // Find ticket
        const ticket = await Ticket.findOne({ ticketCode }).populate('eventId userId');
        if (!ticket) {
            return NextResponse.json({ message: "Invalid ticket code" }, { status: 404 });
        }

        // Check if user is event organizer
        const event = await Event.findById(ticket.eventId);
        if (!event || event.organizerId.toString() !== session.user.id) {
            return NextResponse.json({ message: "Only event organizer can scan tickets" }, { status: 403 });
        }

        // Check if already used
        if (ticket.status === 'used') {
            return NextResponse.json({
                message: "Ticket already used",
                ticket: {
                    ...ticket.toObject(),
                    alreadyScanned: true,
                },
            }, { status: 400 });
        }

        // Check if cancelled
        if (ticket.status === 'cancelled') {
            return NextResponse.json({ message: "Ticket has been cancelled" }, { status: 400 });
        }

        // Check payment status for paid events
        if (event.eventType === 'paid' && ticket.paymentStatus !== 'completed') {
            return NextResponse.json({ message: "Payment not completed" }, { status: 400 });
        }

        // Mark ticket as used
        ticket.status = 'used';
        ticket.scannedAt = new Date();
        ticket.scannedBy = session.user.id;
        await ticket.save();

        const populatedTicket = await Ticket.findById(ticket._id)
            .populate('userId', 'name email image')
            .populate('eventId', 'title date time location');

        return NextResponse.json({
            message: "Ticket scanned successfully",
            ticket: populatedTicket,
        });
    } catch (error) {
        console.error("Ticket scan error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
