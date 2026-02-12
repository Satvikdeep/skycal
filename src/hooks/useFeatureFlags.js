import { useState, useEffect } from 'react'

const FEATURES = {
  V2_DASHBOARD: 'v2',
  NEW_ANIMATIONS: 'new_anim'
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState({
    [FEATURES.V2_DASHBOARD]: false
  })

  useEffect(() => {
    // 1. Check URL params (e.g. ?v=2 enables v2)
    const params = new URLSearchParams(window.location.search)
    const vParam = params.get('v')
    
    // 2. Check Local Storage (persists across reloads)
    const storedVersion = localStorage.getItem('app_version')

    const isV2 = vParam === '2' || storedVersion === '2'

    setFlags(prev => ({
      ...prev,
      [FEATURES.V2_DASHBOARD]: isV2
    }))
  }, [])

  const toggleVersion = () => {
    setFlags(prev => {
      const newState = !prev[FEATURES.V2_DASHBOARD]
      localStorage.setItem('app_version', newState ? '2' : '1')
      
      // Optional: Refresh page to ensure clean slate if state is heavy
      // window.location.reload() 
      
      return { ...prev, [FEATURES.V2_DASHBOARD]: newState }
    })
  }

  return {
    isV2: flags[FEATURES.V2_DASHBOARD],
    toggleVersion
  }
}
