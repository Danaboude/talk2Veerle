import { FAQ_ITEMS } from './faq-items';
import { SeoData, SITE_NAME, SITE_URL } from './seo.service';

const ORG_ID = `${SITE_URL}/#praktijk`;
const PERSON_ID = `${SITE_URL}/over-mij#veerle-follens`;

const person = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: 'Veerle Follens',
  jobTitle: 'Psychotherapeut, coach en trainer',
  url: `${SITE_URL}/over-mij`,
  image: `${SITE_URL}/veerle.jpg`,
  worksFor: { '@id': ORG_ID },
  knowsLanguage: ['nl', 'fr', 'en'],
  knowsAbout: [
    'Therapie en coaching in de natuur',
    'Somatic Experiencing',
    'Verbindende communicatie',
    'Stress en overprikkeling',
    'Neurodivergentie',
    'Koppel- en relatiebegeleiding',
  ],
};

const business = {
  '@type': ['ProfessionalService', 'LocalBusiness'],
  '@id': ORG_ID,
  name: SITE_NAME,
  alternateName: ['Talk2', 'Talk2 Veerle Follens'],
  description:
    'Therapie, coaching en training in de natuur, binnen en online voor volwassenen, koppels, professionals en teams. Lichaamsgericht en afgestemd op overprikkeling, stress, trauma en neurodivergentie.',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/nature.jpg`,
  email: 'veerle@talk2.be',
  telephone: '+32473564186',
  vatID: 'BE0633453649',
  founder: { '@id': PERSON_ID },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Frans Blocklaan 14',
    postalCode: '2620',
    addressLocality: 'Hemiksem',
    addressCountry: 'BE',
  },
  areaServed: [
    { '@type': 'AdministrativeArea', name: 'Provincie Antwerpen' },
    { '@type': 'Country', name: 'België' },
  ],
  availableLanguage: ['nl', 'fr', 'en'],
  paymentAccepted: 'Cash, Payconiq',
  sameAs: ['https://cal.com/talk2', 'https://www.facebook.com/groups/393215694627781'],
  knowsAbout: person.knowsAbout,
};

const website = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  inLanguage: 'nl-BE',
  publisher: { '@id': ORG_ID },
};

const crumbs = (name: string, path: string) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
    { '@type': 'ListItem', position: 2, name, item: `${SITE_URL}${path}` },
  ],
});

const page = (type: string, path: string, name: string, description: string) => ({
  '@context': 'https://schema.org',
  '@type': type,
  '@id': `${SITE_URL}${path}#webpage`,
  url: `${SITE_URL}${path}`,
  name,
  description,
  inLanguage: 'nl-BE',
  isPartOf: { '@id': `${SITE_URL}/#website` },
  about: { '@id': ORG_ID },
});

const HOME: SeoData = {
  title: 'Therapie en coaching in de natuur | TALK2 Antwerpen',
  description:
    'Therapie, coaching en training in de natuur en online, regio Antwerpen. Bij stress, overprikkeling of vastgelopen communicatie. Boek een intake bij Veerle Follens.',
  path: '/',
  image: `${SITE_URL}/nature.jpg`,
  jsonLd: [
    { '@context': 'https://schema.org', '@graph': [business, person, website] },
    page('WebPage', '/', 'TALK2: therapie, coaching en training', 'Therapie, coaching en training in de natuur, regio Antwerpen.'),
  ],
};

const AANBOD: SeoData = {
  title: 'Aanbod: individueel, koppels en professionals | TALK2',
  description:
    'Individuele begeleiding, koppelbegeleiding, coaching voor professionals en trajecten voor teams en groepen. In de natuur, binnen of online. Bekijk het aanbod en boek.',
  path: '/aanbod',
  jsonLd: [
    page('CollectionPage', '/aanbod', 'Aanbod van TALK2', "Begeleiding voor individuen, duo's en koppels, professionals, organisaties en groepen."),
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Aanbod van TALK2',
      itemListElement: [
        ['Individuele begeleiding', 'Individuele sessies in de natuur, binnen of online, en open groepsaanbod.', '/aanbod#individuen'],
        ["Duo's en koppels", "Sessies en trajecten van bescherming naar verbinding voor koppels, duo's en ouder-kindrelaties.", '/aanbod#duos'],
        ['Professionals die met mensen werken', 'Coaching en begeleiding voor therapeuten, coaches, leerkrachten, begeleiders en leidinggevenden.', '/aanbod#professionals'],
        ['Organisaties en groepen', 'Team- en groepsbegeleiding, trainingen en bezinningsbegeleiding op maat.', '/aanbod#organisaties'],
      ].map(([name, description, url], i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: { '@type': 'Service', name, description, url: `${SITE_URL}${url}`, provider: { '@id': ORG_ID }, areaServed: 'Antwerpen' },
      })),
    },
    crumbs('Aanbod', '/aanbod'),
  ],
};

const AANPAK: SeoData = {
  title: 'Aanpak: BOS, ZEE en WEI, van stress naar verbinding | TALK2',
  description:
    'De aanpak van TALK2 in drie bewegingen: Bewust Omgaan met Stress (BOS), Zelfverbonden Echt luisteren en Echt spreken (ZEE) en Weten, Ervaren en Integreren (WEI).',
  path: '/aanpak',
  jsonLd: [
    page('WebPage', '/aanpak', 'Aanpak van TALK2: BOS, ZEE en WEI', 'Werken met lichaam, zenuwstelsel en communicatie in drie bewegingen.'),
    crumbs('Aanpak', '/aanpak'),
  ],
};

const OVER_MIJ: SeoData = {
  title: 'Over Veerle Follens, psychotherapeut en coach | TALK2',
  description:
    'Maak kennis met Veerle Follens: meer dan tien jaar ervaring als psychotherapeut, coach en trainer. Werkt lichaamsgericht, in de natuur en met verbindende communicatie.',
  path: '/over-mij',
  image: `${SITE_URL}/veerle.jpg`,
  jsonLd: [
    { '@context': 'https://schema.org', '@type': 'ProfilePage', '@id': `${SITE_URL}/over-mij#webpage`, url: `${SITE_URL}/over-mij`, inLanguage: 'nl-BE', mainEntity: person },
    crumbs('Over mij', '/over-mij'),
  ],
};

const CONTACT: SeoData = {
  title: 'Contact en veelgestelde vragen | TALK2 Hemiksem',
  description:
    'Contact met TALK2 in Hemiksem, Frans Blocklaan 14. Mail, bel of boek een intake. Antwoorden over tarieven, terugbetaling, annuleren en sessies in de natuur.',
  path: '/contact',
  jsonLd: [
    page('ContactPage', '/contact', 'Contact met TALK2', 'Contactgegevens en veelgestelde vragen.'),
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'nl-BE',
      mainEntity: FAQ_ITEMS.map(q => ({
        '@type': 'Question',
        name: q.question,
        acceptedAnswer: { '@type': 'Answer', text: q.answer },
      })),
    },
    crumbs('Contact', '/contact'),
  ],
};

export const SEO = { HOME, AANBOD, AANPAK, OVER_MIJ, CONTACT };
