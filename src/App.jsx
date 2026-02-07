import { useState, useEffect, useRef, useMemo } from 'react'
import { auth, googleProvider, db } from './firebase'
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from 'firebase/auth'
import { collection, addDoc, doc, deleteDoc, updateDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil, Check, X, LogOut } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, subDays } from 'date-fns'
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react"


// iOS-style Swipeable Entry Component
function SwipeableEntry({ entry, onDelete, onEdit, isEditing, editTitle, setEditTitle, editCals, setEditCals, editProt, setEditProt, onSave, onCancel }) {
  const x = useMotionValue(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [swipeState, setSwipeState] = useState('closed') // 'closed', 'delete-revealed'
  
  const ACTION_WIDTH = 90
  const DELETE_CONFIRM_THRESHOLD = 160
  const EDIT_THRESHOLD = 80
  
  // Pastel pink for delete (matches the selected-date style)
  const deleteOpacity = useTransform(x, [0, 30, ACTION_WIDTH], [0, 0.6, 1])
  const deleteScale = useTransform(x, [0, 30, ACTION_WIDTH], [0.6, 0.85, 1])
  
  // Soft stone/beige for edit
  const editOpacity = useTransform(x, [-ACTION_WIDTH, -30, 0], [1, 0.6, 0])
  const editScale = useTransform(x, [-ACTION_WIDTH, -30, 0], [1, 0.85, 0.6])
  
  const handleDragEnd = (_, info) => {
    const velocity = info.velocity.x
    const offset = info.offset.x
    
    // EDIT: Single swipe left triggers edit immediately
    if (offset < -EDIT_THRESHOLD || velocity < -500) {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 28 })
      setSwipeState('closed')
      onEdit()
      return
    }
    
    // DELETE: Two-stage process
    if (swipeState === 'delete-revealed') {
      // Already revealed - check if swiping more to confirm delete
      if (offset > 60 || velocity > 400) {
        setIsDeleting(true)
        animate(x, 500, { type: "spring", stiffness: 200, damping: 25 })
        setTimeout(() => onDelete(), 250)
        return
      }
      // Swiping back = close
      if (offset < -20 || velocity < -200) {
        animate(x, 0, { type: "spring", stiffness: 300, damping: 28 })
        setSwipeState('closed')
        return
      }
      // Small movement = stay revealed
      animate(x, ACTION_WIDTH, { type: "spring", stiffness: 300, damping: 28 })
      return
    }
    
    // First swipe right = reveal delete
    if (offset > 50 || velocity > 400) {
      animate(x, ACTION_WIDTH, { type: "spring", stiffness: 300, damping: 28 })
      setSwipeState('delete-revealed')
      return
    }
    
    // Default = snap back
    animate(x, 0, { type: "spring", stiffness: 300, damping: 28 })
    setSwipeState('closed')
  }
  
  const handleContentClick = () => {
    if (swipeState !== 'closed') {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 28 })
      setSwipeState('closed')
    }
  }

  if (isEditing) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40 space-y-3"
      >
        <input 
          value={editTitle} 
          onChange={e => setEditTitle(e.target.value)}
          className="w-full bg-white/50 rounded-2xl px-4 py-2 text-stone-800 font-serif italic text-lg focus:outline-none border border-white/20 placeholder-stone-400"
          placeholder="Food name..."
        />
        <div className="flex gap-2">
          <div className="flex-1 bg-white/50 rounded-2xl px-4 py-2 border border-white/20">
            <label className="text-[9px] uppercase text-stone-400 block mb-1">Calories</label>
            <input 
              type="number"
              value={editCals} 
              onChange={e => setEditCals(e.target.value)}
              className="w-full bg-transparent focus:outline-none font-bold text-stone-700"
            />
          </div>
          <div className="flex-1 bg-white/50 rounded-2xl px-4 py-2 border border-white/20">
            <label className="text-[9px] uppercase text-stone-400 block mb-1">Protein</label>
            <input 
              type="number"
              value={editProt} 
              onChange={e => setEditProt(e.target.value)}
              className="w-full bg-transparent focus:outline-none font-bold text-stone-700"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onSave}
            className="flex-1 bg-stone-800 text-white rounded-2xl py-2.5 flex items-center justify-center gap-2 active:scale-95 transition shadow-lg hover:bg-black"
          >
            <Check size={18} /> Save
          </button>
          <button 
            onClick={onCancel}
            className="flex-1 bg-white/50 text-stone-600 rounded-2xl py-2.5 flex items-center justify-center gap-2 active:scale-95 transition border border-white/20 hover:bg-white/70"
          >
            <X size={18} /> Cancel
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Delete action - pastel pink */}
      <motion.div 
        className="absolute inset-y-0 left-0 w-24 flex items-center justify-center rounded-l-2xl"
        style={{ 
          opacity: deleteOpacity,
          background: 'linear-gradient(90deg, #fecdd3 0%, #fbcfe8 100%)'
        }}
      >
        <motion.div style={{ scale: deleteScale }} className="flex flex-col items-center gap-1">
          <Trash2 className="text-rose-400" size={20} />
          <span className="text-rose-400 text-[10px] font-medium">
            {swipeState === 'delete-revealed' ? 'Swipe →' : 'Delete'}
          </span>
        </motion.div>
      </motion.div>
      
      {/* Edit action - soft stone */}
      <motion.div 
        className="absolute inset-y-0 right-0 w-24 flex items-center justify-center rounded-r-2xl"
        style={{ 
          opacity: editOpacity,
          background: 'linear-gradient(270deg, #e7e5e4 0%, #d6d3d1 100%)'
        }}
      >
        <motion.div style={{ scale: editScale }} className="flex flex-col items-center gap-1">
          <Pencil className="text-stone-500" size={20} />
          <span className="text-stone-500 text-[10px] font-medium">Edit</span>
        </motion.div>
      </motion.div>
      
      {/* Main content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: swipeState === 'delete-revealed' ? 200 : ACTION_WIDTH }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        onClick={handleContentClick}
        style={{ x }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className={`flex justify-between items-center p-4 bg-white/40 rounded-2xl border border-white/20 cursor-grab active:cursor-grabbing relative z-10 transition-opacity duration-200 ${isDeleting ? 'opacity-0' : ''}`}
      >
        <div>
          <p className="text-base font-medium text-stone-800">{entry.title}</p>
          <p className="text-xs text-stone-500">{entry.protein}g protein</p>
        </div>
        <p className="font-bold text-stone-600">{entry.calories}</p>
      </motion.div>
    </div>
  )
}

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

  return (
    <div className="h-dvh flex flex-col items-center justify-center p-0 md:p-4">
      <SpeedInsights />
      <Analytics />
      {isLoading ? (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="glass-panel p-12 rounded-[40px] text-center max-w-sm w-full shadow-2xl"
        >
          <h1 className="text-5xl italic mb-4 text-stone-800 tracking-tight">SkyCal</h1>
          <p className="text-stone-500 text-sm">Loading...</p>
        </motion.div>
      ) : !user ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-12 rounded-[40px] text-center max-w-sm w-full shadow-2xl">
          <h1 className="text-5xl italic mb-2 text-stone-800 tracking-tight">SkyCal</h1>
          <p className="text-stone-600 mb-8 font-light">Your daily calorie journal.</p>
          <button onClick={handleLogin} className="w-full py-3 bg-stone-800 text-white rounded-2xl font-medium hover:bg-stone-700 transition">Enter Journal</button>
          <p className="text-stone-450 text-xs mt-6 font-light">~ made with love by satvik ~</p>
        </motion.div>
      ) : (
        <motion.div layout className="glass-panel w-full md:max-w-md h-full md:h-[85vh] rounded-none md:rounded-[40px] flex flex-col overflow-hidden relative shadow-none md:shadow-2xl backdrop-blur-xl bg-white/40 border-0 md:border border-white/60">
          
          <div className="p-8 pb-4 flex justify-between items-start">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">Current Log</p>
              <h2 className="text-3xl italic text-stone-800">{format(selectedDate, 'MMMM do')}</h2>
            </div>
            
            <button onClick={() => setShowProfile(!showProfile)} className="p-2 bg-white/30 hover:bg-white/50 rounded-full transition text-stone-400">
              <LogOut size={16} />
            </button>
          </div>

          {/* Profile dropdown */}
          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="mx-8 mb-2 overflow-hidden"
              >
                <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {user?.photoURL && (
                      <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full shadow-sm" referrerPolicy="no-referrer" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">{user?.displayName || 'User'}</p>
                      <p className="text-xs text-stone-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => signOut(auth)} 
                    className="w-full py-2.5 bg-white/50 hover:bg-red-50 text-stone-600 hover:text-red-500 rounded-xl text-sm font-medium transition border border-white/30"
                  >
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="px-8 pb-4 border-b border-stone-200/30 flex justify-between items-baseline">
             <div className="text-4xl font-light text-stone-800">{totalCals} <span className="text-sm font-normal text-stone-400">kcal</span></div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
            <AnimatePresence mode="wait">
              {view === 'dashboard' ? (
                <motion.div key="dash" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="space-y-6">
                  
                  <div className="bg-white/40 p-6 rounded-3xl backdrop-blur-sm border border-white/40 shadow-sm">
                    <div className="input-with-cursor relative mb-6">
                      {!title && !titleFocused && <span className="cursor-hint"></span>}
                      <input 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        onFocus={() => setTitleFocused(true)}
                        onBlur={() => setTitleFocused(false)}
                        placeholder="Tandoori Momos..." 
                        className="w-full bg-transparent text-xl placeholder-stone-400 text-stone-800 focus:outline-none font-serif italic" 
                      />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1 bg-white/50 rounded-2xl px-4 py-2 border border-white/20">
                        <label className="text-[9px] uppercase text-stone-400 block mb-1">Calories</label>
                        <input type="number" value={cals} onChange={e => setCals(e.target.value)} className="w-full bg-transparent focus:outline-none font-bold text-stone-700" />
                      </div>
                      <div className="flex-1 bg-white/50 rounded-2xl px-4 py-2 border border-white/20">
                        <label className="text-[9px] uppercase text-stone-400 block mb-1">Protein</label>
                        <input type="number" value={prot} onChange={e => setProt(e.target.value)} className="w-full bg-transparent focus:outline-none font-bold text-stone-700" />
                      </div>
                      <button onClick={addEntry} className="bg-stone-800 text-white rounded-2xl px-5 flex items-center justify-center shadow-lg active:scale-95 transition hover:bg-black">
                        <Plus size={24} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                     <h3 className="text-lg font-serif italic text-stone-600 pl-2">Meal Logs</h3>
                     {logsForSelectedDate.length === 0 ? (
                       <p className="text-center text-stone-400 text-sm py-8 italic font-light">Your plate is empty.</p>
                     ) : (
                       logsForSelectedDate.map(entry => (
                         <SwipeableEntry 
                           key={entry.id} 
                           entry={entry} 
                           onDelete={() => deleteEntry(entry.id)}
                           onEdit={() => startEdit(entry)}
                           isEditing={editingEntry === entry.id}
                           editTitle={editTitle}
                           setEditTitle={setEditTitle}
                           editCals={editCals}
                           setEditCals={setEditCals}
                           editProt={editProt}
                           setEditProt={setEditProt}
                           onSave={saveEdit}
                           onCancel={cancelEdit}
                         />
                       ))
                     )}
                  </div>
                </motion.div>
              ) : view === 'calendar' ? (
                <motion.div key="cal" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}}>
                   <div className="flex justify-between items-center mb-6 px-2">
                     <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white/40 rounded-full text-stone-600"><ChevronLeft size={20}/></button>
                     <h2 className="text-xl font-medium text-stone-800">{format(currentMonth, 'MMMM yyyy')}</h2>
                     <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white/40 rounded-full text-stone-600"><ChevronRight size={20}/></button>
                   </div>
                   <div className="grid grid-cols-7 mb-2 text-center text-[10px] text-stone-400 uppercase tracking-widest font-bold">
                     <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                   </div>
                   {renderCalendar()}
                   
                   {/* Calendar legend */}
                   <div className="mt-4 flex items-center justify-center gap-5 text-[10px] text-stone-400">
                     <span className="flex items-center gap-1.5"><span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500/60"></span> Under {CALORIE_LIMIT}</span>
                     <span className="flex items-center gap-1.5"><span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400/60"></span> Over {CALORIE_LIMIT}</span>
                   </div>

                   <div className="mt-6 text-center">
                      <button onClick={() => { setSelectedDate(new Date()); setView('dashboard') }} className="text-xs bg-stone-800 text-white px-6 py-3 rounded-full shadow-lg hover:scale-105 transition hover:bg-black">
                        Return to Today
                      </button>
                   </div>
                </motion.div>
              ) : (
                /* Reflect View */
                <motion.div key="reflect" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} className="space-y-5">
                  <div className="pl-1">
                    <h3 className="text-xl font-serif italic text-stone-700">Weekly Reflect</h3>
                    <p className="text-[11px] text-stone-400 mt-0.5">{format(weeklyStats.days[0]?.date || new Date(), 'MMM d')} — {format(weeklyStats.days[6]?.date || new Date(), 'MMM d')}</p>
                  </div>

                  {/* SVG Area Chart */}
                  <div className="bg-white/40 backdrop-blur-sm rounded-3xl border border-white/40 p-5 pb-3 shadow-sm overflow-hidden">
                    {(() => {
                      const maxCal = Math.max(...weeklyStats.days.map(x => x.calories), CALORIE_LIMIT + 200)
                      const chartW = 320
                      const chartH = 120
                      const padX = 20
                      const padTop = 18
                      const totalH = chartH + padTop
                      const stepX = (chartW - padX * 2) / 6
                      const threshY = padTop + chartH - (CALORIE_LIMIT / maxCal) * chartH

                      const points = weeklyStats.days.map((d, i) => ({
                        x: padX + i * stepX,
                        y: d.calories > 0 ? padTop + chartH - (d.calories / maxCal) * chartH : padTop + chartH,
                        cal: d.calories,
                        date: d.date,
                      }))

                      const linePath = points.map((p, i) => {
                        if (i === 0) return `M ${p.x} ${p.y}`
                        const prev = points[i - 1]
                        const cpx = (prev.x + p.x) / 2
                        return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`
                      }).join(' ')

                      const areaPath = `${linePath} L ${points[6].x} ${totalH} L ${points[0].x} ${totalH} Z`

                      return (
                        <div>
                          <svg viewBox={`0 0 ${chartW} ${totalH + 2}`} className="w-full" style={{ height: '150px' }}>
                            <defs>
                              <linearGradient id="areaGreen" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6dbd8a" stopOpacity="0.35" />
                                <stop offset="100%" stopColor="#6dbd8a" stopOpacity="0.03" />
                              </linearGradient>
                              <linearGradient id="areaRed" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#e07070" stopOpacity="0.35" />
                                <stop offset="100%" stopColor="#e07070" stopOpacity="0.03" />
                              </linearGradient>
                              <clipPath id="clipAbove">
                                <rect x="0" y="0" width={chartW} height={threshY} />
                              </clipPath>
                              <clipPath id="clipBelow">
                                <rect x="0" y={threshY} width={chartW} height={totalH - threshY + 2} />
                              </clipPath>
                            </defs>
                            {/* Threshold line */}
                            <line x1={padX} y1={threshY} x2={chartW - padX} y2={threshY} stroke="#d4cdc4" strokeWidth="1" strokeDasharray="4 3" />
                            {/* Area - above threshold (red) */}
                            <path d={areaPath} fill="url(#areaRed)" clipPath="url(#clipAbove)" />
                            {/* Area - below threshold (green) */}
                            <path d={areaPath} fill="url(#areaGreen)" clipPath="url(#clipBelow)" />
                            {/* Line */}
                            <path d={linePath} fill="none" stroke="#b1728c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            {/* Dots + labels */}
                            {points.map((p, i) => (
                              <g key={i}>
                                {p.cal > 0 && (
                                  <>
                                    <circle cx={p.x} cy={p.y} r="4" fill={p.cal > CALORIE_LIMIT ? '#e07070' : '#6dbd8a'} stroke="white" strokeWidth="1.5" />
                                    <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="8" fill="#8a8078" fontFamily="Quicksand, sans-serif" fontWeight="500">
                                      {p.cal}
                                    </text>
                                  </>
                                )}
                              </g>
                            ))}
                          </svg>
                          <div className="flex justify-between mt-1" style={{ padding: '0 5%' }}>
                            {weeklyStats.days.map((d, i) => (
                              <span key={i} className="text-[10px] text-stone-400 text-center" style={{ width: `${100/7}%` }}>
                                {format(d.date, 'EEE').slice(0, 2)}
                              </span>
                            ))}
                          </div>
                          <p className="text-[10px] text-stone-400/60 text-right mt-1 italic">{CALORIE_LIMIT} kcal limit</p>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Summary cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40 p-4 text-center">
                      <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">Total Intake</p>
                      <p className="text-2xl font-light text-stone-700 font-serif">{weeklyStats.totalCalories.toLocaleString()}</p>
                      <p className="text-[10px] text-stone-400">kcal</p>
                    </div>
                    <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40 p-4 text-center">
                      <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">Daily Avg</p>
                      <p className={`text-2xl font-light font-serif ${weeklyStats.avgCalories > CALORIE_LIMIT ? 'text-red-400' : 'text-stone-700'}`}>{weeklyStats.avgCalories.toLocaleString()}</p>
                      <p className="text-[10px] text-stone-400">kcal / day</p>
                    </div>
                    <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40 p-4 text-center">
                      <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">Total Deficit</p>
                      <p className={`text-2xl font-light font-serif ${weeklyStats.totalDeficit >= 0 ? 'text-green-600/70' : 'text-red-400'}`}>{weeklyStats.totalDeficit >= 0 ? '' : '+'}{Math.abs(weeklyStats.totalDeficit).toLocaleString()}</p>
                      <p className="text-[10px] text-stone-400">{weeklyStats.totalDeficit >= 0 ? 'kcal deficit' : 'kcal surplus'}</p>
                    </div>
                    <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40 p-4 text-center">
                      <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">Avg Deficit</p>
                      <p className={`text-2xl font-light font-serif ${weeklyStats.avgDeficit >= 0 ? 'text-green-600/70' : 'text-red-400'}`}>{weeklyStats.avgDeficit >= 0 ? '' : '+'}{Math.abs(weeklyStats.avgDeficit).toLocaleString()}</p>
                      <p className="text-[10px] text-stone-400">kcal / day</p>
                    </div>
                    <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40 p-4 text-center">
                      <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">Total Protein</p>
                      <p className="text-2xl font-light text-stone-700 font-serif">{weeklyStats.totalProtein.toLocaleString()}</p>
                      <p className="text-[10px] text-stone-400">grams</p>
                    </div>
                    <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40 p-4 text-center">
                      <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">Days Tracked</p>
                      <p className="text-2xl font-light text-stone-700 font-serif">{weeklyStats.daysWithData}</p>
                      <p className="text-[10px] text-stone-400">of 7 days</p>
                    </div>
                  </div>

                  {/* Daily breakdown */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-serif italic text-stone-600 pl-2">Day by Day</h3>
                    {weeklyStats.days.slice().reverse().map(d => (
                      <div 
                        key={d.dateString} 
                        className="flex justify-between items-center p-3.5 bg-white/40 rounded-2xl border border-white/20 cursor-pointer hover:bg-white/50 transition"
                        onClick={() => { setSelectedDate(d.date); setView('dashboard') }}
                      >
                        <div>
                          <p className="text-sm text-stone-700">{format(d.date, 'EEEE')}</p>
                          <p className="text-[11px] text-stone-400">{format(d.date, 'MMM d')}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${
                            d.calories === 0 ? 'text-stone-300 italic' : d.calories > CALORIE_LIMIT ? 'text-red-400' : 'text-green-600/70'
                          }`}>{d.calories > 0 ? `${d.calories} kcal` : 'no logs'}</p>
                          {d.protein > 0 && <p className="text-[11px] text-stone-400">{d.protein}g protein</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-4 flex justify-center pb-12 md:pb-8">
            <div className="bg-white/20 backdrop-blur-md p-1 rounded-full flex gap-1 shadow-inner border border-white/20">
              <button onClick={() => { setView('dashboard'); setShowProfile(false) }} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${view === 'dashboard' ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}>Journal</button>
              <button onClick={() => { setView('calendar'); setShowProfile(false) }} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${view === 'calendar' ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}>Calendar</button>
              <button onClick={() => { setView('stats'); setShowProfile(false) }} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${view === 'stats' ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}>Reflect</button>
            </div>
          </div>

        </motion.div>
      )}
    </div>
  )
}