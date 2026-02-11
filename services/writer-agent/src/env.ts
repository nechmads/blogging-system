import type { WriterAgent } from './agent/writer-agent'
import type { DataLayerApi } from '@hotmetal/data-layer'

export interface WriterAgentEnv {
  DAL: DataLayerApi
  WRITER_AGENT: DurableObjectNamespace<WriterAgent>
  AI: Ai
  IMAGE_BUCKET: R2Bucket
  ANTHROPIC_API_KEY: string
  CMS_URL: string
  CMS_API_KEY: string
  WRITER_API_KEY: string
  ALEXANDER_API_URL: string
  ALEXANDER_API_KEY: string
}
