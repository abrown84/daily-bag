import React from 'react'
import { Bell, BellSlash, BellRinging, WarningCircle } from '@phosphor-icons/react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { useNotifications } from '../hooks/useNotifications'

export const NotificationSettings: React.FC = () => {
  const {
    isSupported,
    permission,
    isEnabled,
    enableNotifications,
    disableNotifications,
  } = useNotifications()

  const handleToggle = async () => {
    if (isEnabled) {
      disableNotifications()
    } else {
      await enableNotifications()
    }
  }

  const getStatusInfo = () => {
    if (!isSupported) {
      return {
        icon: WarningCircle,
        text: 'Notifications not supported',
        description: 'Your browser does not support notifications.',
        color: 'text-muted-foreground',
      }
    }

    if (permission === 'denied') {
      return {
        icon: BellSlash,
        text: 'Notifications blocked',
        description: 'Please enable notifications in your browser settings.',
        color: 'text-destructive',
      }
    }

    if (isEnabled) {
      return {
        icon: BellRinging,
        text: 'Notifications enabled',
        description: 'You will receive chore reminders.',
        color: 'text-green-500',
      }
    }

    return {
      icon: Bell,
      text: 'Notifications disabled',
      description: 'Enable to receive chore reminders.',
      color: 'text-muted-foreground',
    }
  }

  const status = getStatusInfo()
  const StatusIcon = status.icon

  return (
    <Card className="bg-card/60 rounded-2xl border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg bg-muted/50 ${status.color}`}>
              <StatusIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground text-sm">
                {status.text}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                {status.description}
              </p>
            </div>
          </div>

          {isSupported && permission !== 'denied' && (
            <Button
              variant={isEnabled ? 'outline' : 'default'}
              size="sm"
              onClick={handleToggle}
              className="flex-shrink-0"
            >
              {isEnabled ? 'Disable' : 'Enable'}
            </Button>
          )}

          {permission === 'denied' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Open browser settings instruction
                alert(
                  'To enable notifications:\n\n' +
                  '1. Click the lock/info icon in your browser address bar\n' +
                  '2. Find "Notifications" in the permissions\n' +
                  '3. Change it from "Block" to "Allow"\n' +
                  '4. Refresh the page'
                )
              }}
              className="flex-shrink-0"
            >
              Help
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
