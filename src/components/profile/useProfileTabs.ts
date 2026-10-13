import { useEffect, useState } from 'react'
import type { Location } from 'react-router-dom'
import type { ProfileTab } from './ProfileTabNavigation'

export function useProfileTabs(location: Location) {
  const queryTab = new URLSearchParams(location.search).get('tab') as ProfileTab | null
  const isWriteRoute = location.pathname === '/write'
  const [activeTab, setActiveTab] = useState<ProfileTab>(isWriteRoute ? 'write' : queryTab || 'articles')

  useEffect(() => {
    if (location.pathname === '/write') setActiveTab('write')
    else if (queryTab) setActiveTab(queryTab)
  }, [location.pathname, queryTab])

  return { activeTab, setActiveTab }
}
