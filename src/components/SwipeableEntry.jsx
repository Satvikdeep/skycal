import { useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { Trash2, Pencil, Check, X } from 'lucide-react'

// iOS-style swipe actions for log entries.
export default function SwipeableEntry({
  entry,
  onDelete,
  onEdit,
  isEditing,
  editTitle,
  setEditTitle,
  editCals,
  setEditCals,
  editProt,
  setEditProt,
  onSave,
  onCancel,
  contentClassName = '',
  editClassName = '',
}) {
  const x = useMotionValue(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [swipeState, setSwipeState] = useState('closed')

  const ACTION_WIDTH = 90
  const EDIT_THRESHOLD = 80

  const deleteOpacity = useTransform(x, [0, 30, ACTION_WIDTH], [0, 0.6, 1])
  const deleteScale = useTransform(x, [0, 30, ACTION_WIDTH], [0.6, 0.85, 1])

  const editOpacity = useTransform(x, [-ACTION_WIDTH, -30, 0], [1, 0.6, 0])
  const editScale = useTransform(x, [-ACTION_WIDTH, -30, 0], [1, 0.85, 0.6])

  const handleDragEnd = (_, info) => {
    const velocity = info.velocity.x
    const offset = info.offset.x

    if (offset < -EDIT_THRESHOLD || velocity < -500) {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 28 })
      setSwipeState('closed')
      onEdit()
      return
    }

    if (swipeState === 'delete-revealed') {
      if (offset > 60 || velocity > 400) {
        setIsDeleting(true)
        animate(x, 500, { type: 'spring', stiffness: 200, damping: 25 })
        setTimeout(() => onDelete(), 250)
        return
      }
      if (offset < -20 || velocity < -200) {
        animate(x, 0, { type: 'spring', stiffness: 300, damping: 28 })
        setSwipeState('closed')
        return
      }
      animate(x, ACTION_WIDTH, { type: 'spring', stiffness: 300, damping: 28 })
      return
    }

    if (offset > 50 || velocity > 400) {
      animate(x, ACTION_WIDTH, { type: 'spring', stiffness: 300, damping: 28 })
      setSwipeState('delete-revealed')
      return
    }

    animate(x, 0, { type: 'spring', stiffness: 300, damping: 28 })
    setSwipeState('closed')
  }

  const handleContentClick = () => {
    if (swipeState !== 'closed') {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 28 })
      setSwipeState('closed')
    }
  }

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40 space-y-3 ${editClassName}`}
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
      <motion.div
        className="absolute inset-y-0 left-0 w-24 flex items-center justify-center rounded-l-2xl"
        style={{
          opacity: deleteOpacity,
          background: 'linear-gradient(90deg, #fecdd3 0%, #fbcfe8 100%)',
        }}
      >
        <motion.div style={{ scale: deleteScale }} className="flex flex-col items-center gap-1">
          <Trash2 className="text-rose-400" size={20} />
          <span className="text-rose-400 text-[10px] font-medium">
            {swipeState === 'delete-revealed' ? 'Swipe ->' : 'Delete'}
          </span>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute inset-y-0 right-0 w-24 flex items-center justify-center rounded-r-2xl"
        style={{
          opacity: editOpacity,
          background: 'linear-gradient(270deg, #e7e5e4 0%, #d6d3d1 100%)',
        }}
      >
        <motion.div style={{ scale: editScale }} className="flex flex-col items-center gap-1">
          <Pencil className="text-stone-500" size={20} />
          <span className="text-stone-500 text-[10px] font-medium">Edit</span>
        </motion.div>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: swipeState === 'delete-revealed' ? 200 : ACTION_WIDTH }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        onClick={handleContentClick}
        style={{ x }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className={`flex justify-between items-center p-4 bg-white/40 rounded-2xl border border-white/20 cursor-grab active:cursor-grabbing relative z-10 transition-opacity duration-200 ${isDeleting ? 'opacity-0' : ''} ${contentClassName}`}
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
