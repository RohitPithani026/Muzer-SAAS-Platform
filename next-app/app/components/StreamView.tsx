"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ThumbsUp, ThumbsDown, Play, Share2 } from "lucide-react"
import { motion } from "framer-motion"
import { toast, ToastContainer } from "react-toastify"
import { Appbar } from "./Appbar"
import YouTubePlayer from "youtube-player";
import Image from "next/image";
interface Video {
    id: string;
    type: string;
    url: string;
    extractedId: string;
    title: string;
    smallImg: string;
    bigImg: string;
    active: boolean;
    userId: string;
    upvotes: number;
    haveUpvoted: boolean;
}

const REFRESH_INTERVAL_MS = 10 * 1000;

export default function StreamView({
    creatorId,
    playVideo = false
}: {
    creatorId: string;
    playVideo: boolean;
}) {
    const [videoUrl, setVideoUrl] = useState("")
    const [queue, setQueue] = useState<Video[]>([]);
    const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
    const [previewId, setPreviewId] = useState("");
    const [loading, setLoading] = useState(false);
    const [playNextLoader, setPlayNextLoader] = useState(false);
    const videoPlayerRef = useRef<HTMLDivElement>(null);

    async function refreshStreams() {
        const res = await fetch(`/api/streams/?creatorId=${creatorId}`, {
            credentials: "include"
        });
        const json = await res.json();

        const sortedQueue = json.streams.sort((a: Video, b: Video) => b.upvotes - a.upvotes);
        setQueue(sortedQueue);

        setCurrentVideo(video => {
            if (!video && sortedQueue.length > 0) {
                return sortedQueue[0];
            }
            if (!json.activeStream?.stream && video) {
                return video;
            }
            if (video && sortedQueue.some((v: Video) => v.id === video.id)) {
                return video;
            }
            return json.activeStream?.stream || video;
        });
    }

    useEffect(() => {
        refreshStreams();
        const interval = setInterval(() => {
            refreshStreams();
        }, REFRESH_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [creatorId]);

    useEffect(() => {
        if (!videoPlayerRef.current || !currentVideo) return;

        const player = YouTubePlayer(videoPlayerRef.current, {
            videoId: currentVideo.extractedId,
            playerVars: {
                autoplay: 1,
                controls: 1,
                modestbranding: 1,
            },
        });

        player.on("ready", () => {
            console.log("YouTube Player is ready!");
            player.playVideo();
        });

        player.on("stateChange", (event: { data: number }) => {
            console.log("Player State Changed:", event.data);
            if (event.data === 0) {
                console.log("Video ended. Playing next...");
                setTimeout(playNext, 2000);
            }
        });

        return () => {
            player.destroy();
        };
    }, [currentVideo]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true);
        const res = await fetch("/api/streams", {
            method: "POST",
            body: JSON.stringify({
                creatorId: creatorId,
                url: videoUrl
            })
        });
        setQueue([...queue, await res.json()]);
        setLoading(false);
        setVideoUrl('');
        toast.success("Song added to queue successfully");
    }

    const handleVote = async (id: string, isUpvote: boolean) => {
        setQueue(
            queue
                .map((video) =>
                    video.id === id
                        ? {
                            ...video,
                            upvotes: isUpvote ? video.upvotes + 1 : video.upvotes - 1,
                            haveUpvoted: !video.haveUpvoted,
                        }
                        : video,
                )
                .sort((a: Video, b: Video) => b.upvotes - a.upvotes),
        );

        await fetch(`/api/streams/${isUpvote ? "upvote" : "downvote"}`, {
            method: "POST",
            body: JSON.stringify({
                streamId: id,
            }),
        });
    };

    const playNext = async () => {
        if (queue.length === 0) {
            console.log("No more videos in the queue.");
            setCurrentVideo(null);
            return;
        }

        try {
            setPlayNextLoader(true);

            const data = await fetch('/api/streams/next', { method: "GET" });
            const json = await data.json();

            if (!json.stream) {
                console.log("No new video received from API.");
                setCurrentVideo(null);
                return;
            }

            console.log("Next video:", json.stream);

            setCurrentVideo(json.stream);
            setQueue(q => q.filter(video => video.id !== json.stream.id));

            setTimeout(() => {
                refreshStreams();
            }, 2000);

        } catch (e) {
            console.error("Error playing next song:", e);
        } finally {
            setPlayNextLoader(false);
        }
    };

    const handleShare = () => {
        const shareableLink = `${window.location.host}/creator/${creatorId}`;
        navigator.clipboard.writeText(shareableLink).then(
            () => {
                toast.success('Link copied to clipboard!', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                })
            },
            (err) => {
                console.error('Could not copy text: ', err)
                toast.error('Failed to copy link. Please try again.', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                })
            }
        );
    };

    const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value
        setVideoUrl(url)
        const videoId = extractVideoId(url)
        setPreviewId(videoId || "")
    }

    const extractVideoId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
        const match = url.match(regExp)
        return match && match[2].length === 11 ? match[2] : null
    }

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
            <Appbar />
            <div className="flex justify-center  px-5 md:px-10 xl:px-20">
                <main className="items-center flex-grow container mx-auto px-4 py-8">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 pb-4">
                            Stream Song Voting
                        </h1>
                        <Button onClick={handleShare} className="bg-purple-700 hover:bg-purple-800 text-white ">
                            <Share2 className="mr-2 h-5 w-5" />
                            Share
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main video player */}
                        <div className="lg:col-span-2 lg:row-span-2 space-y-6">
                            <h2 className="text-2xl font-bold text-white">Now Playing</h2>
                            {currentVideo ? (
                                <div className="aspect-video arelative w-full max-w-4xl mx-auto">
                                    {playVideo ? (
                                        <div className="relative w-full h-0 pb-[56.25%] rounded-lg overflow-hidden">
                                            <div ref={videoPlayerRef} className="absolute top-0 left-0 w-full h-full"></div>
                                        </div>
                                    ) : (
                                        <>
                                            <Image
                                                src={currentVideo.bigImg}
                                                alt={currentVideo.title} // Always include alt text
                                                width={640}
                                                height={360}
                                                className="w-full h-72 object-cover rounded"
                                            />
                                            <p className="mt-2 text-center font-semibold text-white">{currentVideo.title}</p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <p className="text-center py-8 text-gray-400">
                                    No video playing
                                </p>
                            )}
                            {playVideo && (
                                <Button
                                    disabled={playNextLoader}
                                    onClick={playNext}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                                >
                                    <Play className="mr-2 h-4 w-4" />{" "}
                                    {playNextLoader ? "Loading..." : "Play next"}
                                </Button>
                            )}
                            <form onSubmit={handleSubmit} className="space-y-2">
                                <Input
                                    type="text"
                                    placeholder="Paste YouTube video URL here"
                                    value={videoUrl}
                                    onChange={handleVideoUrlChange}
                                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                                />
                                <Button onClick={handleSubmit} type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>{loading ? "Loading..." : "Add to Queue"}</Button>
                                {/* Video preview area */}
                                {previewId && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        transition={{ duration: 0.5 }}
                                        className="mt-4 overflow-hidden"
                                        style={{ minHeight: "400px" }}
                                    >
                                        <h3 className="text-xl font-semibold mb-2 text-purple-300">Preview:</h3>
                                        <div className="aspect-video rounded-lg overflow-hidden">
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                src={`https://www.youtube.com/embed/${previewId}`}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            ></iframe>
                                        </div>
                                    </motion.div>
                                )}
                            </form>
                        </div>
                        {/* Video queue */}
                        <div className="lg:row-start-1 space-y-4">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-100">Upcoming Songs</h2>
                            {queue.length === 0 ? (
                                <p className="text-gray-400">No upcoming songs. Add some to get started!</p>
                            ) : (
                                <div className="space-y-4">
                                    {queue.map((video) => (
                                        <Card
                                            key={video.id}
                                            className="bg-gray-800 border border-gray-700 rounded-lg shadow hover:shadow-lg transition-shadow"
                                        >
                                            <CardContent className="flex items-start p-4 gap-4">
                                                {/* Video Thumbnail */}
                                                <Image
                                                    src={video.bigImg || "/placeholder.svg"}
                                                    alt={`Thumbnail for ${video.title}`}
                                                    width={112}
                                                    height={80}
                                                    className="w-28 h-20 object-cover rounded-md flex-shrink-0"
                                                />

                                                {/* Video Details */}
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-100 line-clamp-2">{video.title}</h3>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        {/* Voting Button */}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleVote(video.id, video.haveUpvoted ? false : true)}
                                                            className={`${video.haveUpvoted
                                                                ? "text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                                                : "text-green-400 hover:text-green-300 hover:bg-green-400/10"
                                                                } transition-all flex items-center`}
                                                        >
                                                            {video.haveUpvoted ? (
                                                                <ThumbsDown className="mr-1 h-4 w-4" />
                                                            ) : (
                                                                <ThumbsUp className="mr-1 h-4 w-4" />
                                                            )}
                                                            <span className="font-medium">{video.upvotes}</span>
                                                        </Button>
                                                        {/* Play Button */}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setCurrentVideo(video)}
                                                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                                                        >
                                                            <Play className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
            />
        </div>
    )
}