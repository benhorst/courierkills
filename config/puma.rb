environment ENV['RAILS_ENV'] || 'production'
daemonize

workers    1 # should be same number of your CPU core
threads    1, 8
bind       'unix:/apps/sockets/courier_live.sock'

pidfile    "/apps/live/courier/tmp/puma.pid"
