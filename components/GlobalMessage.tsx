"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area"; // Use Shadcn's ScrollArea
import { Socket } from 'socket.io-client'; // Assuming types from Dashboard
import { ServerToClientEvents, ClientToServerEvents } from '../app/maze/page'; // Adjust path if needed

interface Message {
    text: string;
    username: string;
    timestamp: number; // Add timestamp for potential sorting/display
}

interface GlobalChatProps {
    socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
    username: string | null;
}

// Define the new events for chat
interface ChatServerToClientEvents extends ServerToClientEvents {
    "messageResponse": (data: { text: string; username: string }) => void;
    // Add other chat-specific events if needed
}

interface ChatClientToServerEvents extends ClientToServerEvents {
    "message-global": (data: { text: string; username: string | null }) => void; // Send username too
    // Add other chat-specific events if needed
}


export default function GlobalChat({ socket, username }: GlobalChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const scrollAreaRef = useRef<HTMLDivElement>(null); // Ref for the viewport div inside ScrollArea

    // Function to scroll to the bottom
    const scrollToBottom = useCallback(() => {
        const viewport = scrollAreaRef.current;
        if (viewport) {
            // Small delay ensures DOM is updated before scrolling
            setTimeout(() => {
                viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
            }, 50);
        }
    }, []);


    // Effect to handle incoming messages
    useEffect(() => {
        if (!socket) return;

        const handleMessageResponse = (data: { text: string; username: string }) => {
            setMessages((prevMessages) => [
                ...prevMessages,
                { ...data, timestamp: Date.now() }
            ]);
        };

        // Cast socket to include chat events - Be cautious with casting
        const chatSocket = socket as Socket<ChatServerToClientEvents, ChatClientToServerEvents>;

        chatSocket.on('messageResponse', handleMessageResponse);

        // Cleanup listener on component unmount or socket change
        return () => {
            chatSocket.off('messageResponse', handleMessageResponse);
        };
    }, [socket]); // Depend only on socket

    // Effect to scroll down when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]); // Depend on messages and the stable scrollToBottom function


    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(event.target.value);
    };

    const handleSendMessage = (event?: React.FormEvent<HTMLFormElement>) => {
        if (event) event.preventDefault(); // Prevent form submission page reload

        if (newMessage.trim() && socket && username) {
            // Cast socket to include chat events
            const chatSocket = socket as Socket<ChatServerToClientEvents, ChatClientToServerEvents>;

            chatSocket.emit('message-global', { text: newMessage, username: username });
            setNewMessage(''); // Clear input after sending
            // Optimistic UI update (optional - adds message immediately)
            // setMessages(prev => [...prev, { text: newMessage, username: "You", timestamp: Date.now() }]);
            scrollToBottom(); // Scroll after sending
        } else {
            console.warn("Cannot send message: Socket not connected, username missing, or message empty.");
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-900/80 backdrop-blur-sm text-gray-200">
            {/* Header (Optional) */}
            {/* <div className="p-3 border-b border-gray-700 text-center text-sm font-mono text-blue-300">
        --- Global Chat Channel ---
      </div> */}

            {/* Message Display Area */}
            <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={msg.timestamp} className="flex flex-col">
                            {index === 0 || messages[index - 1].username !== msg.username ? (
                                <span className="text-xs font-medium text-purple-300 mb-1">
                                    {msg.username}
                                </span>
                            ) : null}
                            <div
                                className={`bg-gray-800/60 p-3 rounded-lg max-w-[85%] break-words ${msg.username === username ? "self-end" : "self-start"
                                    }`}
                            >
                                <p className="text-sm text-gray-100">{msg.text}</p>
                            </div>
                            <span className="text-xs text-gray-500 mt-1 self-start">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-3 border-t border-gray-700/50">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <Input
                        type="text"
                        placeholder="Type message..."
                        value={newMessage}
                        onChange={handleInputChange}
                        className="flex-grow bg-gray-700/80 border-gray-600 text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-transparent placeholder-gray-400 px-3 py-2 text-sm"
                        autoComplete="off"
                    />
                    <Button
                        type="submit"
                        variant="outline" // Use outline or a custom variant
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white border-blue-700 hover:border-blue-600 px-4 rounded-md transition-colors duration-150"
                        disabled={!socket || !username || newMessage.trim() === ''}
                    >
                        Send
                    </Button>
                </form>
            </div>
        </div>
    );
}