import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles } from 'lucide-react';

const AISettings: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Features
        </CardTitle>
        <CardDescription>
          Transcription and summarization capabilities (Coming Soon)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
          <p className="text-muted-foreground mb-4">
            AI features including transcription, summarization, and content analysis will be available in future updates.
          </p>
          <Badge variant="secondary">Planned for v0.2.0</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default AISettings;