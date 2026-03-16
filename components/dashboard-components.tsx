import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Banknote, CalendarRange, ShoppingBag, TrendingDown } from "lucide-react";

export function DashboardStats() {
  const stats = [
    {
      title: "Rent Collected (This Week)",
      value: "₱45,250",
      change: "Thu–Sun collections settled",
      icon: Banknote,
      trend: "up"
    },
    {
      title: "Pending Rent",
      value: "₱8,750",
      change: "Merchants to follow up",
      icon: TrendingDown,
      trend: "up"
    },
    {
      title: "Reserved Spots",
      value: "38 / 42",
      change: "Across Thu–Sun sessions",
      icon: CalendarRange,
      trend: "up"
    },
    {
      title: "Market Expenses",
      value: "₱12,300",
      change: "Stall ops, permits, staff",
      icon: ShoppingBag,
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
      user: "Stall A12",
      action: "paid rent for",
      target: "Thu–Sun",
      time: "5 min ago",
      status: "success"
    },
    {
      user: "Stall B07",
      action: "reserved spot for",
      target: "Sat–Sun",
      time: "12 min ago",
      status: "info"
    },
    {
      user: "Security & Cleaning",
      action: "expense logged",
      target: "₱3,200",
      time: "30 min ago",
      status: "warning"
    },
    {
      user: "Stall C03",
      action: "marked pending rent",
      target: "Sun",
      time: "1 hour ago",
      status: "warning"
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
      name: "Stall A12 – Fresh Produce",
      status: "Paid",
      progress: 100,
      dueDate: "Thu–Sun",
      assignee: "Maria D."
    },
    {
      name: "Stall B07 – Coffee Cart",
      status: "Reserved",
      progress: 50,
      dueDate: "Sat–Sun",
      assignee: "Liam K."
    },
    {
      name: "Stall C03 – Vintage Clothing",
      status: "Pending Rent",
      progress: 40,
      dueDate: "Thu–Sun",
      assignee: "Ana P."
    },
    {
      name: "Stall D14 – Street Food",
      status: "Paid",
      progress: 90,
      dueDate: "Fri–Sun",
      assignee: "Jorge R."
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid": return "bg-green-100 text-green-800";
      case "Reserved": return "bg-blue-100 text-blue-800";
      case "Pending Rent": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Merchant Rent & Reservations</CardTitle>
        <CardDescription>Track stall rent status across the weekend market</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map((project, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Days: {project.dueDate} • Contact: {project.assignee}
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
              <p className="text-xs text-muted-foreground">
                {project.progress}% of rent settled for this run
              </p>
              {index < projects.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
