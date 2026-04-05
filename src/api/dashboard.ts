import customAxios from "@/lib/customAxios";
import type { Widget, DashboardWidget } from "@/types/models";
import type { Layout } from "react-grid-layout";

export async function getAvailableWidgets(): Promise<Widget[]> {
  const res = await customAxios.get("/v1/widgets");
  return res.data.data;
}

export async function getDashboardWidgets(projectId: number): Promise<DashboardWidget[]> {
  const res = await customAxios.get(`/v1/projects/${projectId}/dashboard-widgets`);
  return res.data.data;
}

export async function addDashboardWidget(
  projectId: number,
  widgetId: number
): Promise<DashboardWidget> {
  const res = await customAxios.post(`/v1/projects/${projectId}/dashboard-widgets`, {
    widget_id: widgetId,
  });
  return res.data.data;
}

export async function syncLayout(projectId: number, layout: Layout): Promise<void> {
  await customAxios.post(`/v1/projects/${projectId}/dashboard-widgets/sync`, { layout });
}

export async function removeDashboardWidget(dashboardWidgetId: number): Promise<void> {
  await customAxios.delete(`/v1/dashboard-widgets/${dashboardWidgetId}`);
}
