"use client"

import { useEffect, useRef, useCallback } from "react"

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

// Keep the virtual area large for the "infinite" effect
const VIRTUAL_WIDTH = 4000
const VIRTUAL_HEIGHT = 4000
const NODE_COUNT = 300 // Adjust as needed

const NetworkBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameId = useRef<number | null>(null) // To store animation frame ID for cleanup
  const nodesRef = useRef<Node[]>([]) // Use ref for nodes/connections to avoid dependency issues in animate
  const connectionsRef = useRef<Connection[]>([])
  const parentRef = useRef<HTMLElement | null>(null) // To store parent element ref


  // Memoize handlers to prevent recreating them on every render
  const updateParentInfo = useCallback(() => {
    const parent = parentRef.current
    if (!parent) return


    const canvas = canvasRef.current
    if (canvas && (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight)) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
        console.log("Canvas resized to:", parent.clientWidth, parent.clientHeight); // Debug log
    }
  }, []) // No dependencies, relies on refs

  const handleResize = useCallback(() => {
    // Update parent info which includes resizing the canvas
    updateParentInfo()
  }, [updateParentInfo])


  // Effect for initialization and setting up animation loop + listeners
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const parent = canvas.parentElement
    if (!parent) {
        console.error("NetworkBackground needs a parent element.")
        return
    }
    parentRef.current = parent // Store parent element

    // Ensure parent can contain the absolutely positioned canvas
    // Parent needs position: relative, absolute, or fixed.
    // We log a warning if it's static.
    const parentPosition = window.getComputedStyle(parent).position;
    if (parentPosition === 'static') {
        console.warn("NetworkBackground parent should have a non-static position (e.g., relative, absolute, fixed) for correct positioning.");
    }


    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Initialize nodes only once
    if (nodesRef.current.length === 0) {
        for (let i = 0; i < NODE_COUNT; i++) {
          nodesRef.current.push({
            x: Math.random() * VIRTUAL_WIDTH,
            y: Math.random() * VIRTUAL_HEIGHT,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2 + 1,
            color: `rgba(59, 130, 246, ${Math.random() * 0.5 + 0.4})`, // Example blueish color
          })
        }
    }

    // --- Animation Logic ---
    const animate = () => {
      // Read current scroll and size directly from state/refs for the animation frame
      // This avoids making animate dependent on state values that change often
      const currentScroll = {x: parentRef.current?.scrollLeft ?? 0, y: parentRef.current?.scrollTop ?? 0}
      const currentSize = {width: parentRef.current?.clientWidth ?? 0, height: parentRef.current?.clientHeight ?? 0}

      if (currentSize.width === 0 || currentSize.height === 0 || !ctx) {
         // Don't draw if canvas has no size or context is lost
         animationFrameId.current = requestAnimationFrame(animate);
         return;
      }

      ctx.clearRect(0, 0, currentSize.width, currentSize.height)

      const nodes = nodesRef.current
      const connections = connectionsRef.current
      const margin = 100 // Margin for drawing elements slightly outside viewport

      // Update & draw nodes
      nodes.forEach((node, index) => {
        node.x += node.vx
        node.y += node.vy

        // Bounce off virtual walls
        if (node.x - node.radius < 0 || node.x + node.radius > VIRTUAL_WIDTH) node.vx *= -1
        if (node.y - node.radius < 0 || node.y + node.radius > VIRTUAL_HEIGHT) node.vy *= -1
         // Clamp position just in case they escape slightly
        node.x = Math.max(node.radius, Math.min(VIRTUAL_WIDTH - node.radius, node.x));
        node.y = Math.max(node.radius, Math.min(VIRTUAL_HEIGHT - node.radius, node.y));


        // Check if node is within the parent's viewport (+ margin)
        const visibleX = node.x > currentScroll.x - margin && node.x < currentScroll.x + currentSize.width + margin
        const visibleY = node.y > currentScroll.y - margin && node.y < currentScroll.y + currentSize.height + margin
        const inView = visibleX && visibleY

        if (inView) {
          ctx.beginPath()
          // Draw relative to parent scroll offset
          ctx.arc(node.x - currentScroll.x, node.y - currentScroll.y, node.radius, 0, Math.PI * 2)
          ctx.fillStyle = node.color
          ctx.fill()
        }

        // Randomly create new connections (only consider nodes that *might* be visible soon)
         if (inView && Math.random() < 0.005) { // Reduced frequency a bit
            // Try to connect to a *nearby* node for better visual coherence
            const potentialTargets = nodes.map((targetNode, targetIndex) => {
                 if (targetIndex === index) return null;
                 const dx = targetNode.x - node.x;
                 const dy = targetNode.y - node.y;
                 const distSq = dx * dx + dy * dy;
                 // Connect to nodes within a certain range (e.g., 300px)
                 return distSq < 300 * 300 ? { index: targetIndex, distSq } : null;
            }).filter(t => t !== null).sort((a, b) => a!.distSq - b!.distSq);


            if (potentialTargets.length > 0) {
                 // Pick one of the closest nodes randomly
                const targetIndex = potentialTargets[Math.floor(Math.random() * Math.min(potentialTargets.length, 5))]!.index;

                // Avoid duplicate connections (simple check)
                const exists = connections.some(c => (c.from === index && c.to === targetIndex) || (c.from === targetIndex && c.to === index));

                if (!exists) {
                    connections.push({
                        from: index,
                        to: targetIndex,
                        age: 0,
                        maxAge: 150 + Math.random() * 150, // Slightly longer lifespan
                    });
                }
            }
        }
      })

      // Draw and manage connections
       for (let i = connections.length - 1; i >= 0; i--) {
           const connection = connections[i];
           connection.age++;

           if (connection.age > connection.maxAge) {
               connections.splice(i, 1);
               continue;
           }

           // Ensure nodes exist (should always be true unless NODE_COUNT changes drastically)
           if (!nodes[connection.from] || !nodes[connection.to]) {
                connections.splice(i, 1);
               continue;
           }

           const fromNode = nodes[connection.from];
           const toNode = nodes[connection.to];

           // Check if *both* nodes are potentially visible
           const fromVisible =
               fromNode.x > currentScroll.x - margin && fromNode.x < currentScroll.x + currentSize.width + margin &&
               fromNode.y > currentScroll.y - margin && fromNode.y < currentScroll.y + currentSize.height + margin;

           const toVisible =
               toNode.x > currentScroll.x - margin && toNode.x < currentScroll.x + currentSize.width + margin &&
               toNode.y > currentScroll.y - margin && toNode.y < currentScroll.y + currentSize.height + margin;

           // Only draw if *both* endpoints are within the extended viewport
           if (fromVisible && toVisible) {
                const opacity = 1 - connection.age / connection.maxAge;
                ctx.beginPath();
                ctx.moveTo(fromNode.x - currentScroll.x, fromNode.y - currentScroll.y);
                ctx.lineTo(toNode.x - currentScroll.x, toNode.y - currentScroll.y);
                // Use a slightly more visible base color for lines
                ctx.strokeStyle = `rgba(59, 130, 246, ${opacity * 0.5})`; // Adjusted opacity
                ctx.lineWidth = 0.5;
                ctx.stroke();
           }
       }

      animationFrameId.current = requestAnimationFrame(animate)
    }

    // --- Initial Setup and Listener Attachment ---
    updateParentInfo(); // Set initial size and scroll, resize canvas
    window.addEventListener("resize", handleResize)

    // Start animation
    animationFrameId.current = requestAnimationFrame(animate)


    // --- Cleanup ---
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
      window.removeEventListener("resize", handleResize)
      console.log("NetworkBackground cleanup ran.");
    }
  }, [handleResize, updateParentInfo]) // Add memoized handlers as dependencies

  return (
    <canvas
      ref={canvasRef}
      // Use absolute positioning to fill the parent
      className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none"
      // Set a background color directly or via parent's CSS
       style={{ background: "black" }}
    />
  )
}

export default NetworkBackground