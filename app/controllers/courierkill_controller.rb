class CourierkillController < ApplicationController

  def index

    render :json => Courierkill.all
  end

  def show
    @kill = Courierkill.find(params[:id])
    
    render :json => @kill
  end

  def last
    @kill = Courierkill.all.sort_by(&:created_at).last
    
    render :json => @kill
  end

  def create
    @kill = Courierkill.new(params)

    if @kill.save
      render :json => @kill
    else
      render :json => { :error => "failed to create kill" }
    end
  end
end
