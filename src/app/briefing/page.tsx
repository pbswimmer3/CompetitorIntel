'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { FileText, Calendar, Clock } from 'lucide-react';
import { BriefingGenerator } from '@/components/BriefingGenerator';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function BriefingPage() {
  const { data, mutate } = useSWR('/api/briefing', fetcher);
  const [selectedBriefingId, setSelectedBriefingId] = useState<number | null>(null);

  const allBriefings = data?.briefings || [];
  const latestBriefing = data?.latest;

  // Get the briefing to display - selected one or latest
  const displayedBriefing = selectedBriefingId
    ? allBriefings.find((b: any) => b.id === selectedBriefingId)
    : latestBriefing;

  const handleBriefingGenerated = () => {
    mutate(); // Refresh the data
    setSelectedBriefingId(null); // Show the new latest
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-purple-400" />
            Weekly Intelligence Briefing
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-generated strategic analysis for Skan.AI leadership
          </p>
        </div>
        <BriefingGenerator onGenerated={handleBriefingGenerated} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Briefing Content - 3 columns */}
        <div className="lg:col-span-3">
          {displayedBriefing ? (
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    Week of {format(new Date(displayedBriefing.week_of), 'MMMM d, yyyy')}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    Generated {formatLocalTime(displayedBriefing.generated_at)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert prose-sm max-w-none">
                  <BriefingContent content={displayedBriefing.content} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="py-16 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Briefings Generated Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Click the &quot;Generate Briefing&quot; button to create your first weekly intelligence report.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Previous Briefings - 1 column */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Previous Briefings</h2>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              {allBriefings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No previous briefings
                </p>
              ) : (
                <div className="space-y-2">
                  {allBriefings.map((briefing: any, index: number) => {
                    const isSelected = selectedBriefingId === briefing.id ||
                      (selectedBriefingId === null && index === 0);

                    return (
                      <button
                        key={briefing.id}
                        onClick={() => setSelectedBriefingId(briefing.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          isSelected
                            ? 'border-primary/50 bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {format(new Date(briefing.week_of), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Generated {formatLocalTime(briefing.generated_at)}
                        </div>
                        {index === 0 && (
                          <Badge variant="outline" className="mt-2 text-xs bg-primary/10 text-primary border-primary/20">
                            Latest
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium mb-2">About This Briefing</h3>
              <p className="text-xs text-muted-foreground">
                This briefing is generated by Claude AI analyzing recent competitive intelligence data.
                It provides strategic insights specifically tailored for Skan.AI leadership.
              </p>
              <Separator className="my-3" />
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model</span>
                  <span>Claude Sonnet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Focus</span>
                  <span>Process Mining</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Format timestamp in local timezone
function formatLocalTime(isoString: string): string {
  const date = new Date(isoString);
  return format(date, 'MMM d, h:mm a');
}

// Component to render markdown-like content
function BriefingContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={index} className="text-xl font-semibold mt-6 mb-3 text-foreground flex items-center gap-2">
          {line.replace('## ', '')}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={index} className="text-lg font-medium mt-4 mb-2 text-foreground">
          {line.replace('### ', '')}
        </h3>
      );
    } else if (line.startsWith('- ')) {
      elements.push(
        <li key={index} className="text-muted-foreground ml-4 mb-1">
          {line.replace('- ', '')}
        </li>
      );
    } else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(
        <p key={index} className="font-semibold text-foreground my-2">
          {line.replace(/\*\*/g, '')}
        </p>
      );
    } else if (line.trim() === '') {
      elements.push(<br key={index} />);
    } else {
      elements.push(
        <p key={index} className="text-muted-foreground mb-2">
          {line}
        </p>
      );
    }
  });

  return <>{elements}</>;
}
