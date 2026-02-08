import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { format, addMonths, subMonths } from 'date-fns'
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
  renderCalendar,
  weeklyStats,
  onSignOut,
}) {
  const goalLeft = CALORIE_LIMIT - totalCals

  return (
    <div className="min-h-dvh w-full px-16 py-10">
      <div className="max-w-[1260px] mx-auto space-y-10">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center relative">
          <div className="flex items-center gap-3 justify-self-start">
            <div className="w-10 h-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-serif">
              S
            </div>
            <div>
              <p className="text-lg font-serif italic text-stone-800">SkyCal</p>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 -mt-0.5">
                Focus Journal
              </p>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-md p-1 rounded-full flex gap-1 shadow-inner border border-white/40">
            <button
              onClick={() => {
                setView('dashboard')
                setShowProfile(false)
              }}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                view !== 'stats'
                  ? 'bg-stone-900 text-white shadow'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Journal
            </button>
            <button
              onClick={() => {
                setView('stats')
                setShowProfile(false)
              }}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                view === 'stats'
                  ? 'bg-stone-900 text-white shadow'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Reflect
            </button>
          </div>

          <button
            onClick={() => setShowProfile(!showProfile)}
            className="w-10 h-10 rounded-full bg-white/60 border border-white/70 flex items-center justify-center text-stone-600 shadow-sm justify-self-end"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-sm font-semibold">{(user?.displayName || 'S')[0]}</span>
            )}
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

        <div className="grid grid-cols-[320px_minmax(0,1fr)_280px] gap-14">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-stone-400">Today</p>
              <h2 className="text-3xl font-serif italic text-stone-800">
                {format(selectedDate, 'MMM do')}
              </h2>
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

            <button
              onClick={() => {
                setSelectedDate(new Date())
                setView('dashboard')
              }}
              className="w-fit text-xs bg-stone-900 text-white px-5 py-2.5 rounded-full shadow hover:bg-black transition"
            >
              Back to Today
            </button>
          </div>

          {view === 'stats' ? (
            <div className="glass-panel rounded-3xl p-6 space-y-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-stone-400">Weekly Reflect</p>
                <h3 className="text-2xl font-serif italic text-stone-800">Your Week</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/60 rounded-2xl border border-white/40 p-4 text-center">
                  <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">Total Intake</p>
                  <p className="text-2xl font-light text-stone-700 font-serif">
                    {weeklyStats.totalCalories.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-stone-400">kcal</p>
                </div>
                <div className="bg-white/60 rounded-2xl border border-white/40 p-4 text-center">
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
                <div className="bg-white/60 rounded-2xl border border-white/40 p-4 text-center">
                  <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">Total Protein</p>
                  <p className="text-2xl font-light text-stone-700 font-serif">
                    {weeklyStats.totalProtein.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-stone-400">grams</p>
                </div>
                <div className="bg-white/60 rounded-2xl border border-white/40 p-4 text-center">
                  <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">Days Tracked</p>
                  <p className="text-2xl font-light text-stone-700 font-serif">{weeklyStats.daysWithData}</p>
                  <p className="text-[10px] text-stone-400">of 7 days</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-[720px] mx-auto w-full">
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
                      className="w-10 bg-transparent text-right text-sm text-stone-700 focus:outline-none"
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

              <div className="space-y-3">
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
          )}

          <div className="rounded-[28px] p-2 flex flex-col gap-6">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-stone-400">Total Intra-day</p>
              <p className="text-[64px] leading-[1] font-serif text-stone-800">{totalCals}</p>
              <p className="text-xs text-stone-400 mt-1">kcal consumed</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs text-stone-500">
                <span className="uppercase tracking-widest text-[10px]">Goal</span>
                <div className="flex-1 h-px bg-stone-300/60"></div>
                <span className="text-stone-700 font-medium">{CALORIE_LIMIT}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-stone-500">
                <span className="uppercase tracking-widest text-[10px]">Left</span>
                <div className="flex-1 h-px bg-stone-300/60"></div>
                <span className={`font-medium ${goalLeft >= 0 ? 'text-stone-700' : 'text-red-500'}`}>
                  {goalLeft}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
