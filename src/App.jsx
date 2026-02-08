import { useState, useEffect, useMemo } from 'react'
import { auth, googleProvider, db } from './firebase'
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from 'firebase/auth'
import { collection, addDoc, doc, deleteDoc, updateDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { motion } from 'framer-motion'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, subDays } from 'date-fns'
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react"
import DesktopApp from './components/DesktopApp'
import MobileApp from './components/MobileApp'


export default function App() {
  const [user, setUser] = useState(null)
  const [entries, setEntries] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date()) 
  const [selectedDate, setSelectedDate] = useState(new Date()) 
  const [view, setView] = useState('dashboard')
  const [showProfile, setShowProfile] = useState(false)

  const [title, setTitle] = useState('')
  const [cals, setCals] = useState('')
  const [prot, setProt] = useState('')
  const [titleFocused, setTitleFocused] = useState(false)
  
  // Edit mode state
  const [editingEntry, setEditingEntry] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editCals, setEditCals] = useState('')
  const [editProt, setEditProt] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDesktop, setIsDesktop] = useState(false)

  const CALORIE_LIMIT = 1800
  const MAINTENANCE_CALORIES = 2400

  // Single unified auth initialization - handles both redirect and state
  useEffect(() => {
    let unsubscribeSnapshot = null
    let isMounted = true
    let loadingCleared = false
    
    const clearLoading = () => {
      if (isMounted && !loadingCleared) {
        loadingCleared = true
        setIsLoading(false)
      }
    }
    
    // Safety timeout - if auth doesn't respond in 2 seconds, show the app anyway
    const safetyTimeout = setTimeout(() => {
      console.log("Auth timeout - forcing app display")
      clearLoading()
    }, 2000)
    
    const initAuth = async () => {
      // First, check for any pending redirect result
      try {
        const result = await getRedirectResult(auth)
        if (result) {
          console.log("Redirect sign-in successful")
        }
      } catch (error) {
        // Silently handle redirect errors - they're often just "no redirect pending"
        if (error.code !== 'auth/popup-closed-by-user') {
          console.error("Redirect check:", error.code)
        }
      }
    }
    
    // Start the redirect check
    initAuth()
    
    // Set up auth state listener
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!isMounted) return
      
      setUser(currentUser)
      clearLoading()
      
      if (currentUser) {
        // Query only by uid to avoid needing a composite index
        const q = query(
          collection(db, "logs"),
          where("uid", "==", currentUser.uid)
        )
        unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          if (!isMounted) return
          const loadedEntries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          // Sort client-side by createdAt descending
          loadedEntries.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0
            const bTime = b.createdAt?.toMillis?.() || 0
            return bTime - aTime
          })
          setEntries(loadedEntries)
        }, (error) => {
          console.error("Firestore error:", error)
        })
      } else {
        setEntries([])
      }
    })
    return () => {
      isMounted = false
      clearTimeout(safetyTimeout)
      unsubscribeAuth()
      if (unsubscribeSnapshot) unsubscribeSnapshot()
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(min-width: 1024px)')
    const handleChange = () => setIsDesktop(media.matches)
    handleChange()
    if (media.addEventListener) {
      media.addEventListener('change', handleChange)
    } else {
      media.addListener(handleChange)
    }
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', handleChange)
      } else {
        media.removeListener(handleChange)
      }
    }
  }, [])

  const handleLogin = async () => {
    try {
      // Use popup for all devices - more reliable than redirect
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      console.error("Login error:", error)
      
      // If popup was blocked or failed, try redirect as fallback
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, googleProvider)
        } catch (redirectError) {
          alert("Login failed. Please enable popups or try again.")
        }
      } else {
        alert("Login failed: " + error.message)
      }
    }
  }

  const addEntry = async () => {
    if (!title || !cals) return
    await addDoc(collection(db, "logs"), {
      uid: user.uid, title, calories: Number(cals), protein: Number(prot) || 0,
      createdAt: serverTimestamp(), dateString: format(selectedDate, 'yyyy-MM-dd')
    })
    setTitle(''); setCals(''); setProt(''); setView('dashboard')
  }

  const deleteEntry = async (entryId) => {
    await deleteDoc(doc(db, "logs", entryId))
  }

  const startEdit = (entry) => {
    setEditingEntry(entry.id)
    setEditTitle(entry.title)
    setEditCals(entry.calories.toString())
    setEditProt(entry.protein.toString())
  }

  const saveEdit = async () => {
    if (!editingEntry || !editTitle || !editCals) return
    await updateDoc(doc(db, "logs", editingEntry), {
      title: editTitle,
      calories: Number(editCals),
      protein: Number(editProt) || 0
    })
    setEditingEntry(null)
  }

  const cancelEdit = () => {
    setEditingEntry(null)
  }

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
  const logsForSelectedDate = entries.filter(e => e.dateString === selectedDateStr)
  const totalCals = logsForSelectedDate.reduce((acc, curr) => acc + curr.calories, 0)

  // Compute daily totals map: dateString -> { calories, protein }
  const dailyTotals = useMemo(() => {
    const map = {}
    entries.forEach(e => {
      if (!map[e.dateString]) map[e.dateString] = { calories: 0, protein: 0 }
      map[e.dateString].calories += e.calories || 0
      map[e.dateString].protein += e.protein || 0
    })
    return map
  }, [entries])

  // Weekly stats: last 7 days excluding today (8 days ago to 1 day ago)
  const weeklyStats = useMemo(() => {
    const today = new Date()
    const days = []
    let totalCals = 0
    let totalProt = 0
    let daysWithData = 0
    for (let i = 7; i >= 1; i--) {
      const d = subDays(today, i)
      const ds = format(d, 'yyyy-MM-dd')
      const data = dailyTotals[ds] || { calories: 0, protein: 0 }
      days.push({ date: d, dateString: ds, ...data })
      totalCals += data.calories
      totalProt += data.protein
      if (data.calories > 0) daysWithData++
    }
    return {
      days,
      totalCalories: totalCals,
      totalProtein: totalProt,
      avgCalories: daysWithData > 0 ? Math.round(totalCals / daysWithData) : 0,
      avgProtein: daysWithData > 0 ? Math.round(totalProt / daysWithData) : 0,
      daysWithData,
      totalDeficit: daysWithData > 0 ? (MAINTENANCE_CALORIES * daysWithData) - totalCals : 0,
      avgDeficit: daysWithData > 0 ? Math.round(((MAINTENANCE_CALORIES * daysWithData) - totalCals) / daysWithData) : 0,
    }
  }, [dailyTotals])

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)
    const rows = []; let days = []; let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day
        const dayStr = format(cloneDay, 'yyyy-MM-dd')
        const dayData = dailyTotals[dayStr]
        const isCurrentMonth = isSameMonth(day, monthStart)
        const isSelected = isSameDay(day, selectedDate)
        const isFuture = cloneDay > new Date()
        const hasData = dayData && dayData.calories > 0 && isCurrentMonth && !isFuture
        const isUnder = hasData && dayData.calories <= CALORIE_LIMIT
        const isOver = hasData && dayData.calories > CALORIE_LIMIT

        days.push(
          <div
            className={`p-2 w-full text-center text-sm cursor-pointer rounded-full relative transition-all
              ${!isCurrentMonth ? "text-stone-400/50" : "text-stone-600"}
              ${isSelected ? "selected-date shadow-md scale-110" : "hover:bg-white/40"}
            `}
            key={day} onClick={() => { setSelectedDate(cloneDay); setView('dashboard') }}
          >
            {format(day, "d")}
            {hasData && !isSelected && (
              <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-[2px]">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  isUnder ? 'bg-green-500/60' : 'bg-red-400/60'
                }`}></div>
              </div>
            )}
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(<div className="grid grid-cols-7 mb-2" key={day}>{days}</div>)
      days = []
    }
    return <div className="mt-4">{rows}</div>
  }

  const onSignOut = () => signOut(auth)

  const appProps = {
    user,
    showProfile,
    setShowProfile,
    selectedDate,
    setSelectedDate,
    currentMonth,
    setCurrentMonth,
    view,
    setView,
    title,
    setTitle,
    titleFocused,
    setTitleFocused,
    cals,
    setCals,
    prot,
    setProt,
    addEntry,
    logsForSelectedDate,
    deleteEntry,
    startEdit,
    editingEntry,
    editTitle,
    setEditTitle,
    editCals,
    setEditCals,
    editProt,
    setEditProt,
    saveEdit,
    cancelEdit,
    totalCals,
    CALORIE_LIMIT,
    renderCalendar,
    weeklyStats,
    onSignOut,
  }

  return (
    <div className="min-h-dvh w-full">
      <SpeedInsights />
      <Analytics />
      {isLoading ? (
        <div className="min-h-dvh flex flex-col items-center justify-center p-0 md:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-panel p-12 rounded-[40px] text-center max-w-sm w-full shadow-2xl"
          >
            <h1 className="text-5xl italic mb-4 text-stone-800 tracking-tight">SkyCal</h1>
            <p className="text-stone-500 text-sm">Loading...</p>
          </motion.div>
        </div>
      ) : !user ? (
        <div className="min-h-dvh flex flex-col items-center justify-center p-0 md:p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-12 rounded-[40px] text-center max-w-sm w-full shadow-2xl"
          >
            <h1 className="text-5xl italic mb-2 text-stone-800 tracking-tight">SkyCal</h1>
            <p className="text-stone-600 mb-8 font-light">Your daily calorie journal.</p>
            <button
              onClick={handleLogin}
              className="w-full py-3 bg-stone-800 text-white rounded-2xl font-medium hover:bg-stone-700 transition"
            >
              Enter Journal
            </button>
            <p className="text-stone-450 text-xs mt-6 font-light">~ made with love by satvik ~</p>
          </motion.div>
        </div>
      ) : (
        <div className="w-full">
          {isDesktop ? <DesktopApp {...appProps} /> : <MobileApp {...appProps} />}
        </div>
      )}
    </div>
  )
}