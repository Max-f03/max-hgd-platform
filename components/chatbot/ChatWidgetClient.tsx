"use client";

import dynamic from "next/dynamic";

const ChatWidget = dynamic(() => import("@/components/chatbot/ChatWidget"), {
  ssr: false,
});

export default function ChatWidgetClient() {
  return <ChatWidget />;
}
