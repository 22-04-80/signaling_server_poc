defmodule SignalingServerPocWeb.SignalChannel do
  use Phoenix.Channel

  def join("signal:join", _message, socket) do
    {:ok, socket}
  end

  def handle_in("get_uuid", %{}, socket) do
    uuid = UUID.uuid4()
    SignalingServerPocWeb.UuidToSocketMap.set(uuid, socket)
    push(socket, "get_uuid", %{uuid: uuid})
    {:noreply, socket}
  end

  def handle_in("call", %{"caller" => caller, "callee" => callee}, socket) do
    calleeSocket = SignalingServerPocWeb.UuidToSocketMap.get(callee)
    case calleeSocket do
      nil ->
        push(socket, "no_callee", %{"callee" => callee})
        {:noreply, socket}
      _ ->
        push(calleeSocket, "call", %{caller: caller, callee: callee})
        {:noreply, socket}
    end
  end

  def handle_in("call_accepted", %{"caller" => caller, "callee" => callee}, socket) do
    callerSocket = SignalingServerPocWeb.UuidToSocketMap.get(caller)
    push(callerSocket, "call_accepted", %{callee: callee})
    {:noreply, socket}
  end

  def handle_in("video_offer", %{"caller" => caller, "callee" => callee, "sdp" => sdp}, socket) do
    calleeSocket = SignalingServerPocWeb.UuidToSocketMap.get(callee)
    case calleeSocket do
      nil ->
        push(socket, "no_callee", %{"callee" => callee})
        {:noreply, socket}
      _ ->
        push(calleeSocket, "video_offer", %{"caller" => caller, "callee" => callee, "sdp" => sdp})
        {:noreply, socket}
    end
  end

  def handle_in("video_answer", %{"caller" => caller, "callee" => callee, "sdp" => sdp}, socket) do
    callerSocket = SignalingServerPocWeb.UuidToSocketMap.get(caller)
    case callerSocket do
      nil ->
        push(socket, "no_caller", %{"caller" => caller})
        {:noreply, socket}
      _ ->
        push(callerSocket, "video_answer", %{"caller" => caller, "callee" => callee, "sdp" => sdp})
        {:noreply, socket}
    end
  end

  def handle_in("new_ice_candidate", %{"target" => target, "candidate" => candidate}, socket) do
    targetSocket = SignalingServerPocWeb.UuidToSocketMap.get(target)
    case targetSocket do
      nil ->
        push(socket, "no_target", %{"target" => target})
        {:noreply, socket}
      _ ->
        push(targetSocket, "new_ice_candidate", %{"target" => target, "candidate" => candidate})
        {:noreply, socket}
    end
  end

  def handle_in("hang_up", %{"name" => name, "target" => target}, socket) do
    targetSocket = SignalingServerPocWeb.UuidToSocketMap.get(target)
    case targetSocket do
      nil ->
        push(socket, "no_target", %{"target" => target})
        {:noreply, socket}
      _ ->
        push(targetSocket, "hang_up", %{"target" => target, "name" => name})
        {:noreply, socket}
    end
  end
end
