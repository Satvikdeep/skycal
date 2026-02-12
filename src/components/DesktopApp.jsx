import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Github, Globe } from 'lucide-react'
import { format, addMonths, subMonths, isSameDay, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth } from 'date-fns'
import SwipeableEntry from './SwipeableEntry'
import ScrollIndicator from './ScrollIndicator'

function StatsCard({ title, value, unit, hoverTitle, hoverValue, hoverUnit, isDeficit }) {
  const [isHovered, setIsHovered] = useState(false)
  
  const isProtein = title.includes('Protein')
  
  // Value formatting
  const currentValRaw = isHovered ? hoverValue : value
  const currentValAbs = Math.abs(currentValRaw).toLocaleString()
  const showPlus = !isHovered && isDeficit && currentValRaw < 0
  
  // Title / Unit
  const currentTitle = isHovered ? hoverTitle : title
  const currentUnit = isHovered ? hoverUnit : unit
  
  const textColor = !isHovered && isDeficit
    ? (value >= 0 ? 'text-emerald-600' : 'text-red-500')
    : 'text-stone-800'

  return (
    <div 
      className="rounded-2xl bg-white/45 border border-white/50 p-4 transition-all duration-300 hover:bg-white/60 cursor-default select-none relative overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative z-10">
        <p className="text-[9px] uppercase tracking-widest text-stone-500 mb-2 h-3 block transition-colors duration-300">
          {currentTitle}
        </p>
        <div className="h-7 w-full relative mb-1">
           <AnimatePresence mode="wait" initial={false}>
             <motion.p
               key={isHovered ? 'hover' : 'normal'}
               initial={{ opacity: 0, y: 5, filter: 'blur(2px)' }}
               animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
               exit={{ opacity: 0, y: -5, filter: 'blur(2px)' }}
               transition={{ duration: 0.2, ease: "easeOut" }}
               className={`text-xl font-light font-serif leading-none absolute inset-0 ${textColor}`}
             >
               {showPlus ? '+' : ''}{currentValAbs}{isProtein ? 'g' : ''}
             </motion.p>
           </AnimatePresence>
        </div>
        <p className="text-[10px] text-stone-500">
           {currentUnit}
        </p>
      </div>
    </div>
  )
}

export default function DesktopApp({
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
  MAINTENANCE_CALORIES,
  renderCalendar,
  weeklyStats,
  monthStats,
  monthWeeks,
  yearMonths,
  dailyTotals,
  saveSettings,
  onSignOut,
  isV2
}) {
  const goalLeft = CALORIE_LIMIT - totalCals
  const isToday = isSameDay(selectedDate, new Date())
  const dayNumber = format(selectedDate, 'd')
  const daySuffix = format(selectedDate, 'do').replace(dayNumber, '')
  const weekStart = weeklyStats.days[0]?.date || new Date()
  const weekEnd = weeklyStats.days[6]?.date || new Date()

  // Live IST clock
  const [istTime, setIstTime] = useState(() => new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }))
  useEffect(() => {
    const tick = setInterval(() => {
      setIstTime(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }))
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  // Reflect page local state
  const [weekOffset, setWeekOffset] = useState(0)
  const [weekDir, setWeekDir] = useState(0)
  const [reflectMonth, setReflectMonth] = useState(new Date())
  const [monthDir, setMonthDir] = useState(0)
  const [editGoal, setEditGoal] = useState(CALORIE_LIMIT)
  const [editMaint, setEditMaint] = useState(MAINTENANCE_CALORIES)
  const [savedMsg, setSavedMsg] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [showFooter, setShowFooter] = useState(false)
  const [showIndepth, setShowIndepth] = useState(false)

  useEffect(() => { setEditGoal(CALORIE_LIMIT) }, [CALORIE_LIMIT])
  useEffect(() => { setEditMaint(MAINTENANCE_CALORIES) }, [MAINTENANCE_CALORIES])

  const handleSaveSettings = () => {
    saveSettings(editGoal, editMaint)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 1500)
  }

  const goToPrevWeek = () => { setWeekDir(-1); setWeekOffset(p => p - 1) }
  const goToNextWeek = () => { if (weekOffset < 0) { setWeekDir(1); setWeekOffset(p => p + 1) } }
  const goToPrevMonth = () => { setMonthDir(-1); setReflectMonth(p => subMonths(p, 1)) }
  const goToNextMonth = () => { setMonthDir(1); setReflectMonth(p => addMonths(p, 1)) }

  const reflectWeekData = useMemo(() => {
    const today = new Date()
    const days = []
    for (let i = 7; i >= 1; i--) {
      const d = subDays(today, i + (-weekOffset * 7))
      const ds = format(d, 'yyyy-MM-dd')
      const data = dailyTotals[ds] || { calories: 0, protein: 0 }
      days.push({ date: d, dateString: ds, ...data })
    }
    return { days }
  }, [weekOffset, dailyTotals])

  const reflectCalendar = useMemo(() => {
    const ms = startOfMonth(reflectMonth)
    const me = endOfMonth(ms)
    const calStart = startOfWeek(ms)
    const calEnd = endOfWeek(me)
    const today = new Date()
    const rows = []
    let days = []
    let day = calStart
    while (day <= calEnd) {
      for (let ii = 0; ii < 7; ii++) {
        const dayStr = format(day, 'yyyy-MM-dd')
        const dayData = dailyTotals[dayStr]
        const isInMonth = isSameMonth(day, ms)
        const isFutureDay = day > today
        const hasData = dayData && dayData.calories > 0 && isInMonth && !isFutureDay
        const deficit = hasData ? MAINTENANCE_CALORIES - dayData.calories : null
        days.push({
          date: new Date(day),
          dayNum: format(day, 'd'),
          isInMonth,
          hasData,
          deficit,
          isToday: isSameDay(day, today)
        })
        day = addDays(day, 1)
      }
      rows.push([...days])
      days = []
    }
    return rows
  }, [reflectMonth, dailyTotals, MAINTENANCE_CALORIES])

  return (
    <div className="min-h-dvh w-full px-16 py-10 flex flex-col">
      <div className="max-w-[1260px] mx-auto space-y-10 flex-1 w-full">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center relative">
          <motion.div
            className="flex items-end gap-3 justify-self-start cursor-pointer select-none"
            onClick={() => setShowFooter(f => !f)}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <img src="/skycal-logo.png" alt="SkyCal" className="h-[46px] w-auto object-contain" />
            <div>
              <p className="text-2xl font-serif italic text-stone-800 tracking-tight">SkyCal</p>
              {isV2 && <p className="text-[9px] uppercase tracking-widest text-emerald-600 font-bold ml-0.5 -mt-0.5">V2 Beta</p>}
            </div>
          </motion.div>

          <div className="bg-white/60 backdrop-blur-md p-1 rounded-full flex gap-1 shadow-inner border border-white/40 relative">
            <button
              onClick={() => {
                setView('dashboard')
                setShowProfile(false)
              }}
              className="relative px-6 py-2 rounded-full text-sm font-medium text-stone-600 hover:text-stone-800 transition"
            >
              {view !== 'stats' && (
                <motion.span
                  layoutId="nav-pill"
                  transition={{ type: 'spring', stiffness: 140, damping: 12, mass: 1 }}
                  className="absolute inset-0 rounded-full bg-stone-200/70 border border-white/70 shadow"
                />
              )}
              <span className={`relative z-10 ${view !== 'stats' ? 'text-stone-800' : ''}`}>
                Journal
              </span>
            </button>
            <button
              onClick={() => {
                setView('stats')
                setShowProfile(false)
              }}
              className="relative px-6 py-2 rounded-full text-sm font-medium text-stone-600 hover:text-stone-800 transition"
            >
              {view === 'stats' && (
                <motion.span
                  layoutId="nav-pill"
                  transition={{ type: 'spring', stiffness: 140, damping: 12, mass: 1 }}
                  className="absolute inset-0 rounded-full bg-stone-200/70 border border-white/70 shadow"
                />
              )}
              <span className={`relative z-10 ${view === 'stats' ? 'text-stone-800' : ''}`}>
                Reflect
              </span>
            </button>
          </div>

          <button
            onClick={() => setShowProfile(!showProfile)}
            className="w-10 h-10 rounded-full bg-white/70 border border-white/80 flex items-center justify-center text-stone-700 shadow-sm justify-self-end"
          >
            <span className="text-sm font-semibold">
              {(user?.displayName || user?.email || 'User')[0].toUpperCase()}
            </span>
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="absolute right-0 top-14 w-64 z-50"
              >
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 p-4 space-y-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    {user?.photoURL && (
                      <img
                        src={user.photoURL}
                        alt=""
                        className="w-10 h-10 rounded-full shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">
                        {user?.displayName || 'User'}
                      </p>
                      <p className="text-xs text-stone-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <div className="border-t border-stone-200/40 pt-3 space-y-3">
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-medium">Goals</p>
                    <div className="space-y-1">
                      <label className="text-[11px] text-stone-500 font-medium">Daily Goal</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={editGoal}
                          onChange={e => setEditGoal(e.target.value)}
                          onFocus={() => setFocusedField('goal')}
                          onBlur={() => setTimeout(() => setFocusedField(f => f === 'goal' ? null : f), 150)}
                          onKeyDown={e => { if (e.key === 'Enter') { handleSaveSettings(); e.target.blur() } }}
                          className="w-full bg-white/60 border border-stone-200/50 rounded-xl px-3 py-2 pr-16 text-sm text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          {focusedField === 'goal' && (
                            <button
                              onMouseDown={e => { e.preventDefault(); handleSaveSettings() }}
                              className="px-2 py-0.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white text-[10px] font-semibold transition shadow-sm"
                            >
                              Save
                            </button>
                          )}
                          <span className="text-[10px] text-stone-400">kcal</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-stone-500 font-medium">Maintenance</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={editMaint}
                          onChange={e => setEditMaint(e.target.value)}
                          onFocus={() => setFocusedField('maint')}
                          onBlur={() => setTimeout(() => setFocusedField(f => f === 'maint' ? null : f), 150)}
                          onKeyDown={e => { if (e.key === 'Enter') { handleSaveSettings(); e.target.blur() } }}
                          className="w-full bg-white/60 border border-stone-200/50 rounded-xl px-3 py-2 pr-16 text-sm text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          {focusedField === 'maint' && (
                            <button
                              onMouseDown={e => { e.preventDefault(); handleSaveSettings() }}
                              className="px-2 py-0.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white text-[10px] font-semibold transition shadow-sm"
                            >
                              Save
                            </button>
                          )}
                          <span className="text-[10px] text-stone-400">kcal</span>
                        </div>
                      </div>
                    </div>
                    <AnimatePresence>
                      {savedMsg && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-[11px] text-stone-800 font-medium text-center"
                        >
                          ✓ Saved
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  <button
                    onClick={onSignOut}
                    className="w-full py-2.5 bg-white/70 hover:bg-red-50 text-stone-600 hover:text-red-500 rounded-xl text-sm font-medium transition border border-white/30"
                  >
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {view === 'stats' ? (
                    <div className="space-y-10">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="rounded-[28px] bg-white/35 border border-white/50 p-6">
                          <p className="text-[11px] uppercase tracking-widest text-stone-500">This Week</p>
                          <div className="mt-4 grid grid-cols-3 gap-3">
                            <StatsCard
                              title="Avg Deficit"
                              value={weeklyStats.avgDeficit}
                              unit="kcal / day"
                              hoverTitle="Avg Intake"
                              hoverValue={weeklyStats.avgCalories}
                              hoverUnit="kcal / day"
                              isDeficit={true}
                            />
                            <StatsCard
                              title="Total Deficit"
                              value={weeklyStats.totalDeficit}
                              unit="kcal"
                              hoverTitle="Total Intake"
                              hoverValue={weeklyStats.totalCalories}
                              hoverUnit="kcal"
                              isDeficit={true}
                            />
                            <StatsCard
                              title="Avg Protein"
                              value={weeklyStats.avgProtein}
                              unit="per day"
                              hoverTitle="Total Protein"
                              hoverValue={weeklyStats.totalProtein}
                              hoverUnit="total"
                              isDeficit={false}
                            />
                          </div>
                        </div>

                        <div className="rounded-[28px] bg-white/35 border border-white/50 p-6">
                          <p className="text-[11px] uppercase tracking-widest text-stone-500">This Month</p>
                          <div className="mt-4 grid grid-cols-3 gap-3">
                            <StatsCard
                              title="Avg Deficit"
                              value={monthStats.avgDeficit}
                              unit="kcal / day"
                              hoverTitle="Avg Intake"
                              hoverValue={monthStats.avgCalories}
                              hoverUnit="kcal / day"
                              isDeficit={true}
                            />
                            <StatsCard
                              title="Total Deficit"
                              value={monthStats.totalDeficit}
                              unit="kcal"
                              hoverTitle="Total Intake"
                              hoverValue={monthStats.totalCalories}
                              hoverUnit="kcal"
                              isDeficit={true}
                            />
                            <StatsCard
                              title="Avg Protein"
                              value={monthStats.avgProtein}
                              unit="per day"
                              hoverTitle="Total Protein"
                              hoverValue={monthStats.totalProtein}
                              hoverUnit="total"
                              isDeficit={false}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Weekly Graph + Monthly Calendar */}
                      <div className="grid grid-cols-[1fr_380px] gap-8 items-start">
                        {/* Weekly Calorie Chart */}
                        <div className="rounded-[28px] bg-white/50 backdrop-blur-md border border-white/60 p-6 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <button
                              onClick={goToPrevWeek}
                              className="p-2 hover:bg-white/40 rounded-full text-stone-500 transition"
                            >
                              <ChevronLeft size={18} />
                            </button>
                            <div className="text-center">
                              <p className="text-xs uppercase tracking-widest text-stone-500 mb-0.5 font-medium">Weekly Intake</p>
                              <p className="text-sm text-stone-700 font-medium">
                                {format(reflectWeekData.days[0]?.date || new Date(), 'MMM d')} — {format(reflectWeekData.days[6]?.date || new Date(), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <button
                              onClick={goToNextWeek}
                              className={`p-2 hover:bg-white/40 rounded-full transition ${weekOffset >= 0 ? 'text-stone-300 cursor-default' : 'text-stone-500'}`}
                              disabled={weekOffset >= 0}
                            >
                              <ChevronRight size={18} />
                            </button>
                          </div>

                          <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                              key={weekOffset}
                              initial={{ opacity: 0, x: weekDir * 30 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -weekDir * 30 }}
                              transition={{ duration: 0.2, ease: 'easeOut' }}
                            >
                              {(() => {
                                const data = reflectWeekData.days
                                const calsWithData = data.filter(x => x.calories > 0).map(x => x.calories)
                                const maxCal = Math.max(...calsWithData, MAINTENANCE_CALORIES + 200)
                                const minCal = Math.max(0, Math.min(...(calsWithData.length ? calsWithData : [0]), CALORIE_LIMIT) - 300)
                                const range = maxCal - minCal
                                const chartW = 660
                                const chartH = 240
                                const padX = 40
                                const padTop = 32
                                const padBottom = 12
                                const plotH = chartH - padTop - padBottom
                                const totalH = chartH
                                const stepX = (chartW - padX * 2) / 6

                                const calToY = (cal) => padTop + plotH - ((cal - minCal) / range) * plotH
                                const goalY = calToY(CALORIE_LIMIT)
                                const maintY = calToY(MAINTENANCE_CALORIES)

                                const points = data.map((d, i) => ({
                                  x: padX + i * stepX,
                                  y: d.calories > 0
                                    ? calToY(d.calories)
                                    : padTop + plotH,
                                  cal: d.calories,
                                  date: d.date,
                                  hasData: d.calories > 0,
                                }))

                                const linePath = points
                                  .map((p, i) => {
                                    if (i === 0) return `M ${p.x} ${p.y}`
                                    const prev = points[i - 1]
                                    const cpx = (prev.x + p.x) / 2
                                    return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`
                                  })
                                  .join(' ')

                                const areaPath = `${linePath} L ${points[6].x} ${totalH} L ${points[0].x} ${totalH} Z`

                                return (
                                  <div>
                                    <svg viewBox={`0 0 ${chartW} ${totalH + 2}`} className="w-full" style={{ height: '260px' }}>
                                      <defs>
                                        <linearGradient id="deskAreaGreen" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="0%" stopColor="#6dbd8a" stopOpacity="0.28" />
                                          <stop offset="100%" stopColor="#6dbd8a" stopOpacity="0.02" />
                                        </linearGradient>
                                        <linearGradient id="deskAreaRed" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="0%" stopColor="#e07070" stopOpacity="0.28" />
                                          <stop offset="100%" stopColor="#e07070" stopOpacity="0.02" />
                                        </linearGradient>
                                        <clipPath id="deskClipAbove">
                                          <rect x="0" y="0" width={chartW} height={goalY} />
                                        </clipPath>
                                        <clipPath id="deskClipBelow">
                                          <rect x="0" y={goalY} width={chartW} height={totalH - goalY + 2} />
                                        </clipPath>
                                      </defs>

                                      {/* Maintenance baseline */}
                                      <line x1={padX} y1={maintY} x2={chartW - padX} y2={maintY} stroke="#9a8e82" strokeWidth="1" strokeDasharray="6 4" />
                                      <text x={padX - 6} y={maintY + 4} textAnchor="end" fontSize="10" fill="#a8a098" fontFamily="sans-serif" fontWeight="500">{MAINTENANCE_CALORIES}</text>

                                      {/* Goal baseline */}
                                      <line x1={padX} y1={goalY} x2={chartW - padX} y2={goalY} stroke="#9a8e82" strokeWidth="1" strokeDasharray="4 3" />
                                      <text x={padX - 6} y={goalY + 4} textAnchor="end" fontSize="10" fill="#a8a098" fontFamily="sans-serif" fontWeight="500">{CALORIE_LIMIT}</text>

                                      {/* Area fills */}
                                      <path d={areaPath} fill="url(#deskAreaRed)" clipPath="url(#deskClipAbove)" />
                                      <path d={areaPath} fill="url(#deskAreaGreen)" clipPath="url(#deskClipBelow)" />

                                      {/* Curve */}
                                      <path d={linePath} fill="none" stroke="#c0647e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                                      {/* Data points */}
                                      {points.map((p, i) => (
                                        <g key={i}>
                                          {p.hasData && (
                                            <>
                                              <circle
                                                cx={p.x}
                                                cy={p.y}
                                                r="5"
                                                fill={
                                                  p.cal > MAINTENANCE_CALORIES
                                                    ? '#e07070'
                                                    : p.cal > CALORIE_LIMIT
                                                    ? '#d4a74a'
                                                    : '#6dbd8a'
                                                }
                                                stroke="white"
                                                strokeWidth="2"
                                              />
                                              <text
                                                x={p.x}
                                                y={p.y - 12}
                                                textAnchor="middle"
                                                fontSize="10"
                                                fill="#b0a89e"
                                                fontFamily="sans-serif"
                                                fontWeight="500"
                                              >
                                                {p.cal}
                                              </text>
                                            </>
                                          )}
                                        </g>
                                      ))}
                                    </svg>

                                    <div className="flex justify-between mt-2 px-3">
                                      {data.map((d, i) => (
                                        <span key={i} className="text-xs text-stone-600 font-medium text-center" style={{ width: `${100 / 7}%` }}>
                                          {format(d.date, 'EEE')}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )
                              })()}
                            </motion.div>
                          </AnimatePresence>

                          {/* Legend */}
                          <div className="flex items-center justify-center gap-6 mt-4 text-[11px] text-stone-500">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#6dbd8a]"></span> Under {CALORIE_LIMIT}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#d4a74a]"></span> {CALORIE_LIMIT}–{MAINTENANCE_CALORIES}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#e07070]"></span> Over {MAINTENANCE_CALORIES}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4">
                        {/* Monthly Calendar with Deficits */}
                        <div className="rounded-[28px] bg-white/50 backdrop-blur-md border border-white/60 p-5 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <button
                              onClick={goToPrevMonth}
                              className="p-2 hover:bg-white/40 rounded-full text-stone-500 transition"
                            >
                              <ChevronLeft size={18} />
                            </button>
                            <h3 className="text-base font-semibold text-stone-800">
                              {format(reflectMonth, 'MMMM yyyy')}
                            </h3>
                            <button
                              onClick={goToNextMonth}
                              className="p-2 hover:bg-white/40 rounded-full text-stone-500 transition"
                            >
                              <ChevronRight size={18} />
                            </button>
                          </div>

                          <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                              key={format(reflectMonth, 'yyyy-MM')}
                              initial={{ opacity: 0, x: monthDir * 30 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -monthDir * 30 }}
                              transition={{ duration: 0.2, ease: 'easeOut' }}
                            >
                              <div>
                                <div className="grid grid-cols-7 text-center text-[10px] text-stone-500 uppercase tracking-widest font-bold mb-3">
                                  <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                                </div>
                                {reflectCalendar.map((week, wi) => (
                                  <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
                                    {week.map((day, di) => (
                                      <div
                                        key={di}
                                        className={`rounded-xl py-1.5 px-1 text-center min-h-[52px] flex flex-col items-center justify-center transition cursor-pointer hover:bg-stone-100/60
                                          ${!day.isInMonth ? 'opacity-15' : ''}
                                          ${day.isToday ? 'bg-stone-800 text-white shadow-md' : ''}
                                        `}
                                        onClick={() => {
                                          setSelectedDate(day.date)
                                          setView('dashboard')
                                        }}
                                      >
                                        <span className={`text-xs leading-none font-medium ${day.isToday ? 'text-white' : 'text-stone-700'}`}>
                                          {day.dayNum}
                                        </span>
                                        {day.hasData && (
                                          <span className={`text-[10px] font-semibold mt-1 leading-none ${
                                            day.isToday
                                              ? day.deficit >= 0 ? 'text-green-300' : 'text-red-300'
                                              : day.deficit >= 0 ? 'text-emerald-600' : 'text-red-500'
                                          }`}>
                                            {day.deficit > 0 ? '+' : ''}{day.deficit}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>

                              {/* Calendar legend */}
                              <div className="flex items-center justify-center gap-5 mt-4 text-[10px] text-stone-500">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Deficit (+)
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-red-400"></span> Surplus (−)
                                </span>
                              </div>
                            </motion.div>
                          </AnimatePresence>
                        </div>

                        <button
                          onClick={() => setShowIndepth(!showIndepth)}
                          className="w-full py-2 rounded-2xl bg-white/40 border border-white/50 text-stone-600 text-xs font-medium hover:bg-white/60 hover:text-stone-800 transition shadow-sm uppercase tracking-wider relative overflow-hidden group"
                        >
                          <span className="relative z-10 group-hover:text-stone-900 transition-colors">
                            {showIndepth ? 'Hide Analysis' : 'Look into indepth analysis'}
                          </span>
                          <motion.span 
                            className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity"
                            layoutId="hover-bg"
                          />
                        </button>
                        </div>
                      </div>

                      <AnimatePresence>
                         {showIndepth && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, scale: 0.98, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, height: 'auto', scale: 1, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, height: 0, scale: 0.98, filter: 'blur(10px)' }}
                                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                                className="overflow-hidden"
                            >
                                <div className="rounded-[28px] bg-white/35 border border-white/50 p-8 min-h-[400px] flex flex-col items-center justify-center text-stone-400 gap-4 mt-8">
                                    <div className="p-4 rounded-full bg-white/40 shadow-sm text-stone-400">
                                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
                                    </div>
                                    <div className="text-center space-y-1">
                                      <p className="text-sm font-medium text-stone-600">Advanced Analytics</p>
                                      <p className="text-xs text-stone-400/80 max-w-[200px] mx-auto leading-relaxed">
                                        Deeper insights into your nutrition patterns will appear here in the next update.
                                      </p>
                                    </div>
                                </div>
                            </motion.div>
                         )}
                      </AnimatePresence>
                    </div>
                  ) : (
                <div className="grid grid-cols-[320px_minmax(0,1fr)_280px] gap-14">
                <div className="space-y-6">
              <div className="space-y-1">
                <div className="flex items-baseline gap-4">
                  <h2 className="text-[38px] font-serif italic text-stone-800">
                    {format(selectedDate, 'MMM ')}
                    {dayNumber}
                    <sup className="ml-0.5 text-[0.45em] font-medium">{daySuffix}</sup>
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-stone-500">{format(selectedDate, 'EEEE, yyyy')}</p>
                  {isToday && (
                    <span className="text-[11px] text-stone-600 leading-none bg-white/30 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/40">
                      today
                    </span>
                  )}
                </div>
              </div>

              <div className="glass-panel rounded-[28px] px-6 py-5 space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-2 hover:bg-white/40 rounded-full text-stone-600"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <h3 className="text-sm font-medium text-stone-700">
                    {format(currentMonth, 'MMMM')}
                  </h3>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 hover:bg-white/40 rounded-full text-stone-600"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-7 text-center text-[10px] text-stone-400 uppercase tracking-widest font-bold">
                  <div>S</div>
                  <div>M</div>
                  <div>T</div>
                  <div>W</div>
                  <div>T</div>
                  <div>F</div>
                  <div>S</div>
                </div>

                <div className="text-xs text-stone-600">{renderCalendar()}</div>
              </div>

              {!isToday && (
                <button
                  onClick={() => {
                    setSelectedDate(new Date())
                    setView('dashboard')
                  }}
                  className="w-fit text-xs bg-stone-900 text-white px-5 py-2.5 rounded-full shadow hover:bg-black transition"
                >
                  Back to Today
                </button>
              )}
            </div>

            <div className="space-y-10 max-w-[720px] mx-auto w-full">
              <div className="bg-white/85 rounded-[999px] px-6 py-2.5 shadow-[0_18px_40px_rgba(15,23,42,0.12)] border border-white/70">
                <div className="flex items-center gap-4">
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="What did you eat?"
                    className="flex-1 bg-transparent px-1 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none"
                  />
                  <div className="flex items-center gap-2 text-xs text-stone-400">
                    <input
                      type="number"
                      value={cals}
                      onChange={e => setCals(e.target.value)}
                      placeholder="0"
                      className="w-12 bg-transparent text-right text-sm text-stone-700 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span>cal</span>
                    <div className="w-px h-4 bg-stone-200/70"></div>
                    <input
                      type="number"
                      value={prot}
                      onChange={e => setProt(e.target.value)}
                      placeholder="0"
                      className="w-5 bg-transparent text-right text-sm text-stone-700 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span>p</span>
                  </div>
                  <button
                    onClick={addEntry}
                    className="w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center shadow"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                {logsForSelectedDate.length === 0 ? (
                  <div className="glass-panel rounded-3xl p-8 text-center text-stone-400 text-sm italic bg-white/60 border border-white/40">
                    Your plate is empty.
                  </div>
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
                      contentClassName="bg-white/60 border-white/40 shadow-[0_10px_28px_rgba(15,23,42,0.08)]"
                      editClassName="bg-white/60 border-white/40"
                    />
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[28px] p-2 flex flex-col gap-6">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-stone-700">Total Intra-day</p>
                <p className="text-[68px] leading-[1] font-serif text-stone-800">{totalCals}</p>
                <p className="text-xs text-stone-700 mt-1">kcal consumed</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-end gap-3 text-xs text-stone-700">
                  <span className="uppercase tracking-widest text-[10px]">Goal</span>
                  <div className="w-16 h-px bg-stone-400/80"></div>
                  <span className="text-stone-800 font-medium">{CALORIE_LIMIT}</span>
                </div>
                <div className="flex items-center justify-end gap-3 text-xs text-stone-700">
                  <span className="uppercase tracking-widest text-[10px]">Left</span>
                  <div className="w-16 h-px bg-stone-400/80"></div>
                  <span className={`font-medium ${goalLeft >= 0 ? 'text-stone-800' : 'text-red-500'}`}>
                    {goalLeft}
                  </span>
                </div>
              </div>
              <div className="text-right mt-4">
                <p className="text-[10px] uppercase tracking-widest text-stone-600 mb-0.5">IST</p>
                <p className="text-lg font-light text-stone-600 tabular-nums">{istTime}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showFooter && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="flex justify-end pb-1 pt-4 pr-4"
          >
            <div className="flex flex-col items-end gap-2">
              <motion.img
                src="/satvik.png"
                alt="Satvik"
                className="w-40 h-40 rounded-2xl object-cover object-top"
                initial={{ opacity: 0, y: 20, filter: 'drop-shadow(0 0 0px rgba(255,255,255,0))' }}
                animate={{ opacity: 1, y: 0, filter: 'drop-shadow(0 0 0px rgba(255,255,255,0))' }}
                whileHover={{ filter: 'drop-shadow(0 0 14px rgba(255,255,255,0.75))' }}
                transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.05 }}
              />
              <div className="group flex items-center gap-3 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 shadow-sm hover:bg-white/35 transition cursor-default">
              <div className="flex items-center gap-1.5">
                <a href="https://github.com/Satvikdeep" target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-stone-700 transition">
                  <Github size={13} />
                </a>
                <a href="https://github.com/Satvikdeep" target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-stone-700 transition">
                  <Globe size={13} />
                </a>
              </div>
              <p className="text-[11px] text-stone-500 group-hover:text-stone-700 transition">designed by satvik, with much love.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ScrollIndicator watch={[view, showIndepth, logsForSelectedDate, showProfile, showFooter, selectedDate, currentMonth]} />
    </div>
  )
}
