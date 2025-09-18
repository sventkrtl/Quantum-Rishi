// job-scheduler.ts
// Production-ready AI content generation job scheduler for Quantum Rishi
// Supports multiple AI providers with fallback mechanisms and concurrency control

import { createClient } from '@supabase/supabase-js';

// Environment configuration
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const LM_CLOUD_API_KEY = process.env.LM_CLOUD_API_KEY!; // Gemini/Sarvam/OpenAI API key
const LM_FALLBACK_URL = process.env.LM_FALLBACK_URL!; // LM Studio runner endpoint
const MAX_CONCURRENCY = parseInt(process.env.MAX_CONCURRENCY || '4');
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '5000'); // 5 seconds
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3');

// Initialize Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// Global state tracking
let running = 0;
let shuttingDown = false;

// Payload interfaces
interface StoryPayload {
  prompt: string;
  characterLimit?: number;
  style?: string;
}

interface ContentPayload {
  content: string;
  analysisType?: string;
}

interface DatasetPayload {
  datasetId: string;
  operation?: string;
}

// Job interface
interface Job {
  id: string;
  type: 'story_generation' | 'content_analysis' | 'dataset_processing';
  payload: StoryPayload | ContentPayload | DatasetPayload;
  status: 'queued' | 'running' | 'completed' | 'failed';
  priority: number;
  attempts: number;
  created_at: string;
  updated_at: string;
  error_message?: string;
}

// Result interfaces
interface StoryResult {
  content: string;
  metadata: {
    characterCount: number;
    style: string;
    generatedAt: string;
  };
}

interface ContentResult {
  analysis: string;
  analysisType: string;
  contentLength: number;
  analyzedAt: string;
}

interface DatasetResult {
  datasetId: string;
  operation: string;
  result: string;
  processedAt: string;
}

type JobResult = StoryResult | ContentResult | DatasetResult;

// AI Provider configuration
interface AIProvider {
  name: string;
  apiKey?: string;
  endpoint: string;
  isCloud: boolean;
}

const AI_PROVIDERS: AIProvider[] = [
  {
    name: 'gemini',
    apiKey: LM_CLOUD_API_KEY,
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    isCloud: true
  },
  {
    name: 'lm_studio',
    endpoint: LM_FALLBACK_URL,
    isCloud: false
  }
];

/**
 * Fetch next available jobs from the queue
 */
async function fetchNextJobs(limit: number = 5): Promise<Job[]> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'queued')
      .lt('attempts', MAX_RETRIES)
      .order('priority', { ascending: true }) // Higher priority first (lower number = higher priority)
      .order('created_at', { ascending: true }) // FIFO for same priority
      .limit(limit);

    if (error) {
      console.error('Error fetching jobs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Database error in fetchNextJobs:', error);
    return [];
  }
}

/**
 * Atomically claim a job by updating its status to 'running'
 */
async function claimJob(jobId: string): Promise<boolean> {
  try {
    // First get current attempts count
    const { data: currentJob, error: fetchError } = await supabase
      .from('jobs')
      .select('attempts')
      .eq('id', jobId)
      .eq('status', 'queued')
      .single();

    if (fetchError || !currentJob) {
      return false;
    }

    const { data, error } = await supabase
      .from('jobs')
      .update({ 
        status: 'running',
        updated_at: new Date().toISOString(),
        attempts: currentJob.attempts + 1
      })
      .eq('id', jobId)
      .eq('status', 'queued') // Only claim if still queued
      .select('id')
      .single();

    if (error) {
      console.error(`Failed to claim job ${jobId}:`, error);
      return false;
    }

    return data !== null;
  } catch (error) {
    console.error(`Error claiming job ${jobId}:`, error);
    return false;
  }
}

/**
 * Update job status in database
 */
async function updateJobStatus(
  jobId: string, 
  status: 'completed' | 'failed', 
  result?: JobResult, 
  errorMessage?: string
): Promise<void> {
  try {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    };

    if (result) updateData.result = result;
    if (errorMessage) updateData.error_message = errorMessage;

    const { error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', jobId);

    if (error) {
      console.error(`Failed to update job ${jobId} status:`, error);
    }
  } catch (error) {
    console.error(`Error updating job ${jobId} status:`, error);
  }
}

/**
 * Call AI provider with fallback mechanism
 */
async function callAIProvider(prompt: string): Promise<string> {
  let lastError: Error | null = null;

  for (const provider of AI_PROVIDERS) {
    try {
      console.log(`Trying AI provider: ${provider.name}`);
      
      if (provider.isCloud) {
        // Cloud provider (Gemini, OpenAI, etc.)
        const response = await fetch(provider.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.apiKey}`,
            ...(provider.name === 'gemini' && { 'x-goog-api-key': provider.apiKey })
          },
          body: JSON.stringify({
            ...(provider.name === 'gemini' ? {
              contents: [{ parts: [{ text: prompt }] }]
            } : {
              messages: [{ role: 'user', content: prompt }],
              max_tokens: 2000,
              temperature: 0.7
            })
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json() as Record<string, unknown>;
        
        // Extract content based on provider
        if (provider.name === 'gemini') {
          const candidates = result.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          return candidates?.[0]?.content?.parts?.[0]?.text || 'No content generated';
        } else {
          const choices = result.choices as Array<{ message?: { content?: string } }>;
          return choices?.[0]?.message?.content || 'No content generated';
        }
      } else {
        // Local provider (LM Studio)
        const response = await fetch(`${provider.endpoint}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2000,
            temperature: 0.7,
            stream: false
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json() as Record<string, unknown>;
        const choices = result.choices as Array<{ message?: { content?: string } }>;
        return choices?.[0]?.message?.content || 'No content generated';
      }
    } catch (error) {
      console.error(`Provider ${provider.name} failed:`, error);
      lastError = error as Error;
      continue; // Try next provider
    }
  }

  throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
}

/**
 * Process a single job
 */
async function processJob(job: Job): Promise<void> {
  const startTime = Date.now();
  console.log(`Processing job ${job.id} (type: ${job.type}, attempt: ${job.attempts + 1})`);

  try {
    let result: JobResult;

    switch (job.type) {
      case 'story_generation':
        result = await processStoryGeneration(job.payload as StoryPayload);
        break;
      
      case 'content_analysis':
        result = await processContentAnalysis(job.payload as ContentPayload);
        break;
      
      case 'dataset_processing':
        result = await processDatasetProcessing(job.payload as DatasetPayload);
        break;
      
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }

    await updateJobStatus(job.id, 'completed', result);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Job ${job.id} completed in ${duration}ms`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Job ${job.id} failed:`, errorMessage);
    
    await updateJobStatus(job.id, 'failed', undefined, errorMessage);
  }
}

/**
 * Process story generation job
 */
async function processStoryGeneration(payload: StoryPayload): Promise<StoryResult> {
  const { prompt, characterLimit = 2000, style = 'narrative' } = payload;
  
  const enhancedPrompt = `
Create an engaging ${style} story based on the following prompt. 
Keep it under ${characterLimit} characters and ensure it's appropriate for all audiences.
Focus on positive themes and ethical storytelling.

Prompt: ${prompt}

Story:`;

  const generatedContent = await callAIProvider(enhancedPrompt);
  
  return {
    content: generatedContent,
    metadata: {
      characterCount: generatedContent.length,
      style,
      generatedAt: new Date().toISOString()
    }
  };
}

/**
 * Process content analysis job
 */
async function processContentAnalysis(payload: ContentPayload): Promise<ContentResult> {
  const { content, analysisType = 'sentiment' } = payload;
  
  const analysisPrompt = `
Analyze the following content for ${analysisType}. 
Provide a structured analysis with key insights.

Content: ${content}

Analysis:`;

  const analysis = await callAIProvider(analysisPrompt);
  
  return {
    analysis,
    analysisType,
    contentLength: content.length,
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Process dataset processing job
 */
async function processDatasetProcessing(payload: DatasetPayload): Promise<DatasetResult> {
  const { datasetId, operation = 'classify' } = payload;
  
  // Fetch dataset from Supabase
  const { data: dataset, error } = await supabase
    .from('datasets')
    .select('*')
    .eq('id', datasetId)
    .single();

  if (error || !dataset) {
    throw new Error(`Dataset ${datasetId} not found`);
  }

  const processingPrompt = `
Process the following dataset for ${operation}.
Provide structured output that can be stored in a database.

Dataset: ${JSON.stringify(dataset.content)}

Processing Result:`;

  const result = await callAIProvider(processingPrompt);
  
  return {
    datasetId,
    operation,
    result,
    processedAt: new Date().toISOString()
  };
}

/**
 * Main job processing loop
 */
async function processJobs(): Promise<void> {
  if (shuttingDown) return;

  try {
    // Check if we have capacity for more jobs
    const availableSlots = MAX_CONCURRENCY - running;
    if (availableSlots <= 0) {
      return; // No capacity, wait for next cycle
    }

    // Fetch available jobs
    const jobs = await fetchNextJobs(availableSlots);
    
    if (jobs.length === 0) {
      return; // No jobs to process
    }

    // Process each job concurrently
    const jobPromises = jobs.map(async (job) => {
      // Try to claim the job
      const claimed = await claimJob(job.id);
      if (!claimed) {
        return; // Job was claimed by another worker
      }

      running++;
      try {
        await processJob(job);
      } finally {
        running--;
      }
    });

    await Promise.allSettled(jobPromises);

  } catch (error) {
    console.error('Error in processJobs:', error);
  }
}

/**
 * Health check endpoint
 */
async function healthCheck(): Promise<{ status: string; running: number; timestamp: string }> {
  return {
    status: shuttingDown ? 'shutting_down' : 'healthy',
    running,
    timestamp: new Date().toISOString()
  };
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(): Promise<void> {
  console.log('Received shutdown signal, waiting for jobs to complete...');
  shuttingDown = true;

  // Wait for running jobs to complete (max 30 seconds)
  const timeout = 30000;
  const start = Date.now();
  
  while (running > 0 && (Date.now() - start) < timeout) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Waiting for ${running} jobs to complete...`);
  }

  if (running > 0) {
    console.log(`Force shutdown with ${running} jobs still running`);
  } else {
    console.log('All jobs completed, shutting down gracefully');
  }

  process.exit(0);
}

/**
 * Start the job scheduler
 */
async function startScheduler(): Promise<void> {
  console.log('🚀 Starting Quantum Rishi Job Scheduler');
  console.log(`Configuration:
    - Max Concurrency: ${MAX_CONCURRENCY}
    - Poll Interval: ${POLL_INTERVAL}ms
    - Max Retries: ${MAX_RETRIES}
    - AI Providers: ${AI_PROVIDERS.map(p => p.name).join(', ')}
  `);

  // Setup graceful shutdown
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);

  // Test database connection
  try {
    const { error } = await supabase.from('jobs').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  // Start main processing loop
  const processInterval = setInterval(async () => {
    if (!shuttingDown) {
      await processJobs();
    }
  }, POLL_INTERVAL);

  // Cleanup interval on shutdown
  process.on('exit', () => {
    clearInterval(processInterval);
  });

  console.log('✅ Job scheduler started successfully');
}

// Export for use in other modules
export {
  startScheduler,
  healthCheck,
  processJob
};

export type { Job };

// Start if this file is run directly
if (require.main === module) {
  startScheduler().catch(error => {
    console.error('Fatal error starting scheduler:', error);
    process.exit(1);
  });
}