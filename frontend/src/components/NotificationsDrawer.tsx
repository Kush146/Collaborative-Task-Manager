import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Notification } from '../types'

export const NotificationsDrawer = ({ open, onClose }: any) => {
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications')).data.notifications as Notification[]
  })
  if (!open) return null
  return (
    <div className="fixed top-0 right-0 w-96 h-full bg-white shadow-2xl z-50">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Notifications</h3>
        <button onClick={onClose}>Close</button>
      </div>
      <div className="p-4 space-y-3">
        {data?.length ? data.map(n => (
          <div key={n.id} className="p-3 border rounded">
            <div className="text-sm font-medium">{n.type}</div>
            <div className="text-xs text-gray-600">{JSON.stringify(n.data)}</div>
          </div>
        )) : <div className="text-sm text-gray-500">No notifications.</div>}
      </div>
    </div>
  )
}
