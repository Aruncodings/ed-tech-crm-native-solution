"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Phone, CheckCircle2, TrendingUp, Clock, Target, Award } from "lucide-react";

interface CallStatsCardProps {
  stats: {
    callsMade: number;
    callsAnswered: number;
    totalDurationSeconds: number;
    leadsContacted: number;
    leadsConverted: number;
  };
  limits: {
    dailyCallLimit: number;
    monthlyCallLimit: number;
  };
  monthlyCallsMade: number;
}

export function CallStatsCard({ stats, limits, monthlyCallsMade }: CallStatsCardProps) {
  const answerRate = stats.callsMade > 0 
    ? ((stats.callsAnswered / stats.callsMade) * 100).toFixed(1)
    : "0.0";
    
  const conversionRate = stats.leadsContacted > 0
    ? ((stats.leadsConverted / stats.leadsContacted) * 100).toFixed(1)
    : "0.0";
    
  const avgDuration = stats.callsAnswered > 0
    ? Math.round(stats.totalDurationSeconds / stats.callsAnswered / 60)
    : 0;

  const dailyProgress = limits.dailyCallLimit > 0
    ? (stats.callsMade / limits.dailyCallLimit) * 100
    : 0;
    
  const monthlyProgress = limits.monthlyCallLimit > 0
    ? (monthlyCallsMade / limits.monthlyCallLimit) * 100
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Today's Calls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            Today's Calls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold">{stats.callsMade}</div>
          {limits.dailyCallLimit > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Daily Limit</span>
                <span className="font-medium">{stats.callsMade} / {limits.dailyCallLimit}</span>
              </div>
              <Progress value={Math.min(dailyProgress, 100)} className="h-1" />
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {stats.callsAnswered} answered ({answerRate}%)
          </p>
        </CardContent>
      </Card>

      {/* Monthly Performance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600" />
            This Month
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold">{monthlyCallsMade}</div>
          {limits.monthlyCallLimit > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Monthly Limit</span>
                <span className="font-medium">{monthlyCallsMade} / {limits.monthlyCallLimit}</span>
              </div>
              <Progress value={Math.min(monthlyProgress, 100)} className="h-1" />
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Total calls this month
          </p>
        </CardContent>
      </Card>

      {/* Answer Rate */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Answer Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{answerRate}%</div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.callsAnswered} of {stats.callsMade} answered
          </p>
        </CardContent>
      </Card>

      {/* Avg Call Duration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" />
            Avg Duration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgDuration} min</div>
          <p className="text-xs text-muted-foreground mt-2">
            Per answered call
          </p>
        </CardContent>
      </Card>

      {/* Conversion Rate */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            Conversion Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{conversionRate}%</div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.leadsConverted} of {stats.leadsContacted} converted
          </p>
        </CardContent>
      </Card>

      {/* Total Conversions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-600" />
            Conversions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.leadsConverted}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Leads converted today
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
