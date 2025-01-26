"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ThumbsUp, ThumbsDown, Play, Share2, Slice } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "@/hooks/use-toast"
import axios from "axios";
import StreamView from "../components/StreamView"

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

const creatorId = "781b98c2-6caf-40e0-bd6a-9b6a3b12b4ad";

export default function Component() {
    return <StreamView creatorId={creatorId} />
}
