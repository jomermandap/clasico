import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Users, ShoppingCart, TrendingUp } from "lucide-react";

export function DashboardStats() {
  const stats = [
    {
      title: "Total Revenue",
      value: "$45,231.89",
      change: "+20.1% from last month",
      icon: DollarSign,
      trend: "up"
    },
    {
      title: "Active Users",
      value: "2,350",
      change: "+180.1% from last month",
      icon: Users,
      trend: "up"
    },
    {
      title: "Total Orders",
      value: "1,234",
      change: "+19% from last month",
      icon: ShoppingCart,
      trend: "up"
    },
    {
      title: "Growth Rate",
      value: "12.5%",
      change: "+4% from last month",
      icon: TrendingUp,
      trend: "up"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function RecentActivity() {
  const activities = [
    {
      user: "John Doe",
      action: "created new order",
      target: "#12345",
      time: "2 minutes ago",
      status: "success"
    },
    {
      user: "Jane Smith",
      action: "updated customer",
      target: "Acme Corp",
      time: "5 minutes ago",
      status: "info"
    },
    {
      user: "Bob Johnson",
      action: "deleted product",
      target: "Widget A",
      time: "10 minutes ago",
      status: "warning"
    },
    {
      user: "Alice Brown",
      action: "completed shipment",
      target: "#12346",
      time: "15 minutes ago",
      status: "success"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "bg-green-100 text-green-800";
      case "warning": return "bg-yellow-100 text-yellow-800";
      case "info": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions from your team</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {activity.user} {activity.action} <span className="font-mono">{activity.target}</span>
                </p>
                <p className="text-sm text-muted-foreground">{activity.time}</p>
              </div>
              <Badge variant="secondary" className={getStatusColor(activity.status)}>
                {activity.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectsTable() {
  const projects = [
    {
      name: "Website Redesign",
      status: "In Progress",
      progress: 75,
      dueDate: "2024-03-15",
      assignee: "John Doe"
    },
    {
      name: "Mobile App Development",
      status: "Planning",
      progress: 25,
      dueDate: "2024-04-20",
      assignee: "Jane Smith"
    },
    {
      name: "Database Migration",
      status: "Completed",
      progress: 100,
      dueDate: "2024-02-28",
      assignee: "Bob Johnson"
    },
    {
      name: "API Integration",
      status: "In Progress",
      progress: 60,
      dueDate: "2024-03-25",
      assignee: "Alice Brown"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800";
      case "In Progress": return "bg-blue-100 text-blue-800";
      case "Planning": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects</CardTitle>
        <CardDescription>Track your active projects and their progress</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map((project, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Due: {project.dueDate} • Assigned to: {project.assignee}
                  </p>
                </div>
                <Badge variant="secondary" className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{project.progress}% complete</p>
              {index < projects.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
