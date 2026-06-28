import { describe, it, expect } from 'vitest';
import { decodeJobContentHtml, stripHtml } from '../utils/html.js';

describe('stripHtml', () => {
    it('removes HTML tags and decodes common entities', () => {
        expect(
            stripHtml(
                '<p>Experience with <strong>Python</strong> &amp; PostgreSQL.</p>',
            ),
        ).toBe('Experience with Python & PostgreSQL.');
    });

    it('handles Greenhouse entity-encoded HTML content', () => {
        const greenhouseContent =
            '&lt;h2&gt;Who we are&lt;/h2&gt;\n' +
            '&lt;p&gt;Stripe is a financial platform for everyone&#39;s reach.&lt;/p&gt;\n' +
            '&lt;ul&gt;&lt;li&gt;Own the full sales cycle&lt;/li&gt;&lt;/ul&gt;';

        expect(stripHtml(greenhouseContent)).toBe(
            "Who we are Stripe is a financial platform for everyone's reach. Own the full sales cycle",
        );
    });

    it('decodes chained entities like &amp;nbsp;', () => {
        expect(stripHtml('&lt;p&gt;Grow revenue&amp;nbsp;today&lt;/p&gt;')).toBe(
            'Grow revenue today',
        );
    });

    it('returns an empty string for missing content', () => {
        expect(stripHtml('')).toBe('');
        expect(stripHtml(null)).toBe('');
    });
});

describe('decodeJobContentHtml', () => {
    it('decodes entity-encoded HTML while preserving tags', () => {
        const greenhouseContent =
            '&lt;h2&gt;Who we are&lt;/h2&gt;\n' +
            '&lt;p&gt;Stripe is a financial platform for everyone&#39;s reach.&lt;/p&gt;\n' +
            '&lt;ul&gt;&lt;li&gt;Own the full sales cycle&lt;/li&gt;&lt;/ul&gt;';

        expect(decodeJobContentHtml(greenhouseContent)).toBe(
            "<h2>Who we are</h2>\n" +
                "<p>Stripe is a financial platform for everyone's reach.</p>\n" +
                '<ul><li>Own the full sales cycle</li></ul>',
        );
    });

    it('returns an empty string for missing content', () => {
        expect(decodeJobContentHtml('')).toBe('');
        expect(decodeJobContentHtml(null)).toBe('');
    });
});
