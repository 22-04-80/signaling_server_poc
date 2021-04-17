# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
use Mix.Config

# Configures the endpoint
config :signaling_server_poc, SignalingServerPocWeb.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "ffxxWe2O2HcfpSzbKR6CY0l7MPmuTCtPF0Tjn/p+0IyBwzKWT6JKFz1YNnnXmrWU",
  render_errors: [view: SignalingServerPocWeb.ErrorView, accepts: ~w(html json), layout: false],
  pubsub_server: SignalingServerPoc.PubSub,
  live_view: [signing_salt: "1EUtFTDG"]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env()}.exs"
