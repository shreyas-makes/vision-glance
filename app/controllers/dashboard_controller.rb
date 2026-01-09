# frozen_string_literal: true

class DashboardController < InertiaController
  def index
    events = Current.user.events.order(:start_on, :end_on, :created_at)

    render inertia: {events: events.map(&:calendar_payload)}
  end
end
