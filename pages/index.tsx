"use client"


import { useState, useEffect, useCallback, useRef } from "react"


// Types for our game
type Direction = "up" | "down" | "left" | "right"
type ArrowType = "normal" | "double" | "fast" | "reverse" | "bonus" | "hidden"
type GameState = "start" | "playing" | "gameover" | "success"
type Theme = "default" | "neon" | "retro" | "dark" | "forest" | "sunset" | "ocean" | "candy"
type SettingsState = "closed" | "open"
type DeviceType = "mobile" | "tablet" | "desktop"
type DifficultyLevel = "easy" | "medium" | "hard" | "expert"


interface Arrow {
  direction: Direction
  type: ArrowType
}


interface Notification {
  text: string
  duration: number
  style?: string
}


export default function ArrowGame() {
  // Game configuration
  const [sequence, setSequence] = useState<Arrow[]>([])
  const [userSequence, setUserSequence] = useState<Direction[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [gameState, setGameState] = useState<GameState>("start")
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [timeLeft, setTimeLeft] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [combo, setCombo] = useState(1)
  const [timePerArrow, setTimePerArrow] = useState(2000) // ms per arrow
  const [lastInputTime, setLastInputTime] = useState(0)
  const [gameSpeed, setGameSpeed] = useState(1)
  const [viewportHeight, setViewportHeight] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(0)
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop")
  const [showHint, setShowHint] = useState(false)
  const [notification, setNotification] = useState<Notification>({ text: "", duration: 0 })
  const [notificationQueue, setNotificationQueue] = useState<Notification[]>([])
  const [isProcessingNotification, setIsProcessingNotification] = useState(false)
  const [theme, setTheme] = useState<Theme>("default")
  const [settingsState, setSettingsState] = useState<SettingsState>("closed")
  const [isFullyVisible, setIsFullyVisible] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium")
  const [isMounted, setIsMounted] = useState(false)


  // Refs for animations
  const containerRef = useRef<HTMLDivElement>(null)
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null)


  // Set isMounted to true after component mounts
  useEffect(() => {
    setIsMounted(true)
  }, [])


  // Update viewport dimensions and device type
  useEffect(() => {
    if (!isMounted) return;


    const updateViewport = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const landscape = vw > vh


      setViewportHeight(vh)
      setViewportWidth(vw)
      setIsLandscape(landscape)


      // Improved device type detection with more granular breakpoints
      if (vw < 360) {
        setDeviceType("mobile") // Small mobile
      } else if (vw < 480) {
        setDeviceType("mobile") // Standard mobile
      } else if (vw < 768) {
        setDeviceType("tablet") // Small tablet/large mobile
      } else if (vw < 1024) {
        setDeviceType("tablet") // Standard tablet
      } else {
        setDeviceType("desktop") // Desktop and larger
      }


      // Check if game container fits in viewport
      if (gameContainerRef.current) {
        const rect = gameContainerRef.current.getBoundingClientRect()
        setIsFullyVisible(rect.top >= 0 && rect.bottom <= vh)
      }
    }


    updateViewport()
    window.addEventListener("resize", updateViewport)
    
    // Also update on orientation change for mobile devices
    window.addEventListener("orientationchange", () => {
      // Short delay to ensure the browser has completed the orientation change
      setTimeout(updateViewport, 100)
    })


    // Initial check after a short delay to ensure DOM is fully rendered
    setTimeout(updateViewport, 300)


    return () => {
      window.removeEventListener("resize", updateViewport)
      window.removeEventListener("orientationchange", updateViewport)
    }
  }, [isMounted])


  // Adjust layout when game container visibility changes
  useEffect(() => {
    if (!isFullyVisible && gameContainerRef.current) {
      // Scroll to center the game container if it's not fully visible
      gameContainerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }
  }, [isFullyVisible, gameState])


  // Handle notification queue
  useEffect(() => {
    if (notificationQueue.length > 0 && !isProcessingNotification) {
      const nextNotification = notificationQueue[0]
      const newQueue = notificationQueue.slice(1)


      setIsProcessingNotification(true)
      setNotification(nextNotification)
      setNotificationQueue(newQueue)


      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current)
      }


      notificationTimerRef.current = setTimeout(() => {
        setNotification({ text: "", duration: 0 })
        setIsProcessingNotification(false)
      }, nextNotification.duration)
    }
  }, [notificationQueue, isProcessingNotification])


  // Add notification to queue
  const addNotification = (text: string, duration: number, style?: string) => {
    // Add notification to queue
    setNotificationQueue((prev) => {
      // Filter out notifications with the same text to prevent duplicates
      const filtered = prev.filter((n) => n.text !== text)
      return [...filtered, { text, duration, style }]
    })
  }


  // Generate a random sequence based on the current level and difficulty
  const generateSequence = useCallback(() => {
    const directions: Direction[] = ["up", "down", "left", "right"]
    const newSequence: Arrow[] = []


    // Base sequence length varies by difficulty
    let baseLength = 3 + Math.floor(level / 2)
    let sequenceLength = baseLength + Math.floor(level / 3)
    
    // Adjust sequence length based on difficulty
    switch(difficulty) {
      case "easy":
        baseLength = Math.max(2, baseLength - 1);
        sequenceLength = baseLength + Math.floor(level / 4);
        break;
      case "medium":
        // Default values
        break;
      case "hard":
        baseLength = baseLength + 1;
        sequenceLength = baseLength + Math.floor(level / 2);
        break;
      case "expert":
        baseLength = baseLength + 2;
        sequenceLength = baseLength + Math.floor(level / 1.5);
        break;
    }


    for (let i = 0; i < sequenceLength; i++) {
      const randomIndex = Math.floor(Math.random() * directions.length)
      const direction = directions[randomIndex]


      // Determine arrow type based on level, difficulty, and randomness
      let type: ArrowType = "normal"
      const rand = Math.random()


      // Probability adjustments based on difficulty
      const difficultyMultiplier = {
        "easy": 0.7,
        "medium": 1,
        "hard": 1.3,
        "expert": 1.5
      }[difficulty];
      
      const adjustedLevel = Math.floor(level * difficultyMultiplier);


      if (adjustedLevel >= 3 && rand > 0.7) {
        // Level 3+: Introduce double arrows
        type = "double"
      } else if (adjustedLevel >= 5 && rand > 0.8) {
        // Level 5+: Introduce fast arrows
        type = "fast"
      } else if (adjustedLevel >= 7 && rand > 0.85) {
        // Level 7+: Introduce reverse arrows
        type = "reverse"
      } else if (adjustedLevel >= 9 && rand > 0.9) {
        // Level 9+: Introduce hidden arrows
        type = "hidden"
      } else if (adjustedLevel >= 2 && rand > 0.9) {
        // Level 2+: Introduce bonus arrows
        type = "bonus"
      }


      newSequence.push({ direction, type })
    }


    return newSequence
  }, [level, difficulty])


  // Start a new game
  const startGame = useCallback(() => {
    // Clear any existing notifications
    setNotification({ text: "", duration: 0 })
    setNotificationQueue([])
    setIsProcessingNotification(false)


    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current)
    }


    const newSequence = generateSequence()
    setSequence(newSequence)
    setUserSequence([])
    setCurrentIndex(0)
    setGameState("playing")
    
    // Adjust time based on difficulty
    let baseTime = 10 + level * 2;
    switch(difficulty) {
      case "easy":
        baseTime += 5;
        break;
      case "medium":
        // Default time
        break;
      case "hard":
        baseTime -= 2;
        break;
      case "expert":
        baseTime -= 4;
        break;
    }
    setTimeLeft(Math.max(5, baseTime));
    
    setStreak(0)
    setCombo(1)
    
    // Adjust game speed based on level and difficulty
    const difficultySpeedModifier = {
      "easy": 0.8,
      "medium": 1,
      "hard": 1.2,
      "expert": 1.5
    }[difficulty];
    
    setGameSpeed(1 + (level - 1) * 0.1 * difficultySpeedModifier)
    
    // Adjust time per arrow based on level and difficulty
    const baseTimePerArrow = Math.max(2000 - (level - 1) * 150, 800);
    setTimePerArrow(baseTimePerArrow * (1 / difficultySpeedModifier))
    
    setLastInputTime(Date.now())
  }, [generateSequence, level, difficulty])


  // Calculate score based on timing and combo
  const calculateScore = (timeTaken: number) => {
    const baseScore = 10 * level
    const timeBonus = Math.max(0, 1 - timeTaken / timePerArrow) * 10
    const comboMultiplier = combo


    return Math.floor(baseScore * (1 + timeBonus) * comboMultiplier)
  }


  // Handle keyboard input
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (gameState !== "playing") return


      let direction: Direction | null = null


      switch (e.key) {
        case "ArrowUp":
          direction = "up"
          break
        case "ArrowDown":
          direction = "down"
          break
        case "ArrowLeft":
          direction = "left"
          break
        case "ArrowRight":
          direction = "right"
          break
        case "h": // Hint key
          if (currentIndex < sequence.length && sequence[currentIndex].type === "hidden") {
            setShowHint(true)
            setTimeout(() => setShowHint(false), 500)
          }
          return
        default:
          return // Ignore other keys
      }


      if (direction) {
        handleInput(direction)
      }
    },
    [
      gameState,
      sequence,
      currentIndex,
      userSequence,
      score,
      highScore,
      level,
      combo,
      streak,
      lastInputTime,
      timePerArrow,
    ],
  )


  // Handle input (from keyboard or button)
  const handleInput = (direction: Direction) => {
    if (gameState !== "playing") return


    const currentArrow = sequence[currentIndex]
    const currentTime = Date.now()
    const timeTaken = currentTime - lastInputTime
    setLastInputTime(currentTime)


    // For reverse arrows, the input should be the opposite
    let expectedDirection = currentArrow.direction
    if (currentArrow.type === "reverse") {
      const opposites: Record<Direction, Direction> = {
        up: "down",
        down: "up",
        left: "right",
        right: "left",
      }
      expectedDirection = opposites[expectedDirection]
    }


    const newUserSequence = [...userSequence, direction]
    setUserSequence(newUserSequence)


    // Check if the input is correct
    if (direction !== expectedDirection) {
      // Wrong input
      // For bonus arrows, don't end game on mistake
      if (currentArrow.type === "bonus") {
        // Just skip this arrow
        const nextIndex = currentIndex + 1
        setCurrentIndex(nextIndex)
        setStreak(0)
        setCombo(1)


        // Check if sequence is complete
        if (nextIndex === sequence.length) {
          const newScore = score + level * sequence.length * 5 // Reduced score for missing bonus
          setScore(newScore)
          updateHighScore(newScore)
          setGameState("success")
        }
      } else {
        // Game over for normal arrows
        setGameState("gameover")
      }
      return
    }


    // Correct input
    const nextIndex = currentIndex + 1


    // Update streak and combo
    const newStreak = streak + 1
    setStreak(newStreak)


    // Every 3 correct inputs increases combo
    if (newStreak % 3 === 0) {
      const newCombo = combo + 1
      setCombo(newCombo)
    }


    // Check for perfect timing (within 20% of ideal time)
    const isPerfect = timeTaken < timePerArrow * 0.5


    // Double arrows require a second press
    if (currentArrow.type === "double" && !userSequence.length) {
      // First press of double arrow, stay on same index
      return
    }


    // Move to next arrow
    setCurrentIndex(nextIndex)


    // Add score
    const pointsToAdd = arrowScore(currentArrow.type, timeTaken)


    const newScore = score + pointsToAdd
    setScore(newScore)


    // Check if sequence is complete
    if (nextIndex === sequence.length) {
      updateHighScore(newScore)
      setGameState("success")
    }
  }


  // Calculate score based on arrow type and timing
  const arrowScore = (type: ArrowType, timeTaken: number) => {
    const baseScore = calculateScore(timeTaken)


    // Bonus points for special arrows
    switch (type) {
      case "bonus":
        return baseScore * 3
      case "fast":
        return baseScore * 2
      case "hidden":
        return baseScore * 4
      default:
        return baseScore
    }
  }


  // Update high score if needed
  const updateHighScore = (newScore: number) => {
    if (newScore > highScore) {
      setHighScore(newScore)
      localStorage.setItem("arrowGameHighScore", newScore.toString())
    }
  }


  // Handle on-screen arrow button clicks
  const handleArrowClick = (direction: Direction) => {
    handleInput(direction)
  }


  // Handle hint button click
  const handleHintClick = () => {
    if (currentIndex < sequence.length && sequence[currentIndex].type === "hidden") {
      setShowHint(true)
      setTimeout(() => setShowHint(false), 500)
    }
  }


  // Move to next level
  const nextLevel = () => {
    setLevel(level + 1)
    startGame()
  }


  // Restart the game
  const restartGame = () => {
    setScore(0)
    setLevel(1)
    setStreak(0)
    setCombo(1)
    startGame()
  }


  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null


    if (gameState === "playing" && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (gameState === "playing" && timeLeft === 0) {
      setGameState("gameover")
    }


    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [gameState, timeLeft])


  // Keyboard event listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])


  // Load high score from localStorage
  useEffect(() => {
    if (!isMounted) return;
    
    const savedHighScore = localStorage.getItem("arrowGameHighScore")
    if (savedHighScore) {
      setHighScore(Number.parseInt(savedHighScore))
    }
  }, [isMounted])


  // Load theme from localStorage
  useEffect(() => {
    if (!isMounted) return;
    
    const savedTheme = localStorage.getItem("arrowGameTheme")
    if (savedTheme) {
      setTheme(savedTheme as Theme)
    }
  }, [isMounted])


  // Load difficulty from localStorage
  useEffect(() => {
    if (!isMounted) return;
    
    const savedDifficulty = localStorage.getItem("arrowGameDifficulty")
    if (savedDifficulty) {
      setDifficulty(savedDifficulty as DifficultyLevel)
    }
  }, [isMounted])


  // Handle theme change
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem("arrowGameTheme", newTheme)
  }


  // Toggle settings menu
  const toggleSettings = () => {
    setSettingsState(settingsState === "closed" ? "open" : "closed")
  }


  // Return to home/start screen
  const goToHome = () => {
    setGameState("start")
    // Clear any existing notifications
    setNotification({ text: "", duration: 0 })
    setNotificationQueue([])
    setIsProcessingNotification(false)


    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current)
    }
  }


  // Create firework effect
  const createFirework = (x: number, y: number) => {
    if (!containerRef.current || !isMounted) return


    const colors = [
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#ffff00",
      "#ff00ff",
      "#00ffff",
      "#ff8800",
      "#8800ff",
      "#ff5500",
      "#00ffaa",
      "#aa00ff",
      "#ffaa00",
    ]


    // Create particles per firework
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement("div")
      particle.className = "absolute w-2 h-2 rounded-full"
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      particle.style.left = `${x}px`
      particle.style.top = `${y}px`


      // Random direction
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 4
      const vx = Math.cos(angle) * speed
      const vy = Math.sin(angle) * speed


      // Animation
      let posX = 0
      let posY = 0
      let opacity = 1
      let frame = 0
      let size = 2 + Math.random() * 3


      const animate = () => {
        frame++
        posX += vx
        posY += vy + 0.1 * frame // Add gravity
        opacity -= 0.02
        size *= 0.99


        particle.style.transform = `translate(${posX}px, ${posY}px)`
        particle.style.opacity = opacity.toString()
        particle.style.width = `${size}px`
        particle.style.height = `${size}px`


        if (opacity > 0) {
          requestAnimationFrame(animate)
        } else {
          particle.remove()
        }
      }


      containerRef.current.appendChild(particle)
      requestAnimationFrame(animate)
    }
  }


  // Create energy wave effect
  const createEnergyWave = (x: number, y: number) => {
    if (!containerRef.current || !isMounted) return


    const wave = document.createElement("div")
    wave.className = "absolute rounded-full border-4 border-cyan-400 z-10"
    wave.style.left = `${x}px`
    wave.style.top = `${y}px`
    wave.style.width = "10px"
    wave.style.height = "10px"
    wave.style.transform = "translate(-50%, -50%)"


    let size = 10
    let opacity = 1


    const animate = () => {
      size += 15
      opacity -= 0.02


      wave.style.width = `${size}px`
      wave.style.height = `${size}px`
      wave.style.opacity = opacity.toString()


      if (opacity > 0) {
        requestAnimationFrame(animate)
      } else {
        wave.remove()
      }
    }


    containerRef.current.appendChild(wave)
    requestAnimationFrame(animate)
  }


  // Celebration effect
  useEffect(() => {
    if (!isMounted) return;
    
    if (gameState === "success" && containerRef.current) {
      // Create multiple fireworks
      const container = containerRef.current
      const width = container.offsetWidth
      const height = container.offsetHeight


      // Initial fireworks
      for (let i = 0; i < 8; i++) {
        const x = Math.random() * width
        const y = Math.random() * height * 0.6
        setTimeout(() => createFirework(x, y), i * 200)
      }


      // Energy wave from center
      const centerX = width / 2
      const centerY = height / 2
      setTimeout(() => createEnergyWave(centerX, centerY), 300)


      // Additional fireworks
      const interval = setInterval(() => {
        const x = Math.random() * width
        const y = Math.random() * height * 0.6
        createFirework(x, y)
      }, 600)


      return () => clearInterval(interval)
    }
  }, [gameState, isMounted])


  // Render arrow component with improved responsiveness
  const Arrow = ({
    arrowData,
    active = false,
    current = false,
  }: {
    arrowData: Arrow
    active?: boolean
    current?: boolean
  }) => {
    const { direction, type } = arrowData


    // Determine arrow style based on type
    const getArrowStyle = () => {
      if (active) return "bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg shadow-green-500/50 border border-green-300/50"


      switch (type) {
        case "double":
          return "bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg shadow-purple-500/50 border-2 border-purple-300/70"
        case "fast":
          return "bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/50 border border-red-300/50"
        case "reverse":
          return "bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-lg shadow-orange-500/50 border border-orange-300/50"
        case "bonus":
          return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/50 border-2 border-yellow-300/70"
        case "hidden":
          return "bg-gradient-to-br from-slate-500 to-slate-700 text-white/0 shadow-lg shadow-slate-500/50 border-2 border-slate-400/70"
        default:
          return current
            ? "bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-lg shadow-cyan-500/50 border border-cyan-300/50"
            : "bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-md hover:shadow-lg hover:from-slate-600 hover:to-slate-800 border border-slate-600/30"
      }
    }


    // Get icon based on arrow type
    const getArrowIcon = () => {
      const baseIcon = {
        up: "↑",
        down: "↓",
        left: "←",
        right: "→",
      }[direction]


      if (type === "double") return `${baseIcon}${baseIcon}`
      if (type === "fast") return `${baseIcon}⚡`
      if (type === "reverse") return `${baseIcon}⟲`
      if (type === "bonus") return `${baseIcon}★`
      if (type === "hidden") return showHint ? baseIcon : "?"


      return baseIcon
    }


    // Animation based on arrow type
    const getAnimation = () => {
      if (!current) return ""


      switch (type) {
        case "fast":
          return "animate-pulse-fast"
        case "double":
          return "animate-bounce"
        case "reverse":
          return "animate-spin-slow"
        case "bonus":
          return "animate-pulse"
        case "hidden":
          return "animate-pulse-slow"
        default:
          return "animate-pulse"
      }
    }


    // Add a 3D transform effect on hover for better interactivity
    return (
      <button
        className={`${getArrowSize()} flex items-center justify-center rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 hover:rotate-1 ${getArrowStyle()} ${getAnimation()} ${current ? 'active-glow' : ''} cursor-pointer`}
        onClick={() => handleArrowClick(direction)}
        disabled={gameState !== "playing"}
        style={{
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          fontWeight: 'bold'
        }}
      >
        {getArrowIcon()}
      </button>
    )
  }


  // Stat Card component
  const StatCard = ({
    label,
    value,
    highlight = false,
  }: { label: string; value: string | number; highlight?: boolean }) => {
    return (
      <div
        className={`bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5 min-w-16 text-center transition-all duration-300 border border-white/20 ${
          highlight ? "ring-2 ring-yellow-400 scale-110 bg-white/20" : ""
        }`}
        style={{
          boxShadow: highlight ? '0 0 10px rgba(250, 204, 21, 0.5)' : '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        <p className="text-xs font-medium text-white/70 uppercase tracking-wider">{label}</p>
        <p className={`${deviceType === "mobile" ? "text-lg" : "text-2xl"} font-bold`}
           style={{textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}
        >{value}</p>
      </div>
    )
  }


  // Determine container size based on device type and viewport with improved responsiveness
  const getContainerSize = () => {
    // For mobile in landscape, use a different layout
    if (deviceType === "mobile" && isLandscape) {
      return "max-w-full h-full p-2 mx-auto flex-row"
    }


    // More granular sizing based on viewport width
    if (viewportWidth < 360) {
      return "max-w-full p-2 mx-auto" // Very small devices, maximize space
    } else if (viewportWidth < 480) {
      return "max-w-sm p-3 mx-auto" // Standard mobile
    } else if (viewportWidth < 768) {
      return "max-w-md p-4 mx-auto" // Large mobile/small tablet
    } else if (viewportWidth < 1024) {
      return "max-w-lg p-5 mx-auto" // Standard tablet
    } else {
      return "max-w-xl p-6 mx-auto" // Desktop and larger
    }
  }


  // Size based on device type with improved granularity
  const getArrowSize = () => {
    // For very small screens
    if (viewportWidth < 320) {
      return "w-10 h-10 text-lg"
    }
    
    // Mobile devices in landscape need more compact UI
    if (deviceType === "mobile" && isLandscape) {
      return "w-12 h-12 text-xl"
    }


    // Size based on both device type and viewport width for better adaptability
    if (deviceType === "mobile") {
      return "w-14 h-14 text-2xl"
    } else if (deviceType === "tablet") {
      return viewportWidth < 768 ? "w-14 h-14 text-2xl" : "w-16 h-16 text-3xl"
    } else {
      return "w-20 h-20 text-4xl" // Desktop
    }
  }


  // Get sequence display size based on device type with improved granularity
  const getSequenceItemSize = () => {
    // For very small screens
    if (viewportWidth < 320) {
      return "w-6 h-6 text-xs"
    }
    
    // For landscape mobile, make sequence items smaller to fit more
    if (deviceType === "mobile" && isLandscape) {
      return "w-7 h-7 text-xs"
    }
    
    // Based on device type with more granular sizing
    if (deviceType === "mobile") {
      return "w-8 h-8 text-sm"
    } else if (deviceType === "tablet") {
      return viewportWidth < 768 ? "w-9 h-9 text-base" : "w-10 h-10 text-lg"
    } else {
      return "w-14 h-14 text-2xl" // Desktop
    }
  }


  // Determine font sizes based on device type with improved granularity
  const getTitleSize = () => {
    if (viewportWidth < 320) {
      return "text-2xl"
    } else if (deviceType === "mobile") {
        return "text-3xl"
    } else if (deviceType === "tablet") {
      return viewportWidth < 768 ? "text-3xl" : "text-4xl"
    } else {
        return "text-5xl"
    }
  }


  // Specialized layout for mobile devices in landscape orientation
  const MobileLandscapeLayout = () => (
    <div className="flex flex-row h-full w-full">
      <div className="flex flex-col items-center justify-center h-full w-1/2 p-2">
        <div className={`mb-2 flex flex-wrap justify-center gap-1`}>
          {sequence.map((arrow, index) => {
            let bgColor = "bg-slate-700 text-white/70"
            if (index < currentIndex) bgColor = "bg-gradient-to-r from-green-400 to-green-600 text-white"
            if (index === currentIndex) {
              switch (arrow.type) {
                case "double":
                  bgColor =
                    "bg-gradient-to-r from-purple-500 to-purple-700 text-white animate-pulse border-2 border-purple-300"
                  break
                case "fast":
                  bgColor = "bg-gradient-to-r from-red-500 to-red-700 text-white animate-pulse-fast"
                  break
                case "reverse":
                  bgColor = "bg-gradient-to-r from-orange-500 to-orange-700 text-white animate-spin-slow"
                  break
                case "bonus":
                  bgColor =
                    "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white animate-pulse border-2 border-yellow-300"
                  break
                case "hidden":
                  bgColor =
                    "bg-gradient-to-r from-slate-500 to-slate-700 text-white/0 animate-pulse-slow border-2 border-slate-400"
                  break
                default:
                  bgColor = "bg-gradient-to-r from-cyan-400 to-cyan-600 text-white animate-pulse"
              }
            }


            // Get icon based on arrow type
            const getArrowIcon = () => {
              const baseIcon = {
                up: "↑",
                down: "↓",
                left: "←",
                right: "→",
              }[arrow.direction]


              if (arrow.type === "double") return `${baseIcon}${baseIcon}`
              if (arrow.type === "fast") return `${baseIcon}⚡`
              if (arrow.type === "reverse") return `${baseIcon}⟲`
              if (arrow.type === "bonus") return `${baseIcon}★`
              if (arrow.type === "hidden") return index === currentIndex && showHint ? baseIcon : "?"


              return baseIcon
            }


            return (
              <div
                key={index}
                className={`${getSequenceItemSize()} flex items-center justify-center rounded-xl shadow-md ${bgColor}`}
              >
                {getArrowIcon()}
              </div>
            )
          })}
        </div>


        <p className="mb-2 text-center text-white/80 text-xs font-medium">
          Press arrow keys or tap buttons
        </p>


        {/* Hint button for hidden arrows */}
        {currentIndex < sequence.length && sequence[currentIndex].type === "hidden" && (
          <button
            onClick={handleHintClick}
            className="mt-1 mb-2 px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded-lg text-xs font-medium transition-colors"
          >
            Hint (H)
          </button>
        )}


        <div className="mt-auto h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
            style={{ width: `${(currentIndex / sequence.length) * 100}%` }}
          />
        </div>
      </div>


      <div className="flex items-center justify-center h-full w-1/2 p-2">
        <div className="grid grid-cols-3 gap-2">
          <div className="col-start-2">
            <Arrow
              arrowData={{
                direction: "up",
                type:
                  currentIndex < sequence.length && sequence[currentIndex].direction === "up"
                    ? sequence[currentIndex].type
                    : "normal",
              }}
              active={userSequence[currentIndex] === "up"}
              current={currentIndex < sequence.length && sequence[currentIndex].direction === "up"}
            />
          </div>
          <div>
            <Arrow
              arrowData={{
                direction: "left",
                type:
                  currentIndex < sequence.length && sequence[currentIndex].direction === "left"
                    ? sequence[currentIndex].type
                    : "normal",
              }}
              active={userSequence[currentIndex] === "left"}
              current={currentIndex < sequence.length && sequence[currentIndex].direction === "left"}
            />
          </div>
          <div>
            <Arrow
              arrowData={{
                direction: "down",
                type:
                  currentIndex < sequence.length && sequence[currentIndex].direction === "down"
                    ? sequence[currentIndex].type
                    : "normal",
              }}
              active={userSequence[currentIndex] === "down"}
              current={currentIndex < sequence.length && sequence[currentIndex].direction === "down"}
            />
          </div>
          <div>
            <Arrow
              arrowData={{
                direction: "right",
                type:
                  currentIndex < sequence.length && sequence[currentIndex].direction === "right"
                    ? sequence[currentIndex].type
                    : "normal",
              }}
              active={userSequence[currentIndex] === "right"}
              current={currentIndex < sequence.length && sequence[currentIndex].direction === "right"}
            />
          </div>
        </div>
      </div>
    </div>
  )


  // Get notification style based on text content
  const getNotificationStyle = () => {
    const baseSize = deviceType === "mobile" ? "text-3xl" : "text-5xl"
    const baseStyles = "font-bold tracking-wider px-6 py-2 rounded-lg shadow-lg backdrop-blur-sm"


    if (notification.style) {
      return `${baseSize} ${baseStyles} ${notification.style}`
    }


    // Default styles based on text content
    if (notification.text.includes("PERFECT")) {
      return `${baseSize} ${baseStyles} bg-green-500/30 text-green-300 border-2 border-green-400 animate-scale-fade`
    }
    if (notification.text.includes("MISS")) {
      return `${baseSize} ${baseStyles} bg-red-500/30 text-red-300 border-2 border-red-400 animate-shake`
    }
    if (notification.text.includes("LEVEL UP")) {
      return `${baseSize} ${baseStyles} bg-yellow-500/30 text-yellow-300 border-2 border-yellow-400 animate-scale-fade`
    }
    if (notification.text.includes("COMBO")) {
      return `text-2xl sm:text-3xl ${baseStyles} bg-purple-500/30 text-purple-300 border-2 border-purple-400 animate-float-up`
    }


    return notification.text
      ? `${baseSize} ${baseStyles} bg-blue-500/30 text-blue-300 border-2 border-blue-400`
      : "hidden"
  }


  // Get theme-specific styles
  const getThemeBackground = () => {
    switch (theme) {
      case "neon":
        return "bg-gradient-to-br from-black via-purple-900 to-black"
      case "retro":
        return "bg-gradient-to-br from-amber-900 via-red-800 to-amber-900"
      case "dark":
        return "bg-gradient-to-br from-gray-900 via-gray-800 to-black"
      case "forest":
        return "bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900"
      case "sunset":
        return "bg-gradient-to-br from-orange-600 via-pink-500 to-purple-700"
      case "ocean":
        return "bg-gradient-to-br from-blue-900 via-cyan-800 to-indigo-900"
      case "candy":
        return "bg-gradient-to-br from-pink-500 via-purple-400 to-indigo-500"
      default:
        return "bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900"
    }
  }


  const getThemeGrid = () => {
    switch (theme) {
      case "neon":
        return "bg-[radial-gradient(rgba(255,0,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"
      case "retro":
        return "bg-[radial-gradient(rgba(255,165,0,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"
      case "dark":
        return "bg-[radial-gradient(rgba(100,100,100,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"
      case "forest":
        return "bg-[radial-gradient(rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:30px_30px]"
      case "sunset":
        return "bg-[radial-gradient(rgba(251,146,60,0.1)_1px,transparent_1px)] bg-[size:35px_35px]"
      case "ocean":
        return "bg-[radial-gradient(rgba(14,165,233,0.1)_1px,transparent_1px)] bg-[size:25px_25px]"
      case "candy":
        return "bg-[radial-gradient(rgba(216,180,254,0.15)_2px,transparent_2px)] bg-[size:20px_20px]"
      default:
        return "bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"
    }
  }


  const getThemeParticles = () => {
    switch (theme) {
      case "neon":
        return "bg-pink-500/20"
      case "retro":
        return "bg-amber-500/20"
      case "dark":
        return "bg-gray-400/10"
      case "forest":
        return "bg-emerald-500/20"
      case "sunset":
        return "bg-orange-400/20"
      case "ocean":
        return "bg-cyan-400/20"
      case "candy":
        return "bg-violet-400/20"
      default:
        return "bg-white/10"
    }
  }


  const getThemeGlow1 = () => {
    switch (theme) {
      case "neon":
        return "bg-pink-500/30"
      case "retro":
        return "bg-amber-500/20"
      case "dark":
        return "bg-gray-600/10"
      case "forest":
        return "bg-green-500/30"
      case "sunset":
        return "bg-orange-500/30"
      case "ocean":
        return "bg-blue-500/30"
      case "candy":
        return "bg-pink-400/30"
      default:
        return "bg-cyan-500/20"
    }
  }


  const getThemeGlow2 = () => {
    switch (theme) {
      case "neon":
        return "bg-cyan-500/30"
      case "retro":
        return "bg-red-500/20"
      case "dark":
        return "bg-gray-700/10"
      case "forest":
        return "bg-teal-500/30"
      case "sunset":
        return "bg-pink-500/30"
      case "ocean":
        return "bg-indigo-500/30"
      case "candy":
        return "bg-purple-500/30"
      default:
        return "bg-purple-500/20"
    }
  }


  const getThemeGlow3 = () => {
    switch (theme) {
      case "neon":
        return "bg-green-500/30"
      case "retro":
        return "bg-yellow-500/20"
      case "dark":
        return "bg-gray-500/10"
      case "forest":
        return "bg-emerald-600/30"
      case "sunset":
        return "bg-purple-500/30"
      case "ocean":
        return "bg-cyan-600/30"
      case "candy":
        return "bg-indigo-500/30"
      default:
        return "bg-blue-500/20"
    }
  }


  const getThemeTitle = () => {
    switch (theme) {
      case "neon":
        return "from-pink-400 to-cyan-400 font-['Audiowide',cursive]"
      case "retro":
        return "from-amber-400 to-red-400 font-['Press_Start_2P',cursive]"
      case "dark":
        return "from-gray-400 to-gray-300 font-['Orbitron',sans-serif]"
      case "forest":
        return "from-green-400 to-emerald-400 font-['Cabin_Sketch',cursive]"
      case "sunset":
        return "from-orange-400 to-pink-400 font-['Pacifico',cursive]"
      case "ocean":
        return "from-blue-400 to-cyan-400 font-['Quicksand',sans-serif]"
      case "candy":
        return "from-pink-400 to-purple-400 font-['Bubblegum_Sans',cursive]"
      default:
        return "from-cyan-400 to-purple-400 font-['Montserrat',sans-serif]"
    }
  }


  const getThemeButton = () => {
    switch (theme) {
      case "neon":
        return "from-pink-500 to-cyan-600 hover:from-pink-400 hover:to-cyan-500 shadow-cyan-500/30"
      case "retro":
        return "from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 shadow-amber-500/30"
      case "dark":
        return "from-gray-600 to-gray-800 hover:from-gray-500 hover:to-gray-700 shadow-gray-500/30"
      case "forest":
        return "from-green-500 to-teal-600 hover:from-green-400 hover:to-teal-500 shadow-green-500/30"
      case "sunset":
        return "from-orange-500 to-pink-600 hover:from-orange-400 hover:to-pink-500 shadow-orange-500/30"
      case "ocean":
        return "from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 shadow-blue-500/30"
      case "candy":
        return "from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 shadow-pink-500/30"
      default:
        return "from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-blue-500/30"
    }
  }


  // Handle difficulty change
  const handleDifficultyChange = (newDifficulty: DifficultyLevel) => {
    setDifficulty(newDifficulty)
    localStorage.setItem("arrowGameDifficulty", newDifficulty)
  }


  // Add touch gesture support for swipe controls on mobile
  useEffect(() => {
    if (deviceType !== "mobile" || gameState !== "playing") return;
    
    let touchStartX = 0;
    let touchStartY = 0;
    const minSwipeDistance = 30; // Minimum distance for swipe detection
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (gameState !== "playing") return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      
      // Determine if horizontal or vertical swipe was stronger
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0) {
            handleInput("right");
          } else {
            handleInput("left");
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
          if (deltaY > 0) {
            handleInput("down");
          } else {
            handleInput("up");
          }
        }
      }
    };
    
    // Add touch event listeners
    if (gameContainerRef.current) {
      gameContainerRef.current.addEventListener("touchstart", handleTouchStart);
      gameContainerRef.current.addEventListener("touchend", handleTouchEnd);
    }
    
    return () => {
      if (gameContainerRef.current) {
        gameContainerRef.current.removeEventListener("touchstart", handleTouchStart);
        gameContainerRef.current.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [deviceType, gameState, handleInput]);


  // Client-side animated particles component to avoid hydration issues
  const AnimatedParticles = () => {
    // Generate particles only on client-side
    const particles = [...Array(deviceType === "mobile" ? 10 : 20)].map((_, i) => {
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const duration = 5 + Math.random() * 10;
      const opacity = Math.random() * 0.5 + 0.1;
      
      return (
        <div
          key={i}
          className={`absolute w-2 h-2 rounded-full ${getThemeParticles()}`}
          style={{
            top: `${top}%`,
            left: `${left}%`,
            animation: `float ${duration}s linear infinite`,
            opacity: opacity,
          }}
        />
      );
    });
    
    return <>{particles}</>;
  };


  return (
    <>
      {!isMounted ? (
        // Simple loading state while client-side code initializes
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <div className="animate-pulse text-white text-xl">Loading...</div>
        </div>
      ) : (
        <div
          className="min-h-screen h-screen flex flex-col items-center justify-center p-2 text-white relative overflow-hidden touch-manipulation"
          ref={containerRef}
        >
          {/* Game background */}
          <div className="absolute inset-0 overflow-hidden -z-10">
            {/* Background gradient based on theme */}
            <div className={`absolute inset-0 ${getThemeBackground()}`}></div>


            {/* Grid lines */}
            <div className={`absolute inset-0 ${getThemeGrid()}`}></div>


            {/* Animated particles - client-side only component */}
            <AnimatedParticles />


            {/* Glow effects */}
            <div className={`absolute top-1/4 -left-20 w-60 h-60 ${getThemeGlow1()} rounded-full blur-3xl`}></div>
            <div className={`absolute bottom-1/4 -right-20 w-80 h-80 ${getThemeGlow2()} rounded-full blur-3xl`}></div>
            <div className={`absolute top-3/4 left-1/3 w-40 h-40 ${getThemeGlow3()} rounded-full blur-3xl`}></div>
          </div>


          {/* Menu and Settings Buttons */}
          <div className="fixed top-2 right-2 z-50 flex gap-2 sm:gap-3 safe-area-right" style={{ 
            top: 'max(8px, env(safe-area-inset-top, 8px))',
            right: 'max(8px, env(safe-area-inset-right, 8px))'
          }}>
            {gameState !== "start" && !deviceType.includes("mobile") && (
              <button
                onClick={goToHome}
                className="w-8 h-8 min-w-8 min-h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer border border-white/10 shadow-lg active:scale-95 transform"
                aria-label="Home"
                style={{ touchAction: "manipulation" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={deviceType === "mobile" ? "14" : "20"}
                  height={deviceType === "mobile" ? "14" : "20"}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </button>
            )}
            <button
              onClick={toggleSettings}
              className="w-8 h-8 min-w-8 min-h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer border border-white/10 shadow-lg active:scale-95 transform"
              aria-label="Settings"
              style={{ touchAction: "manipulation" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={deviceType === "mobile" ? "14" : "20"}
                height={deviceType === "mobile" ? "14" : "20"}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 0 1-1.74V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>


          {/* Settings Modal */}
          {settingsState === "open" && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-slate-800 rounded-xl p-3 sm:p-4 max-w-sm w-full mx-4 border border-white/10">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg sm:text-xl font-bold">Settings</h2>
                  <button
                    onClick={toggleSettings}
                    className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 cursor-pointer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  </button>
                </div>


                <div className="mb-3 sm:mb-4">
                  <h3 className="text-sm font-medium mb-2">Game Difficulty</h3>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => handleDifficultyChange("easy")}
                      className={`p-2 rounded-lg flex flex-col items-center text-xs ${difficulty === "easy" ? "bg-green-700/70 ring-1 ring-green-400" : "bg-slate-700/50 hover:bg-slate-700"} cursor-pointer`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      <span>Easy</span>
                    </button>


                    <button
                      onClick={() => handleDifficultyChange("medium")}
                      className={`p-2 rounded-lg flex flex-col items-center text-xs ${difficulty === "medium" ? "bg-blue-700/70 ring-1 ring-blue-400" : "bg-slate-700/50 hover:bg-slate-700"} cursor-pointer`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Medium</span>
                    </button>


                    <button
                      onClick={() => handleDifficultyChange("hard")}
                      className={`p-2 rounded-lg flex flex-col items-center text-xs ${difficulty === "hard" ? "bg-orange-700/70 ring-1 ring-orange-400" : "bg-slate-700/50 hover:bg-slate-700"} cursor-pointer`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Hard</span>
                    </button>


                    <button
                      onClick={() => handleDifficultyChange("expert")}
                      className={`p-2 rounded-lg flex flex-col items-center text-xs ${difficulty === "expert" ? "bg-red-700/70 ring-1 ring-red-400" : "bg-slate-700/50 hover:bg-slate-700"} cursor-pointer`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Expert</span>
                    </button>
                  </div>
                </div>


                <div className="mb-3 sm:mb-4">
                  <h3 className="text-sm font-medium mb-2">Game Theme</h3>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => handleThemeChange("default")}
                      className={`p-2 rounded-lg flex flex-col items-center text-xs ${theme === "default" ? "bg-slate-700 ring-1 ring-cyan-400" : "bg-slate-700/50 hover:bg-slate-700"} cursor-pointer`}
                    >
                      <div className="w-5 h-5 rounded-full mb-1 bg-gradient-to-r from-cyan-400 to-purple-400"></div>
                      <span>Default</span>
                    </button>


                    <button
                      onClick={() => handleThemeChange("neon")}
                      className={`p-2 rounded-lg flex flex-col items-center text-xs ${theme === "neon" ? "bg-slate-700 ring-1 ring-pink-400" : "bg-slate-700/50 hover:bg-slate-700"} cursor-pointer`}
                    >
                      <div className="w-5 h-5 rounded-full mb-1 bg-gradient-to-r from-pink-400 to-cyan-400"></div>
                      <span>Gamer</span>
                    </button>


                    <button
                      onClick={() => handleThemeChange("retro")}
                      className={`p-2 rounded-lg flex flex-col items-center text-xs ${theme === "retro" ? "bg-slate-700 ring-1 ring-amber-400" : "bg-slate-700/50 hover:bg-slate-700"} cursor-pointer`}
                    >
                      <div className="w-5 h-5 rounded-full mb-1 bg-gradient-to-r from-amber-400 to-red-400"></div>
                      <span>Retro</span>
                    </button>


                    <button
                      onClick={() => handleThemeChange("dark")}
                      className={`p-2 rounded-lg flex flex-col items-center text-xs ${theme === "dark" ? "bg-slate-700 ring-1 ring-gray-400" : "bg-slate-700/50 hover:bg-slate-700"} cursor-pointer`}
                    >
                      <div className="w-5 h-5 rounded-full mb-1 bg-gradient-to-r from-gray-400 to-gray-700"></div>
                      <span>Dark</span>
                    </button>
                    
                    <button
                      onClick={() => handleThemeChange("forest")}
                      className={`p-2 rounded-lg flex flex-col items-center text-xs ${theme === "forest" ? "bg-slate-700 ring-1 ring-green-400" : "bg-slate-700/50 hover:bg-slate-700"} cursor-pointer`}
                    >
                      <div className="w-5 h-5 rounded-full mb-1 bg-gradient-to-r from-green-400 to-emerald-400"></div>
                      <span>Forest</span>
                    </button>
                    
                    <button
                      onClick={() => handleThemeChange("sunset")}
                      className={`p-2 rounded-lg flex flex-col items-center text-xs ${theme === "sunset" ? "bg-slate-700 ring-1 ring-orange-400" : "bg-slate-700/50 hover:bg-slate-700"} cursor-pointer`}
                    >
                      <div className="w-5 h-5 rounded-full mb-1 bg-gradient-to-r from-orange-400 to-pink-400"></div>
                      <span>Sunset</span>
                    </button>
                    
                    <button
                      onClick={() => handleThemeChange("ocean")}
                      className={`p-2 rounded-lg flex flex-col items-center text-xs ${theme === "ocean" ? "bg-slate-700 ring-1 ring-blue-400" : "bg-slate-700/50 hover:bg-slate-700"} cursor-pointer`}
                    >
                      <div className="w-5 h-5 rounded-full mb-1 bg-gradient-to-r from-blue-400 to-cyan-400"></div>
                      <span>Ocean</span>
                    </button>
                    
                    <button
                      onClick={() => handleThemeChange("candy")}
                      className={`p-2 rounded-lg flex flex-col items-center text-xs ${theme === "candy" ? "bg-slate-700 ring-1 ring-purple-400" : "bg-slate-700/50 hover:bg-slate-700"} cursor-pointer`}
                    >
                      <div className="w-5 h-5 rounded-full mb-1 bg-gradient-to-r from-pink-400 to-purple-400"></div>
                      <span>Candy</span>
                    </button>
                  </div>
                </div>


                <button
                  onClick={toggleSettings}
                  className={`w-full py-2 bg-gradient-to-r ${getThemeButton()} rounded-lg font-bold transition-all duration-300 text-sm cursor-pointer`}
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}


          {/* Game content wrapper - ensures everything fits in viewport */}
          <div
            className={`flex ${deviceType === "mobile" && isLandscape ? "flex-row" : "flex-col"} items-center justify-center h-full w-full max-h-screen overflow-hidden`}
          >
            {/* Game header - compact for mobile */}
            <div className={`text-center relative w-full mb-1 ${deviceType === "mobile" ? "mb-0.5" : "mb-2"} z-10`}>
              {gameState !== "start" && deviceType === "mobile" && (
                <div className="fixed top-2 left-2 z-[100]" style={{ 
                  top: 'max(8px, env(safe-area-inset-top, 8px))',
                  left: 'max(8px, env(safe-area-inset-left, 8px))'
                }}>
                  <button
                    onClick={goToHome}
                    className="w-8 h-8 min-w-8 min-h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer border border-white/10 shadow-lg active:scale-95 transform"
                    aria-label="Home"
                    style={{ touchAction: "manipulation" }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white"
                    >
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  </button>
                </div>
              )}
              <h1
                className={`${getTitleSize()} font-bold mb-1 sm:mb-2 bg-clip-text text-transparent bg-gradient-to-r ${getThemeTitle()} drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] tracking-wider`}
                style={{letterSpacing: '0.05em'}}
              >
                ARROW MASTER
              </h1>
              <div className="flex gap-1 sm:gap-2 justify-center flex-wrap">
                <StatCard label="Score" value={score} highlight={notification.text.includes("COMBO")} />
                <StatCard label="High" value={highScore} />
                <StatCard label="Level" value={level} highlight={notification.text.includes("LEVEL UP")} />
                <StatCard label="Combo" value={`${combo}x`} highlight={notification.text.includes("COMBO")} />
                {gameState === "playing" && <StatCard label="Time" value={`${timeLeft}s`} highlight={timeLeft <= 5} />}
                <StatCard 
                  label="Difficulty" 
                  value={difficulty.charAt(0).toUpperCase()} 
                  highlight={false} 
                />
              </div>
            </div>


            {/* Game container */}
            <div
              className={`bg-black/30 backdrop-blur-md rounded-2xl ${getContainerSize()} w-full border border-white/10 shadow-[0_0_15px_rgba(123,97,255,0.3)] z-10 relative flex-1 flex ${deviceType === "mobile" && isLandscape ? "flex-row" : "flex-col"} justify-center max-h-[80vh] sm:max-h-[85vh]`}
              ref={gameContainerRef}
            >
              {/* Global notification system */}
              {notification.text && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                  <div className={getNotificationStyle()}>{notification.text}</div>
                </div>
              )}


              {gameState === "start" && (
                <div className={`text-center px-2 sm:px-4 flex flex-col max-h-full justify-center ${deviceType === "mobile" ? "overflow-auto" : "overflow-visible"}`}>
                  <h2
                    className={`${deviceType === "mobile" ? "text-xl" : "text-2xl sm:text-3xl"} font-bold mb-1 sm:mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] tracking-wider`}
                    style={{ 
                      fontFamily: "'Audiowide', cursive",
                      letterSpacing: "0.05em",
                      textShadow: "0 0 10px rgba(0, 255, 255, 0.4)" 
                    }}
                  >
                    How to Play
                  </h2>
                  <div className="mb-2 sm:mb-3 text-white/80 space-y-1 sm:space-y-2 text-xs sm:text-sm">
                    <p style={{ fontFamily: "'Quicksand', sans-serif", letterSpacing: "0.03em" }} className="text-sm sm:text-base font-medium">
                      Press the arrow keys or tap the arrows in the correct sequence.
                    </p>


                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="bg-purple-900/30 backdrop-blur-sm p-2 sm:p-3 rounded-lg border border-purple-500/30 shadow-[0_0_10px_rgba(147,51,234,0.2)] transition-all duration-300 hover:scale-105 hover:bg-purple-900/50 hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(147,51,234,0.4)] cursor-pointer">
                        <div 
                          className="text-purple-400 font-bold mb-0.5 text-xs sm:text-sm" 
                          style={{ fontFamily: "'Orbitron', sans-serif" }}
                        >
                          Double Arrows
                        </div>
                        <div className="text-xs text-purple-200/80" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                          Press the same arrow twice
                        </div>
                      </div>
                      <div className="bg-red-900/30 backdrop-blur-sm p-2 sm:p-3 rounded-lg border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)] transition-all duration-300 hover:scale-105 hover:bg-red-900/50 hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer">
                        <div 
                          className="text-red-400 font-bold mb-0.5 text-xs sm:text-sm"
                          style={{ fontFamily: "'Orbitron', sans-serif" }}
                        >
                          Fast Arrows
                        </div>
                        <div className="text-xs text-red-200/80" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                          Press quickly for bonus points
                        </div>
                      </div>
                      <div className="bg-orange-900/30 backdrop-blur-sm p-2 sm:p-3 rounded-lg border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)] transition-all duration-300 hover:scale-105 hover:bg-orange-900/50 hover:border-orange-500/50 hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] cursor-pointer">
                        <div 
                          className="text-orange-400 font-bold mb-0.5 text-xs sm:text-sm"
                          style={{ fontFamily: "'Orbitron', sans-serif" }}
                        >
                          Reverse Arrows
                        </div>
                        <div className="text-xs text-orange-200/80" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                          Press the opposite direction
                        </div>
                      </div>
                      <div className="bg-yellow-900/30 backdrop-blur-sm p-2 sm:p-3 rounded-lg border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)] transition-all duration-300 hover:scale-105 hover:bg-yellow-900/50 hover:border-yellow-500/50 hover:shadow-[0_0_15px_rgba(234,179,8,0.4)] cursor-pointer">
                        <div 
                          className="text-yellow-400 font-bold mb-0.5 text-xs sm:text-sm"
                          style={{ fontFamily: "'Orbitron', sans-serif" }}
                        >
                          Bonus Arrows
                        </div>
                        <div className="text-xs text-yellow-200/80" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                          Triple points, no penalty for mistakes
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-xs sm:text-sm font-medium mb-1" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                      Difficulty: <span className={
                      difficulty === "easy" ? "text-green-400" :
                      difficulty === "medium" ? "text-blue-400" :
                      difficulty === "hard" ? "text-orange-400" :
                      "text-red-400"
                    } style={{ fontFamily: "'Orbitron', sans-serif" }}>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>
                    </p>
                    <div className="flex justify-center gap-1 sm:gap-2">
                      <button
                        onClick={() => handleDifficultyChange("easy")}
                        className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition-all duration-300 cursor-pointer transform hover:scale-105 ${difficulty === "easy" ? "bg-green-600 shadow-[0_0_10px_rgba(74,222,128,0.4)]" : "bg-slate-600/60 hover:bg-slate-500"}`}
                        style={{ fontFamily: "'Orbitron', sans-serif" }}
                      >
                        Easy
                      </button>
                      <button 
                        onClick={() => handleDifficultyChange("medium")}
                        className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition-all duration-300 cursor-pointer transform hover:scale-105 ${difficulty === "medium" ? "bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.4)]" : "bg-slate-600/60 hover:bg-slate-500"}`}
                        style={{ fontFamily: "'Orbitron', sans-serif" }}
                      >
                        Medium
                      </button>
                      <button 
                        onClick={() => handleDifficultyChange("hard")}
                        className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition-all duration-300 cursor-pointer transform hover:scale-105 ${difficulty === "hard" ? "bg-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.4)]" : "bg-slate-600/60 hover:bg-slate-500"}`}
                        style={{ fontFamily: "'Orbitron', sans-serif" }}
                      >
                        Hard
                      </button>
                      <button 
                        onClick={() => handleDifficultyChange("expert")}
                        className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition-all duration-300 cursor-pointer transform hover:scale-105 ${difficulty === "expert" ? "bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.4)]" : "bg-slate-600/60 hover:bg-slate-500"}`}
                        style={{ fontFamily: "'Orbitron', sans-serif" }}
                      >
                        Expert
                      </button>
                    </div>
                  </div>


                  <div className="flex justify-center">
                    <button
                      onClick={startGame}
                      className={`px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r ${getThemeButton()} rounded-full font-bold text-base sm:text-lg transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg cursor-pointer`}
                      style={{ 
                        fontFamily: "'Audiowide', cursive",
                        letterSpacing: "0.08em",
                        boxShadow: "0 0 15px rgba(0, 255, 255, 0.4)"
                      }}
                    >
                      Start Game
                    </button>
                  </div>
                </div>
              )}


              {gameState === "playing" && (
                <div
                  className={`flex ${deviceType === "mobile" && isLandscape ? "flex-row" : "flex-col"} items-center justify-between h-full w-full`}
                >
                  {deviceType === "mobile" && isLandscape ? (
                    // Use the specialized layout component for mobile landscape
                    <MobileLandscapeLayout />
                  ) : (
                    // Portrait layout (existing code with enhancements)
                    <>
                      <div
                        className={`mb-2 sm:mb-4 flex flex-wrap justify-center gap-1 sm:gap-2 ${deviceType === "mobile" ? "px-1" : "px-2"}`}
                      >
                        {sequence.map((arrow, index) => {
                          let bgColor = "bg-slate-700 text-white/70"
                          if (index < currentIndex) bgColor = "bg-gradient-to-r from-green-400 to-green-600 text-white"
                          if (index === currentIndex) {
                            switch (arrow.type) {
                              case "double":
                                bgColor =
                                  "bg-gradient-to-r from-purple-500 to-purple-700 text-white animate-pulse border-2 border-purple-300"
                                break
                              case "fast":
                                bgColor = "bg-gradient-to-r from-red-500 to-red-700 text-white animate-pulse-fast"
                                break
                              case "reverse":
                                bgColor = "bg-gradient-to-r from-orange-500 to-orange-700 text-white animate-spin-slow"
                                break
                              case "bonus":
                                bgColor =
                                  "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white animate-pulse border-2 border-yellow-300"
                                break
                              case "hidden":
                                bgColor =
                                  "bg-gradient-to-r from-slate-500 to-slate-700 text-white/0 animate-pulse-slow border-2 border-slate-400"
                                break
                              default:
                                bgColor = "bg-gradient-to-r from-cyan-400 to-cyan-600 text-white animate-pulse"
                            }
                          }


                          // Get icon based on arrow type
                          const getArrowIcon = () => {
                            const baseIcon = {
                              up: "↑",
                              down: "↓",
                              left: "←",
                              right: "→",
                            }[arrow.direction]


                            if (arrow.type === "double") return `${baseIcon}${baseIcon}`
                            if (arrow.type === "fast") return `${baseIcon}⚡`
                            if (arrow.type === "reverse") return `${baseIcon}⟲`
                            if (arrow.type === "bonus") return `${baseIcon}★`
                            if (arrow.type === "hidden") return index === currentIndex && showHint ? baseIcon : "?"


                            return baseIcon
                          }


                          return (
                            <div
                              key={index}
                              className={`${getSequenceItemSize()} flex items-center justify-center rounded-xl shadow-md ${bgColor}`}
                            >
                              {getArrowIcon()}
                            </div>
                          )
                        })}
                      </div>


                      <p className="mb-2 sm:mb-3 text-center text-white/80 text-xs sm:text-sm font-medium">
                        Press the correct arrow keys or tap the buttons below
                      </p>


                      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3">
                        <div className="col-start-2">
                          <Arrow
                            arrowData={{
                              direction: "up",
                              type:
                                currentIndex < sequence.length && sequence[currentIndex].direction === "up"
                                  ? sequence[currentIndex].type
                                  : "normal",
                            }}
                            active={userSequence[currentIndex] === "up"}
                            current={currentIndex < sequence.length && sequence[currentIndex].direction === "up"}
                          />
                        </div>
                        <div>
                          <Arrow
                            arrowData={{
                              direction: "left",
                              type:
                                currentIndex < sequence.length && sequence[currentIndex].direction === "left"
                                  ? sequence[currentIndex].type
                                  : "normal",
                            }}
                            active={userSequence[currentIndex] === "left"}
                            current={currentIndex < sequence.length && sequence[currentIndex].direction === "left"}
                          />
                        </div>
                        <div>
                          <Arrow
                            arrowData={{
                              direction: "down",
                              type:
                                currentIndex < sequence.length && sequence[currentIndex].direction === "down"
                                  ? sequence[currentIndex].type
                                  : "normal",
                            }}
                            active={userSequence[currentIndex] === "down"}
                            current={currentIndex < sequence.length && sequence[currentIndex].direction === "down"}
                          />
                        </div>
                        <div>
                          <Arrow
                            arrowData={{
                              direction: "right",
                              type:
                                currentIndex < sequence.length && sequence[currentIndex].direction === "right"
                                  ? sequence[currentIndex].type
                                  : "normal",
                            }}
                            active={userSequence[currentIndex] === "right"}
                            current={currentIndex < sequence.length && sequence[currentIndex].direction === "right"}
                          />
                        </div>
                      </div>


                      {/* Hint button for hidden arrows */}
                      {currentIndex < sequence.length && sequence[currentIndex].type === "hidden" && (
                        <button
                          onClick={handleHintClick}
                          className="mt-1 mb-2 px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                        >
                          Hint (H)
                        </button>
                      )}


                      <div className="mt-auto h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                          style={{ width: `${(currentIndex / sequence.length) * 100}%` }}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}


              {gameState === "gameover" && (
                <div className="text-center">
                  <h2
                    className={`${deviceType === "mobile" ? "text-2xl" : "text-3xl sm:text-4xl"} font-bold mb-2 text-red-500`}
                  >
                    Game Over!
                  </h2>
                  <p className="mb-1 text-sm sm:text-base">
                    You reached level {level} with a score of {score}.
                  </p>
                  <p className="mb-1 text-xs text-white/70">
                    Difficulty: <span className={
                      difficulty === "easy" ? "text-green-400" :
                      difficulty === "medium" ? "text-blue-400" :
                      difficulty === "hard" ? "text-orange-400" :
                      "text-red-400"
                    }>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>
                  </p>
                  <button
                    onClick={restartGame}
                    className={`px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r ${getThemeButton()} rounded-full font-bold text-base transition-all duration-300 transform hover:scale-105 shadow-lg cursor-pointer`}
                  >
                    Play Again
                  </button>
                </div>
              )}


              {gameState === "success" && (
                <div className="text-center">
                  <h2
                    className={`${deviceType === "mobile" ? "text-2xl" : "text-3xl sm:text-4xl"} font-bold mb-2 text-green-400`}
                  >
                    Level Complete!
                  </h2>
                  <p className="mb-1 text-sm sm:text-base">Great job! You completed level {level}.</p>
                  <p className="mb-1 text-lg sm:text-xl font-bold">Score: {score}</p>
                  
                  <p className="mb-1 text-xs text-white/70">
                    Difficulty: <span className={
                      difficulty === "easy" ? "text-green-400" :
                      difficulty === "medium" ? "text-blue-400" :
                      difficulty === "hard" ? "text-orange-400" :
                      "text-red-400"
                    }>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>
                  </p>


                  {combo > 1 && (
                    <p className="mb-4 text-yellow-300 text-sm">
                      {combo}x Combo Bonus! {streak} correct in a row!
                    </p>
                  )}


                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                  <button
                    onClick={nextLevel}
                    className={`px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r ${getThemeButton()} rounded-full font-bold text-base transition-all duration-300 transform hover:scale-105 shadow-lg cursor-pointer`}
                  >
                    Next Level
                  </button>
                      
                      {level > 2 && (
                        <button
                          onClick={() => {
                            handleDifficultyChange(
                              difficulty === "easy" ? "medium" :
                              difficulty === "medium" ? "hard" :
                              difficulty === "hard" ? "expert" : "easy"
                            );
                            setTimeout(nextLevel, 100);
                          }}
                          className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-700 rounded-full font-bold text-base transition-all duration-300 transform hover:scale-105 shadow-lg cursor-pointer"
                        >
                          {difficulty === "expert" ? "Easier" : "Harder"}
                        </button>
                      )}
                  </div>
                </div>
              )}
            </div>


            {/* Instructions - only show on larger screens or when not playing */}
            {(deviceType !== "mobile" || gameState !== "playing") && (
              <div className="mt-1 text-center text-xs text-white/60 z-10">
                <p>Use keyboard arrow keys or tap the on-screen buttons</p>
              </div>
            )}


            {/* Add instructions for swipe controls on mobile */}
            {deviceType === "mobile" && gameState === "playing" && (
              <div className="mt-1 text-center text-xs text-white/60 z-10">
                <p>Swipe in any direction or tap buttons</p>
              </div>
            )}
          </div>


          {/* CSS for animations */}
          <style jsx global>{`
            /* Import custom fonts for our themes */
            @import url('https://fonts.googleapis.com/css2?family=Audiowide&family=Press+Start+2P&family=Orbitron:wght@400;700&family=Cabin+Sketch:wght@400;700&family=Pacifico&family=Quicksand:wght@400;700&family=Bubblegum+Sans&family=Montserrat:wght@400;700&display=swap');
            
            /* Game title with text shadow and enhanced appearance */
            h1 {
              text-shadow: 0 4px 8px rgba(0, 0, 0, 0.6);
              letter-spacing: 2px;
            }
            
            /* Add a subtle pulsing glow to buttons on hover */
            button:hover {
              filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
            }
            
            /* Add pointer cursor to all interactive elements */
            button, 
            a,
            .cursor-pointer,
            [role="button"],
            [onclick] {
              cursor: pointer !important;
            }
            
            /* Enhanced animations */
            @keyframes float {
              0% {
                transform: translateY(0) translateX(0);
              }
              25% {
                transform: translateY(-20px) translateX(10px);
              }
              50% {
                transform: translateY(0) translateX(20px);
              }
              75% {
                transform: translateY(20px) translateX(10px);
              }
              100% {
                transform: translateY(0) translateX(0);
              }
            }
            
            @keyframes float-up {
              0% {
                transform: translateY(0);
                opacity: 0;
              }
              20% {
                transform: translateY(-10px);
                opacity: 1;
              }
              80% {
                transform: translateY(-40px);
                opacity: 1;
              }
              100% {
                transform: translateY(-60px);
                opacity: 0;
              }
            }
            
            @keyframes scale-fade {
              0% {
                transform: scale(0.5);
                opacity: 0;
              }
              20% {
                transform: scale(1.2);
                opacity: 1;
              }
              80% {
                transform: scale(1.2);
                opacity: 1;
              }
              100% {
                transform: scale(1);
                opacity: 0;
              }
            }
            
            @keyframes shake {
              0%, 100% {
                transform: translateX(0);
              }
              20%, 60% {
                transform: translateX(-10px);
              }
              40%, 80% {
                transform: translateX(10px);
              }
            }


            @keyframes pulse-fast {
              0%, 100% {
                opacity: 1;
                filter: brightness(1.2);
              }
              50% {
                opacity: 0.5;
                filter: brightness(0.8);
              }
            }
            
            @keyframes pulse-slow {
              0%, 100% {
                opacity: 1;
                transform: scale(1);
              }
              50% {
                opacity: 0.3;
                transform: scale(0.95);
              }
            }
            
            @keyframes spin-slow {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }
            
            /* Glowing effect for active elements */
            .active-glow {
              box-shadow: 0 0 15px 5px rgba(255, 255, 255, 0.3);
              animation: pulse 1.5s infinite ease-in-out;
            }
            
            @keyframes pulse {
              0%, 100% {
                box-shadow: 0 0 15px 5px rgba(255, 255, 255, 0.3);
              }
              50% {
                box-shadow: 0 0 25px 10px rgba(255, 255, 255, 0.5);
              }
            }
            
            /* Enhanced mobile responsiveness */
            html, body {
              overflow: hidden;
              height: 100%;
              touch-action: manipulation;
              overscroll-behavior: none;
              -webkit-overflow-scrolling: touch;
              -webkit-text-size-adjust: 100%;
            }
            
            /* Improved touch handling */
            * {
              touch-action: manipulation;
              -webkit-tap-highlight-color: transparent;
            }
            
            /* Prevent text selection */
            .no-select {
              user-select: none;
              -webkit-user-select: none;
            }
            
            /* Responsive font sizing with more breakpoints */
            @media (max-width: 320px) {
              html {
                font-size: 12px;
              }
            }
            
            @media (min-width: 321px) and (max-width: 375px) {
              html {
                font-size: 14px;
              }
            }
            
            @media (min-width: 376px) and (max-width: 480px) {
              html {
                font-size: 15px;
              }
            }
            
            /* Fix for iOS safe areas */
            @supports (padding-top: env(safe-area-inset-top)) {
              .safe-area-top {
                padding-top: env(safe-area-inset-top);
              }
              .safe-area-bottom {
                padding-bottom: env(safe-area-inset-bottom);
              }
            }
          `}</style>
        </div>
      )}
    </>
  )
}










