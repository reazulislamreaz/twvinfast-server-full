// import { Injectable, Logger } from '@nestjs/common';
// import OpenAI from 'openai';

// @Injectable()
// export class AiService {
//   private logger = new Logger('AI');
//   private client: OpenAI;

//   constructor() {
//     this.client = new OpenAI({
//       apiKey: process.env.OPENAI_API_KEY,
//     });
//   }

//   async generateEmailReply(prompt: string, meta?: { thread_id?: number }) {
//     this.logger.log(
//       `🤖 Generating AI reply for thread: ${meta?.thread_id ?? 'N/A'}`,
//     );

//     const completion = await this.client.chat.completions.create({
//       model: 'gpt-4o-mini',
//       messages: [
//         {
//           role: 'system',
//           content:
//             'You are an AI assistant that writes professional, concise, helpful email replies for a legal/AI email platform.',
//         },
//         {
//           role: 'user',
//           content: prompt,
//         },
//       ],
//       temperature: 0.4,
//     });

//     return completion.choices[0].message.content || '';
//   }
// }
