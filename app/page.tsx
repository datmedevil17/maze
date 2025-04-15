"use client"
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Hexagon, Link2 } from "lucide-react"
import NetworkBackground from "@/components/networkBackground"

export default function Home() {
  const router = useRouter()
  const walletConnected = true
  const [selectedCursor, setSelectedCursor] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState<boolean>(false)
  const [name, setName] = useState('')

  const cursors = ["/cursors/cursor1.png", "/cursors/cursor2.png", "/cursors/cursor3.png", "/cursors/cursor4.png"]

  useEffect(() => {
    // Fade-in animation on load
    setIsVisible(true)
  }, [])

  const handleCursorSelect = (index: number) => {
    setSelectedCursor(index)
  }

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value.trim())
  }

  const handleContinue = () => {
    if (walletConnected && selectedCursor !== null && name) {
      // Fade-out animation before navigation
      setIsVisible(false)
      setTimeout(() => {
        localStorage.setItem("selectedCursor", cursors[selectedCursor])
        localStorage.setItem("name", name) // Save the name
        router.push("/maze")
      }, 500)
    }
  }


  return (
    <main className="min-h-screen flex items-center justify-center bg-black overflow-hidden">
      <NetworkBackground />

      <div
        className={`relative z-10 w-full max-w-md px-4 transition-all duration-1000 ease-in-out transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
      >
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 animate-pulse-slow">
          <Hexagon className="w-24 h-24 text-blue-500 opacity-50" />
          <Link2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-blue-300" />
        </div>

        <Card className="border border-blue-900/50 bg-black/80 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-white animate-fade-in">Maze</CardTitle>
            <CardDescription className="text-center text-blue-300 animate-fade-in-delay">
              Connect your wallet and choose your cursor to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 animate-fade-in-delay-2">
              <h3 className="text-md font-medium text-blue-300">Step 1: Connect Wallet</h3>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>

            {walletConnected && (
              <div className="space-y-4 animate-fade-in-delay-2">
                <h3 className="text-md font-medium text-blue-300">Step 2: Enter Your Name</h3>
                <div className="flex justify-center">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={handleNameChange}
                    className="w-full p-2 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-400"
                  />
                </div>
              </div>
            )}

            <div
              className={`space-y-4 transition-all duration-500 ${walletConnected
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-50 pointer-events-none transform translate-y-4"
                }`}
            >
              <h3 className="text-md font-medium text-blue-300">Step 3: Choose Your Cursor</h3>
              <div className="grid grid-cols-2 gap-4">
                {cursors.map((cursor, index) => (
                  <div
                    key={index}
                    className={`
                      relative p-4 border rounded-lg cursor-pointer transition-all duration-300
                      ${selectedCursor === index
                        ? "border-blue-500 bg-blue-900/20 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        : "border-gray-800 hover:border-blue-700 bg-gray-900/50 hover:bg-gray-900/80 hover:scale-[1.03]"
                      }
                    `}
                    onClick={() => handleCursorSelect(index)}
                  >
                    <div className="flex items-center justify-center h-20">
                      <Image
                        src={cursor}
                        alt={`Cursor ${index + 1}`}
                        width={64}
                        height={64}
                        className="object-contain transition-transform duration-300 hover:scale-110"
                      />
                    </div>
                    {selectedCursor === index && (
                      <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className={`
                w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 
                text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                ${walletConnected && selectedCursor !== null && name ? "animate-pulse-subtle" : ""}
              `}
              disabled={!walletConnected || selectedCursor === null || !name}
              onClick={handleContinue}
            >
              Continue to Maze
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
