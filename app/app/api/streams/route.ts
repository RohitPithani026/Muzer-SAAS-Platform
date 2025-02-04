import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import db from "../../lib/db";
// @ts-expect-error: No type definitions available for "youtube-search-api"
import youtubesearchapi from "youtube-search-api";
import { YT_REGEX } from "../../lib/utils";
import { getServerSession } from "next-auth";

const CreateStreamSchema = z.object({
    creatorId: z.string(),
    url: z.string()
});

const MAX_QUEUE_LEN = 20;

export async function POST(req: NextRequest) {
    try {
        const data = CreateStreamSchema.parse(await req.json());
        const isYt = data.url.match(YT_REGEX);
        if (!isYt) {
            return NextResponse.json(
                { message: "Wrong URL format" },
                { status: 411 }
            );
        }

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

        const extractedId = data.url.split("?v=")[1];

        const res = await youtubesearchapi.GetVideoDetails(extractedId);

        const thumbnails = res.thumbnail.thumbnails;
        thumbnails.sort((a: { width: number }, b: { width: number }) => 
            a.width < b.width ? -1 : 1
        );

        const existingActiveStream = await db.stream.count({
            where: { userId: data.creatorId }
        });

        if (existingActiveStream > MAX_QUEUE_LEN) {
            return NextResponse.json(
                { message: "Already at limit" },
                { status: 411 }
            );
        }

        const stream = await db.stream.create({
            data: {
                userId: data.creatorId,
                addedBy: user.id,
                url: data.url,
                extractedId,
                type: "Youtube",
                title: res.title ?? "Can't find video",
                smallImg: (thumbnails.length > 1 
                    ? thumbnails[thumbnails.length - 2].url 
                    : thumbnails[thumbnails.length - 1].url
                ) ?? "https://tse3.mm.bing.net/th?id=OIP.g1m0K7yumfwkc_ub224a4AHaE7&pid=Api&P=0&h=180",
                bigImg: thumbnails[thumbnails.length - 1].url 
                    ?? "https://tse3.mm.bing.net/th?id=OIP.g1m0K7yumfwkc_ub224a4AHaE7&pid=Api&P=0&h=180"
            }
        });

        return NextResponse.json({
            ...stream,
            hasUpvoted: false,
            upvotes: 0
        });
    } catch (error) {
        console.error("Error while adding a stream:", error); // ✅ Log the error
        return NextResponse.json(
            { message: "Error while adding a stream" },
            { status: 411 }
        );
    }
}

export async function GET(req: NextRequest) {
    const creatorId = req.nextUrl.searchParams.get("creatorId");
    const session = await getServerSession();
    const user = await db.user.findFirst({
        where: {
            email: session?.user?.email ?? "",
        }
    });

    if (!user) {
        return NextResponse.json(
            { message: "Unauthenticated" },
            { status: 403 }
        );
    }

    if (!creatorId) {
        return NextResponse.json(
            { message: "Error" },
            { status: 411 }
        );
    }

    const [streams, activeStreams] = await Promise.all([
        db.stream.findMany({
            where: {
                userId: creatorId,
                played: false
            },
            include: {
                _count: { select: { upvotes: true } },
                upvotes: { where: { userId: user.id } }
            },
        }),
        db.currentStream.findFirst({
            where: { userId: creatorId },
            include: { stream: true }
        })
    ]);

    return NextResponse.json({
        streams: streams.map(({ _count, upvotes, ...rest }) => ({
            ...rest,
            upvotes: _count.upvotes,
            haveUpvoted: upvotes.length > 0,
        })),
        activeStreams
    });
}
