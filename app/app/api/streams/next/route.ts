import { prismaClient } from "@/app/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { use } from "react";

export async function GET() {
    const session = await getServerSession();
    // Todo: You can get rid of the db call here
    const user = await prismaClient.user.findFirst({
        where: {
            email: session?.user?.email ?? "",
        }
    });

    if (!user) {
        return NextResponse.json({
            message: "Unauthenticated"
        }, {
            status: 403
        });
    }

    const mostUpvotedStream = await prismaClient.stream.findFirst({
        where: {
            userId: user.id
        },
        orderBy: {
            upvotes: {
                _count: 'desc'
            }
        }
    });

    await Promise.all([prismaClient.currentStream.upsert({
        where: {
            userId: user.id
        },
        update: {
            streamId: mostUpvotedStream?.id
        },
        create: {
            userId: user.id,
            streamId: mostUpvotedStream?.id
        }
    }),
    prismaClient.stream.delete({
        where: {
            id: mostUpvotedStream?.id ?? ""
        },
    })])

    return NextResponse.json({
        stream: mostUpvotedStream
    })
}