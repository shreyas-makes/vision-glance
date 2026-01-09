import { Head, router } from "@inertiajs/react"

import YearlyPlanner from "@/components/yearly-planner"
import { eventsPath } from "@/routes"
import type { CalendarEvent } from "@/types"

type EventPayload = Pick<
  CalendarEvent,
  "label" | "start" | "end" | "tone" | "images"
>

type DashboardProps = {
  events: CalendarEvent[]
}

export default function Dashboard({ events }: DashboardProps) {
  const handleCreateEvent = (payload: EventPayload) => {
    router.post(eventsPath(), payload, { preserveScroll: true })
  }

  return (
    <div className="min-h-screen bg-slate-50/40 px-4 py-6 sm:px-6 sm:py-8">
      <Head title="Dashboard">
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link
          href="https://fonts.bunny.net/css?family=fraunces:400,600|jetbrains-mono:400,600|space-grotesk:400,600"
          rel="stylesheet"
        />
      </Head>

      <div className="mx-auto flex w-full max-w-7xl flex-col">
        <YearlyPlanner events={events} onCreateEvent={handleCreateEvent} />
      </div>
    </div>
  )
}
