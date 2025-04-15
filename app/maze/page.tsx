"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import NetworkBackground from "@/components/networkBackground";
import { handleSocket, handleUserLeft } from "@/lib/utils";
import { io, Socket } from "socket.io-client";

// Define proper socket and cursor types
interface ServerToClientEvents {
  "remote-cursor-move": (data: {
    userId: string;
    username: string;
    cursorPos: CursorPosition;
    currImg: string | null;
  }) => void;
  "user-left": (userId: string) => void;
}

interface ClientToServerEvents {
  "join-room": (data: { roomId: string; userId: string | null }) => void;
  "cursor-move": (data: {
    roomId: string;
    userId: string | null;
    username: string | null;
    cursorPos: CursorPosition;
    currImg: string | null;
  }) => void;
}

export type CursorPosition = {
  x: number;
  y: number;
};

export default function Dashboard() {
  const router = useRouter();
  const [selectedCursor, setSelectedCursor] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const myCursor: CursorPosition = { x: 0, y: 0 };

  // on connect
  useEffect(() => {
    // Fade-in animation on load
    setIsVisible(true);
    // const socketInstance = io("http://172.70.103.241:3000");
    const socketInstance = io(
      "https://cursorxone-backend-1.onrender.com"
    ) as Socket<ServerToClientEvents, ClientToServerEvents>;
    setSocket(socketInstance);
    // Get the selected cursor from localStorage
    const cursor = localStorage.getItem("selectedCursor");
    const myname = localStorage.getItem("name");
    setSelectedCursor(cursor);
    setName(myname);

    socketInstance.on("connect", () => {
      socketInstance.emit("join-room", { roomId: "maze", userId: myname });
    });
    // Apply the custom cursor to the body
    if (cursor) {
      document.body.style.cursor = `url('${cursor}') 16 16, auto`;
    }
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // other cursor movements
  useEffect(() => {
    if (!socket) return;

    socket.on(
      "remote-cursor-move",
      ({ userId, username, cursorPos, currImg }) => {
        handleSocket(userId, username, cursorPos, name, currImg);
      }
    );
    socket.on("user-left", (userId: string) => {
      handleUserLeft(userId);
    });
    return () => {
      socket.off("remote-cursor-move");
      socket.off("user-left");
    };
  }, [socket, name]); // Added name to dependency array

  // my cursor movements
  useEffect(() => {
    if (!socket) return;

    const handleMouseMove = (event: MouseEvent) => {
      const htmlElem = document.documentElement;

      myCursor.x = event.clientX;
      myCursor.y = event.clientY;

      const cursorPos = {
        x: htmlElem.scrollLeft + event.clientX,
        y: htmlElem.scrollTop + event.clientY,
      };

      socket.emit("cursor-move", {
        roomId: "maze",
        userId: name,
        username: name,
        cursorPos,
        currImg: selectedCursor,
      });
    };

    const emitOnScroll = (e: Event) => {
      const target = e.target as Document;
      const scrollingElement = target.scrollingElement;
      if (!scrollingElement) return;

      const cursorPos = {
        x: scrollingElement.scrollLeft + myCursor.x,
        y: scrollingElement.scrollTop + myCursor.y,
      };

      socket.emit("cursor-move", {
        roomId: "maze",
        userId: name,
        username: name,
        cursorPos,
        currImg: selectedCursor,
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("scroll", emitOnScroll);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("scroll", emitOnScroll);
    };
  }, [socket, name, selectedCursor, myCursor]); // Added selectedCursor to dependency array

  const handleBack = () => {
    setIsVisible(false);
    setTimeout(() => {
      router.push("/");
    }, 500);
  };

  return (
    <main
      id="MAZE"
      className="min-h-screen flex flex-col items-center justify-center bg-black overflow-hidden  w-[7344px] h-[4896px]"
    >
      <NetworkBackground />
      {/* <Image
        src="/bgMap.png" // or external URL
        alt=""
        width={7344}
        height={4896}
        className="full z-[5]" // optional styling
      /> */}
      <div
        className={`fixed top-0 left-0 z-10 text-center space-y-6 max-w-md p-6 transition-all duration-1000 ease-in-out transform ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <Button
          onClick={handleBack}
          className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] animate-fade-in-delay-3"
        >
          Back to Login
        </Button>
      </div>
    </main>
  );
}
