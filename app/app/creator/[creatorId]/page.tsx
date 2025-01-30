import StreamView from "@/app/components/StreamView";

export default async function ({
    params,
}: {
    params: {
        creatorId: string;
    };
}) {
    const { creatorId } = await params; // Await the params here

    return (
        <div>
            <StreamView creatorId={creatorId} playVideo={false} />
        </div>
    );
}