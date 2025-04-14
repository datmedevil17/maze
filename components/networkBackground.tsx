"use client"

import { useEffect, useRef } from "react"

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
}

interface Connection {
  from: number
  to: number
  age: number
  maxAge: number
}

const VIRTUAL_WIDTH = 4000
const VIRTUAL_HEIGHT = 4000
const NODE_COUNT = 300 // reasonable number to avoid clutter

const NetworkBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Resize canvas on window resize
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", resizeCanvas)

    const nodes: Node[] = []
    const connections: Connection[] = []

    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * VIRTUAL_WIDTH,
        y: Math.random() * VIRTUAL_HEIGHT,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        color: `rgba(59, 130, 246, ${Math.random() * 0.5 + 0.4})`,
      })
    }

    const animate = () => {
      const scrollX = window.scrollX
      const scrollY = window.scrollY

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update & draw nodes that are in viewport
      nodes.forEach((node, index) => {
        node.x += node.vx
        node.y += node.vy

        // Bounce off virtual walls
        if (node.x < 0 || node.x > VIRTUAL_WIDTH) node.vx *= -1
        if (node.y < 0 || node.y > VIRTUAL_HEIGHT) node.vy *= -1

        // Only draw if within visible area (+margin for smooth entry)
        const margin = 100
        const inView =
          node.x > scrollX - margin &&
          node.x < scrollX + window.innerWidth + margin &&
          node.y > scrollY - margin &&
          node.y < scrollY + window.innerHeight + margin

        if (!inView) return

        ctx.beginPath()
        ctx.arc(node.x - scrollX, node.y - scrollY, node.radius, 0, Math.PI * 2)
        ctx.fillStyle = node.color
        ctx.fill()

        // Randomly create new connections
        if (Math.random() < 0.01) {
          const targetIndex = Math.floor(Math.random() * nodes.length)
          if (targetIndex !== index) {
            connections.push({
              from: index,
              to: targetIndex,
              age: 0,
              maxAge: 100 + Math.random() * 100,
            })
          }
        }
      })

      // Draw visible connections
      for (let i = connections.length - 1; i >= 0; i--) {
        const connection = connections[i]
        connection.age++

        if (connection.age > connection.maxAge) {
          connections.splice(i, 1)
          continue
        }

        const fromNode = nodes[connection.from]
        const toNode = nodes[connection.to]

        const opacity = 1 - connection.age / connection.maxAge

        // Only draw if both nodes are in view
        const isVisible =
          fromNode.x > scrollX - 100 &&
          fromNode.x < scrollX + window.innerWidth + 100 &&
          fromNode.y > scrollY - 100 &&
          fromNode.y < scrollY + window.innerHeight + 100 &&
          toNode.x > scrollX - 100 &&
          toNode.x < scrollX + window.innerWidth + 100 &&
          toNode.y > scrollY - 100 &&
          toNode.y < scrollY + window.innerHeight + 100

        if (!isVisible) continue

        ctx.beginPath()
        ctx.moveTo(fromNode.x - scrollX, fromNode.y - scrollY)
        ctx.lineTo(toNode.x - scrollX, toNode.y - scrollY)
        ctx.strokeStyle = `rgba(59, 130, 246, ${opacity * 0.7})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none"
      style={{ background: "black" }}
    />
  )
}

export default NetworkBackground
