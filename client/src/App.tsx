import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { AssistantCore } from "./components/AssistantCore";
import { AudioInputPanel } from "./components/panels/AudioInputPanel";
import { LastIntentPanel } from "./components/panels/LastIntentPanel";
import { SubsystemRosterPanel } from "./components/panels/SubsystemRosterPanel";
import { EnvironmentPanel } from "./components/panels/EnvironmentPanel";
import { VoiceSessionLogPanel } from "./components/panels/VoiceSessionLogPanel";
import { PerimeterPanel } from "./components/panels/PerimeterPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { ConfirmActionModal } from "./components/ConfirmActionModal";
import { TimerTray } from "./components/TimerTray";
import { useAssistant } from "./hooks/useAssistant";
import { useSimulatedTelemetry } from "./hooks/useSimulatedTelemetry";
import { fetchAssistantConfig } from "./services/api";

export default function App() {
  const assistant = useAssistant();
  const { environment, perimeter } = useSimulatedTelemetry();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ttsConfigured, setTtsConfigured] = useState(false);

  // Pull the display name and voice-service status from the backend once;
  // the operator's own name override in Settings always takes precedence.
  useEffect(() => {
    fetchAssistantConfig()
      .then(({ assistantName, ttsConfigured }) => {
        assistant.setSettings((prev) =>
          prev.assistantName === "SENTINEL" ? { ...prev, assistantName } : prev
        );
        setTtsConfigured(ttsConfigured);
      })
      .catch(() => {
        /* backend unreachable — fall back to the default name */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      e.preventDefault();
      assistant.toggleMic();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistant.toggleMic]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        assistantName={assistant.settings.assistantName}
        wakeWordArmed={assistant.subsystems.wakeWordEngine === "ARMED"}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-5 px-5 py-6 max-w-[1500px] w-full mx-auto">
        <div className="order-2 lg:order-1 flex flex-col gap-4">
          <AudioInputPanel gainDb={assistant.micGainDb} listening={assistant.assistantState === "LISTENING"} />
          <LastIntentPanel intent={assistant.lastIntent} />
          <SubsystemRosterPanel subsystems={assistant.subsystems} />
        </div>

        <div className="order-1 lg:order-2 flex items-center justify-center py-6">
          <AssistantCore
            state={assistant.assistantState}
            level={assistant.micLevel}
            assistantName={assistant.settings.assistantName}
            interimTranscript={assistant.interimTranscript}
            currentUserText={assistant.currentUserText}
            currentResponseText={assistant.currentResponseText}
            errorMessage={assistant.errorMessage}
            onToggleMic={assistant.toggleMic}
            onDismissError={assistant.dismissError}
          />
        </div>

        <div className="order-3 flex flex-col gap-4">
          <EnvironmentPanel environment={environment} />
          <VoiceSessionLogPanel turns={assistant.turns} onReplay={assistant.replay} />
          <PerimeterPanel perimeter={perimeter} />
        </div>
      </main>

      <Footer wakeWordEnabled={assistant.settings.wakeWordEnabled} />

      <TimerTray timers={assistant.activeTimers} />

      <ConfirmActionModal
        action={assistant.pendingConfirmation}
        onConfirm={assistant.confirmPendingAction}
        onCancel={assistant.cancelPendingAction}
      />

      <SettingsPanel
        open={settingsOpen}
        settings={assistant.settings}
        onChange={assistant.setSettings}
        onClearHistory={assistant.clearHistory}
        onClose={() => setSettingsOpen(false)}
        notesCount={assistant.notes.length}
        ttsConfigured={ttsConfigured}
      />
    </div>
  );
}
