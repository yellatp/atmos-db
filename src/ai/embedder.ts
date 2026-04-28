import { AtmosError } from '../utils/errors';

export class AtmosEmbedder {
  private model: string;

  constructor(private aiBinding: any, modelName?: string) {
    this.model = modelName || '@cf/baai/bge-base-en-v1.5';
  }

  async embed(text: string): Promise<number[]> {
    try {
      if (!text || text.trim() === '') {
        throw new Error('Text to embed cannot be empty');
      }
      const response = await this.aiBinding.run(this.model, { text: [text] });
      return response.data[0];
    } catch (err) {
      throw new AtmosError('EMBED_ERROR', 'Failed to generate embedding', err);
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    try {
      if (!texts.length) return [];
      const response = await this.aiBinding.run(this.model, { text: texts });
      return response.data;
    } catch (err) {
      throw new AtmosError('EMBED_ERROR', 'Failed to generate batch embeddings', err);
    }
  }
}
