import { Atmos } from './atmos';

export async function handleCronTrigger(event: any, env: any, ctx: any) {
  // Check triggers based on schedule
  // if (event.cron === "0 * * * *") {

  const atmos = new Atmos({
    bindings: env
  });

  try {
    // Analytics sync is currently disabled in v0.1
    // Future roadmap: Sync tables to R2 Data Lake
    console.log('Cron trigger executed');
  } catch (error) {
    console.error('Cron trigger failed:', error);
  }
}
