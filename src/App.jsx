import { useState, useEffect } from 'react'
import { auth, googleProvider, db } from './firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, ChevronLeft, ChevronRight, Plus, Calendar as CalIcon, X } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from 'date-fns'

// --- 1. LOCAL FILE PATHS ---
// These look for files inside the "public" folder
const MOBILE_BG = "/bg-mobile.jpeg"
const DESKTOP_BG = "/bg-desktop.jpg"

export default function App() {
  const [user, setUser] = useState(null)
  const [entries, setEntries] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date()) 
  const [selectedDate, setSelectedDate] = useState(new Date()) 
  const [view, setView] = useState('dashboard') 

  const [title, setTitle] = useState('')
  const [cals, setCals] = useState('')
  const [prot, setProt] = useState('')

  // Default to mobile bg initially
  const [bgImage, setBgImage] = useState(MOBILE_BG)

  // --- 2. WINDOW RESIZE LOGIC ---
  useEffect(() => {
    const handleResize = () => {
      // If screen is wider than 768px, use desktop image, else mobile
      if (window.innerWidth > 768) {
        setBgImage(DESKTOP_BG)
      } else {
        setBgImage(MOBILE_BG)
      }
    }
    handleResize() // Check immediately on load
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Auth & Data Listener
  useEffect(() => {
    let unsubscribeSnapshot = null
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        // Query only by uid to avoid needing a composite index
        const q = query(
          collection(db, "logs"),
          where("uid", "==", currentUser.uid)
        )
        unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
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
      unsubscribeAuth()
      if (unsubscribeSnapshot) unsubscribeSnapshot()
    }
  }, [])

  const handleLogin = async () => await signInWithPopup(auth, googleProvider)

  const addEntry = async () => {
    if (!title || !cals) return
    await addDoc(collection(db, "logs"), {
      uid: user.uid, title, calories: Number(cals), protein: Number(prot) || 0,
      createdAt: serverTimestamp(), dateString: format(new Date(), 'yyyy-MM-dd')
    })
    setTitle(''); setCals(''); setProt(''); setView('dashboard')
  }

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
  const logsForSelectedDate = entries.filter(e => e.dateString === selectedDateStr)
  const totalCals = logsForSelectedDate.reduce((acc, curr) => acc + curr.calories, 0)

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)
    const rows = []; let days = []; let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day
        days.push(
          <div
            className={`p-2 w-full text-center text-sm cursor-pointer rounded-full relative transition-all
              ${!isSameMonth(day, monthStart) ? "text-stone-400/50" : "text-stone-600"}
              ${isSameDay(day, selectedDate) ? "selected-date shadow-md scale-110" : "hover:bg-white/40"}
            `}
            key={day} onClick={() => { setSelectedDate(cloneDay); setView('dashboard') }}
          >
            {format(day, "d")}
            {entries.some(e => e.dateString === format(cloneDay, 'yyyy-MM-dd')) && !isSameDay(day, selectedDate) && (
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-pink-500 rounded-full"></div>
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
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 transition-all duration-1000"
      style={{ 
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundColor: '#fce7f3' // Pink fallback if image fails
      }}
    >
      {!user ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-12 rounded-[40px] text-center max-w-sm w-full shadow-2xl">
          <h1 className="text-5xl italic mb-2 text-stone-800 tracking-tight">SkyCal</h1>
          <p className="text-stone-600 mb-8 font-light">Your daily nutrition journal.</p>
          <button onClick={handleLogin} className="w-full py-3 bg-stone-800 text-white rounded-2xl font-medium hover:bg-stone-700 transition">Enter Journal</button>
        </motion.div>
      ) : (
        <motion.div layout className="glass-panel w-full max-w-md h-[85vh] rounded-[40px] flex flex-col overflow-hidden relative shadow-2xl backdrop-blur-xl bg-white/40 border border-white/60">
          
          <div className="p-8 pb-4 flex justify-between items-start">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">Current Log</p>
              <h2 className="text-3xl italic text-stone-800">{format(selectedDate, 'MMMM do')}</h2>
            </div>
            
            <button onClick={() => signOut(auth)} className="p-2 bg-white/30 hover:bg-red-50 hover:text-red-500 rounded-full transition text-stone-400">
              <LogOut size={16} />
            </button>
          </div>

          <div className="px-8 pb-4 border-b border-stone-200/30 flex justify-between items-baseline">
             <div className="text-4xl font-light text-stone-800">{totalCals} <span className="text-sm font-normal text-stone-400">kcal</span></div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
            <AnimatePresence mode="wait">
              {view === 'dashboard' ? (
                <motion.div key="dash" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="space-y-6">
                  
                  <div className="bg-white/40 p-6 rounded-3xl backdrop-blur-sm border border-white/40 shadow-sm">
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Morning coffee..." className="w-full bg-transparent text-xl placeholder-stone-400 text-stone-800 focus:outline-none mb-6 font-serif italic" />
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
                     <h3 className="text-lg font-serif italic text-stone-600 pl-2">Meals</h3>
                     {logsForSelectedDate.length === 0 ? (
                       <p className="text-center text-stone-400 text-sm py-8 italic font-light">Your plate is empty.</p>
                     ) : (
                       logsForSelectedDate.map(entry => (
                         <div key={entry.id} className="flex justify-between items-center p-4 bg-white/40 rounded-2xl hover:bg-white/60 transition border border-white/20">
                           <div>
                             <p className="text-base font-medium text-stone-800">{entry.title}</p>
                             <p className="text-xs text-stone-500">{entry.protein}g protein</p>
                           </div>
                           <p className="font-bold text-stone-600">{entry.calories}</p>
                         </div>
                       ))
                     )}
                  </div>
                </motion.div>
              ) : (
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
                   <div className="mt-8 text-center">
                      <button onClick={() => { setSelectedDate(new Date()); setView('dashboard') }} className="text-xs bg-stone-800 text-white px-6 py-3 rounded-full shadow-lg hover:scale-105 transition hover:bg-black">
                        Return to Today
                      </button>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-4 flex justify-center pb-8">
            <div className="bg-white/20 backdrop-blur-md p-1 rounded-full flex gap-1 shadow-inner border border-white/20">
              <button onClick={() => setView('dashboard')} className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${view === 'dashboard' ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}>Journal</button>
              <button onClick={() => setView('calendar')} className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${view === 'calendar' ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}>Calendar</button>
            </div>
          </div>

        </motion.div>
      )}
    </div>
  )
}