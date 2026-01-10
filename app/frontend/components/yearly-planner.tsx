import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
type PlannerEvent = {
  id: string | number
  label: string
  start: string
  end: string
  tone: "sea" | "sunset" | "orchid" | "ink"
  createdAt?: number
}

type VisionEvent = PlannerEvent & {
  images: string[]
  description?: string
}

type EventPayload = Omit<VisionEvent, "id" | "createdAt">

type PlannerEventWithDates = VisionEvent & {
  startDate: Date
  endDate: Date
}

type EventSegment = {
  id: PlannerEvent["id"]
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

const tonePolaroidBackground: Record<PlannerEvent["tone"], string> = {
  sea: "#1b6c7a",
  sunset: "#e66a3b",
  orchid: "#8a4b87",
  ink: "#1f2937",
}

const tonePolaroidText: Record<PlannerEvent["tone"], string> = {
  sea: "#ffffff",
  sunset: "#ffffff",
  orchid: "#ffffff",
  ink: "#ffffff",
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

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

const sampleEventTemplates: VisionEvent[] = [
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

const createSampleEventsForYear = (year: number) =>
  sampleEventTemplates.map((event) => {
    const startDate = toDate(event.start)
    const endDate = toDate(event.end)
    const start = new Date(year, startDate.getMonth(), startDate.getDate())
    const end = new Date(year, endDate.getMonth(), endDate.getDate())
    return {
      ...event,
      id: `${event.id}-${year}`,
      start: formatDateKey(start),
      end: formatDateKey(end),
    }
  })

function toDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

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

function splitEventLabel(label: string) {
  const trimmed = label.trim()
  if (!trimmed) {
    return { emoji: "", text: "" }
  }
  const first = Array.from(trimmed)[0] ?? ""
  const isEmoji = first ? /\p{Extended_Pictographic}/u.test(first) : false
  if (!isEmoji) {
    return { emoji: "", text: trimmed }
  }
  const text = trimmed.slice(first.length).trim()
  return { emoji: first, text: text || trimmed }
}

const polaroidStyle = {
  content: (event: VisionEvent) => {
    const { emoji, text } = splitEventLabel(event.label)
    const previewImages = event.images.slice(0, 4)
    const placements =
      previewImages.length <= 1
        ? [{ x: "-50%", y: "0px", rotate: 0 }]
        : [
            { x: "calc(var(--stack-spread) * -1)", y: "-6px", rotate: -6 },
            { x: "calc(var(--stack-spread) * 0.2)", y: "6px", rotate: 5 },
            { x: "calc(var(--stack-spread) * 1.15)", y: "32px", rotate: -3 },
            { x: "calc(var(--stack-spread) * -0.1)", y: "82px", rotate: 8 },
          ]
    return (
      <div
        className="relative w-full max-w-[600px] overflow-visible"
        style={
          {
            width: "min(92vw, 600px)",
            "--stack-spread": "clamp(80px, 20vw, 140px)",
            "--stack-image": "clamp(312px, 50.4vw, 432px)",
            "--stack-height": "clamp(360px, 62.4vw, 456px)",
          } as React.CSSProperties
        }
      >
        <div className="relative px-2 pb-2 pt-2">
          <div className="relative" style={{ height: "var(--stack-height)" }}>
            {previewImages.map((image, index) => {
              const placement = placements[index] ?? placements[0]
              const isSingle = previewImages.length <= 1
              return (
                <div
                  key={`${event.id}-tooltip-image-${image}`}
                  className="absolute left-1/2 top-1"
                  style={{
                    width: "var(--stack-image)",
                    transform: isSingle
                      ? `translate(${placement.x}, ${placement.y})`
                      : `translate(${placement.x}, ${placement.y}) rotate(${placement.rotate}deg)`,
                    zIndex: previewImages.length - index,
                  }}
                >
                  <div className="overflow-hidden rounded-xl border border-white/80 bg-white shadow-[0_18px_40px_-24px_rgba(15,23,42,0.6)]">
                    <div className="aspect-[4/3]">
                      <img
                        src={image}
                        alt={`${event.label} vision`}
                        className="block h-full w-full object-cover object-center"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  },
}

function VisionTooltipContent({ event }: { event: VisionEvent }) {
  const variant = polaroidStyle
  return (
    <div className="relative overflow-visible">{variant.content(event)}</div>
  )
}

function EventPill({
  event,
  pillClassName,
  labelClassName,
  rangeClassName,
  showRange = true,
  onSelect,
}: {
  event: VisionEvent
  pillClassName: string
  labelClassName?: string
  rangeClassName?: string
  showRange?: boolean
  onSelect?: (event: VisionEvent) => void
}) {
  const hasImages = event.images.length > 0
  const isInteractive = Boolean(onSelect)
  const pill = (
    <div
      className={`${pillClassName}${isInteractive ? " cursor-pointer" : ""}`}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? "button" : undefined}
      onClick={isInteractive ? () => onSelect?.(event) : undefined}
      onKeyDown={
        isInteractive
          ? (eventKey) => {
              if (eventKey.key === "Enter" || eventKey.key === " ") {
                eventKey.preventDefault()
                onSelect?.(event)
              }
            }
          : undefined
      }
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
        align="center"
        collisionPadding={32}
        avoidCollisions
        sticky="always"
        className="border-0 bg-transparent p-0 shadow-none z-[120] overflow-visible"
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

type YearlyPlannerProps = {
  year?: number
  events?: VisionEvent[]
  onCreateEvent?: (event: EventPayload) => void
  onUpdateEvent?: (eventId: VisionEvent["id"], event: EventPayload) => void
  heroCTA?: ReactNode
}

export default function YearlyPlanner({
  year = 2026,
  events: eventsProp,
  onCreateEvent,
  onUpdateEvent,
  heroCTA,
}: YearlyPlannerProps) {
  const [activeYear, setActiveYear] = useState(year)
  const [gridColumns, setGridColumns] = useState(7)
  const [gridCellSize, setGridCellSize] = useState(56)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"calendar" | "vision">("calendar")
  const [eventTitle, setEventTitle] = useState("")
  const [eventEmoji, setEventEmoji] = useState("")
  const [eventStart, setEventStart] = useState("")
  const [eventEnd, setEventEnd] = useState("")
  const [eventImages, setEventImages] = useState<string[]>([])
  const [eventDescription, setEventDescription] = useState("")
  const [useSampleEvents, setUseSampleEvents] = useState(!eventsProp)
  const [events, setEvents] = useState<VisionEvent[]>(
    eventsProp ?? createSampleEventsForYear(year),
  )
  const [editingEventId, setEditingEventId] = useState<
    VisionEvent["id"] | null
  >(null)
  const yearGridRef = useRef<HTMLDivElement | null>(null)
  const isSubmitDisabled = !eventTitle.trim() || !eventStart || !eventEnd

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
    if (eventsProp) {
      setEvents(eventsProp)
      setUseSampleEvents(false)
      return
    }
    if (useSampleEvents) {
      setEvents(createSampleEventsForYear(activeYear))
    }
  }, [eventsProp, activeYear, useSampleEvents])

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

  const resetForm = () => {
    setEventTitle("")
    setEventEmoji("")
    setEventStart("")
    setEventEnd("")
    setEventImages([])
    setEventDescription("")
  }

  const openCreateSheet = () => {
    setEditingEventId(null)
    resetForm()
    setIsSheetOpen(true)
  }

  const openEditSheet = (event: VisionEvent) => {
    const { emoji, text } = splitEventLabel(event.label)
    setUseSampleEvents(false)
    setEditingEventId(event.id)
    setEventTitle(text)
    setEventEmoji(emoji)
    setEventStart(event.start)
    setEventEnd(event.end)
    setEventImages(event.images)
    setEventDescription(event.description ?? "")
    setIsSheetOpen(true)
  }

  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open)
    if (!open) {
      setEditingEventId(null)
      resetForm()
    }
  }

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

  const weekRowHeights = useMemo(() => {
    const dayCellHeight = Math.max(64, Math.round(gridCellSize * 2.3))
    const rowHeight = dayCellHeight + yearEventOffset
    return Array.from({ length: weekRows }, () => `${rowHeight}px`)
  }, [gridCellSize, weekRows, yearEventOffset])

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) {
      setEventImages([])
      return
    }
    const previews = await Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result))
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(file)
          }),
      ),
    )
    setEventImages(previews)
  }

  const handleEventSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!eventTitle.trim() || !eventStart || !eventEnd) return
    const startDate = toDate(eventStart)
    const endDate = toDate(eventEnd)
    const start =
      startDate.getTime() <= endDate.getTime() ? startDate : endDate
    const end =
      startDate.getTime() <= endDate.getTime() ? endDate : startDate
    const tone = toneOrder[events.length % toneOrder.length]
    const label = `${eventEmoji.trim()} ${eventTitle.trim()}`.trim()
    const existingEvent = events.find((item) => item.id === editingEventId)
    const payload: EventPayload = {
      label,
      start: formatDateKey(start),
      end: formatDateKey(end),
      tone: existingEvent?.tone ?? tone,
      images: eventImages,
      description: eventDescription.trim(),
    }
    if (editingEventId) {
      if (onUpdateEvent) {
        onUpdateEvent(editingEventId, payload)
      } else {
        setEvents((prev) =>
          prev.map((item) =>
            item.id === editingEventId ? { ...item, ...payload } : item,
          ),
        )
      }
    } else if (onCreateEvent) {
      onCreateEvent(payload)
    } else {
      setUseSampleEvents(false)
      const createdAt = Date.now()
      setEvents((prev) => [
        ...prev,
        {
          id: `event-${createdAt}`,
          createdAt,
          ...payload,
        },
      ])
    }
    setEditingEventId(null)
    resetForm()
    setIsSheetOpen(false)
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
  const sortedVisionEvents = useMemo(() => {
    return [...spannedEvents].sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime(),
    )
  }, [spannedEvents])
  return (
    <>
      <section className="relative w-full overflow-visible px-4 py-6 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
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
              Your year ahead at a glance. Map out your vision board, directly
              on the calendar.
            </p>
            {heroCTA ? (
              <div className="mt-6 w-full max-w-xl">{heroCTA}</div>
            ) : null}
            <div className="mt-6 flex flex-col items-center gap-3">
              <div
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 p-1 text-xs font-semibold text-slate-600 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.5)]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                <button
                  type="button"
                  onClick={() => setViewMode("calendar")}
                  aria-pressed={viewMode === "calendar"}
                  className={`rounded-full px-4 py-2 transition ${
                    viewMode === "calendar"
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Calendar
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("vision")}
                  aria-pressed={viewMode === "vision"}
                  className={`rounded-full px-4 py-2 transition ${
                    viewMode === "vision"
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Vision board
                </button>
              </div>
              {viewMode === "calendar" ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">
                    Shortcuts
                  </span>
                  <div className="flex items-center gap-1">
                    <kbd className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-slate-600 shadow-[0_8px_16px_-12px_rgba(15,23,42,0.7)]">
                      ←
                    </kbd>
                    <kbd className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-slate-600 shadow-[0_8px_16px_-12px_rgba(15,23,42,0.7)]">
                      →
                    </kbd>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Switch years
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-500">
                  Collect visuals and map them to dates.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-8 space-y-4">
          {viewMode === "calendar" ? (
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
                            segmentEvent ? "cursor-pointer" : ""
                          }`}
                          style={{
                            gridRow: segment.row,
                            gridColumn: `${segment.colStart} / span ${segment.span}`,
                            marginTop:
                              segment.stackIndex *
                              (yearEventRowHeight + yearEventRowGap),
                          }}
                          tabIndex={segmentEvent ? 0 : undefined}
                          role={segmentEvent ? "button" : undefined}
                          onClick={
                            segmentEvent
                              ? () => openEditSheet(segmentEvent)
                              : undefined
                          }
                          onKeyDown={
                            segmentEvent
                              ? (eventKey) => {
                                  if (
                                    eventKey.key === "Enter" ||
                                    eventKey.key === " "
                                  ) {
                                    eventKey.preventDefault()
                                    openEditSheet(segmentEvent)
                                  }
                                }
                              : undefined
                          }
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
                            align="center"
                            collisionPadding={32}
                            avoidCollisions
                            sticky="always"
                            className="border-0 bg-transparent p-0 shadow-none z-[120] overflow-visible"
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
                    aria-owns={
                      yearDayIds.length > 0 ? yearDayIds.join(" ") : undefined
                    }
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
                      return (
                        <div
                          id={`year-day-${dayKey}`}
                          key={`${day.date.toISOString()}-mobile-year`}
                          role="gridcell"
                          aria-label={`${monthNames[day.monthIndex]} ${
                            day.dayNumber
                          }, ${activeYear}`}
                          className={[
                            "relative h-full rounded-md border border-slate-200 bg-white px-2 text-left text-xs",
                            day.isWeekend
                              ? "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200/80"
                              : "",
                          ].join(" ")}
                          style={{ paddingTop: yearEventOffset }}
                        >
                          {day.isMonthStart && (
                            <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-slate-900 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-white">
                              {monthNames[day.monthIndex].slice(0, 3)}
                            </span>
                          )}
                          <span
                            className="mt-4 block text-[12px] font-semibold text-slate-900"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {day.dayNumber}
                          </span>
                        </div>
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
                    onSelect={openEditSheet}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-[0_30px_70px_-50px_rgba(15,23,42,0.6)] sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p
                    className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Vision board
                  </p>
                  <p className="text-xs text-slate-400">
                    Pin the imagery, then anchor it to the calendar.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                    {sortedVisionEvents.length} visions
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                    {activeYear}
                  </span>
                </div>
              </div>

              <div className="mt-6 columns-1 gap-5 sm:columns-2 lg:columns-3">
                {sortedVisionEvents.map((event) => {
                  const previewImages = event.images.slice(0, 4)
                  const imageGridCols =
                    previewImages.length <= 1 ? "grid-cols-1" : "grid-cols-2"
                  return (
                    <div
                      key={`${event.id}-vision-card`}
                      className="relative mb-5 break-inside-avoid overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.6)]"
                    >
                      <div
                        className="absolute inset-0 opacity-70"
                        style={{
                          background: `linear-gradient(140deg, ${tonePolaroidBackground[event.tone]}22, transparent 55%)`,
                        }}
                      />
                      <div className="relative space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900">
                            {event.label}
                          </p>
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${toneStyles[event.tone]}`}
                            aria-hidden="true"
                          />
                        </div>

                        {previewImages.length > 0 ? (
                          <div className={`grid gap-2 ${imageGridCols}`}>
                            {previewImages.map((image, index) => (
                              <div
                                key={`${event.id}-vision-image-${image}`}
                                className={`overflow-hidden rounded-2xl border border-white/60 shadow-[0_16px_30px_-22px_rgba(15,23,42,0.6)] ${
                                  previewImages.length === 1
                                    ? "aspect-[4/3]"
                                    : index === 0
                                      ? "aspect-[4/3]"
                                      : "aspect-square"
                                }`}
                              >
                                <img
                                  src={image}
                                  alt={`${event.label} vision`}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-xs text-slate-500">
                            Add imagery to bring this vision to life.
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>
      <button
        type="button"
        onClick={openCreateSheet}
        className="group fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-[0_22px_48px_-24px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60"
        aria-label="Add new vision"
      >
        <span className="text-2xl leading-none">+</span>
      </button>
      <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
      <SheetContent side="right" className="w-full max-w-md overflow-hidden p-0">
          <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border-b border-slate-200/70 bg-slate-50/80 px-5 py-4">
              <SheetHeader className="space-y-2">
                <SheetTitle className="text-lg font-semibold text-slate-900">
                  {editingEventId ? "Edit vision" : "Add vision"}
                </SheetTitle>
                <SheetDescription className="text-sm text-slate-600">
                  Capture the moment and attach imagery for quick hover previews.
                </SheetDescription>
              </SheetHeader>
            </div>
            <form
              onSubmit={handleEventSubmit}
              className="flex-1 min-h-0 space-y-4 overflow-y-auto px-5 py-4"
            >
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Title
                </Label>
                <Input
                  value={eventTitle}
                  onChange={(event) => setEventTitle(event.target.value)}
                  placeholder="Vision title"
                  className="h-10 bg-white text-sm text-slate-900 shadow-[0_0_0_1px_rgba(148,163,184,0.18)] focus-visible:ring-slate-300/70"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Vision details
                </Label>
                <textarea
                  value={eventDescription}
                  onChange={(event) => setEventDescription(event.target.value)}
                  placeholder="Describe the vision..."
                  rows={3}
                  className="w-full rounded-md border border-slate-200/70 bg-white px-3 py-2 text-sm text-slate-900 shadow-[0_0_0_1px_rgba(148,163,184,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/70"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Emoji
                </Label>
                <Input
                  value={eventEmoji}
                  onChange={(event) => setEventEmoji(event.target.value)}
                  placeholder="✨"
                  maxLength={4}
                  className="h-10 bg-white text-sm text-slate-900 shadow-[0_0_0_1px_rgba(148,163,184,0.18)] focus-visible:ring-slate-300/70"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Start date
                  </Label>
                  <Input
                    type="date"
                    value={eventStart}
                    onChange={(event) => setEventStart(event.target.value)}
                    className="h-10 bg-white text-sm text-slate-900 shadow-[0_0_0_1px_rgba(148,163,184,0.18)] focus-visible:ring-slate-300/70"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    End date
                  </Label>
                  <Input
                    type="date"
                    value={eventEnd}
                    onChange={(event) => setEventEnd(event.target.value)}
                    className="h-10 bg-white text-sm text-slate-900 shadow-[0_0_0_1px_rgba(148,163,184,0.18)] focus-visible:ring-slate-300/70"
                  />
                </div>
              </div>
              <Separator className="bg-slate-200/70" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Images
                  </Label>
                  <span className="text-xs text-slate-400">
                    Optional, up to 6
                  </span>
                </div>
                <div className="rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/80 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.8)] transition hover:border-slate-300">
                  <input
                    id="vision-images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                  <label
                    htmlFor="vision-images"
                    className="group flex cursor-pointer items-center gap-3 rounded-xl bg-white/70 px-3 py-2 text-sm text-slate-600 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:bg-white"
                  >
                    <span className="flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-[0_8px_16px_-10px_rgba(15,23,42,0.4)]">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="size-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      >
                        <path d="M4 16l4-4 4 4 4-4 4 4" />
                        <path d="M20 16V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10" />
                        <circle cx="9" cy="8" r="2" />
                      </svg>
                    </span>
                    <span className="flex-1 space-y-1">
                      <span className="block font-medium text-slate-900">
                        Drop files or browse
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        JPG, PNG, or GIF. Max 6 images.
                      </span>
                    </span>
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white shadow-[0_8px_16px_-12px_rgba(15,23,42,0.6)] transition group-hover:translate-y-[-1px]">
                      Choose
                    </span>
                  </label>
                </div>
                {eventImages.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-500">
                      {eventImages.length} image
                      {eventImages.length === 1 ? "" : "s"} selected
                    </div>
                    <div className="flex flex-wrap gap-2">
                    {eventImages.map((image) => (
                      <div
                        key={image}
                        className="h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-[0_10px_20px_-16px_rgba(15,23,42,0.6)]"
                      >
                        <img
                          src={image}
                          alt="Vision upload preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                    </div>
                  </div>
                )}
              </div>
              <Button
                type="submit"
                disabled={isSubmitDisabled}
                className="h-12 w-full rounded-full text-xs font-semibold uppercase tracking-[0.3em]"
              >
                {editingEventId ? "Save changes" : "Save vision"}
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
