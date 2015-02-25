class IndexController < ApplicationController

def index
  @lastKill = Courierkill.last
end

def reset
  if params[:killer].present?
    @kill = Courierkill.create({ :killer => params[:killer] })
  else
    @kill = Courierkill.create()
  end
end

end
