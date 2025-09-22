import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch modules with their lessons ordered by position
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select(`
        id,
        name,
        position,
        lessons (
          id,
          title,
          video_iframe,
          position
        )
      `)
      .order('position')
      .order('position', { referencedTable: 'lessons' });

    if (modulesError) {
      console.error('Error fetching modules:', modulesError);
      throw modulesError;
    }

    // Transform the data to match the requested API format
    const transformedData = [];
    
    if (modules) {
      for (const module of modules) {
        if (module.lessons && module.lessons.length > 0) {
          for (const lesson of module.lessons) {
            transformedData.push({
              module: module.name,
              title: lesson.title,
              videoIframe: lesson.video_iframe || "",
              url: null
            });
          }
        }
      }
    }

    console.log(`API: Returning ${transformedData.length} lessons from ${modules?.length || 0} modules`);

    return new Response(JSON.stringify(transformedData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error in courses-api function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), 
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});