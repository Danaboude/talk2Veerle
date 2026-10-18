import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OfferingsService } from './offerings.service';
import { BOOKING_LINKS } from '../config/booking-links';

describe('OfferingsService booking links', () => {
    let service: OfferingsService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
        service = TestBed.inject(OfferingsService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('reads saved database links and dates, with email contact for undated open offers', () => {
        service.getPublishedForAudience('individuen').subscribe(rows => {
            expect(rows[0].contactLink).toBe(BOOKING_LINKS.nature90);
            expect(rows[0].eventDate).toBe('26 november 2026');
            expect(rows[1].contactLink).toBe('mailto:veerle@talk2.be');
            expect(rows[1].eventDate).toBe('');
        });
        http.expectOne('/api/offerings-api?audience=individuen&published=true').flush([
            { id: 'walk', event_date: '26 november 2026', contact_link: BOOKING_LINKS.nature90 },
            { id: 'open-group', event_date: '', contact_link: 'veerle@talk2.be' },
        ]);
    });

    it('does not send visitors to a generic calendar or unsafe links', () => {
        service.getPublishedForAudience('individuen').subscribe(rows => {
            expect(rows.every(row => row.contactLink === '')).toBe(true);
        });
        http.expectOne('/api/offerings-api?audience=individuen&published=true').flush([
            { id: 'generic', contact_link: 'https://cal.com/talk2' },
            { id: 'missing', contact_link: '' },
            { id: 'unsafe', contact_link: 'javascript:alert(1)' },
        ]);
    });

    it('preserves database fields when an admin loads and saves an offer', () => {
        service.getAll().subscribe(rows => service.save(rows[0]).subscribe());
        http.expectOne('/api/offerings-api').flush([
            { id: 'walk', event_date: '26 november 2026', contact_link: BOOKING_LINKS.nature90 },
        ]);
        const save = http.expectOne('/api/offerings-api');
        expect(save.request.body.eventDate).toBe('26 november 2026');
        expect(save.request.body.contactLink).toBe(BOOKING_LINKS.nature90);
        save.flush({ success: true });
    });
});
