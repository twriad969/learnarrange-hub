import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Edit, Trash2, Plus, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LessonItem } from '@/components/LessonItem';

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

interface ModuleCardProps {
  module: Module;
  onUpdate: (moduleId: string, updatedModule: Module) => void;
  onDelete: (moduleId: string) => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ module, onUpdate, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [editName, setEditName] = useState(module.name);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonIframe, setNewLessonIframe] = useState('');
  const { toast } = useToast();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `module-${module.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateModule = async () => {
    if (!editName.trim()) return;

    try {
      const { error } = await supabase
        .from('modules')
        .update({ name: editName })
        .eq('id', module.id);

      if (error) throw error;

      onUpdate(module.id, { ...module, name: editName });
      setIsEditOpen(false);
      
      toast({
        title: "Success",
        description: "Module updated successfully"
      });
    } catch (error) {
      console.error('Error updating module:', error);
      toast({
        title: "Error",
        description: "Failed to update module",
        variant: "destructive"
      });
    }
  };

  const addLesson = async () => {
    if (!newLessonTitle.trim()) return;

    try {
      const { data, error } = await supabase
        .from('lessons')
        .insert([{
          title: newLessonTitle,
          video_iframe: newLessonIframe,
          module_id: module.id,
          position: module.lessons.length
        }])
        .select()
        .single();

      if (error) throw error;

      const updatedModule = {
        ...module,
        lessons: [...module.lessons, data]
      };

      onUpdate(module.id, updatedModule);
      setNewLessonTitle('');
      setNewLessonIframe('');
      setIsAddLessonOpen(false);
      
      toast({
        title: "Success",
        description: "Lesson added successfully"
      });
    } catch (error) {
      console.error('Error adding lesson:', error);
      toast({
        title: "Error",
        description: "Failed to add lesson",
        variant: "destructive"
      });
    }
  };

  const updateLessonPositions = async (newLessons: Lesson[]) => {
    try {
      for (let i = 0; i < newLessons.length; i++) {
        const { error } = await supabase
          .from('lessons')
          .update({ position: i })
          .eq('id', newLessons[i].id);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating lesson positions:', error);
      toast({
        title: "Error",
        description: "Failed to update lesson order",
        variant: "destructive"
      });
    }
  };

  const handleLessonDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId.startsWith('lesson-') && overId.startsWith('lesson-')) {
      const oldIndex = module.lessons.findIndex(l => `lesson-${l.id}` === activeId);
      const newIndex = module.lessons.findIndex(l => `lesson-${l.id}` === overId);

      const newLessons = arrayMove(module.lessons, oldIndex, newIndex);
      const updatedModule = { ...module, lessons: newLessons };
      
      onUpdate(module.id, updatedModule);
      await updateLessonPositions(newLessons);
    }
  };

  const updateLesson = (lessonId: string, updatedLesson: Lesson) => {
    const updatedLessons = module.lessons.map(l => l.id === lessonId ? updatedLesson : l);
    onUpdate(module.id, { ...module, lessons: updatedLessons });
  };

  const deleteLesson = async (lessonId: string) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;

      const updatedLessons = module.lessons.filter(l => l.id !== lessonId);
      onUpdate(module.id, { ...module, lessons: updatedLessons });
      
      toast({
        title: "Success",
        description: "Lesson deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast({
        title: "Error",
        description: "Failed to delete lesson",
        variant: "destructive"
      });
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`transition-all duration-200 ${isDragging ? 'opacity-50' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="cursor-move p-1 text-muted-foreground hover:text-foreground"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </div>
            
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary">
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <CardTitle className="text-lg">{module.name}</CardTitle>
              </CollapsibleTrigger>
            </Collapsible>
            
            <Badge variant="secondary">
              {module.lessons.length} lessons
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Module</DialogTitle>
                  <DialogDescription>Update the module name.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-module-name">Module Name</Label>
                    <Input
                      id="edit-module-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && updateModule()}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={updateModule} disabled={!editName.trim()}>
                      Update Module
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(module.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-muted-foreground">
                Lessons in this module
              </div>
              
              <Dialog open={isAddLessonOpen} onOpenChange={setIsAddLessonOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-3 w-3" />
                    Add Lesson
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Lesson</DialogTitle>
                    <DialogDescription>
                      Add a lesson to "{module.name}"
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="lesson-title">Lesson Title</Label>
                      <Input
                        id="lesson-title"
                        placeholder="e.g. Introduction to the basics"
                        value={newLessonTitle}
                        onChange={(e) => setNewLessonTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lesson-iframe">Video Iframe Code</Label>
                      <Textarea
                        id="lesson-iframe"
                        placeholder='Paste your iframe embed code here...'
                        value={newLessonIframe}
                        onChange={(e) => setNewLessonIframe(e.target.value)}
                        rows={6}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddLessonOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={addLesson} disabled={!newLessonTitle.trim()}>
                        Add Lesson
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleLessonDragEnd}
            >
              <SortableContext
                items={module.lessons.map(l => `lesson-${l.id}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {module.lessons.map((lesson) => (
                    <LessonItem
                      key={lesson.id}
                      lesson={lesson}
                      onUpdate={updateLesson}
                      onDelete={deleteLesson}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {module.lessons.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                No lessons yet. Add your first lesson to get started.
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};