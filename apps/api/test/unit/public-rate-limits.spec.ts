import fastify from 'fastify';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ReviewsController } from '../../src/modules/reviews/reviews.controller';
import { EnquiriesController } from '../../src/modules/enquiries/enquiries.controller';

describe('public request limits', () => {
  it('limits submissions without applying the submission quota to browsing', () => {
    expect(
      Reflect.getMetadata(
        GUARDS_METADATA,
        ReviewsController.prototype.submitReview,
      ),
    ).toContain(ThrottlerGuard);
    expect(
      Reflect.getMetadata(
        GUARDS_METADATA,
        EnquiriesController.prototype.createEnquiry,
      ),
    ).toContain(ThrottlerGuard);
    expect(
      Reflect.getMetadata(
        GUARDS_METADATA,
        EnquiriesController.prototype.recordWhatsappEnquiry,
      ),
    ).toContain(ThrottlerGuard);
    expect(
      Reflect.getMetadata(GUARDS_METADATA, ReviewsController) || [],
    ).not.toContain(ThrottlerGuard);
    expect(
      Reflect.getMetadata(
        GUARDS_METADATA,
        ReviewsController.prototype.getProductReviews,
      ) || [],
    ).not.toContain(ThrottlerGuard);
  });
  it('separates real clients behind the loopback proxy without trusting remote spoofed IPs', async () => {
    const app = fastify({ trustProxy: 'loopback' });
    app.get('/ip', (request) => ({ ip: request.ip }));
    try {
      const proxied = await app.inject({
        method: 'GET',
        url: '/ip',
        remoteAddress: '127.0.0.1',
        headers: { 'x-forwarded-for': '198.51.100.10, 203.0.113.7' },
      });
      expect(proxied.json().ip).toBe('203.0.113.7');
      const direct = await app.inject({
        method: 'GET',
        url: '/ip',
        remoteAddress: '192.0.2.5',
        headers: { 'x-forwarded-for': '203.0.113.7' },
      });
      expect(direct.json().ip).toBe('192.0.2.5');
    } finally {
      await app.close();
    }
  });
});
