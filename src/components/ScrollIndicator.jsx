import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp, ChevronDown } from 'lucide-react'

export default function ScrollIndicator({ watch = [] }) {
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const checkScroll = () => {
    const scrollY = window.scrollY
    const innerHeight = window.innerHeight
    const scrollHeight = document.documentElement.scrollHeight
    
    // Use a small buffer (e.g. 5px) to avoid precision issues
    setCanScrollUp(scrollY > 5)
    
    // Check if we are not at the bottom
    setCanScrollDown(scrollY + innerHeight < scrollHeight - 5)
  }

  // Check on any watch dependency change + delay for safety
  useEffect(() => {
    checkScroll()
    const t = setTimeout(checkScroll, 100)
    const t2 = setTimeout(checkScroll, 300) 
    return () => { clearTimeout(t); clearTimeout(t2) }
  }, watch)

  useEffect(() => {
    checkScroll()
    
    window.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll, { passive: true })
    
    // Watch for content size changes
    const resizeObserver = new ResizeObserver(() => {
      checkScroll()
    })
    resizeObserver.observe(document.body)
    resizeObserver.observe(document.documentElement)

    // Mutation observer for good measure (catches DOM changes that might not trigger resize immediately)
    const mutationObserver = new MutationObserver(() => {
        checkScroll()
    })
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [])

  const scrollUp = () => {
    window.scrollBy({ top: -window.innerHeight * 0.75, behavior: 'smooth' })
  }

  const scrollDown = () => {
    window.scrollBy({ top: window.innerHeight * 0.75, behavior: 'smooth' })
  }

  return (
    <>
      <AnimatePresence>
        {canScrollUp && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-0 right-0 z-50 flex justify-center pointer-events-none"
          >
            <button
              onClick={scrollUp}
              className="pointer-events-auto p-2 bg-white/30 hover:bg-white/50 backdrop-blur-md rounded-full text-stone-600/70 hover:text-stone-800 shadow-sm border border-white/40 transition-all active:scale-95"
            >
              <ChevronUp size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {canScrollDown && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-0 right-0 z-50 flex justify-center pointer-events-none"
          >
            <button
              onClick={scrollDown}
              className="pointer-events-auto p-2 bg-white/30 hover:bg-white/50 backdrop-blur-md rounded-full text-stone-600/70 hover:text-stone-800 shadow-sm border border-white/40 transition-all active:scale-95"
            >
              <ChevronDown size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
