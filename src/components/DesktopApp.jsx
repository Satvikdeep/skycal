import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { format, addMonths, subMonths, isSameDay, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth } from 'date-fns'
import SwipeableEntry from './SwipeableEntry'

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
  onSignOut,
}) {
  const goalLeft = CALORIE_LIMIT - totalCals
  const isToday = isSameDay(selectedDate, new Date())
  const dayNumber = format(selectedDate, 'd')
  const daySuffix = format(selectedDate, 'do').replace(dayNumber, '')
  const weekStart = weeklyStats.days[0]?.date || new Date()
  const weekEnd = weeklyStats.days[6]?.date || new Date()

  // Reflect page local state
  const [weekOffset, setWeekOffset] = useState(0)
  const [weekDir, setWeekDir] = useState(0)
  const [reflectMonth, setReflectMonth] = useState(new Date())
  const [monthDir, setMonthDir] = useState(0)

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
    <div className="min-h-dvh w-full px-16 py-10">
      <div className="max-w-[1260px] mx-auto space-y-10">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center relative">
          <div className="flex items-center gap-3 justify-self-start">
            <img src="/skycal-logo.png" alt="SkyCal" className="h-10 w-auto object-contain" />
            <div>
              <p className="text-2xl font-serif italic text-stone-800 tracking-tight">SkyCal</p>
            </div>
          </div>

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
                  transition={{ type: 'spring', stiffness: 220, damping: 16, mass: 0.8 }}
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
                  transition={{ type: 'spring', stiffness: 220, damping: 16, mass: 0.8 }}
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
                className="absolute right-0 top-14 w-64"
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
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.28em] text-stone-500">Reflect</p>
                          <h3 className="text-3xl font-serif italic text-stone-800">Week + Month</h3>
                          <p className="mt-1 text-sm text-stone-600">{format(currentMonth, 'MMMM yyyy')}</p>
                        </div>
                        <div className="text-right text-xs text-stone-500">
                          <p className="text-[11px] uppercase tracking-widest">Week Range</p>
                          <p className="mt-1 text-sm text-stone-700">
                            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="rounded-[28px] bg-white/35 border border-white/50 p-6">
                          <p className="text-[11px] uppercase tracking-widest text-stone-500">This Week</p>
                          <div className="mt-4 grid grid-cols-3 gap-3">
                            <div className="rounded-2xl bg-white/45 border border-white/50 p-4">
                              <p className="text-[9px] uppercase tracking-widest text-stone-500">Avg Deficit</p>
                              <p className={`text-xl font-light font-serif ${weeklyStats.avgDeficit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {weeklyStats.avgDeficit >= 0 ? '' : '+'}{Math.abs(weeklyStats.avgDeficit).toLocaleString()}
                              </p>
                              <p className="text-[10px] text-stone-500">kcal / day</p>
                            </div>
                            <div className="rounded-2xl bg-white/45 border border-white/50 p-4">
                              <p className="text-[9px] uppercase tracking-widest text-stone-500">Total Deficit</p>
                              <p className={`text-xl font-light font-serif ${weeklyStats.totalDeficit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {weeklyStats.totalDeficit >= 0 ? '' : '+'}{Math.abs(weeklyStats.totalDeficit).toLocaleString()}
                              </p>
                              <p className="text-[10px] text-stone-500">kcal</p>
                            </div>
                            <div className="rounded-2xl bg-white/45 border border-white/50 p-4">
                              <p className="text-[9px] uppercase tracking-widest text-stone-500">Avg Protein</p>
                              <p className="text-xl font-light text-stone-800 font-serif">
                                {weeklyStats.avgProtein.toLocaleString()}g
                              </p>
                              <p className="text-[10px] text-stone-500">per day</p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[28px] bg-white/35 border border-white/50 p-6">
                          <p className="text-[11px] uppercase tracking-widest text-stone-500">This Month</p>
                          <div className="mt-4 grid grid-cols-3 gap-3">
                            <div className="rounded-2xl bg-white/45 border border-white/50 p-4">
                              <p className="text-[9px] uppercase tracking-widest text-stone-500">Avg Deficit</p>
                              <p className={`text-xl font-light font-serif ${monthStats.avgDeficit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {monthStats.avgDeficit >= 0 ? '' : '+'}{Math.abs(monthStats.avgDeficit).toLocaleString()}
                              </p>
                              <p className="text-[10px] text-stone-500">kcal / day</p>
                            </div>
                            <div className="rounded-2xl bg-white/45 border border-white/50 p-4">
                              <p className="text-[9px] uppercase tracking-widest text-stone-500">Total Deficit</p>
                              <p className={`text-xl font-light font-serif ${monthStats.totalDeficit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {monthStats.totalDeficit >= 0 ? '' : '+'}{Math.abs(monthStats.totalDeficit).toLocaleString()}
                              </p>
                              <p className="text-[10px] text-stone-500">kcal</p>
                            </div>
                            <div className="rounded-2xl bg-white/45 border border-white/50 p-4">
                              <p className="text-[9px] uppercase tracking-widest text-stone-500">Avg Protein</p>
                              <p className="text-xl font-light text-stone-800 font-serif">
                                {monthStats.avgProtein.toLocaleString()}g
                              </p>
                              <p className="text-[10px] text-stone-500">per day</p>
                            </div>
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
                                const maxCal = Math.max(
                                  ...data.map(x => x.calories),
                                  MAINTENANCE_CALORIES + 300
                                )
                                const chartW = 660
                                const chartH = 280
                                const padX = 40
                                const padTop = 32
                                const padBottom = 12
                                const plotH = chartH - padTop - padBottom
                                const totalH = chartH
                                const stepX = (chartW - padX * 2) / 6

                                const goalY = padTop + plotH - (CALORIE_LIMIT / maxCal) * plotH
                                const maintY = padTop + plotH - (MAINTENANCE_CALORIES / maxCal) * plotH

                                const points = data.map((d, i) => ({
                                  x: padX + i * stepX,
                                  y: d.calories > 0
                                    ? padTop + plotH - (d.calories / maxCal) * plotH
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
                                    <svg viewBox={`0 0 ${chartW} ${totalH + 2}`} className="w-full" style={{ height: '300px' }}>
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
                                      <rect x={padX - 2} y={maintY - 9} width="32" height="16" rx="4" fill="white" fillOpacity="0.7" />
                                      <text x={padX + 14} y={maintY + 3} textAnchor="middle" fontSize="10" fill="#78716c" fontFamily="sans-serif" fontWeight="600">{MAINTENANCE_CALORIES}</text>

                                      {/* Goal baseline */}
                                      <line x1={padX} y1={goalY} x2={chartW - padX} y2={goalY} stroke="#9a8e82" strokeWidth="1" strokeDasharray="4 3" />
                                      <rect x={padX - 2} y={goalY - 9} width="32" height="16" rx="4" fill="white" fillOpacity="0.7" />
                                      <text x={padX + 14} y={goalY + 3} textAnchor="middle" fontSize="10" fill="#78716c" fontFamily="sans-serif" fontWeight="600">{CALORIE_LIMIT}</text>

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
                                              <rect
                                                x={p.x - 18}
                                                y={p.y - 24}
                                                width="36"
                                                height="17"
                                                rx="6"
                                                fill="white"
                                                fillOpacity="0.85"
                                              />
                                              <text
                                                x={p.x}
                                                y={p.y - 12}
                                                textAnchor="middle"
                                                fontSize="11"
                                                fill="#44403c"
                                                fontFamily="sans-serif"
                                                fontWeight="600"
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
                      </div>
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
                  {isToday && (
                    <span className="text-[10px] tracking-[0.2em] text-stone-500 leading-none">
                      today
                    </span>
                  )}
                </div>
                <p className="text-sm text-stone-500">{format(selectedDate, 'EEEE, yyyy')}</p>
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
                      className="w-12 bg-transparent text-right text-sm text-stone-700 focus:outline-none"
                    />
                    <span>k</span>
                    <div className="w-px h-4 bg-stone-200/70"></div>
                    <input
                      type="number"
                      value={prot}
                      onChange={e => setProt(e.target.value)}
                      placeholder="0"
                      className="w-8 bg-transparent text-right text-sm text-stone-700 focus:outline-none"
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
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
