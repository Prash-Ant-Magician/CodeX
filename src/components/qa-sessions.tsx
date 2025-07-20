
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Video } from "lucide-react";
import Image from "next/image";

const sessions = [
  {
    topic: "Advanced React Patterns",
    expert: "Dr. Evelyn Reed",
    date: "2024-08-15",
    time: "3:00 PM UTC",
    avatarHint: "woman scientist",
    description: "Dive deep into render props, higher-order components, and custom hooks to build scalable React applications."
  },
  {
    topic: "Python for Data Science",
    expert: "Prof. Kenji Tanaka",
    date: "2024-08-22",
    time: "5:00 PM UTC",
    avatarHint: "man professor",
    description: "Explore essential libraries like Pandas, NumPy, and Scikit-learn to manipulate and analyze data effectively."
  },
  {
    topic: "Demystifying Java Concurrency",
    expert: "Aisha Adebayo",
    date: "2024-09-05",
    time: "2:00 PM UTC",
    avatarHint: "woman engineer",
    description: "Learn about threads, synchronization, and the modern Java concurrency utilities to write robust multi-threaded applications."
  },
  {
    topic: "Modern C++ for Game Development",
    expert: "Marcus Chen",
    date: "2024-09-12",
    time: "7:00 PM UTC",
    avatarHint: "man developer",
    description: "Discover how C++20 features can optimize game engine performance and simplify your development workflow."
  }
];

export default function QaSessions() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-headline">Expert Q&amp;A Sessions</h1>
        <p className="text-muted-foreground">Join live sessions with industry experts to get your questions answered.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sessions.map((session, index) => (
          <Card key={index} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                   <Image 
                     src={`https://placehold.co/100x100.png`} 
                     alt={session.expert} 
                     width={100} 
                     height={100}
                     data-ai-hint={session.avatarHint}
                   />
                  <AvatarFallback>{session.expert.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{session.topic}</CardTitle>
                  <CardDescription>with {session.expert}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground">{session.description}</p>
              <div className="mt-4 flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(session.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{session.time}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                <Video className="mr-2 h-4 w-4" />
                Join Session
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
