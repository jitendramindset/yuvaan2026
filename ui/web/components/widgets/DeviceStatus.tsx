"use client";
import { useEffect, useState } from "react";
import { Smartphone, Monitor, Watch, Tablet, Plus } from "lucide-react";
import Link from "next/link";

interface Props { config: Record<string, unknown> }

interface Device {
  device_id: string;
  device_name?: string;
  platform?: string;
  status?: string;
}

const PLATFORM_ICONS: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  mobile:   Smartphone,
  android:  Smartphone,
  ios:      Smartphone,
  desktop:  Monitor,
  web:      Monitor,
  watch:    Watch,
  tablet:   Tablet,
};

export function DeviceStatus({ config }: Props) {
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    fetch("/api/backend/devices/list")
      .then((r) => r.json())
      .then((d: { devices?: Device[] }) => {
        if (d.devices?.length) setDevices(d.devices);
      })
      .catch(() => {});
  }, []);

  const show: Device[] = devices.length > 0
    ? devices
    : [
        { device_id: "device.default.local", device_name: "This Device", platform: "desktop", status: "active" },
      ];

  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex-1 space-y-1.5 overflow-y-auto min-h-0">
        {show.map((d) => {
          const Icon = PLATFORM_ICONS[d.platform ?? ""] ?? Smartphone;
          const active = d.status === "active";
          return (
            <div
              key={d.device_id}
              className="flex items-center gap-2.5 p-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: active ? "rgba(34,197,94,0.15)" : "var(--border)" }}
              >
                <Icon size={14} style={{ color: active ? "var(--success)" : "var(--muted)" }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium truncate">
                  {d.device_name ?? d.device_id.split(".").pop() ?? d.device_id}
                </div>
                <div className="text-xs capitalize" style={{ color: "var(--muted)" }}>
                  {d.platform ?? "unknown"}
                </div>
              </div>
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: active ? "var(--success)" : "var(--muted)" }}
              />
            </div>
          );
        })}
      </div>

      <Link href="/device" className="btn btn-secondary text-xs py-1.5 justify-center shrink-0 gap-1">
        <Plus size={11} /> Pair New Device
      </Link>
    </div>
  );
}
