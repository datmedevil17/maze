"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import NetworkBackground from "@/components/networkBackground";
import { handleSocket, handleUserLeft, handleEmojiChange, EmojiData } from "@/lib/utils";
import { io, Socket } from "socket.io-client";
import { EmojiDropdown } from "@/components/emojiSelector"
import { useAccount, useReadContract } from "wagmi";
import { tokenABI, tokenAddress } from "@/contract/contract"
import { formatUnits } from "viem";
import TextPressure from "@/src/blocks/TextAnimations/TextPressure/TextPressure";
import SpaceShooterGame from "../games/spaceShooter/page";
import {startGame , endGame} from "@/contract/function"


// Define proper socket and cursor types
interface ServerToClientEvents {
  "remote-cursor-move": (data: {
    userId: string;
    username: string;
    cursorPos: CursorPosition;
    currImg: string | null;
  }) => void;
  "user-left": (userId: string) => void;
  "emoji-changed": (emoji: EmojiData) => void;

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
  "emoji": (data: { emojiText: string; userId: string; }) => void;
}

export type CursorPosition = {
  x: number;
  y: number;
};

export default function Dashboard() {
  const router = useRouter();
  const [selectedCursor, setSelectedCursor] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const account = useAccount();

  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string>("1f609");
  const walletId = useRef<string>("");
  // on connect
  const { data } = useReadContract({
    address: tokenAddress,
    abi: tokenABI,
    functionName: 'balanceOf',
    args: [account.address!],
  })
  const [balance, setBalance] = useState('0')

  const [selectedRightElement, setSelectedRightElement] = useState<string | null>(null);

  useEffect(() => {
    if (data && typeof data === 'bigint') {
      setBalance(formatUnits(data, 18)) // 18 is typical for ERC-20
    }
  }, [data])

  useEffect(() => {
    if (!account || !account.address) {
      router.push("/");
    }
    if (account.address)
      walletId.current = account.address;
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
      socketInstance.emit("join-room", { roomId: "maze", userId: walletId.current });
    });
    // Apply the custom cursor to the body
    if (cursor) {
      document.body.style.cursor = `url('${cursor}') 0 0, auto`
    }
    return () => {
      socketInstance.disconnect();
    };
  }, [account, router]);

  // listening sockets
  useEffect(() => {
    if (!socket) return;

    socket.on(
      "remote-cursor-move",
      ({ userId, username, cursorPos, currImg }) => {
        handleSocket(userId, username, cursorPos, walletId.current, currImg);
      }
    );
    socket.on("user-left", (userId: string) => {
      handleUserLeft(userId);
    });
    socket.on("emoji-changed", (emoji: EmojiData) => {
      handleEmojiChange(emoji);
    });
    return () => {
      socket.off("remote-cursor-move");
      socket.off("user-left");
    };
  }, [socket]); // Added name to dependency array

  // my cursor movements
  useEffect(() => {
    if (!socket) return;
    const myCursor: CursorPosition = { x: 0, y: 0 };

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
        userId: walletId.current,
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
        userId: walletId.current,
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
  }, [socket, name, selectedCursor]); // Added selectedCursor to dependency array

  // const handleBack = () => {
  //   setIsVisible(false);
  //   setTimeout(() => {
  //     router.push("/")
  //   }, 500)
  // }
  const handleEmojiSelect = (unicodeValue: string) => {

    setSelectedEmoji(unicodeValue);
    if (socket)
      socket.emit('emoji', { emojiText: unicodeValue, userId: walletId.current });
    setIsDropdownOpen(false);
  };
  const toggleDropdown = () => {
    setIsDropdownOpen((prevIsOpen) => !prevIsOpen);
  };

  return (
    <div className="relative  min-h-[99.3vh] h-[99.3vh] bg-black">
      <div className={`relative h-full inline-block overflow-scroll ${selectedRightElement ? "w-2/3" : "w-full"}`}>
        <main
          id="MAZE"
          className="relative min-h-screen bg-black overflow-scroll  w-[8000px] h-[8000px]"
        >
          <NetworkBackground />
          <div className="emojiSelector p-6 text-center text-xl fixed top-0 left-1/3 translate-x-[-50%]">
            <EmojiDropdown
              isDropdownOpen={isDropdownOpen}
              toggleDropdown={toggleDropdown}
              selectedEmoji={selectedEmoji}
              handleEmojiSelect={handleEmojiSelect}
            />
          </div>
          <div className="absolute top-[250px] left-[500px] w-96 h-96 flex items-center justify-center border-2" onClick={() => setSelectedRightElement("spaceShooter")}>
            <h1 className="text-white text-4xl font-bold">Space Shooter Game</h1>
          </div>
          <div className="absolute top-[250px] left-[3200px] w-96 h-96 flex items-center justify-center border-2" onClick={() => setSelectedRightElement("spaceShooter")}>
            <h1 className="text-white text-4xl font-bold">Space Shooter Game</h1>
          </div>
          <div className="absolute top-[350px] left-[1000px] w-[2000px] h-32 flex items-center justify-center">
            <TextPressure
              text="----------------------"
              flex={true}
              alpha={false}
              stroke={false}
              width={true}
              weight={true}
              italic={true}
              textColor="#ffffff"
              strokeColor="#ff0000"
              minFontSize={80}
            />
          </div>
          <div
            className={`fixed top-0 left-0 z-10 text-center space-y-6 max-w-md p-6 transition-all duration-1000 ease-in-out transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
          >
            <Button
              className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] animate-fade-in-delay-3"
            >
              Balance tokens : {balance}
            </Button>
          </div>

        </main>
      </div>
      {selectedRightElement &&
        <div className="gameContainer w-1/3 h-full inline-block relative">
          {selectedRightElement === "spaceShooter" && <SpaceShooterGame /> || <div className="text-white">Global Chat</div>}
        </div>
      }
    </div>
  );
}
