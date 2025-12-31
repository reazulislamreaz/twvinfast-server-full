// // src/stripe/stripe.module.ts
// import { Module } from '@nestjs/common';
// import Stripe from 'stripe';
// import { StripeService } from './stripe.service';

// @Module({
//   providers: [
//     {
//       provide: 'STRIPE_CLIENT',
//       useFactory: () => {
//         return new Stripe(process.env.STRIPE_SECRET_KEY as string, {
//           apiVersion: '2023-10-16' as any,
//         });
//       },
//     },
//     StripeService,
//   ],
//   exports: ['STRIPE_CLIENT', StripeService],
// })
// export class StripeModule {}

// src/stripe/stripe.module.ts
import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';

@Module({
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
