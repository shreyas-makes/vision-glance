# frozen_string_literal: true

class CreateEvents < ActiveRecord::Migration[8.0]
  def change
    create_table :events do |t|
      t.references :user, null: false, foreign_key: true
      t.string :label, null: false
      t.date :start_on, null: false
      t.date :end_on, null: false
      t.string :tone, null: false
      t.json :images, null: false, default: []

      t.timestamps
    end
  end
end
