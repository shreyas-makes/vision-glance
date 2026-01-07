# Product Vision: Life Planner

## Purpose
Life Planner is a year-at-a-glance calendar that trades traditional day/week/month views for a single, immersive annual scan. It exists to help people hold the entire year in their mind at once, then zoom into meaning through visual “vision board” moments that align with date ranges.

## Problem
Most calendar apps optimize for scheduling granularity. They fragment the year, hide long-term arcs, and make it hard to sense the shape of the year ahead. Users who plan life goals, milestones, and intentions need a view that communicates time as a whole, not a sequence of tiny windows.

## Vision
Create a single-view, interactive year grid that feels like a living vision board. The calendar is the stage; intentions and events appear as labeled ranges. Hovering over a range reveals a subtle polaroid-style image stack—present but never overpowering—so users can feel both the macro plan and the emotional texture of the moments they’re manifesting.

## Experience Principles
- One glance should tell the story of the year.
- Visuals must enhance clarity, not compete with it.
- Interactions are soft, graceful, and purposeful.
- The calendar remains the anchor at all times.
- The UI should feel crafted and calm, not busy or utilitarian.

## Core Interaction
- The year is displayed as a responsive grid of months with day-level granularity.
- Events and “manifestations” live as labeled date ranges.
- Hovering a range reveals a polaroid-style tooltip near the label.
- Multiple images can be attached; the stack fans out on hover and collapses when not engaged.

## Differentiation
- This is not a scheduling app.
- It’s a visual planning artifact—part calendar, part vision board—designed to make the year emotionally legible.

## Scope (Phase 1)
- Year-view React component with responsive grid layout.
- Range labels with hover-based image previews.
- Elegant motion and layering to preserve focus on the calendar.

## Out of Scope (For Now)
- Task management, reminders, or recurring events.
- Daily scheduling and time blocking.
- Collaboration or shared calendars.

## Success Criteria
- Users can comprehend the year in a single scan.
- Vision images feel inspiring without breaking context.
- Hovering ranges feels delightful and controlled.
- The UI feels unique, not interchangeable with standard calendar apps.
