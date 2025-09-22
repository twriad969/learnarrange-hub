import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, RotateCcw, Calendar, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface Snapshot {
  id: string;
  name: string;
  data: any;
  created_at: string;
}

interface SnapshotManagerProps {
  modules: Module[];
  onRestore: () => void;
}

export const SnapshotManager: React.FC<SnapshotManagerProps> = ({ modules, onRestore }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchSnapshots();
    }
  }, [isOpen]);

  const fetchSnapshots = async () => {
    try {
      const { data, error } = await supabase
        .from('snapshots')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSnapshots(data || []);
    } catch (error) {
      console.error('Error fetching snapshots:', error);
      toast({
        title: "Error",
        description: "Failed to fetch snapshots",
        variant: "destructive"
      });
    }
  };

  const createSnapshot = async () => {
    if (!newSnapshotName.trim()) return;
    setIsCreating(true);

    try {
      // Prepare snapshot data
      const snapshotData = {
        modules: modules.map(module => ({
          name: module.name,
          position: module.position,
          lessons: module.lessons.map(lesson => ({
            title: lesson.title,
            video_iframe: lesson.video_iframe,
            position: lesson.position
          }))
        }))
      };

      const { data, error } = await supabase
        .from('snapshots')
        .insert([{
          name: newSnapshotName,
          data: snapshotData
        }])
        .select()
        .single();

      if (error) throw error;

      setSnapshots([data, ...snapshots]);
      setNewSnapshotName('');
      setIsCreating(false);
      
      toast({
        title: "Success",
        description: "Snapshot created successfully"
      });
    } catch (error) {
      console.error('Error creating snapshot:', error);
      setIsCreating(false);
      toast({
        title: "Error",
        description: "Failed to create snapshot",
        variant: "destructive"
      });
    }
  };

  const restoreSnapshot = async (snapshot: Snapshot) => {
    try {
      // First, delete all existing modules (cascade will delete lessons)
      const { error: deleteError } = await supabase
        .from('modules')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) throw deleteError;

      // Restore modules and lessons from snapshot
      const snapshotModules = snapshot.data.modules || [];
      
      for (const moduleData of snapshotModules) {
        const { data: newModule, error: moduleError } = await supabase
          .from('modules')
          .insert([{
            name: moduleData.name,
            position: moduleData.position
          }])
          .select()
          .single();

        if (moduleError) throw moduleError;

        // Insert lessons for this module
        if (moduleData.lessons && moduleData.lessons.length > 0) {
          const lessons = moduleData.lessons.map((lesson: any) => ({
            title: lesson.title,
            video_iframe: lesson.video_iframe,
            position: lesson.position,
            module_id: newModule.id
          }));

          const { error: lessonsError } = await supabase
            .from('lessons')
            .insert(lessons);

          if (lessonsError) throw lessonsError;
        }
      }

      onRestore();
      setIsOpen(false);
      
      toast({
        title: "Success",
        description: "Snapshot restored successfully"
      });
    } catch (error) {
      console.error('Error restoring snapshot:', error);
      toast({
        title: "Error",
        description: "Failed to restore snapshot",
        variant: "destructive"
      });
    }
  };

  const deleteSnapshot = async (snapshotId: string) => {
    try {
      const { error } = await supabase
        .from('snapshots')
        .delete()
        .eq('id', snapshotId);

      if (error) throw error;

      setSnapshots(snapshots.filter(s => s.id !== snapshotId));
      
      toast({
        title: "Success",
        description: "Snapshot deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting snapshot:', error);
      toast({
        title: "Error",
        description: "Failed to delete snapshot",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getSnapshotStats = (snapshot: Snapshot) => {
    const modules = snapshot.data.modules || [];
    const totalLessons = modules.reduce((sum: number, module: any) => 
      sum + (module.lessons?.length || 0), 0
    );
    return { modules: modules.length, lessons: totalLessons };
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Save className="h-4 w-4" />
          Snapshots
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Snapshot Manager</DialogTitle>
          <DialogDescription>
            Save and restore different versions of your course structure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Snapshot */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Create New Snapshot</CardTitle>
              <CardDescription>
                Save the current state of your modules and lessons.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="snapshot-name">Snapshot Name</Label>
                <Input
                  id="snapshot-name"
                  placeholder="e.g. Version 1.0 - Complete Course"
                  value={newSnapshotName}
                  onChange={(e) => setNewSnapshotName(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Current: {modules.length} modules, {modules.reduce((sum, m) => sum + m.lessons.length, 0)} lessons
                </div>
                <Button 
                  onClick={createSnapshot} 
                  disabled={!newSnapshotName.trim() || isCreating}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isCreating ? 'Creating...' : 'Create Snapshot'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Existing Snapshots */}
          <div className="space-y-3">
            <h4 className="font-medium">Saved Snapshots</h4>
            
            {snapshots.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No snapshots saved yet. Create your first snapshot above.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {snapshots.map((snapshot) => {
                  const stats = getSnapshotStats(snapshot);
                  return (
                    <Card key={snapshot.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="font-medium">{snapshot.name}</div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(snapshot.created_at)}
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="secondary">
                                {stats.modules} modules
                              </Badge>
                              <Badge variant="secondary">
                                {stats.lessons} lessons
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => restoreSnapshot(snapshot)}
                              className="gap-2"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Restore
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteSnapshot(snapshot.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
