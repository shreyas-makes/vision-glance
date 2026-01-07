import { useMemo, useState } from "react"

type PlannerEvent = {
  id: string
  label: string
  start: string
  end: string
  tone: "sea" | "sunset" | "orchid" | "ink"
}

type VisionEvent = PlannerEvent & {
  images: string[]
}

type EventSegment = {
  id: string
  label: string
  startDay: number
  endDay: number
  tone: PlannerEvent["tone"]
}

type HoverInfo = {
  date: Date
  events: PlannerEvent[]
} | null

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const toneStyles: Record<PlannerEvent["tone"], string> = {
  sea: "bg-[#1b6c7a] text-white/95",
  sunset: "bg-[#e66a3b] text-white/95",
  orchid: "bg-[#8a4b87] text-white/95",
  ink: "bg-[#1f2937] text-white/95",
}

const createPolaroidImage = (label: string, hue: number) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${hue} 62% 72%)"/>
        <stop offset="100%" stop-color="hsl(${hue + 40} 65% 58%)"/>
      </linearGradient>
    </defs>
    <rect width="300" height="400" rx="28" fill="url(#g)"/>
    <circle cx="230" cy="90" r="38" fill="rgba(255,255,255,0.45)"/>
    <circle cx="80" cy="300" r="56" fill="rgba(255,255,255,0.2)"/>
    <text x="24" y="360" font-family="Space Grotesk, sans-serif" font-size="22" fill="rgba(255,255,255,0.9)">${label}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const sampleEvents: VisionEvent[] = [
  {
    id: "copenhagen",
    label: "Copenhagen sprint",
    start: "2026-03-17",
    end: "2026-03-23",
    tone: "sea",
    images: [
      createPolaroidImage("Copenhagen", 188),
      createPolaroidImage("Nordic light", 210),
    ],
  },
  {
    id: "spring-break",
    label: "Spring break",
    start: "2026-04-04",
    end: "2026-04-10",
    tone: "sunset",
    images: [
      createPolaroidImage("Sunset coast", 24),
      createPolaroidImage("Slow mornings", 36),
      createPolaroidImage("Beach day", 18),
    ],
  },
  {
    id: "friends-wedding",
    label: "Friends wedding",
    start: "2026-06-12",
    end: "2026-06-15",
    tone: "orchid",
    images: [
      createPolaroidImage("Wedding", 320),
      createPolaroidImage("Celebration", 300),
    ],
  },
  {
    id: "new-zealand",
    label: "New Zealand",
    start: "2026-09-02",
    end: "2026-09-12",
    tone: "sea",
    images: [
      createPolaroidImage("New Zealand", 200),
      createPolaroidImage("Glacier", 220),
    ],
  },
  {
    id: "oasis-show",
    label: "Oasis reunion",
    start: "2026-10-20",
    end: "2026-10-22",
    tone: "ink",
    images: [createPolaroidImage("Oasis", 240)],
  },
]

function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

function toDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function isDateInRange(date: Date, start: Date, end: Date) {
  const dateValue = date.setHours(0, 0, 0, 0)
  const startValue = start.setHours(0, 0, 0, 0)
  const endValue = end.setHours(0, 0, 0, 0)
  return dateValue >= startValue && dateValue <= endValue
}

function getMonthSegments(
  year: number,
  monthIndex: number,
  events: PlannerEvent[],
): EventSegment[] {
  const daysInMonth = getDaysInMonth(year, monthIndex)
  return events
    .map((event) => {
      const start = toDate(event.start)
      const end = toDate(event.end)
      const monthStart = new Date(year, monthIndex, 1)
      const monthEnd = new Date(year, monthIndex, daysInMonth)

      if (end < monthStart || start > monthEnd) {
        return null
      }

      const startDay = start < monthStart ? 1 : start.getDate()
      const endDay = end > monthEnd ? daysInMonth : end.getDate()

      return {
        id: event.id,
        label: event.label,
        startDay,
        endDay,
        tone: event.tone,
      }
    })
    .filter((segment): segment is EventSegment => Boolean(segment))
}

function formatHoverDate(date: Date) {
  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

export default function YearlyPlanner({ year = 2026 }: { year?: number }) {
  const [hoverInfo, setHoverInfo] = useState<HoverInfo>(null)
  const [visionHover, setVisionHover] = useState<{
    event: VisionEvent
    monthIndex: number
    left: number
    top: number
  } | null>(null)

  const eventDates = useMemo(() => {
    return sampleEvents.map((event) => ({
      ...event,
      startDate: toDate(event.start),
      endDate: toDate(event.end),
    }))
  }, [])

  const handleHover = (date: Date) => {
    const matching = eventDates.filter((event) =>
      isDateInRange(date, event.startDate, event.endDate),
    )
    setHoverInfo({ date, events: matching })
  }

  const handleVisionHover = (
    event: VisionEvent,
    monthIndex: number,
    element: HTMLDivElement | null,
  ) => {
    if (!element) return
    const container = element.closest("[data-month-row]")
    if (!container) return
    const containerRect = container.getBoundingClientRect()
    const targetRect = element.getBoundingClientRect()
    const tooltipWidth = 200
    const padding = 16
    const rawLeft =
      targetRect.left - containerRect.left + targetRect.width / 2
    const left = Math.min(
      Math.max(rawLeft, padding + tooltipWidth / 2),
      containerRect.width - padding - tooltipWidth / 2,
    )
    const top = targetRect.top - containerRect.top
    setVisionHover({ event, monthIndex, left, top })
  }

  const months = useMemo(
    () =>
      monthNames.map((name, index) => ({
        name,
        index,
        days: getDaysInMonth(year, index),
      })),
    [year],
  )

  return (
    <section className="relative w-full overflow-hidden rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_40px_100px_-80px_rgba(12,24,37,0.8)] backdrop-blur sm:p-10">
      <div className="pointer-events-none absolute -right-20 -top-32 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(107,181,197,0.45),rgba(255,255,255,0))]" />
      <div className="pointer-events-none absolute -left-24 -bottom-32 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(242,183,141,0.45),rgba(255,255,255,0))]" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
            Life Planner
          </p>
          <h1
            className="mt-2 text-4xl font-semibold text-slate-950 sm:text-5xl"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {year}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-600 sm:text-base">
            A single-scan calendar for the year ahead. Hover across stretches to
            preview trips, milestones, and focus windows.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-sm shadow-[0_20px_60px_-40px_rgba(15,23,42,0.6)]">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-400">
            Hover preview
          </p>
          {hoverInfo ? (
            <div className="mt-2 space-y-2">
              <p className="text-sm font-semibold text-slate-900">
                {formatHoverDate(hoverInfo.date)}
              </p>
              {hoverInfo.events.length > 0 ? (
                <ul className="space-y-1 text-xs text-slate-600">
                  {hoverInfo.events.map((event) => (
                    <li key={event.id} className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${toneStyles[event.tone]}`}
                      />
                      <span>{event.label}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">No events in range.</p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              Hover any date to surface its events.
            </p>
          )}
        </div>
      </div>

      <div className="relative z-10 mt-8 space-y-4">
        {months.map((month) => {
          const segments = getMonthSegments(year, month.index, sampleEvents)
          const isActiveTooltip = visionHover?.monthIndex === month.index
          return (
            <div
              key={month.name}
              data-month-row
              className="group relative overflow-visible rounded-2xl border border-slate-200/70 bg-white/50 px-3 py-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]"
              onMouseLeave={() => {
                setHoverInfo(null)
                setVisionHover(null)
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-20 shrink-0">
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {month.name.slice(0, 3)}
                  </p>
                  <p className="text-xs text-slate-400">{month.days} days</p>
                </div>

                <div className="relative flex-1">
                  <div className="absolute inset-0 z-10 grid grid-cols-[repeat(31,minmax(0,1fr))] gap-px">
                    {segments.map((segment, index) => {
                      const event = sampleEvents.find(
                        (item) => item.id === segment.id,
                      )
                      return (
                        <div
                          key={`${segment.id}-${index}`}
                          className={`col-span-1 row-span-1 flex cursor-pointer items-center rounded-full px-2 text-[11px] font-medium shadow-[0_10px_24px_-18px_rgba(15,23,42,0.8)] transition hover:translate-y-[-1px] ${toneStyles[segment.tone]}`}
                          style={{
                            gridColumn: `${segment.startDay} / span ${
                              segment.endDay - segment.startDay + 1
                            }`,
                          }}
                          onMouseEnter={(eventMeta) =>
                            event &&
                            handleVisionHover(
                              event,
                              month.index,
                              eventMeta.currentTarget as HTMLDivElement,
                            )
                          }
                          onMouseLeave={() => setVisionHover(null)}
                        >
                          <span className="truncate">{segment.label}</span>
                        </div>
                      )
                    })}
                  </div>

                  <div className="relative z-0 grid grid-cols-[repeat(31,minmax(0,1fr))] gap-px">
                    {Array.from({ length: 31 }, (_, dayIndex) => {
                      const dayNumber = dayIndex + 1
                      const isActive = dayNumber <= month.days
                      const dayDate = new Date(
                        year,
                        month.index,
                        dayNumber,
                      )
                      const dayOfWeek = dayDate.getDay()
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                      return (
                        <button
                          key={`${month.name}-${dayNumber}`}
                          type="button"
                          disabled={!isActive}
                          onMouseEnter={() => isActive && handleHover(dayDate)}
                          aria-label={`${month.name} ${dayNumber}, ${year}`}
                          className={[
                            "relative h-9 rounded-md border border-transparent px-1 text-left text-[10px] transition",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/70",
                            isActive
                              ? "bg-white/90 text-slate-800 hover:bg-slate-900 hover:text-white"
                              : "bg-slate-100/70 text-slate-300",
                            isActive && isWeekend
                              ? "bg-slate-50/90 text-slate-600"
                              : "",
                          ].join(" ")}
                        >
                          {isActive && (
                            <>
                              <span
                                className="block text-[9px] text-slate-400"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                              >
                                {weekdayShort[dayOfWeek]}
                              </span>
                              <span
                                className="text-[11px] font-semibold"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                              >
                                {dayNumber}
                              </span>
                            </>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  <div
                    className={[
                      "pointer-events-none absolute z-30 w-[200px] origin-bottom transition duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                      isActiveTooltip
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-95",
                    ].join(" ")}
                    style={
                      isActiveTooltip
                        ? {
                            left: visionHover?.left ?? "50%",
                            top: visionHover?.top ?? 0,
                            transform: "translate(-50%, -115%)",
                          }
                        : {
                            left: "50%",
                            top: 0,
                            transform: "translate(-50%, -110%)",
                          }
                    }
                  >
                    {isActiveTooltip && visionHover && (
                      <div className="relative">
                        <div className="absolute -bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-white/90 shadow-[0_8px_16px_-12px_rgba(15,23,42,0.9)]" />
                        <div className="rounded-2xl border border-white/70 bg-white/90 p-3 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.9)]">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Vision board
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {visionHover.event.label}
                          </p>
                          <div className="relative mt-3 h-[150px]">
                            {visionHover.event.images
                              .slice(0, 3)
                              .map((image, imageIndex) => (
                                <div
                                  key={image}
                                  className="absolute left-1/2 top-0 transition duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                                  style={{
                                    transform: `translate(${
                                      imageIndex * 28 - 28
                                    }px, ${imageIndex * 10}px) rotate(${
                                      imageIndex % 2 === 0 ? -6 : 5
                                    }deg)`,
                                    zIndex: 3 - imageIndex,
                                    transitionDelay: `${imageIndex * 40}ms`,
                                  }}
                                >
                                  <div className="w-[120px] rounded-lg border border-slate-200 bg-white p-2 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.8)]">
                                    <div className="aspect-[3/4] overflow-hidden rounded-md bg-slate-100">
                                      <img
                                        src={image}
                                        alt={`${visionHover.event.label} vision`}
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                    <div className="mt-2 h-3 w-2/3 rounded-full bg-slate-200/80" />
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="relative z-10 mt-8 flex flex-wrap gap-3 text-xs text-slate-500">
        {sampleEvents.map((event) => (
          <span
            key={event.id}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white px-3 py-1"
          >
            <span className={`h-2.5 w-2.5 rounded-full ${toneStyles[event.tone]}`} />
            {event.label}
          </span>
        ))}
      </div>
    </section>
  )
}
