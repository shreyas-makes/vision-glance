# frozen_string_literal: true

class EventsController < InertiaController
  def create
    event = Current.user.events.new(event_params)

    if event.save
      redirect_to dashboard_path, notice: "Event added"
    else
      redirect_to dashboard_path, inertia: {errors: event.errors}
    end
  end

  private

  def event_params
    permitted = params.permit(:label, :tone, :start, :end, images: [])
    start_on = parse_date(permitted[:start])
    end_on = parse_date(permitted[:end])
    if start_on && end_on && start_on > end_on
      start_on, end_on = end_on, start_on
    end

    {
      label: permitted[:label],
      tone: permitted[:tone],
      start_on: start_on,
      end_on: end_on,
      images: permitted[:images] || [],
    }
  end

  def parse_date(value)
    return if value.blank?

    Date.iso8601(value)
  rescue ArgumentError
    nil
  end
end
