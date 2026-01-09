# frozen_string_literal: true

class Event < ApplicationRecord
  TONES = %w[sea sunset orchid ink].freeze

  belongs_to :user

  validates :label, :start_on, :end_on, :tone, presence: true
  validates :tone, inclusion: {in: TONES}

  def calendar_payload
    {
      id: id,
      label: label,
      start: start_on.iso8601,
      end: end_on.iso8601,
      tone: tone,
      images: images || [],
      createdAt: created_at.to_i * 1000,
    }
  end
end
