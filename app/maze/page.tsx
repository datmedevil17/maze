"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import NetworkBackground from "@/components/networkBackground";
import GlobalChat from "@/components/GlobalMessage";
import { handleSocket, handleUserLeft, handleEmojiChange, EmojiData } from "@/lib/utils";
import { io, Socket } from "socket.io-client";
import { EmojiDropdown } from "@/components/emojiSelector";
import { useAccount, useReadContract } from "wagmi";
import { tokenABI, tokenAddress } from "@/contract/contract";
import { formatUnits, type Address } from "viem";
import TextPressure from "@/src/blocks/TextAnimations/TextPressure/TextPressure";
import SpaceShooterGame from "../games/spaceShooter/page";
// Assuming startGame and endGame are correctly imported if used, though not used in this snippet
// import { startGame, endGame } from "@/contract/function";

// Define proper socket and cursor types
export interface ServerToClientEvents {
  "remote-cursor-move": (data: {
    userId: string;
    username: string;
    cursorPos: CursorPosition;
    currImg: string | null;
  }) => void;
  "user-left": (userId: string) => void;
  "emoji-changed": (emoji: EmojiData) => void;
}

export interface ClientToServerEvents {
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
  const [selectedEmoji, setSelectedEmoji] = useState<string>("1f609"); // Default emoji unicode
  const walletId = useRef<string>(""); // Store wallet ID in ref to avoid stale closures
  const [balance, setBalance] = useState('0');
  const [selectedRightElement, setSelectedRightElement] = useState<string | null>(null); // State for right panel content

  // --- Corrected useReadContract hook ---
  const { data: contractBalanceData, refetch: refetchBalance } = useReadContract({
    address: tokenAddress as Address, // Ensure address is typed correctly if needed
    abi: tokenABI,
    functionName: 'balanceOf',
    args: account.address ? [account.address] : undefined, // Pass args only if address exists
    // Configure TanStack Query options via the 'query' key
    query: {
      enabled: !!account.address, // Only enable the query when the address is available
      // Refetch the balance every 10 seconds (adjust as needed)
      refetchInterval: 10000, // 10000 milliseconds = 10 seconds
      // Optional: refetch when window regains focus (usually default behavior)
      // refetchOnWindowFocus: true,
    },
  });
  // --- End Correction ---

  // Effect to update the balance state when contract data changes
  useEffect(() => {
    // Check if data is valid and a bigint before formatting
    if (contractBalanceData !== undefined && typeof contractBalanceData === 'bigint') {
      setBalance(formatUnits(contractBalanceData, 18)); // Assuming 18 decimals
    }
  }, [contractBalanceData]); // Dependency: Run only when contractBalanceData updates

  // Effect for initial setup, wallet connection, and socket connection
  useEffect(() => {
    // Check for account address, if not present, maybe redirect or show message
    if (!account.address) {
      console.log("No account address found, consider redirecting or showing a connection prompt.");
      router.push("/"); // Example redirect - uncomment if needed
      walletId.current = ""; // Clear walletId if disconnected
    } else {
      walletId.current = account.address; // Update walletId ref
    }

    // Fade-in animation
    setIsVisible(true);

    // Initialize Socket.IO connection
    // const socketInstance = io("http://localhost:3001"); // Example local backend
    const socketInstance = io(
      "https://cursorxone-backend-1.onrender.com" // Your production backend
    ) as Socket<ServerToClientEvents, ClientToServerEvents>;
    setSocket(socketInstance);

    // Retrieve user preferences from localStorage
    const cursor = localStorage.getItem("selectedCursor");
    const myname = localStorage.getItem("name");
    setSelectedCursor(cursor);
    setName(myname);

    // Apply custom cursor from localStorage
    if (cursor) {
      document.body.style.cursor = `url('${cursor}') 0 0, auto`;
    } else {
      document.body.style.cursor = 'auto'; // Default cursor if none selected
    }

    // Socket connection listener
    socketInstance.on("connect", () => {
      console.log("Socket connected:", socketInstance.id);
      // Join room only if walletId is set
      if (walletId.current) {
        socketInstance.emit("join-room", { roomId: "maze", userId: walletId.current });
        console.log(`Emitted join-room for user: ${walletId.current}`);
      }
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });


    // Cleanup function on component unmount
    return () => {
      console.log("Disconnecting socket...");
      socketInstance.disconnect();
      document.body.style.cursor = 'auto'; // Reset cursor on unmount
    };
  }, [account.address]); // Re-run effect if account address changes (connect/disconnect)


  // Effect for setting up socket event listeners
  useEffect(() => {
    if (!socket) return; // Don't run if socket is not initialized

    // Handler functions defined outside to keep useEffect clean
    const handleRemoteCursorMove = (data: { userId: string; username: string; cursorPos: CursorPosition; currImg: string | null; }) => {
      handleSocket(data.userId, data.username, data.cursorPos, walletId.current, data.currImg);
    };
    const handleUserLeftEvent = (userId: string) => {
      handleUserLeft(userId);
    };
    const handleEmojiChangedEvent = (emoji: EmojiData) => {
      handleEmojiChange(emoji);
    };

    // Register listeners
    socket.on("remote-cursor-move", handleRemoteCursorMove);
    socket.on("user-left", handleUserLeftEvent);
    socket.on("emoji-changed", handleEmojiChangedEvent);

    // Cleanup: Remove listeners when socket changes or component unmounts
    return () => {
      socket.off("remote-cursor-move", handleRemoteCursorMove);
      socket.off("user-left", handleUserLeftEvent);
      socket.off("emoji-changed", handleEmojiChangedEvent);
    };
  }, [socket]); // Dependency: Run only when the socket instance changes

  // Effect for tracking and emitting local cursor movements
  useEffect(() => {
    // Only run if socket, name, and cursor are available
    if (!socket || name === null || selectedCursor === null || !walletId.current) return;

    const myCursor: CursorPosition = { x: 0, y: 0 }; // Store last known position

    // Mouse move handler
    const handleMouseMove = (event: MouseEvent) => {
      const htmlElem = document.documentElement;
      myCursor.x = event.clientX; // Update last known position
      myCursor.y = event.clientY;
      const cursorPos = {
        x: htmlElem.scrollLeft + event.clientX,
        y: htmlElem.scrollTop + event.clientY,
      };
      socket.emit("cursor-move", {
        roomId: "maze",
        userId: walletId.current,
        username: name, // Name is available here due to the effect's dependency check
        cursorPos,
        currImg: selectedCursor, // Cursor is available here
      });
    };

    // Scroll handler (emit position relative to scroll)
    const emitOnScroll = (e: Event) => {
      const target = e.target as Document;
      const scrollingElement = target.scrollingElement;
      // Ensure needed values are present before emitting
      if (!scrollingElement || name === null || selectedCursor === null || !walletId.current) return;
      const cursorPos = {
        x: scrollingElement.scrollLeft + myCursor.x, // Use last known clientX/Y
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

    // Add event listeners
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("scroll", emitOnScroll, { passive: true }); // Use passive for scroll performance

    // Cleanup: Remove event listeners
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("scroll", emitOnScroll);
    };
  }, [socket, name, selectedCursor]); // Dependencies: Re-run if socket, name, or selected cursor changes

  // Handler for selecting an emoji from the dropdown
  const handleEmojiSelect = (unicodeValue: string) => {
    setSelectedEmoji(unicodeValue);
    // Emit emoji change only if socket and walletId are valid
    if (socket && walletId.current) {
      socket.emit('emoji', { emojiText: unicodeValue, userId: walletId.current });
    }
    setIsDropdownOpen(false); // Close dropdown after selection
  };

  // Handler to toggle the emoji dropdown visibility
  const toggleDropdown = () => {
    setIsDropdownOpen((prevIsOpen) => !prevIsOpen);
  };

  return (
    // Use flex container for side-by-side layout
    <div className="relative min-h-[99.3vh] h-[99.3vh] bg-black flex overflow-hidden">
      {/* Main Content Area (Scrollable Maze) */}
      <div
        className={`relative h-full inline-block overflow-y-scroll overflow-x-scroll transition-all duration-300 ease-in-out ${selectedRightElement ? "w-2/3" : "w-full"
          }`} // Ensure both overflows are scroll if needed, or adjust
      >
        <main
          id="MAZE"
          className="relative min-h-screen bg-black w-[8000px] h-[8000px]" // Large dimensions for scrolling
        >
          {/* Background Component */}
          <NetworkBackground />

          {/* Emoji Selector (Fixed Position) */}
          <div className="emojiSelector p-6 text-center text-xl fixed top-2 left-1/2 transform -translate-x-1/2 z-20">
            {/* ... EmojiDropdown component ... */}
            <EmojiDropdown
              isDropdownOpen={isDropdownOpen}
              toggleDropdown={toggleDropdown}
              selectedEmoji={selectedEmoji}
              handleEmojiSelect={handleEmojiSelect}
            />
          </div>

          {/* Balance Display (Fixed Position) */}
          <div
            className={`fixed top-4 left-4 z-20 text-center transition-all duration-1000 ease-in-out transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
              }`}
          >
            {/* ... Balance Button ... */}
            <Button
              variant="outline"
              className="bg-black/50 border-blue-500 text-white backdrop-blur-sm hover:bg-blue-700/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] animate-fade-in-delay-3"
              onClick={() => refetchBalance()} // Optionally allow manual refresh on click
            >
              {/* Format balance to a fixed number of decimal places */}
              Balance: {parseFloat(balance).toFixed(4)} CXO
            </Button>
          </div>

          {/* --- Interactive Elements in the Maze --- */}
          {/* ... Clickable elements ... */}
          <div
            className="absolute top-[350px] left-[500px] w-96 h-96 flex items-center justify-center border-2 border-blue-500 cursor-pointer hover:bg-blue-900/50 transition-colors duration-200 rounded-lg shadow-lg shadow-blue-500/30"
            onClick={() => setSelectedRightElement("spaceShooter")}
            title="Play Space Shooter"
          >
            <h1 className="text-white text-4xl font-bold text-center p-4">
              Space Shooter Game
            </h1>
          </div>

          <div
            className="absolute top-[350px] left-[1100px] w-96 h-96 flex items-center justify-center border-2 border-green-500 cursor-pointer hover:bg-green-900/50 transition-colors duration-200 rounded-lg shadow-lg shadow-green-500/30"
            onClick={() => setSelectedRightElement("globalChat")}
            title="Open Global Chat"
          >
            <h1 className="text-white text-4xl font-bold text-center p-4">
              Global Chat
            </h1>
          </div>

          <div
            className="absolute top-[800px] left-[800px] w-96 h-96 flex items-center justify-center border-2 border-red-500 cursor-pointer hover:bg-red-900/50 transition-colors duration-200 rounded-lg shadow-lg shadow-red-500/30"
            onClick={() => setSelectedRightElement("spaceShooter2")} // Example: another game instance
            title="Play Space Shooter (Instance 2)"
          >
            <h1 className="text-white text-4xl font-bold text-center p-4">
              Space Shooter Game 2
            </h1>
          </div>


          {/* Text Pressure Animation */}
          {/* ... TextPressure component ... */}
          <div className="absolute top-[150px] left-0 w-screen h-auto flex items-center justify-center pointer-events-none">
            <TextPressure
              text="----------------- Explore the Maze -----------------"
              flex={true} // Assuming these props are correct for TextPressure
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

        </main>
      </div> {/* End Main Content Area */}

      {/* Right Side Panel (Conditionally Rendered) */}
      {selectedRightElement && (
        // This is the main container for the right panel
        <div className="w-1/3 h-full flex-shrink-0 relative bg-gray-950 border-l-4 border-blue-700 shadow-2xl overflow-hidden"> {/* Use overflow-hidden here if inner div scrolls */}

          {/* Close Button for the Panel */}
          <Button
            variant="ghost" // Keep ghost variant for minimal background
            size="icon"
            className="absolute top-2 right-2 z-30 text-gray-400 hover:text-gray-100 hover:bg-gray-700/50 rounded-full p-1 transition-colors duration-150" // Adjusted styles
            onClick={() => setSelectedRightElement(null)}
            aria-label="Close panel"
          >
            {/* Using a simple 'X' icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}> {/* Slightly bolder stroke */}
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>

          {/* Inner container for content - ADD h-full and make it scrollable */}
          <div className="pt-10 h-full overflow-y-auto">

            {/* Content based on selection */}
            {selectedRightElement === "spaceShooter" && (
              <SpaceShooterGame />
            )}
            {selectedRightElement === "globalChat" && (
              <GlobalChat socket={socket} username={name} /> // Pass socket and username
            )}

            {/* Add more conditional components here */}
            {!["spaceShooter", "globalChat"].includes(selectedRightElement) && (
              <div className="p-4 text-gray-400">
                Selected element view not implemented.
              </div>
            )}
          </div> {/* End Inner container */}
        </div> // End Right Side Panel Container
      )} {/* End Conditional Rendering */}

    </div> // End Flex Container
  );
}
