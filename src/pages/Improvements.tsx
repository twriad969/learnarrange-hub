import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, MessageSquare, Loader2, Sparkles, Heart } from 'lucide-react';

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
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md animate-scale-in">
          <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="mb-6">
                <CheckCircle2 className="w-16 h-16 sm:w-20 sm:h-20 text-success mx-auto mb-4 animate-pulse-glow" />
                <div className="flex justify-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Sparkles key={i} className="w-4 h-4 text-primary animate-pulse" style={{animationDelay: `${i * 0.2}s`}} />
                  ))}
                </div>
              </div>
              
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3">
                Thank You! 🎉
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                Your feedback has been submitted successfully.
              </p>
              
              <div className="bg-gradient-subtle p-4 sm:p-6 rounded-xl border border-border/50">
                <div className="flex items-center justify-center mb-3">
                  <Heart className="w-5 h-5 text-primary mr-2" />
                  <span className="font-medium text-foreground text-sm sm:text-base">বাংলায় বার্তা</span>
                </div>
                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                  <strong className="text-primary">আমরা আপনার মতামত অনুযায়ী আপডেট করব।</strong><br />
                  দয়া করে গ্রুপে নেগেটিভ বা হেট স্পিচ দেবেন না, এতে অন্যদের মনও খারাপ হয়।
                </p>
              </div>
              
              <Button 
                onClick={() => window.location.href = '/'}
                className="mt-6 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 rounded-xl transition-all duration-300 hover:scale-105"
              >
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md sm:max-w-lg animate-fade-in">
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              Course Feedback
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground">
              Help us improve by sharing your experience
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 px-6 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <Label className="text-sm sm:text-base font-medium text-foreground block">
                  Are you satisfied with Vibe Tech course?
                </Label>
                <RadioGroup
                  value={satisfied === null ? "" : satisfied.toString()}
                  onValueChange={(value) => setSatisfied(value === "true")}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="relative">
                    <RadioGroupItem value="true" id="yes" className="peer sr-only" />
                    <Label 
                      htmlFor="yes" 
                      className="flex items-center justify-center p-4 border-2 border-border rounded-xl cursor-pointer transition-all duration-300 hover:border-primary/50 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary font-medium"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Yes
                    </Label>
                  </div>
                  <div className="relative">
                    <RadioGroupItem value="false" id="no" className="peer sr-only" />
                    <Label 
                      htmlFor="no" 
                      className="flex items-center justify-center p-4 border-2 border-border rounded-xl cursor-pointer transition-all duration-300 hover:border-destructive/50 peer-checked:border-destructive peer-checked:bg-destructive/5 peer-checked:text-destructive font-medium"
                    >
                      <MessageSquare className="w-5 h-5 mr-2" />
                      No
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label htmlFor="thoughts" className="text-sm sm:text-base font-medium text-foreground">
                  Share your thoughts (optional)
                </Label>
                <Textarea
                  id="thoughts"
                  placeholder="Tell us what you think about the course, what could be improved, or what you liked most..."
                  value={thoughts}
                  onChange={(e) => setThoughts(e.target.value)}
                  className="min-h-[100px] sm:min-h-[120px] resize-none rounded-xl border-2 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-300"
                />
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-subtle p-4 sm:p-5 rounded-xl border border-border/50">
                  <div className="flex items-center mb-3">
                    <Heart className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                    <span className="font-medium text-foreground text-sm">বাংলায় বার্তা</span>
                  </div>
                  <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                    <strong className="text-primary">আমরা আপনার মতামত অনুযায়ী আপডেট করব।</strong><br />
                    দয়া করে গ্রুপে নেগেটিভ বা হেট স্পিচ দেবেন না, এতে অন্যদের মনও খারাপ হয়।
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || satisfied === null}
                  className={`w-full h-12 sm:h-14 font-medium rounded-xl transition-all duration-300 ${
                    isSubmitting 
                      ? 'bg-primary/80 cursor-not-allowed' 
                      : satisfied !== null 
                      ? 'bg-primary hover:bg-primary/90 hover:scale-[1.02] shadow-lg hover:shadow-xl' 
                      : 'bg-muted-foreground/20 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Improvements;