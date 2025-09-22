import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImportItem {
  module: string;
  title: string;
  videoIframe: string;
  url?: string | null;
}

interface ImportDialogProps {
  onImport: () => void;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({ onImport }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [previewData, setPreviewData] = useState<ImportItem[] | null>(null);
  const [error, setError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const validateAndPreview = () => {
    setError('');
    setPreviewData(null);

    if (!jsonInput.trim()) {
      setError('Please enter JSON data to preview');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      
      if (!Array.isArray(parsed)) {
        setError('JSON must be an array of course items');
        return;
      }

      // Validate structure
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (!item.module || !item.title) {
          setError(`Item ${i + 1}: Missing required fields (module, title)`);
          return;
        }
      }

      setPreviewData(parsed);
    } catch (err) {
      setError('Invalid JSON format');
    }
  };

  const processImport = async () => {
    if (!previewData) return;
    
    setIsImporting(true);

    try {
      // First, delete all existing data
      const { error: deleteError } = await supabase
        .from('modules')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) throw deleteError;

      // Group lessons by module
      const moduleMap = new Map<string, ImportItem[]>();
      
      previewData.forEach(item => {
        if (!moduleMap.has(item.module)) {
          moduleMap.set(item.module, []);
        }
        moduleMap.get(item.module)!.push(item);
      });

      let modulePosition = 0;

      // Create modules and lessons
      for (const [moduleName, lessons] of moduleMap.entries()) {
        // Create module
        const { data: newModule, error: moduleError } = await supabase
          .from('modules')
          .insert([{
            name: moduleName,
            position: modulePosition
          }])
          .select()
          .single();

        if (moduleError) throw moduleError;

        // Create lessons for this module
        const lessonsToInsert = lessons.map((lesson, index) => ({
          title: lesson.title,
          video_iframe: lesson.videoIframe || '',
          position: index,
          module_id: newModule.id
        }));

        const { error: lessonsError } = await supabase
          .from('lessons')
          .insert(lessonsToInsert);

        if (lessonsError) throw lessonsError;

        modulePosition++;
      }

      onImport();
      setIsOpen(false);
      setJsonInput('');
      setPreviewData(null);
      
      toast({
        title: "Success",
        description: `Imported ${moduleMap.size} modules with ${previewData.length} lessons`
      });
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: "Error",
        description: "Failed to import data",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const getPreviewStats = () => {
    if (!previewData) return { modules: 0, lessons: 0 };
    
    const uniqueModules = new Set(previewData.map(item => item.module));
    return {
      modules: uniqueModules.size,
      lessons: previewData.length
    };
  };

  const reset = () => {
    setJsonInput('');
    setPreviewData(null);
    setError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) reset();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import JSON
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Course Data</DialogTitle>
          <DialogDescription>
            Import modules and lessons from JSON. This will replace all existing data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* JSON Input */}
          <div className="space-y-3">
            <Label htmlFor="json-input">JSON Data</Label>
            <Textarea
              id="json-input"
              placeholder={`Paste your JSON here. Expected format:
[
  {
    "module": "Module 1: Getting Started",
    "title": "Introduction to Basics",
    "videoIframe": "<iframe src='...'></iframe>",
    "url": null
  }
]`}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            
            <div className="flex gap-2">
              <Button onClick={validateAndPreview} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Preview Import
              </Button>
              {jsonInput && (
                <Button onClick={reset} variant="ghost">
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          {previewData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Import Preview
                </CardTitle>
                <CardDescription>
                  Review the data before importing. This will replace all existing modules and lessons.
                </CardDescription>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {getPreviewStats().modules} modules
                  </Badge>
                  <Badge variant="secondary">
                    {getPreviewStats().lessons} lessons
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {Array.from(new Set(previewData.map(item => item.module))).map(moduleName => {
                    const moduleLessons = previewData.filter(item => item.module === moduleName);
                    return (
                      <Card key={moduleName} className="bg-muted/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{moduleName}</CardTitle>
                          <CardDescription>{moduleLessons.length} lessons</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-1">
                            {moduleLessons.map((lesson, index) => (
                              <div key={index} className="text-sm p-2 bg-background rounded border">
                                <div className="font-medium">{lesson.title}</div>
                                <div className="text-muted-foreground text-xs">
                                  {lesson.videoIframe ? 'Has video iframe' : 'No video iframe'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                  <div className="flex items-center gap-2 text-destructive mb-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Warning</span>
                  </div>
                  <div className="text-sm text-destructive">
                    This will permanently delete all existing modules and lessons and replace them with the imported data.
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={processImport}
                    disabled={isImporting}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isImporting ? 'Importing...' : 'Confirm Import'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};