import db from "../../../lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpvoteSchema = z.object({
    streamId: z.string(),
});

export async function POST(req: NextRequest) {
    const session = await getServerSession();

    const user = await db.user.findFirst({
        where: {
            email: session?.user?.email ?? "",
        }
    });

    if (!user) {
        return NextResponse.json(
            { message: "Unauthenticated" },
            { status: 411 }
        );
    }

    try {
        const data = UpvoteSchema.parse(await req.json());
        await db.upvote.delete({
            where: {
                userId_streamId: {
                    userId: user.id,
                    streamId: data.streamId
                }
            }
        });
        return NextResponse.json({ message: "Done!" });
    } catch (error) {
        console.error("Error while upvoting:", error); // ✅ Logs the error
        return NextResponse.json(
            { message: "Error while upvoting" },
            { status: 411 }
        );
    }
}
