import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, LogOut } from 'lucide-react'
import { format, addMonths, subMonths } from 'date-fns'
import SwipeableEntry from './SwipeableEntry'

export default function MobileApp({
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
}) {
  return (
    <>
      <motion.div
        layout
        className="glass-panel w-full md:max-w-md min-h-dvh md:min-h-0 md:h-[85vh] rounded-none md:rounded-[40px] flex flex-col md:overflow-hidden relative shadow-none md:shadow-2xl backdrop-blur-xl bg-white/40 border-0 md:border border-white/60"
      >
        <div className="p-8 pt-16 md:pt-8 pb-4 flex justify-between items-start">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">Current Log</p>
            <h2 className="text-3xl italic text-stone-800">{format(selectedDate, 'MMMM do')}</h2>
          </div>

          <button
            onClick={() => setShowProfile(!showProfile)}
            className="p-2 bg-white/30 hover:bg-white/50 rounded-full transition text-stone-400"
          >
            <LogOut size={16} />
          </button>
        </div>

        <AnimatePresence>
          {showProfile && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="mx-8 mb-2 overflow-hidden"
            >
              <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40 p-4 space-y-3">
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
                  className="w-full py-2.5 bg-white/50 hover:bg-red-50 text-stone-600 hover:text-red-500 rounded-xl text-sm font-medium transition border border-white/30"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-8 pb-4 border-b border-stone-200/30 flex justify-between items-baseline">
          <div className="text-4xl font-light text-stone-800">
            {totalCals} <span className="text-sm font-normal text-stone-400">kcal</span>
          </div>
        </div>

        <div className="flex-1 md:overflow-y-auto scrollbar-hide p-6 pb-32 md:pb-6">
          <AnimatePresence mode="wait">
            {view === 'dashboard' ? (
              <motion.div
                key="dash"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
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
                      <input
                        type="number"
                        value={cals}
                        onChange={e => setCals(e.target.value)}
                        className="w-full bg-transparent focus:outline-none font-bold text-stone-700"
                      />
                    </div>
                    <div className="flex-1 bg-white/50 rounded-2xl px-4 py-2 border border-white/20">
                      <label className="text-[9px] uppercase text-stone-400 block mb-1">Protein</label>
                      <input
                        type="number"
                        value={prot}
                        onChange={e => setProt(e.target.value)}
                        className="w-full bg-transparent focus:outline-none font-bold text-stone-700"
                      />
                    </div>
                    <button
                      onClick={addEntry}
                      className="bg-stone-800 text-white rounded-2xl px-5 flex items-center justify-center shadow-lg active:scale-95 transition hover:bg-black"
                    >
                      <Plus size={24} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-serif italic text-stone-600 pl-2">Meal Logs</h3>
                  {logsForSelectedDate.length === 0 ? (
                    <p className="text-center text-stone-400 text-sm py-8 italic font-light">
                      Your plate is empty.
                    </p>
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
              <motion.div
                key="cal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex justify-between items-center mb-6 px-2">
                  <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-2 hover:bg-white/40 rounded-full text-stone-600"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="text-xl font-medium text-stone-800">
                    {format(currentMonth, 'MMMM yyyy')}
                  </h2>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 hover:bg-white/40 rounded-full text-stone-600"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-7 mb-2 text-center text-[10px] text-stone-400 uppercase tracking-widest font-bold">
                  <div>S</div>
                  <div>M</div>
                  <div>T</div>
                  <div>W</div>
                  <div>T</div>
                  <div>F</div>
                  <div>S</div>
                </div>
                {renderCalendar()}

                <div className="mt-4 flex items-center justify-center gap-5 text-[10px] text-stone-400">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500/60"></span> Under{' '}
                    {CALORIE_LIMIT}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400/60"></span> Over{' '}
                    {CALORIE_LIMIT}
                  </span>
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => {
                      setSelectedDate(new Date())
                      setView('dashboard')
                    }}
                    className="text-xs bg-stone-800 text-white px-6 py-3 rounded-full shadow-lg hover:scale-105 transition hover:bg-black"
                  >
                    Return to Today
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="reflect"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                <div className="pl-1">
                  <h3 className="text-xl font-serif italic text-stone-700">Weekly Reflect</h3>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {format(weeklyStats.days[0]?.date || new Date(), 'MMM d')} —{' '}
                    {format(weeklyStats.days[6]?.date || new Date(), 'MMM d')}
                  </p>
                </div>

                <div className="bg-white/40 backdrop-blur-sm rounded-3xl border border-white/40 p-5 pb-3 shadow-sm overflow-hidden">
                  {(() => {
                    const maxCal = Math.max(
                      ...weeklyStats.days.map(x => x.calories),
                      CALORIE_LIMIT + 200
                    )
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
                          <line
                            x1={padX}
                            y1={threshY}
                            x2={chartW - padX}
                            y2={threshY}
                            stroke="#d4cdc4"
                            strokeWidth="1"
                            strokeDasharray="4 3"
                          />
                          <path d={areaPath} fill="url(#areaRed)" clipPath="url(#clipAbove)" />
                          <path d={areaPath} fill="url(#areaGreen)" clipPath="url(#clipBelow)" />
                          <path
                            d={linePath}
                            fill="none"
                            stroke="#b1728c"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {points.map((p, i) => (
                            <g key={i}>
                              {p.cal > 0 && (
                                <>
                                  <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r="4"
                                    fill={p.cal > CALORIE_LIMIT ? '#e07070' : '#6dbd8a'}
                                    stroke="white"
                                    strokeWidth="1.5"
                                  />
                                  <text
                                    x={p.x}
                                    y={p.y - 10}
                                    textAnchor="middle"
                                    fontSize="8"
                                    fill="#8a8078"
                                    fontFamily="Quicksand, sans-serif"
                                    fontWeight="500"
                                  >
                                    {p.cal}
                                  </text>
                                </>
                              )}
                            </g>
                          ))}
                        </svg>
                        <div className="flex justify-between mt-1" style={{ padding: '0 5%' }}>
                          {weeklyStats.days.map((d, i) => (
                            <span
                              key={i}
                              className="text-[10px] text-stone-400 text-center"
                              style={{ width: `${100 / 7}%` }}
                            >
                              {format(d.date, 'EEE').slice(0, 2)}
                            </span>
                          ))}
                        </div>
                        <p className="text-[10px] text-stone-400/60 text-right mt-1 italic">
                          {CALORIE_LIMIT} kcal limit
                        </p>
                      </div>
                    )
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40 p-4 text-center">
                    <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">Total Intake</p>
                    <p className="text-2xl font-light text-stone-700 font-serif">
                      {weeklyStats.totalCalories.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-stone-400">kcal</p>
                  </div>
                  <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40 p-4 text-center">
                    <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">Daily Avg</p>
                    <p
                      className={`text-2xl font-light font-serif ${
                        weeklyStats.avgCalories > CALORIE_LIMIT ? 'text-red-400' : 'text-stone-700'
                      }`}
                    >
                      {weeklyStats.avgCalories.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-stone-400">kcal / day</p>
                  </div>
                  <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40 p-4 text-center">
                    <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">Total Deficit</p>
                    <p
                      className={`text-2xl font-light font-serif ${
                        weeklyStats.totalDeficit >= 0 ? 'text-green-600/70' : 'text-red-400'
                      }`}
                    >
                      {weeklyStats.totalDeficit >= 0 ? '' : '+'}
                      {Math.abs(weeklyStats.totalDeficit).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {weeklyStats.totalDeficit >= 0 ? 'kcal deficit' : 'kcal surplus'}
                    </p>
                  </div>
                  <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40 p-4 text-center">
                    <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">Avg Deficit</p>
                    <p
                      className={`text-2xl font-light font-serif ${
                        weeklyStats.avgDeficit >= 0 ? 'text-green-600/70' : 'text-red-400'
                      }`}
                    >
                      {weeklyStats.avgDeficit >= 0 ? '' : '+'}
                      {Math.abs(weeklyStats.avgDeficit).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-stone-400">kcal / day</p>
                  </div>
                  <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40 p-4 text-center">
                    <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">Total Protein</p>
                    <p className="text-2xl font-light text-stone-700 font-serif">
                      {weeklyStats.totalProtein.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-stone-400">grams</p>
                  </div>
                  <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40 p-4 text-center">
                    <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">Days Tracked</p>
                    <p className="text-2xl font-light text-stone-700 font-serif">{weeklyStats.daysWithData}</p>
                    <p className="text-[10px] text-stone-400">of 7 days</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-serif italic text-stone-600 pl-2">Day by Day</h3>
                  {weeklyStats.days
                    .slice()
                    .reverse()
                    .map(d => (
                      <div
                        key={d.dateString}
                        className="flex justify-between items-center p-3.5 bg-white/40 rounded-2xl border border-white/20 cursor-pointer hover:bg-white/50 transition"
                        onClick={() => {
                          setSelectedDate(d.date)
                          setView('dashboard')
                        }}
                      >
                        <div>
                          <p className="text-sm text-stone-700">{format(d.date, 'EEEE')}</p>
                          <p className="text-[11px] text-stone-400">{format(d.date, 'MMM d')}</p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-medium ${
                              d.calories === 0
                                ? 'text-stone-300 italic'
                                : d.calories > CALORIE_LIMIT
                                ? 'text-red-400'
                                : 'text-green-600/70'
                            }`}
                          >
                            {d.calories > 0 ? `${d.calories} kcal` : 'no logs'}
                          </p>
                          {d.protein > 0 && (
                            <p className="text-[11px] text-stone-400">{d.protein}g protein</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="hidden md:flex p-4 justify-center pb-8">
          <div className="bg-white/20 backdrop-blur-md p-1 rounded-full flex gap-1 shadow-inner border border-white/20">
            <button
              onClick={() => {
                setView('dashboard')
                setShowProfile(false)
              }}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                view === 'dashboard' ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Journal
            </button>
            <button
              onClick={() => {
                setView('calendar')
                setShowProfile(false)
              }}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                view === 'calendar' ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => {
                setView('stats')
                setShowProfile(false)
              }}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                view === 'stats' ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Reflect
            </button>
          </div>
        </div>
      </motion.div>

      <div className="md:hidden fixed bottom-10 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div className="bg-white/20 backdrop-blur-md p-1 rounded-full flex gap-1 shadow-inner border border-white/20 pointer-events-auto">
          <button
            onClick={() => {
              setView('dashboard')
              setShowProfile(false)
            }}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              view === 'dashboard' ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            Journal
          </button>
          <button
            onClick={() => {
              setView('calendar')
              setShowProfile(false)
            }}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              view === 'calendar' ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => {
              setView('stats')
              setShowProfile(false)
            }}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              view === 'stats' ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            Reflect
          </button>
        </div>
      </div>
    </>
  )
}
