class AddKillerToCourierKill < ActiveRecord::Migration
  def change
    add_column :courierkills, :killer, :string, :default=>"Jacob"
  end
end
