"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ThumbsUp, ThumbsDown, Play, Share2 } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "@/hooks/use-toast"
import axios from "axios";

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

export default function Home() {
    const [videoUrl, setVideoUrl] = useState("")
    const [queue, setQueue] = useState<Video[]>([]);
    const [currentVideo, setCurrentVideo] = useState("dQw4w9WgXcQ")
    const [previewId, setPreviewId] = useState("")

    async function refreshStreams() {
        try {
            const res = await axios.get('/api/streams/my', { withCredentials: true });
            if (res.status === 200 && res.data?.streams) {
                const sortedQueue = res.data.streams.sort((a: Video, b: Video) => b.upvotes - a.upvotes);
                setQueue(sortedQueue);
            }
        } catch (error) {
            console.error("Error refreshing streams: ", error);
            toast({
                title: "Failed to fetch queue",
                description: "Unable to load the song queue. Please try again later.",
                variant: "destructive",
            });
        }
    }

    useEffect(() => {
        refreshStreams();

        const interval = setInterval(() => {
            refreshStreams();
        }, REFRESH_INTERVAL_MS);

        return () => clearInterval(interval);
    }, []);

    // const handleSubmit = (e: React.FormEvent) => {
    //     e.preventDefault()
    //     if (previewId) {
    //         setQueue((prev) => [
    //             { id: previewId, title: `New Song`, thumbnail: `https://img.youtube.com/vi/${previewId}/default.jpg`, votes: 0 },
    //             ...prev,
    //         ])
    //     }
    //     setVideoUrl("")
    //     setPreviewId("")
    //     toast({
    //         title: "Song submitted!",
    //         description: "Your song has been added to the queue.",
    //     })
    // }

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


    const sharePage = () => {
        navigator.clipboard.writeText(window.location.href)
        alert("Page URL copied to clipboard!")
    }

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
            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 pb-4">
                        Stream Song Voting
                    </h1>
                    <Button onClick={sharePage} className="bg-blue-600 hover:bg-blue-700 flex items-center justify-center">
                        <Share2 className="mr-2 h-5 w-5" />
                        Share
                    </Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main video player */}
                    <div className="lg:col-span-2 lg:row-span-2 space-y-6">
                        <div className="aspect-video">
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${currentVideo}`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                        <form className="space-y-2"> {/*onSubmit={handleSubmit} */}
                            <Input
                                type="text"
                                placeholder="Paste YouTube video URL here"
                                value={videoUrl}
                                onChange={handleVideoUrlChange}
                                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                            />
                            <Button onClick={() => {
                                fetch("/api/streams", {
                                    method: "POST",
                                    body: JSON.stringify({
                                        creatorId: "creatorId",
                                        url: videoUrl
                                    })
                                })
                            }} type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={!videoUrl}>Add to Queue</Button>
                            {/* Video preview area */}
                            {previewId && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    transition={{ duration: 0.5 }}
                                    className="mt-4 overflow-hidden"
                                    style={{ minHeight: "200px" }}
                                >
                                    <h3 className="text-xl font-semibold mb-2 text-purple-300">Preview:</h3>
                                    <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src={`https://www.youtube.com/embed/${previewId}`}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="w-full h-full"
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
                                            <img
                                                src={video.bigImg || "/placeholder.svg"}
                                                alt={`Thumbnail for ${video.title}`}
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
                                                        onClick={() => setCurrentVideo(video.id)}
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
    )
}
