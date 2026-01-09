import { useEffect, useMemo, useRef, useState } from "react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
type PlannerEvent = {
  id: string
  label: string
  start: string
  end: string
  tone: "sea" | "sunset" | "orchid" | "ink"
  createdAt?: number
}

type VisionEvent = PlannerEvent & {
  images: string[]
}

type PlannerEventWithDates = VisionEvent & {
  startDate: Date
  endDate: Date
}

type EventSegment = {
  id: string
  label: string
  tone: PlannerEvent["tone"]
  startDay: number
  endDay: number
  row: number
  colStart: number
  span: number
  colEnd: number
  createdAt: number
}

type HoverInfo = {
  date: Date
  events: PlannerEventWithDates[]
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

const toneOrder: PlannerEvent["tone"][] = ["sea", "sunset", "orchid", "ink"]

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

function isDateWithinRange(date: Date, start: Date, end: Date) {
  const dateValue = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime()
  const startValue = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  ).getTime()
  const endValue = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
  ).getTime()
  return (
    dateValue >= Math.min(startValue, endValue) &&
    dateValue <= Math.max(startValue, endValue)
  )
}

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)

function formatEventRange(event: PlannerEvent) {
  const start = toDate(event.start)
  const end = toDate(event.end)
  const startMonth = monthNames[start.getMonth()].slice(0, 3)
  const endMonth = monthNames[end.getMonth()].slice(0, 3)
  if (start.getMonth() === end.getMonth()) {
    return `${startMonth} ${start.getDate()}–${end.getDate()}`
  }
  return `${startMonth} ${start.getDate()}–${endMonth} ${end.getDate()}`
}

function VisionTooltipContent({ event }: { event: VisionEvent }) {
  return (
    <div className="relative">
      <div className="absolute -bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-white/95 shadow-[0_8px_16px_-12px_rgba(15,23,42,0.9)]" />
      <div className="rounded-2xl border border-white/70 bg-white/95 p-3 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.9)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          Vision board
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-900">
          {event.label}
        </p>
        <div className="relative mt-3 h-[150px]">
          {event.images.slice(0, 3).map((image, imageIndex) => (
            <div
              key={image}
              className="absolute left-1/2 top-0 transition duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{
                transform: `translate(${imageIndex * 28 - 28}px, ${
                  imageIndex * 10
                }px) rotate(${imageIndex % 2 === 0 ? -6 : 5}deg)`,
                zIndex: 3 - imageIndex,
                transitionDelay: `${imageIndex * 40}ms`,
              }}
            >
              <div className="w-[120px] rounded-lg border border-slate-200 bg-white p-2 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.8)]">
                <div className="aspect-[3/4] overflow-hidden rounded-md bg-slate-100">
                  <img
                    src={image}
                    alt={`${event.label} vision`}
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
  )
}

function EventPill({
  event,
  pillClassName,
  labelClassName,
  rangeClassName,
  showRange = true,
}: {
  event: VisionEvent
  pillClassName: string
  labelClassName?: string
  rangeClassName?: string
  showRange?: boolean
}) {
  const hasImages = event.images.length > 0
  const pill = (
    <div
      className={`${pillClassName}${hasImages ? " cursor-pointer" : ""}`}
      tabIndex={hasImages ? 0 : undefined}
      role={hasImages ? "button" : undefined}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${toneStyles[event.tone]}`} />
      <span className={labelClassName}>{event.label}</span>
      {showRange && (
        <span className={rangeClassName}>{formatEventRange(event)}</span>
      )}
    </div>
  )

  if (!hasImages) {
    return <div className="inline-flex">{pill}</div>
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{pill}</TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={12}
        className="border-0 bg-transparent p-0 shadow-none"
        hideArrow
      >
        <VisionTooltipContent event={event} />
      </TooltipContent>
    </Tooltip>
  )
}

function getDayOfYear(date: Date) {
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const diff = date.getTime() - startOfYear.getTime()
  return Math.floor(diff / 86400000) + 1
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function YearlyPlanner({ year = 2026 }: { year?: number }) {
  const [activeYear, setActiveYear] = useState(year)
  const [, setHoverInfo] = useState<HoverInfo>(null)
  const [, setJumpDate] = useState("")
  const [flashDateKey, setFlashDateKey] = useState<string | null>(null)
  const [gridColumns, setGridColumns] = useState(7)
  const [gridCellSize, setGridCellSize] = useState(56)
  const [addMode, setAddMode] = useState(false)
  const [rangeStart, setRangeStart] = useState<Date | null>(null)
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null)
  const [events, setEvents] = useState<VisionEvent[]>(sampleEvents)
  const yearGridRef = useRef<HTMLDivElement | null>(null)

  const eventDates = useMemo(() => {
    return events.map((event) => ({
      ...event,
      startDate: toDate(event.start),
      endDate: toDate(event.end),
    }))
  }, [events])

  useEffect(() => {
    setActiveYear(year)
  }, [year])

  useEffect(() => {
    if (!flashDateKey) return
    const timeout = window.setTimeout(() => {
      setFlashDateKey(null)
    }, 1600)
    return () => window.clearTimeout(timeout)
  }, [flashDateKey])

  useEffect(() => {
    const container = yearGridRef.current
    if (!container || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width ?? 0
      const minWeekWidth = 66 * 7
      const weekGroups = Math.max(1, Math.floor(width / minWeekWidth))
      const columns = weekGroups * 7
      const rawCell = width > 0 ? width / columns : 56
      const clampedCell = Math.max(44, Math.min(70, Math.floor(rawCell)))
      setGridColumns(columns)
      setGridCellSize(clampedCell)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return
      }
      if (event.key === "ArrowLeft") {
        setActiveYear((prev) => prev - 1)
      }
      if (event.key === "ArrowRight") {
        setActiveYear((prev) => prev + 1)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const spannedEvents = useMemo(() => eventDates, [eventDates])

  const daysInYear = useMemo(
    () => (isLeapYear(activeYear) ? 366 : 365),
    [activeYear],
  )

  const yearStart = useMemo(() => new Date(activeYear, 0, 1), [activeYear])
  const yearStartOffset = useMemo(() => yearStart.getDay(), [yearStart])
  const totalCells = useMemo(
    () => yearStartOffset + daysInYear,
    [daysInYear, yearStartOffset],
  )
  const trailingCells = useMemo(
    () => (gridColumns - (totalCells % gridColumns)) % gridColumns,
    [gridColumns, totalCells],
  )
  const gridCells = useMemo(
    () => totalCells + trailingCells,
    [totalCells, trailingCells],
  )
  const weekRows = useMemo(
    () => Math.ceil(gridCells / gridColumns),
    [gridCells, gridColumns],
  )

  const yearGrid = useMemo(() => {
    return Array.from({ length: gridCells }, (_, index) => {
      const dayOfYear = index - yearStartOffset + 1
      if (dayOfYear < 1 || dayOfYear > daysInYear) {
        return null
      }
      const date = new Date(activeYear, 0, dayOfYear)
      return {
        date,
        dayNumber: date.getDate(),
        monthIndex: date.getMonth(),
        isMonthStart: date.getDate() === 1,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      }
    })
  }, [daysInYear, gridCells, activeYear, yearStartOffset])

  const yearWeekSegments = useMemo(() => {
    const yearEnd = new Date(activeYear, 11, 31)
    const rawSegments = spannedEvents
      .map((event) => {
        if (event.endDate < yearStart || event.startDate > yearEnd) {
          return null
        }
        const startDate = event.startDate < yearStart ? yearStart : event.startDate
        const endDate = event.endDate > yearEnd ? yearEnd : event.endDate
        const startDay = getDayOfYear(startDate)
        const endDay = getDayOfYear(endDate)
        const startIndex = yearStartOffset + startDay - 1
        const endIndex = yearStartOffset + endDay - 1
        const segments: EventSegment[] = []
        let currentIndex = startIndex
        while (currentIndex <= endIndex) {
          const row = Math.floor(currentIndex / gridColumns)
          const rowEnd = row * gridColumns + (gridColumns - 1)
          const segmentEnd = Math.min(endIndex, rowEnd)
          const span = segmentEnd - currentIndex + 1
          const colStart = (currentIndex % gridColumns) + 1
          const colEnd = colStart + span - 1
          segments.push({
            id: event.id,
            label: event.label,
            tone: event.tone,
            startDay,
            endDay,
            row: row + 1,
            colStart,
            span,
            colEnd,
            createdAt: event.createdAt ?? 0,
          })
          currentIndex = segmentEnd + 1
        }
        return segments
      })
      .flat()
      .filter((segment): segment is EventSegment => Boolean(segment))

    const segmentsByRow = new Map<number, number[]>()
    const stackedSegments = rawSegments
      .sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row
        if (a.colStart !== b.colStart) return a.colStart - b.colStart
        return b.createdAt - a.createdAt
      })
      .map((segment) => {
        const existing = segmentsByRow.get(segment.row) ?? []
        let stackIndex = existing.findIndex((end) => segment.colStart > end)
        if (stackIndex === -1) {
          stackIndex = existing.length
          existing.push(segment.colEnd)
        } else {
          existing[stackIndex] = segment.colEnd
        }
        segmentsByRow.set(segment.row, existing)
        return { ...segment, stackIndex }
      })

    const maxStackByRow = Array.from({ length: weekRows }, (_, index) => {
      const stacks = segmentsByRow.get(index + 1)
      return stacks ? stacks.length : 0
    })

    return { segments: stackedSegments, maxStackByRow }
  }, [
    activeYear,
    gridColumns,
    spannedEvents,
    yearStart,
    yearStartOffset,
    daysInYear,
    weekRows,
  ])

  const yearDayIds = useMemo(
    () =>
      yearGrid
        .filter((day) => Boolean(day))
        .map((day) => `year-day-${formatDateKey((day as { date: Date }).date)}`),
    [yearGrid],
  )

  const yearEventRowHeight = 34
  const yearEventRowGap = 8

  const maxEventStack = useMemo(
    () => Math.max(0, ...yearWeekSegments.maxStackByRow),
    [yearWeekSegments.maxStackByRow],
  )

  const yearEventOffset =
    maxEventStack > 0
      ? maxEventStack * yearEventRowHeight +
        (maxEventStack - 1) * yearEventRowGap +
        6
      : 0
  const dayOverlayTop = yearEventOffset + 6

  const weekRowHeights = useMemo(() => {
    const rowHeight = gridCellSize + yearEventOffset
    return Array.from({ length: weekRows }, () => `${rowHeight}px`)
  }, [gridCellSize, weekRows, yearEventOffset])

  const handleHover = (date: Date) => {
    const matching = spannedEvents.filter((event) =>
      isDateInRange(date, event.startDate, event.endDate),
    )
    setHoverInfo({ date, events: matching })
  }

  const handleAddToggle = () => {
    setAddMode((prev) => {
      if (prev) {
        setRangeStart(null)
        setRangeEnd(null)
      }
      return !prev
    })
  }

  const handleRangeClick = (date: Date) => {
    if (!addMode) return
    if (!rangeStart) {
      setRangeStart(date)
      setRangeEnd(date)
      return
    }
    const start =
      date.getTime() < rangeStart.getTime() ? date : rangeStart
    const end = date.getTime() < rangeStart.getTime() ? rangeStart : date
    const createdAt = Date.now()
    const tone = toneOrder[events.length % toneOrder.length]
    setEvents((prev) => [
      ...prev,
      {
        id: `event-${createdAt}`,
        label: "New event",
        start: formatDateKey(start),
        end: formatDateKey(end),
        tone,
        images: [],
        createdAt,
      },
    ])
    setRangeStart(null)
    setRangeEnd(null)
  }

  const handleDaySelect = (date: Date) => {
    const key = formatDateKey(date)
    setJumpDate(key)
    setFlashDateKey(key)
  }

  const weekdayLabels = useMemo(
    () =>
      Array.from({ length: gridColumns }, (_, index) => weekdayShort[index % 7]),
    [gridColumns],
  )
  const eventById = useMemo(
    () => new Map(spannedEvents.map((event) => [event.id, event])),
    [spannedEvents],
  )
  return (
    <section className="relative w-full overflow-visible rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_40px_100px_-80px_rgba(12,24,37,0.8)] backdrop-blur sm:p-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
        <div className="absolute -right-20 -top-32 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(107,181,197,0.45),rgba(255,255,255,0))]" />
        <div className="absolute -left-24 -bottom-32 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(242,183,141,0.45),rgba(255,255,255,0))]" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col items-center text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
            Life Planner
          </p>
          <h1
            className="mt-3 text-5xl font-semibold text-slate-950 sm:text-7xl lg:text-8xl"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {activeYear}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            A single-scan calendar for the year ahead. Hover across stretches to
            preview trips, milestones, and focus windows.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
            <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">
              Shortcuts
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <kbd className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-slate-600 shadow-[0_8px_16px_-12px_rgba(15,23,42,0.7)]">
                  ←
                </kbd>
                <kbd className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-slate-600 shadow-[0_8px_16px_-12px_rgba(15,23,42,0.7)]">
                  →
                </kbd>
              </div>
              <span className="text-[11px] text-slate-500">Switch years</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center">
          <button
            type="button"
            onClick={handleAddToggle}
            aria-pressed={addMode}
            className={[
              "inline-flex items-center gap-2 rounded-full border px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition",
              addMode
                ? "border-slate-900 bg-slate-900 text-white shadow-[0_16px_36px_-28px_rgba(15,23,42,0.8)]"
                : "border-slate-900 bg-slate-900 text-white shadow-[0_16px_36px_-28px_rgba(15,23,42,0.6)] hover:bg-slate-800",
            ].join(" ")}
          >
            Add event
          </button>
        </div>
      </div>

      <div className="relative z-10 mt-8 space-y-4">
        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p
                className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Year flow
              </p>
              <p className="text-xs text-slate-400">
                {daysInYear} days · {spannedEvents.length} events
              </p>
            </div>
            <div />
          </div>

          <div className="mt-3" ref={yearGridRef}>
            <p className="sr-only" id="year-flow-label">
              Year grid with day links. Use the jump menu to highlight dates.
            </p>
            <div
              className="grid gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400"
              style={{
                gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
              }}
            >
              {weekdayLabels.map((day, index) => (
                <div key={`${day}-${index}`} className="text-center">
                  {day}
                </div>
              ))}
            </div>

            <div className="relative mt-2">
              <div
                className="pointer-events-none absolute inset-0 z-10 grid gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                  gridTemplateRows: weekRowHeights.join(" "),
                }}
              >
                {yearWeekSegments.segments.map((segment, index) => {
                  const segmentEvent = eventById.get(segment.id)
                  const hasImages =
                    segmentEvent && segmentEvent.images.length > 0
                  const segmentPill = (
                    <div
                      className={`pointer-events-auto flex h-8 items-center self-start rounded-full px-4 text-[13px] font-semibold shadow-[0_16px_36px_-16px_rgba(15,23,42,0.9)] ${toneStyles[segment.tone]} ${
                        hasImages ? "cursor-pointer" : ""
                      }`}
                      style={{
                        gridRow: segment.row,
                        gridColumn: `${segment.colStart} / span ${segment.span}`,
                        marginTop:
                          segment.stackIndex *
                          (yearEventRowHeight + yearEventRowGap),
                      }}
                      tabIndex={hasImages ? 0 : undefined}
                      role={hasImages ? "button" : undefined}
                    >
                      <span className="truncate">{segment.label}</span>
                    </div>
                  )

                  if (!segmentEvent || !hasImages) {
                    return (
                      <div key={`${segment.id}-year-${index}`}>
                        {segmentPill}
                      </div>
                    )
                  }

                  return (
                    <Tooltip key={`${segment.id}-year-${index}`}>
                      <TooltipTrigger asChild>{segmentPill}</TooltipTrigger>
                      <TooltipContent
                        side="top"
                        sideOffset={12}
                        className="border-0 bg-transparent p-0 shadow-none"
                        hideArrow
                      >
                        <VisionTooltipContent event={segmentEvent} />
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>

              <div
                className="relative z-0 grid gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                  gridTemplateRows: weekRowHeights.join(" "),
                }}
                role="grid"
                aria-labelledby="year-flow-label"
                aria-owns={yearDayIds.length > 0 ? yearDayIds.join(" ") : undefined}
              >
                {yearGrid.map((day, index) => {
                  if (!day) {
                    return (
                      <div
                        key={`year-pad-${index}`}
                        className="h-full rounded-md bg-transparent"
                      />
                    )
                  }
                  const dayKey = formatDateKey(day.date)
                  const isFlash = flashDateKey === dayKey
                  const isRangeActive =
                    addMode &&
                    rangeStart &&
                    rangeEnd &&
                    isDateWithinRange(day.date, rangeStart, rangeEnd)
                  return (
                    <a
                      id={`year-day-${dayKey}`}
                      key={`${day.date.toISOString()}-mobile-year`}
                      href={`/day?date=${dayKey}`}
                      onMouseEnter={() => {
                        handleHover(day.date)
                        if (addMode && rangeStart) {
                          setRangeEnd(day.date)
                        }
                      }}
                      onFocus={() => handleHover(day.date)}
                      onClick={(event) => {
                        if (addMode) {
                          event.preventDefault()
                        }
                        handleHover(day.date)
                        handleRangeClick(day.date)
                        handleDaySelect(day.date)
                      }}
                      aria-label={`${monthNames[day.monthIndex]} ${
                        day.dayNumber
                      }, ${activeYear}`}
                      aria-current={isFlash ? "date" : undefined}
                      className={[
                        "group relative h-full rounded-md border border-slate-200 bg-white px-2 text-left text-xs transition",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/70",
                        "hover:bg-slate-100",
                        addMode ? "cursor-crosshair" : "cursor-pointer",
                        day.isWeekend
                          ? "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200/80"
                          : "",
                        isRangeActive ? "border-slate-900 bg-slate-100" : "",
                        isFlash ? "animate-year-flash ring-2 ring-amber-300" : "",
                      ].join(" ")}
                      style={{ paddingTop: yearEventOffset }}
                    >
                      {addMode && (
                        <span
                          className="pointer-events-none absolute right-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-[12px] font-semibold text-slate-500 opacity-0 transition group-hover:opacity-100"
                          style={{ top: dayOverlayTop }}
                        >
                          +
                        </span>
                      )}
                      {day.isMonthStart && (
                        <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-slate-900 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-white">
                          {monthNames[day.monthIndex].slice(0, 3)}
                        </span>
                      )}
                      <span
                        className="mt-4 block text-[12px] font-semibold text-slate-900"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {day.dayNumber}
                      </span>
                    </a>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
            {spannedEvents.map((event) => (
              <EventPill
                key={`${event.id}-mobile-pill`}
                event={event}
                pillClassName="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3 py-1"
                labelClassName="font-semibold text-slate-800"
                rangeClassName="text-slate-500"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
