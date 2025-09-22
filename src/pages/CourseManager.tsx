import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Upload, Download, Save, RotateCcw } from 'lucide-react';
import { ModuleCard } from '@/components/ModuleCard';
import { SnapshotManager } from '@/components/SnapshotManager';
import { ImportDialog } from '@/components/ImportDialog';

interface Lesson {
  id: string;
  title: string;
  video_iframe: string;
  position: number;
  module_id: string;
}

interface Module {
  id: string;
  name: string;
  position: number;
  lessons: Lesson[];
}

const CourseManager = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [newModuleName, setNewModuleName] = useState('');
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('modules')
        .select(`
          id,
          name,
          position,
          lessons (
            id,
            title,
            video_iframe,
            position,
            module_id
          )
        `)
        .order('position')
        .order('position', { referencedTable: 'lessons' });

      if (error) throw error;

      setModules(data || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast({
        title: "Error",
        description: "Failed to fetch modules",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addModule = async () => {
    if (!newModuleName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('modules')
        .insert([{
          name: newModuleName,
          position: modules.length
        }])
        .select()
        .single();

      if (error) throw error;

      setModules([...modules, { ...data, lessons: [] }]);
      setNewModuleName('');
      setIsAddModuleOpen(false);
      
      toast({
        title: "Success",
        description: "Module added successfully"
      });
    } catch (error) {
      console.error('Error adding module:', error);
      toast({
        title: "Error",
        description: "Failed to add module",
        variant: "destructive"
      });
    }
  };

  const updateModulePositions = async (newModules: Module[]) => {
    try {
      for (let i = 0; i < newModules.length; i++) {
        const { error } = await supabase
          .from('modules')
          .update({ position: i })
          .eq('id', newModules[i].id);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating module positions:', error);
      toast({
        title: "Error",
        description: "Failed to update module order",
        variant: "destructive"
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Handle module reordering
    if (activeId.startsWith('module-') && overId.startsWith('module-')) {
      const oldIndex = modules.findIndex(m => `module-${m.id}` === activeId);
      const newIndex = modules.findIndex(m => `module-${m.id}` === overId);

      const newModules = arrayMove(modules, oldIndex, newIndex);
      setModules(newModules);
      await updateModulePositions(newModules);
    }
  };

  const updateModule = (moduleId: string, updatedModule: Module) => {
    setModules(modules.map(m => m.id === moduleId ? updatedModule : m));
  };

  const deleteModule = async (moduleId: string) => {
    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;

      setModules(modules.filter(m => m.id !== moduleId));
      toast({
        title: "Success",
        description: "Module deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting module:', error);
      toast({
        title: "Error",
        description: "Failed to delete module",
        variant: "destructive"
      });
    }
  };

  const exportData = () => {
    const exportData = [];
    for (const module of modules) {
      for (const lesson of module.lessons) {
        exportData.push({
          module: module.name,
          title: lesson.title,
          videoIframe: lesson.video_iframe,
          url: null
        });
      }
    }

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'courses-export.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Course Manager</h1>
            <p className="text-muted-foreground">Manage your course modules and lessons</p>
          </div>
          
          <div className="flex gap-2">
            <ImportDialog onImport={fetchModules} />
            
            <Button variant="outline" onClick={exportData} className="gap-2">
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
            
            <SnapshotManager modules={modules} onRestore={fetchModules} />
            
            <Dialog open={isAddModuleOpen} onOpenChange={setIsAddModuleOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Module
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Module</DialogTitle>
                  <DialogDescription>
                    Enter a name for your new course module.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="module-name">Module Name</Label>
                    <Input
                      id="module-name"
                      placeholder="e.g. Module 1: Introduction"
                      value={newModuleName}
                      onChange={(e) => setNewModuleName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addModule()}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddModuleOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addModule} disabled={!newModuleName.trim()}>
                      Add Module
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* API Endpoint Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">API Endpoint</CardTitle>
            <CardDescription>
              Access your course data via JSON API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <code className="bg-muted p-2 rounded text-sm block">
              GET https://rjebddhntcqiwpqtqjya.supabase.co/functions/v1/courses-api
            </code>
          </CardContent>
        </Card>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={modules.map(m => `module-${m.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {modules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                onUpdate={updateModule}
                onDelete={deleteModule}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {modules.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-muted-foreground mb-4">
              No modules yet. Create your first module to get started.
            </div>
            <Button onClick={() => setIsAddModuleOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Module
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CourseManager;