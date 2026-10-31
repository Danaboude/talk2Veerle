# Claude Code Implementation Prompt: Website & Booking System Updates

## Context & Objectives
You are assisting in executing a set of website design fixes, booking flow adjustments, and content updates based on a design and functionality review. The goal is to make the website clean, easy to navigate, and clear for neurodivergent clients without causing confusion.

---

## 1. Hero / Homepage Bug Fix
- **Issue**: There is a stray letter "F" rendered on the left side of the hero/homepage section.
- **Action**: Locate the homepage layout component (hero section) and clean up the extra code/text node causing the stray "F" to render.

---

## 2. Contact & Email Form Integration
- **Issue**: General inquiry and specific offer CTAs need reliable email handling. for email it hsoud sue veerle@talk2.be right?
- **Action**:
  - Verify and test the email CTA behavior. When users submit/click, it should reliably initiate an email with the destination address pre-filled (`mailto:` link or email handler).
  - For offers/workshops where no fixed date or Cal.com event exists yet, ensure the action button explicitly triggers a direct email flow (`mailto:`) instead of redirecting to an incomplete Cal.com calendar.

---

## 3. Cal.com Booking Flow & Scheduling Simplification
- **Issue**: Current green CTA links (e.g., "Book an intake") default rigidly to "Couple Therapy (Evening)", creating confusion for daytime Duo sessions (Parent & Child).
- **Action**:
  - Simplify the overall booking structure to avoid high maintenance.
  - Remove overly granular links per individual offer that require constant re-linking.
  - Implement a streamlined scheduling hub or primary button: **"First intake 60 minutes"** linking directly to the main Cal.com page, allowing clients to select their session type there.
  - Ensure clear separation/labeling between:
    - **Duo Therapy**: Parent + Child (Daytime, Nature sessions).
    - **Couple Therapy**: Evening sessions.

---

## 4. FAQ / Q&A Section Update
- **Action**: Add a new question to the Q&A section regarding session languages:
  - **Question**: "In which languages are the sessions conducted?"
  - **Answer**: State clearly that sessions are offered in 3 languages (English, Flemish/Dutch, French).

---

## 5. Media & Content Streamlining
- **Action**: Omit the voiceover audio element for the round table / group session section for now to keep the UI clean and simple.

---

## 6. Client Guide / Documentation Request
- **Action**: Include inline code comments or generate a simple user guide explaining:
  - How to create and map Cal.com meeting links to website CTAs for future offers.
  - How to configure CTAs to switch between `mailto:` links and Cal.com booking URLs.
  - Troubleshooting tip for Vercel deployment updates (instructing users to log out and log back into Vercel dashboard if updates don't immediately reflect).
## 7.
"Wat versta je onder verbindende communicatie?

Verbindende communicatie is de intentie om noch je eigen gevoelens en behoeften, noch die van de ander geweld aan te doen. Ze nodigt uit om gevoelens en behoeften te erkennen en te aanvaarden, zonder druk op jezelf of de ander te leggen om aanwezige behoeften te vervullen."

Could you add this as a separate FAQ, either above or below the other FAQ:

"Wat bedoel je met neurodivergent?"