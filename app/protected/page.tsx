import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardStats, RecentActivity, ProjectsTable } from "@/components/dashboard-components";

export default function ProtectedPage() {
  return (
    <DashboardLayout title="Weekend Market Overview">
      <div className="space-y-6">
        <DashboardStats />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ProjectsTable />
          </div>
          <div>
            <RecentActivity />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
