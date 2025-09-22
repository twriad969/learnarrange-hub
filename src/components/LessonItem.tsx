import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Trash2, GripVertical, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Lesson {
  id: string;
  title: string;
  video_iframe: string;
  position: number;
  module_id: string;
}

interface LessonItemProps {
  lesson: Lesson;
  onUpdate: (lessonId: string, updatedLesson: Lesson) => void;
  onDelete: (lessonId: string) => void;
}

export const LessonItem: React.FC<LessonItemProps> = ({ lesson, onUpdate, onDelete }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(lesson.title);
  const [editIframe, setEditIframe] = useState(lesson.video_iframe);
  const { toast } = useToast();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `lesson-${lesson.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const updateLesson = async () => {
    if (!editTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('lessons')
        .update({ 
          title: editTitle,
          video_iframe: editIframe
        })
        .eq('id', lesson.id);

      if (error) throw error;

      onUpdate(lesson.id, { 
        ...lesson, 
        title: editTitle,
        video_iframe: editIframe
      });
      setIsEditOpen(false);
      
      toast({
        title: "Success",
        description: "Lesson updated successfully"
      });
    } catch (error) {
      console.error('Error updating lesson:', error);
      toast({
        title: "Error",
        description: "Failed to update lesson",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className={`transition-all duration-200 ${isDragging ? 'opacity-50' : ''}`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div
                className="cursor-move p-1 text-muted-foreground hover:text-foreground"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4" />
              </div>
              
              <div className="flex-1">
                <div className="font-medium">{lesson.title}</div>
                <div className="text-sm text-muted-foreground">
                  {lesson.video_iframe ? 'Video iframe configured' : 'No video configured'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {lesson.video_iframe && (
                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Preview: {lesson.title}</DialogTitle>
                      <DialogDescription>
                        Video preview for this lesson
                      </DialogDescription>
                    </DialogHeader>
                    <div 
                      className="w-full"
                      dangerouslySetInnerHTML={{ __html: lesson.video_iframe }}
                    />
                  </DialogContent>
                </Dialog>
              )}

              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Lesson</DialogTitle>
                    <DialogDescription>
                      Update the lesson title and video iframe.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-lesson-title">Lesson Title</Label>
                      <Input
                        id="edit-lesson-title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-lesson-iframe">Video Iframe Code</Label>
                      <Textarea
                        id="edit-lesson-iframe"
                        value={editIframe}
                        onChange={(e) => setEditIframe(e.target.value)}
                        rows={6}
                        placeholder="Paste your iframe embed code here..."
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={updateLesson} disabled={!editTitle.trim()}>
                        Update Lesson
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(lesson.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};