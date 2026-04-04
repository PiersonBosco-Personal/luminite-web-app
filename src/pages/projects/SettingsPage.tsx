import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-96 text-center p-6">
      <Settings className="h-12 w-12 text-muted-foreground/40 mb-4" />
      <h2 className="text-lg font-semibold">Project Settings</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        Manage members, rename, and archive your project here.
      </p>
    </div>
  );
}
