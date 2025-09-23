import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, MessageSquare, Loader2 } from 'lucide-react';

const Improvements = () => {
  console.log('Improvements component loaded');
  const [satisfied, setSatisfied] = useState<boolean | null>(null);
  const [thoughts, setThoughts] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (satisfied === null) {
      toast({
        title: "Please select an option",
        description: "Please choose Yes or No before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('feedback')
        .insert([
          {
            satisfied,
            thoughts: thoughts.trim() || null,
          }
        ]);

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Feedback submitted!",
        description: "Thank you for your valuable feedback.",
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl animate-scale-in">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4 animate-fade-in" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-4">Your feedback has been submitted successfully.</p>
            <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
              <strong>আমরা আপনার মতামত অনুযায়ী আপডেট করব।</strong><br />
              দয়া করে গ্রুপে নেগেটিভ বা হেট স্পিচ দেবেন না, এতে অন্যদের মনও খারাপ হয়।
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            Course Feedback
          </CardTitle>
          <CardDescription className="text-center">
            Help us improve by sharing your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-medium">
                Are you satisfied with Vibe Tech course?
              </Label>
              <RadioGroup
                value={satisfied === null ? "" : satisfied.toString()}
                onValueChange={(value) => setSatisfied(value === "true")}
                className="flex space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="yes" />
                  <Label htmlFor="yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="no" />
                  <Label htmlFor="no" className="cursor-pointer">No</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thoughts" className="text-base font-medium">
                Share your thoughts (optional)
              </Label>
              <Textarea
                id="thoughts"
                placeholder="Tell us what you think about the course, what could be improved, or what you liked most..."
                value={thoughts}
                onChange={(e) => setThoughts(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>

            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
                <strong>আমরা আপনার মতামত অনুযায়ী আপডেট করব।</strong><br />
                দয়া করে গ্রুপে নেগেটিভ বা হেট স্পিচ দেবেন না, এতে অন্যদের মনও খারাপ হয়।
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || satisfied === null}
                className={`w-full h-12 font-medium transition-all duration-300 ${
                  isSubmitting 
                    ? 'bg-primary/80' 
                    : satisfied !== null 
                    ? 'bg-primary hover:bg-primary/90 hover:scale-[1.02]' 
                    : 'bg-muted-foreground/20'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Feedback'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Improvements;