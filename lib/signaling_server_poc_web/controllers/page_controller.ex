defmodule SignalingServerPocWeb.PageController do
  use SignalingServerPocWeb, :controller

  def index(conn, _params) do
    render(conn, "index.html")
  end
end
