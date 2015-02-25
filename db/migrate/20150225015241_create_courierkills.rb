class CreateCourierkills < ActiveRecord::Migration
  def change
    create_table :courierkills do |t|

      t.timestamps
    end
  end
end
