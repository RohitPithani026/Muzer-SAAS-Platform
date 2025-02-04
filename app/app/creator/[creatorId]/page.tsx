import StreamView from "@/app/components/StreamView";

interface CreatorProps {
    params: Promise<{ creatorId: string }>
}
export default async function Creator({ params }: CreatorProps) {
    const { creatorId } = await params;
    return (
        <div>
            <StreamView creatorId={creatorId} playVideo={false} />
        </div>
    );
}