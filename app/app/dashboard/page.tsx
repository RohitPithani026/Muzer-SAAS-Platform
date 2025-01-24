"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ThumbsUp, ThumbsDown, Play, Share2 } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "@/hooks/use-toast"

const initialQueue = [
    { id: "1", title: "Song 1", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg", votes: 15 },
    { id: "2", title: "Song 2", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg", votes: 10 },
    { id: "3", title: "Song 3", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg", votes: 8 },
    { id: "4", title: "Song 4", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg", votes: 5 },
]

export default function Home() {
    const [videoUrl, setVideoUrl] = useState("")
    const [queue, setQueue] = useState(initialQueue)
    const [currentVideo, setCurrentVideo] = useState("dQw4w9WgXcQ")
    const [previewId, setPreviewId] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (previewId) {
            setQueue((prev) => [
                { id: previewId, title: `New Song`, thumbnail: `https://img.youtube.com/vi/${previewId}/default.jpg`, votes: 0 },
                ...prev,
            ])
        }
        setVideoUrl("")
        setPreviewId("")
        toast({
            title: "Song submitted!",
            description: "Your song has been added to the queue.",
        })
    }

    const handleVote = (id: string, increment: number) => {
        setQueue(
            queue
                .map((item) => (item.id === id ? { ...item, votes: item.votes + increment } : item))
                .sort((a, b) => b.votes - a.votes)
        )
    }

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
                        <form onSubmit={handleSubmit} className="space-y-2">
                            <Input
                                type="text"
                                placeholder="Paste YouTube video URL here"
                                value={videoUrl}
                                onChange={handleVideoUrlChange}
                                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                            />
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
                                            src={`https://www.youtube.com/embed/${previewId}`}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="w-full h-full"
                                        ></iframe>
                                    </div>
                                </motion.div>
                            )}
                            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={!videoUrl}>
                                Add to Queue
                            </Button>
                        </form>
                    </div>
                    {/* Video queue */}
                    <div className="lg:row-start-1 space-y-4">
                        <h2 className="text-2xl font-semibold mb-4">Upcoming Songs</h2>
                        {queue.map((video) => (
                            <Card key={video.id} className="bg-gray-800 border-gray-700">
                                <CardContent className="flex items-center p-4">
                                    <img
                                        src={video.thumbnail || "/placeholder.svg"}
                                        alt={video.title}
                                        className="w-24 h-18 object-cover rounded mr-4"
                                    />
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{video.title}</h3>
                                        <div className="flex items-center mt-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleVote(video.id, 1)}
                                                className="text-green-400 hover:text-green-300 hover:bg-green-400/10"
                                            >
                                                <ThumbsUp className="mr-1 h-4 w-4" />
                                                <span>{video.votes}</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleVote(video.id, -1)}
                                                className="text-red-400 hover:text-red-300 hover:bg-red-400/10 ml-2"
                                            >
                                                <ThumbsDown className="mr-1 h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setCurrentVideo(video.id)}
                                        className="ml-2"
                                    >
                                        <Play className="h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}
