import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { allEvents } from "@/types/mock-event-data"
import { ArrowRight, Calendar, Users, Heart, Play, Pause } from "lucide-react"
import { useState, useEffect, useRef } from "react"

export default function LandingPage() {
  // State to track which elements have been clicked
  const [clickedElements, setClickedElements] = useState<{
    person1: boolean;
    person2: boolean;
    person3: boolean;
    person4: boolean;
    person5: boolean;
    centerCircle: boolean;
  }>({
    person1: false,
    person2: false,
    person3: false,
    person4: false,
    person5: false,
    centerCircle: false,
  })

  // State to track animation sequences
  const [animationSequence, setAnimationSequence] = useState({
    isPlaying: false,
    currentStep: 0,
    totalSteps: 5,
    storyMode: false,
  })

  // State to track if all characters have been clicked
  const [allCharactersClicked, setAllCharactersClicked] = useState(false)

  // State to track auto-play mode
  const [autoPlay, setAutoPlay] = useState(false)

  // Ref to store timeouts for cleanup
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])

  // Check if all characters have been clicked
  useEffect(() => {
    const allClicked =
      clickedElements.person1 &&
      clickedElements.person2 &&
      clickedElements.person3 &&
      clickedElements.person4 &&
      clickedElements.person5

    setAllCharactersClicked(allClicked)

    // If all characters are clicked and center is clicked, start the story sequence
    if (allClicked && clickedElements.centerCircle && !animationSequence.storyMode) {
      startStorySequence()
    }
  }, [clickedElements])

  // Auto-play effect
  useEffect(() => {
    if (autoPlay && !animationSequence.isPlaying) {
      startAutoPlaySequence()
    }

    return () => {
      // Clean up any pending timeouts when component unmounts or autoPlay changes
      timeoutsRef.current.forEach((timeout) => {
        if (timeout) clearTimeout(timeout)
      })
      timeoutsRef.current = []
    }
  }, [autoPlay])

  // Function to toggle auto-play
  const toggleAutoPlay = () => {
    // If turning off auto-play, clear all timeouts
    if (autoPlay) {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
      timeoutsRef.current = []

      // Only reset if we're in the middle of a sequence
      if (animationSequence.isPlaying) {
        resetAnimations()
      }
    }

    setAutoPlay(!autoPlay)
  }

  // Function to start the auto-play sequence
  const startAutoPlaySequence = () => {
    // Reset any existing animations
    resetAnimations()

    // Start with a clean slate
    setTimeout(() => {
      // Click each character in sequence
      const addTimeout = (fn: () => void, delay: number) => {
        const timeout = setTimeout(fn, delay)
        timeoutsRef.current.push(timeout)
        return timeout
      }

      // Click person 1
      addTimeout(() => {
        handleElementClick("person1")
      }, 1000)

      // Click person 2
      addTimeout(() => {
        handleElementClick("person2")
      }, 3000)

      // Click person 3
      addTimeout(() => {
        handleElementClick("person3")
      }, 5000)

      // Click person 4
      addTimeout(() => {
        handleElementClick("person4")
      }, 7000)

      // Click person 5
      addTimeout(() => {
        handleElementClick("person5")
      }, 9000)

      // Click center to start story mode
      addTimeout(() => {
        handleElementClick("centerCircle")
      }, 11000)

      // After story sequence completes, restart if still in auto-play
      addTimeout(() => {
        if (autoPlay) {
          startAutoPlaySequence()
        }
      }, 22000) // Story sequence takes about 9-10 seconds, plus the 11 seconds above
    }, 500)
  }

  // Function to handle element clicks
  const handleElementClick = (element: keyof typeof clickedElements) => {
    // If a sequence is already playing, don't allow new clicks
    if (animationSequence.isPlaying && animationSequence.storyMode) return

    setClickedElements((prev) => ({
      ...prev,
      [element]: !prev[element],
    }))

    // If clicking a character, play its individual sequence
    if (element.startsWith("person") && !clickedElements[element]) {
      playCharacterSequence(element)
    }
  }

  // Function to play a character's animation sequence
  const playCharacterSequence = (character: string) => {
    setAnimationSequence({
      isPlaying: true,
      currentStep: 0,
      totalSteps: 3,
      storyMode: false,
    })

    // Step 1: Show speech bubble
    const timeout1 = setTimeout(() => {
      setAnimationSequence((prev) => ({ ...prev, currentStep: 1 }))
    }, 500)
    timeoutsRef.current.push(timeout1)

    // Step 2: Highlight connection to center
    const timeout2 = setTimeout(() => {
      setAnimationSequence((prev) => ({ ...prev, currentStep: 2 }))
    }, 1500)
    timeoutsRef.current.push(timeout2)

    // Step 3: Complete sequence
    const timeout3 = setTimeout(() => {
      setAnimationSequence((prev) => ({ ...prev, currentStep: 3, isPlaying: false }))
    }, 3000)
    timeoutsRef.current.push(timeout3)
  }

  // Function to start the main story sequence
  const startStorySequence = () => {
    setAnimationSequence({
      isPlaying: true,
      currentStep: 0,
      totalSteps: 5,
      storyMode: true,
    })

    // Reset all characters to not clicked for the sequence
    setClickedElements({
      person1: false,
      person2: false,
      person3: false,
      person4: false,
      person5: false,
      centerCircle: true,
    })

    // Step 1: Center circle expands
    const timeout1 = setTimeout(() => {
      setAnimationSequence((prev) => ({ ...prev, currentStep: 1 }))
    }, 1000)
    timeoutsRef.current.push(timeout1)

    // Step 2: First wave of characters connect (1 and 3)
    const timeout2 = setTimeout(() => {
      setClickedElements((prev) => ({
        ...prev,
        person1: true,
        person3: true,
      }))
      setAnimationSequence((prev) => ({ ...prev, currentStep: 2 }))
    }, 2000)
    timeoutsRef.current.push(timeout2)

    // Step 3: Second wave of characters connect (2 and 5)
    const timeout3 = setTimeout(() => {
      setClickedElements((prev) => ({
        ...prev,
        person2: true,
        person5: true,
      }))
      setAnimationSequence((prev) => ({ ...prev, currentStep: 3 }))
    }, 3500)
    timeoutsRef.current.push(timeout3)

    // Step 4: Final character connects (4)
    const timeout4 = setTimeout(() => {
      setClickedElements((prev) => ({
        ...prev,
        person4: true,
      }))
      setAnimationSequence((prev) => ({ ...prev, currentStep: 4 }))
    }, 5000)
    timeoutsRef.current.push(timeout4)

    // Step 5: All characters celebrate
    const timeout5 = setTimeout(() => {
      setAnimationSequence((prev) => ({ ...prev, currentStep: 5 }))
    }, 6500)
    timeoutsRef.current.push(timeout5)

    // Complete sequence
    const timeout6 = setTimeout(() => {
      setAnimationSequence((prev) => ({ ...prev, isPlaying: false }))
    }, 9000)
    timeoutsRef.current.push(timeout6)
  }

  // Function to reset all animations
  const resetAnimations = () => {
    // Clear all timeouts
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
    timeoutsRef.current = []

    setClickedElements({
      person1: false,
      person2: false,
      person3: false,
      person4: false,
      person5: false,
      centerCircle: false,
    })
    setAnimationSequence({
      isPlaying: false,
      currentStep: 0,
      totalSteps: 5,
      storyMode: false,
    })
    setAllCharactersClicked(false)
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-yellow-500/20"></div>
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-yellow-500">
                Transforming Lives of Hong Kong's Ethnic Minorities
              </h1>
              <p className="text-lg text-gray-700">
                Join our events and be part of our mission to improve the lives of ethnic minorities in Hong Kong.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/events">
                  <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">
                    Explore Events <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/sign-up">
                  <Button variant="outline">Sign Up</Button>
                </Link>
              </div>
            </div>
            <div
              className="relative h-[300px] md:h-[400px] rounded-lg shadow-lg overflow-hidden bg-gradient-to-br from-yellow-50 to-yellow-100"
              onDoubleClick={resetAnimations}
            >
              {/* Auto-play button */}
              <button
                onClick={toggleAutoPlay}
                className={`absolute top-4 right-4 z-20 p-2 rounded-full ${
                  autoPlay ? "bg-yellow-500 text-white" : "bg-white/80 text-yellow-600"
                } hover:bg-yellow-400 hover:text-white transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2`}
                aria-label={autoPlay ? "Pause animation" : "Play animation automatically"}
                title={autoPlay ? "Pause animation" : "Play animation automatically"}
              >
                {autoPlay ? <Pause size={20} /> : <Play size={20} />}
              </button>

              {/* Inline SVG with animations and interactivity */}
              <svg
                viewBox="0 0 800 600"
                className="w-full h-full"
                aria-labelledby="hero-svg-title hero-svg-desc"
                role="img"
              >
                <title id="hero-svg-title">Community Connections</title>
                <desc id="hero-svg-desc">
                  An interactive illustration of diverse people connecting at a community event in Hong Kong. Click on
                  people to see animations and discover their stories.
                </desc>

                {/* Decorative elements */}
                <g className="animate-float">
                  <circle cx="100" cy="100" r="20" fill="#FBBF24" opacity="0.3" />
                  <circle cx="700" cy="150" r="30" fill="#FBBF24" opacity="0.2" />
                  <circle cx="200" cy="500" r="25" fill="#FBBF24" opacity="0.2" />
                  <circle cx="650" cy="450" r="35" fill="#FBBF24" opacity="0.3" />
                </g>

                {/* Center interactive circle */}
                <circle
                  cx="400"
                  cy="300"
                  r={clickedElements.centerCircle ? "60" : "40"}
                  fill={clickedElements.centerCircle ? "#FBBF24" : "#FEF3C7"}
                  className={`center-circle ${clickedElements.centerCircle ? "clicked" : ""} ${
                    animationSequence.storyMode && animationSequence.currentStep >= 1 ? "pulse-scale" : ""
                  }`}
                  onClick={() => handleElementClick("centerCircle")}
                  style={{ cursor: "pointer" }}
                />

                {/* Center text that appears during story mode */}
                {animationSequence.storyMode && animationSequence.currentStep >= 1 && (
                  <text
                    x="400"
                    y="305"
                    textAnchor="middle"
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                    className="animate-fade-in"
                  >
                    ZUBIN
                  </text>
                )}

                {/* Connection lines */}
                <g
                  className={`connection-lines ${
                    clickedElements.centerCircle ? "active-connections" : "animate-pulse-slow"
                  }`}
                >
                  {/* Person 1 connection */}
                  <path
                    d="M400,300 L200,300"
                    stroke="#FBBF24"
                    strokeWidth={clickedElements.person1 ? "5" : "2"}
                    fill="none"
                    className={`${clickedElements.person1 ? "active-line" : ""} ${
                      animationSequence.storyMode && animationSequence.currentStep >= 2 ? "animate-draw" : ""
                    }`}
                    strokeDasharray={clickedElements.person1 ? "0" : "1000"}
                    strokeDashoffset={clickedElements.person1 ? "0" : "1000"}
                  />

                  {/* Person 2 connection */}
                  <path
                    d="M400,300 L400,250"
                    stroke="#FBBF24"
                    strokeWidth={clickedElements.person2 ? "5" : "2"}
                    fill="none"
                    className={`${clickedElements.person2 ? "active-line" : ""} ${
                      animationSequence.storyMode && animationSequence.currentStep >= 3 ? "animate-draw" : ""
                    }`}
                    strokeDasharray={clickedElements.person2 ? "0" : "1000"}
                    strokeDashoffset={clickedElements.person2 ? "0" : "1000"}
                  />

                  {/* Person 3 connection */}
                  <path
                    d="M400,300 L600,300"
                    stroke="#FBBF24"
                    strokeWidth={clickedElements.person3 ? "5" : "2"}
                    fill="none"
                    className={`${clickedElements.person3 ? "active-line" : ""} ${
                      animationSequence.storyMode && animationSequence.currentStep >= 2 ? "animate-draw" : ""
                    }`}
                    strokeDasharray={clickedElements.person3 ? "0" : "1000"}
                    strokeDashoffset={clickedElements.person3 ? "0" : "1000"}
                  />

                  {/* Person 4 connection */}
                  <path
                    d="M400,300 L300,400"
                    stroke="#FBBF24"
                    strokeWidth={clickedElements.person4 ? "5" : "2"}
                    fill="none"
                    className={`${clickedElements.person4 ? "active-line" : ""} ${
                      animationSequence.storyMode && animationSequence.currentStep >= 4 ? "animate-draw" : ""
                    }`}
                    strokeDasharray={clickedElements.person4 ? "0" : "1000"}
                    strokeDashoffset={clickedElements.person4 ? "0" : "1000"}
                  />

                  {/* Person 5 connection */}
                  <path
                    d="M400,300 L500,400"
                    stroke="#FBBF24"
                    strokeWidth={clickedElements.person5 ? "5" : "2"}
                    fill="none"
                    className={`${clickedElements.person5 ? "active-line" : ""} ${
                      animationSequence.storyMode && animationSequence.currentStep >= 3 ? "animate-draw" : ""
                    }`}
                    strokeDasharray={clickedElements.person5 ? "0" : "1000"}
                    strokeDashoffset={clickedElements.person5 ? "0" : "1000"}
                  />
                </g>

                {/* People group 1 - interactive on click */}
                <g
                  className={`person-group ${clickedElements.person1 ? "clicked" : ""} ${
                    animationSequence.storyMode && animationSequence.currentStep >= 5 ? "celebrate" : ""
                  }`}
                  transform={`translate(200, 300) ${clickedElements.person1 ? "scale(1.2)" : ""}`}
                  onClick={() => handleElementClick("person1")}
                >
                  <circle
                    className="person-circle"
                    cx="0"
                    cy="0"
                    r="40"
                    fill={clickedElements.person1 ? "#FBBF24" : "#FCD34D"}
                  />
                  <circle cx="0" cy="-15" r="15" fill="#F59E0B" />
                  <path d="M-15,0 Q0,20 15,0" stroke="#F59E0B" strokeWidth="3" fill="none" />
                  {clickedElements.person1 && (
                    <g className="speech-bubble">
                      <rect x="-70" y="-80" width="140" height="40" rx="10" fill="white" stroke="#F59E0B" />
                      <text x="0" y="-55" textAnchor="middle" fill="#F59E0B" fontSize="12">
                        {animationSequence.storyMode && animationSequence.currentStep >= 5
                          ? "We're stronger together!"
                          : "Hello! I'm Mei from Nepal"}
                      </text>
                    </g>
                  )}
                </g>

                {/* People group 2 - interactive on click */}
                <g
                  className={`person-group ${clickedElements.person2 ? "clicked" : ""} ${
                    animationSequence.storyMode && animationSequence.currentStep >= 5 ? "celebrate" : ""
                  }`}
                  transform={`translate(400, 250) ${clickedElements.person2 ? "scale(1.2)" : ""}`}
                  onClick={() => handleElementClick("person2")}
                >
                  <circle
                    className="person-circle"
                    cx="0"
                    cy="0"
                    r="40"
                    fill={clickedElements.person2 ? "#FBBF24" : "#A7F3D0"}
                  />
                  <circle cx="0" cy="-15" r="15" fill="#10B981" />
                  <path d="M-15,0 Q0,20 15,0" stroke="#10B981" strokeWidth="3" fill="none" />
                  {clickedElements.person2 && (
                    <g className="speech-bubble">
                      <rect x="-70" y="-80" width="140" height="40" rx="10" fill="white" stroke="#10B981" />
                      <text x="0" y="-55" textAnchor="middle" fill="#10B981" fontSize="12">
                        {animationSequence.storyMode && animationSequence.currentStep >= 5
                          ? "Building community!"
                          : "I'm Raj from India!"}
                      </text>
                    </g>
                  )}
                </g>

                {/* People group 3 - interactive on click */}
                <g
                  className={`person-group ${clickedElements.person3 ? "clicked" : ""} ${
                    animationSequence.storyMode && animationSequence.currentStep >= 5 ? "celebrate" : ""
                  }`}
                  transform={`translate(600, 300) ${clickedElements.person3 ? "scale(1.2)" : ""}`}
                  onClick={() => handleElementClick("person3")}
                >
                  <circle
                    className="person-circle"
                    cx="0"
                    cy="0"
                    r="40"
                    fill={clickedElements.person3 ? "#FBBF24" : "#BFDBFE"}
                  />
                  <circle cx="0" cy="-15" r="15" fill="#3B82F6" />
                  <path d="M-15,0 Q0,20 15,0" stroke="#3B82F6" strokeWidth="3" fill="none" />
                  {clickedElements.person3 && (
                    <g className="speech-bubble">
                      <rect x="-70" y="-80" width="140" height="40" rx="10" fill="white" stroke="#3B82F6" />
                      <text x="0" y="-55" textAnchor="middle" fill="#3B82F6" fontSize="12">
                        {animationSequence.storyMode && animationSequence.currentStep >= 5
                          ? "Diversity is our strength!"
                          : "Hi, I'm Ahmed from Pakistan!"}
                      </text>
                    </g>
                  )}
                </g>

                {/* People group 4 - interactive on click */}
                <g
                  className={`person-group ${clickedElements.person4 ? "clicked" : ""} ${
                    animationSequence.storyMode && animationSequence.currentStep >= 5 ? "celebrate" : ""
                  }`}
                  transform={`translate(300, 400) ${clickedElements.person4 ? "scale(1.2)" : ""}`}
                  onClick={() => handleElementClick("person4")}
                >
                  <circle
                    className="person-circle"
                    cx="0"
                    cy="0"
                    r="40"
                    fill={clickedElements.person4 ? "#FBBF24" : "#FBD5E0"}
                  />
                  <circle cx="0" cy="-15" r="15" fill="#EC4899" />
                  <path d="M-15,0 Q0,20 15,0" stroke="#EC4899" strokeWidth="3" fill="none" />
                  {clickedElements.person4 && (
                    <g className="speech-bubble">
                      <rect x="-70" y="-80" width="140" height="40" rx="10" fill="white" stroke="#EC4899" />
                      <text x="0" y="-55" textAnchor="middle" fill="#EC4899" fontSize="12">
                        {animationSequence.storyMode && animationSequence.currentStep >= 5
                          ? "Together we can do more!"
                          : "I'm Sofia from Philippines!"}
                      </text>
                    </g>
                  )}
                </g>

                {/* People group 5 - interactive on click */}
                <g
                  className={`person-group ${clickedElements.person5 ? "clicked" : ""} ${
                    animationSequence.storyMode && animationSequence.currentStep >= 5 ? "celebrate" : ""
                  }`}
                  transform={`translate(500, 400) ${clickedElements.person5 ? "scale(1.2)" : ""}`}
                  onClick={() => handleElementClick("person5")}
                >
                  <circle
                    className="person-circle"
                    cx="0"
                    cy="0"
                    r="40"
                    fill={clickedElements.person5 ? "#FBBF24" : "#DDD6FE"}
                  />
                  <circle cx="0" cy="-15" r="15" fill="#8B5CF6" />
                  <path d="M-15,0 Q0,20 15,0" stroke="#8B5CF6" strokeWidth="3" fill="none" />
                  {clickedElements.person5 && (
                    <g className="speech-bubble">
                      <rect x="-70" y="-80" width="140" height="40" rx="10" fill="white" stroke="#8B5CF6" />
                      <text x="0" y="-55" textAnchor="middle" fill="#8B5CF6" fontSize="12">
                        {animationSequence.storyMode && animationSequence.currentStep >= 5
                          ? "Creating a better Hong Kong!"
                          : "Hello, I'm Li from Indonesia!"}
                      </text>
                    </g>
                  )}
                </g>

                {/* Story mode message */}
                {animationSequence.storyMode && (
                  <g className="animate-fade-in">
                    <rect
                      x="250"
                      y="120"
                      width="300"
                      height="40"
                      rx="20"
                      fill="#FBBF24"
                      className="animate-pulse-slow"
                    />
                    <text x="400" y="145" textAnchor="middle" fill="white" fontWeight="bold" fontSize="16">
                      {animationSequence.currentStep < 5 ? "Watch our community form..." : "We are stronger together!"}
                    </text>
                  </g>
                )}

                {/* Text label */}
                <g className="animate-fade-in">
                  <rect x="250" y="500" width="300" height="40" rx="20" fill="#FBBF24" />
                  <text x="400" y="525" textAnchor="middle" fill="white" fontWeight="bold" fontSize="18">
                    Building Inclusive Communities
                  </text>
                </g>

                {/* Instructions text */}
                <text x="400" y="560" textAnchor="middle" fill="#6B7280" fontSize="14">
                  {autoPlay
                    ? "Watching auto-play animation..."
                    : allCharactersClicked
                      ? "Now click the center to see the community story!"
                      : "Click on each character to meet them"}
                </text>

                {/* Auto-play indicator */}
                {autoPlay && (
                  <g className="animate-pulse-slow">
                    <circle cx="70" cy="70" r="10" fill="#FBBF24" />
                    <text x="90" y="75" fill="#6B7280" fontSize="14" className="auto-play-text">
                      Auto-Play Active
                    </text>
                  </g>
                )}
              </svg>

              {/* Replace style jsx with regular style */}
              <style>
                {`
                  @keyframes float {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0); }
                  }
                  
                  @keyframes pulse-slow {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                  }
                  
                  @keyframes fade-in {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                  }
                  
                  @keyframes pop {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                  }
                  
                  @keyframes glow {
                    0% { filter: drop-shadow(0 0 2px rgba(251, 191, 36, 0.5)); }
                    50% { filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.8)); }
                    100% { filter: drop-shadow(0 0 2px rgba(251, 191, 36, 0.5)); }
                  }
                  
                  @keyframes dash {
                    to {
                      stroke-dashoffset: 0;
                    }
                  }
                  
                  @keyframes celebrate {
                    0% { transform: translateY(0) rotate(0); }
                    25% { transform: translateY(-10px) rotate(-5deg); }
                    50% { transform: translateY(0) rotate(0); }
                    75% { transform: translateY(-10px) rotate(5deg); }
                    100% { transform: translateY(0) rotate(0); }
                  }
                  
                  @keyframes pulse-scale {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                  }
                  
                  .animate-float {
                    animation: float 6s ease-in-out infinite;
                  }
                  
                  .animate-pulse-slow {
                    animation: pulse-slow 4s ease-in-out infinite;
                  }
                  
                  .animate-fade-in {
                    animation: fade-in 2s ease-out;
                  }
                  
                  .animate-draw {
                    animation: dash 1.5s linear forwards;
                  }
                  
                  .person-group {
                    cursor: pointer;
                    transition: all 0.5s ease;
                  }
                  
                  .person-group:hover {
                    transform: scale(1.1) translateY(-5px);
                  }
                  
                  .person-group.clicked {
                    animation: pop 0.5s ease-out;
                  }
                  
                  .person-group.celebrate {
                    animation: celebrate 2s ease-in-out infinite;
                  }
                  
                  .person-circle {
                    transition: fill 0.3s ease;
                  }
                  
                  .center-circle {
                    transition: all 0.5s ease;
                    cursor: pointer;
                  }
                  
                  .center-circle.clicked {
                    animation: glow 2s ease-in-out infinite;
                  }
                  
                  .center-circle.pulse-scale {
                    animation: pulse-scale 2s ease-in-out infinite;
                  }
                  
                  .active-connections path {
                    stroke-dasharray: 1000;
                    stroke-dashoffset: 1000;
                    animation: dash 2s linear forwards;
                  }
                  
                  .active-line {
                    animation: pulse-slow 1s ease-in-out infinite;
                  }
                  
                  .speech-bubble {
                    animation: fade-in 0.3s ease-out;
                  }
                  
                  .auto-play-text {
                    font-family: sans-serif;
                  }
                `}
              </style>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="bg-yellow-50 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6 text-center">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {allEvents
              .filter((event) => new Date(event.date) > new Date() && event.status === "Published")
              .slice(0, 3)
              .map((event) => (
                <div key={event.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="h-40 mb-4 overflow-hidden rounded-md bg-gray-100">
                    <img
                      src={event.image || "/placeholder.svg?key=event-default"}
                      alt={event.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Safe error handling with proper type checking
                        if (e && e.currentTarget) {
                          e.currentTarget.src = "/placeholder.svg?key=event-fallback"
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center mb-2">
                    <span className="text-sm font-medium bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      {event.category}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      {new Date(event.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 line-clamp-2">{event.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                  <Link
                    to={`/events/${event.id}`}
                    className="text-yellow-500 hover:text-yellow-600 font-medium inline-flex items-center"
                  >
                    View Details <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/events">
              <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">
                View All Events <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Event Platform</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover, register, and participate in events designed to support and empower ethnic minorities in Hong
              Kong.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="bg-yellow-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Discover Events</h3>
              <p className="text-gray-600 mb-4">
                Browse through our upcoming events, workshops, and community gatherings.
              </p>
              <Link
                to="/events"
                className="text-yellow-500 hover:text-yellow-600 font-medium inline-flex items-center"
              >
                View Events <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="bg-yellow-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Register & Participate</h3>
              <p className="text-gray-600 mb-4">
                Sign up for events, manage your registrations, and track your participation.
              </p>
              <Link
                to="/sign-up"
                className="text-yellow-500 hover:text-yellow-600 font-medium inline-flex items-center"
              >
                Sign Up Now <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="bg-yellow-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Support Our Mission</h3>
              <p className="text-gray-600 mb-4">
                Join our community and help us transform the lives of ethnic minorities in Hong Kong.
              </p>
              <a
                href="https://www.zubinfoundation.org/donate"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-500 hover:text-yellow-600 font-medium inline-flex items-center"
              >
                Learn More <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-yellow-400 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-black">Ready to Join Our Events?</h2>
          <p className="text-black/80 max-w-2xl mx-auto mb-8">
            Create an account to register for events, connect with our community, and stay updated on our initiatives.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/sign-up">
              <Button className="bg-black hover:bg-black/80 text-white">Sign Up Now</Button>
            </Link>
            <Link to="/events">
              <Button variant="outline" className="bg-white hover:bg-white/90 text-black border-black">
                Browse Events
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
