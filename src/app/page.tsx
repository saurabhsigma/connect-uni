"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Users, Clock, MapPin, Zap, BookOpen, Map, MessageCircle, User, ArrowRight, Sparkles } from "lucide-react";
import { getAllAvatars } from "@/lib/avatars";

interface Event {
  _id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: string[];
  image?: string;
}

export default function Home() {
  const [topEvents, setTopEvents] = useState<Event[]>([]);
  const allAvatars = getAllAvatars();

  useEffect(() => {
    fetchTopEvents();
  }, []);

  const fetchTopEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setTopEvents(data.slice(0, 3)); // Top 3 events by attendance
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 text-center overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20 opacity-50 blur-3xl" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "4s" }} />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "5s", animationDelay: "1s" }} />

        <h1 className="relative z-10 text-6xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-secondary animate-in fade-in slide-in-from-bottom-4 duration-1000">
          Campus Connect
        </h1>
        <p className="relative z-10 text-lg md:text-xl text-muted-foreground mt-6 max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          Your all-in-one platform for campus life. Connect, share, explore, and thrive.
        </p>
        <br /> <br />
        
        {/* Animated Avatar Network */}
        <div className="relative z-10 mt-12 mb-8 h-48 w-full max-w-4xl">
          <div className="absolute inset-0 flex items-center justify-center">
            {allAvatars.map((avatar, index) => {
              const angle = (index / allAvatars.length) * Math.PI * 2;
              const radius = 120;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              return (
                <div
                  key={avatar.id}
                  className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm border-2 border-primary/30 flex items-center justify-center text-3xl animate-float shadow-lg"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: 'translate(-50%, -50%)',
                    animationDelay: `${index * 0.1}s`,
                    animationDuration: `${3 + (index % 3)}s`,
                  }}
                >
                  {avatar.emoji}
                </div>
              );
            })}
            
            {/* Center connecting node */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl animate-pulse shadow-xl shadow-primary/50">
              🌐
            </div>
            
            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full opacity-20">
              {allAvatars.map((_, index) => {
                const angle = (index / allAvatars.length) * Math.PI * 2;
                const radius = 120;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                return (
                  <line
                    key={index}
                    x1="50%"
                    y1="50%"
                    x2={`calc(50% + ${x}px)`}
                    y2={`calc(50% + ${y}px)`}
                    stroke="url(#gradient)"
                    strokeWidth="2"
                    className="animate-pulse"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  />
                );
              })}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgb(147, 51, 234)" />
                  <stop offset="100%" stopColor="rgb(236, 72, 153)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* <div className="relative z-10 mt-10 flex gap-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <a
            href="/auth/signup"
            className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
          >
            Get Started
          </a>
          <a
            href="/auth/signin"
            className="px-8 py-3 rounded-full bg-secondary/10 border border-secondary/20 text-secondary font-semibold hover:bg-secondary/20 transition-all backdrop-blur-sm"
          >
            Sign In
          </a>
        </div> */}
      </section>

      {/* Top Events Section */}
      {topEvents.length > 0 && (
        <section className="py-20 px-4 max-w-7xl mx-auto w-full z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-yellow-400 animate-spin" style={{ animationDuration: "3s" }} />
                Trending Events
              </h2>
              <p className="text-muted-foreground mt-2">Most popular events happening soon</p>
            </div>
            <Link 
              href="/events" 
              className="px-6 py-2 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-medium hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 flex items-center gap-2 group"
            >
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topEvents.map((event, index) => (
              <Link
                key={event._id}
                href={`/events/${event._id}`}
                className="group glass-card rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <div className="relative h-48 bg-muted/50 overflow-hidden">
                  {event.image ? (
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-primary/20 to-secondary/20">
                      <Calendar size={48} className="opacity-30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-emerald-500 backdrop-blur px-3 py-1.5 rounded-full text-sm font-bold text-white flex items-center gap-1.5 shadow-lg">
                    <Users size={14} />
                    {event.attendees.length}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 line-clamp-1 group-hover:text-primary transition-colors">{event.title}</h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2 group-hover:text-primary/80 transition-colors">
                      <Calendar size={14} className="text-blue-400 flex-shrink-0" />
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="flex items-center gap-2 group-hover:text-secondary/80 transition-colors">
                      <Clock size={14} className="text-orange-400 flex-shrink-0" />
                      {event.time}
                    </p>
                    <p className="flex items-center gap-2 group-hover:text-accent/80 transition-colors">
                      <MapPin size={14} className="text-pink-400 flex-shrink-0" />
                      <span className="line-clamp-1">{event.location}</span>
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Features Grid */}
      <section className="py-20 px-4 max-w-7xl mx-auto w-full z-10">
        <div className="mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
            Everything you need is here.
          </h2>
          <p className="text-center text-muted-foreground text-lg">Campus life made simple, connected, and fun</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "Surplus Store",
              description: "Buy and sell used textbooks, gadgets, and more with trusted peers.",
              icon: Zap,
              color: "from-blue-500 to-cyan-500",
              bgColor: "bg-blue-500/10 border-blue-500/20",
              href: "/store",
              gradient: "via-blue-400",
            },
            {
              title: "Hoodmaps",
              description: "Discover hidden gems, rate hostels, and navigate campus like a pro.",
              icon: Map,
              color: "from-green-500 to-emerald-500",
              bgColor: "bg-green-500/10 border-green-500/20",
              href: "/hoodmaps",
              gradient: "via-green-400",
            },
            {
              title: "Event Feed",
              description: "Never miss a campus event. RSVP and see who's going.",
              icon: Calendar,
              color: "from-orange-500 to-red-500",
              bgColor: "bg-orange-500/10 border-orange-500/20",
              href: "/events",
              gradient: "via-orange-400",
            },
            {
              title: "Community",
              description: "Join discussions, clubs, and connect with students sharing your interests.",
              icon: MessageCircle,
              color: "from-purple-500 to-pink-500",
              bgColor: "bg-purple-500/10 border-purple-500/20",
              href: "/community",
              gradient: "via-purple-400",
            },
            {
              title: "Student Profiles",
              description: "Showcase your skills, courses, and connect with potential study buddies.",
              icon: User,
              color: "from-pink-500 to-rose-500",
              bgColor: "bg-pink-500/10 border-pink-500/20",
              href: "/profile",
              gradient: "via-pink-400",
            },
            {
              title: "Learning Resources",
              description: "Access study materials, notes, and collaborate with classmates.",
              icon: BookOpen,
              color: "from-indigo-500 to-blue-500",
              bgColor: "bg-indigo-500/10 border-indigo-500/20",
              href: "/community",
              gradient: "via-indigo-400",
            },
          ].map((feature, i) => {
            const IconComponent = feature.icon;
            return (
              <Link
                key={i}
                href={feature.href}
                className={`group relative p-8 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${feature.bgColor} overflow-hidden`}
              >
                {/* Animated gradient background */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${feature.color} transition-opacity duration-300`} />
                
                {/* Glowing border effect on hover */}
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 bg-gradient-to-r ${feature.color} blur-xl transition-opacity duration-300 -z-10`} />
                
                <div className="relative">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} p-3 mb-4 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm group-hover:text-foreground/80 transition-colors">{feature.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-sm font-medium">Explore</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
