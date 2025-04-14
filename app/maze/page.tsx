"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import NetworkBackground from "@/components/networkBackground"

export default function Dashboard() {
  const router = useRouter()
  const [selectedCursor, setSelectedCursor] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Fade-in animation on load
    setIsVisible(true)

    // Get the selected cursor from localStorage
    const cursor = localStorage.getItem("selectedCursor")
    // console.log(cursor);
    setSelectedCursor(cursor)

    // Apply the custom cursor to the body
    if (cursor) {
      document.body.style.cursor = `url('${cursor}') 16 16, auto`
    }
  }, [])

  const handleBack = () => {
    setIsVisible(false)
    setTimeout(() => {
      router.push("/")
    }, 500)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black overflow-hidden  w-[4000px] h-[4000px]">
      <NetworkBackground />

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
  )
}
