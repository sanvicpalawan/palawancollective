import type { Build, FieldLogEntry, Guide } from "@/db/schema";

export type BuildSeed = Omit<Build, "id" | "createdAt">;
export type GuideSeed = Omit<Guide, "id" | "createdAt" | "verifiedAt"> & { verifiedDaysAgo: number };
export type LogSeed = Omit<FieldLogEntry, "id" | "loggedAt"> & { hoursAgo: number };

/* ------------------------------------------------------------------ */
/* Built environments — proof of execution (case study + story)         */
/* ------------------------------------------------------------------ */

export const buildSeeds: BuildSeed[] = [
  {
    slug: "off-grid-resort-build",
    position: 1,
    title: "Off-Grid Resort Build",
    tags: "Solar, water systems, remote logistics",
    status: "In build",
    location: "Site 01 · Northern Palawan",
    since: "2024",
    summary: "A small resort on a coast with no road, no grid and no piped water. Everything arrives by boat; everything runs on sun and rain.",
    fieldSpec: "18 kWp · 12,000 L · 0 km of road",
    image: "/images/built-resort.jpg",
    imageAlt: "A carpenter working on a timber roof structure",
    specs: [
      { label: "Power", value: "18 kWp solar · 48 kWh LiFePO₄" },
      { label: "Water", value: "12,000 L rain catchment + shallow well" },
      { label: "Access", value: "Boat only · 40 minutes" },
      { label: "Crew", value: "9 people · 2 local families" },
    ],
    sections: [
      {
        heading: "The situation",
        body: [
          "A stretch of coast in northern Palawan with no road, no grid and no piped water. The nearest hardware store is a 40-minute boat ride away, and the landing beach is only usable around high tide.",
          "The brief we gave ourselves: a small resort that runs on sun and rain, is built mostly by people from the next barangay, and can be run by a caretaker when we’re not there.",
        ],
      },
      {
        heading: "What we built",
        body: [
          "An 18 kWp solar array with 48 kWh of LiFePO₄ storage, sized to ride out a full habagat week with the generator as the last resort.",
          "12,000 litres of rainwater catchment plus a shallow well, with filtration and a pump system that has failed — and been fixed — enough times to be boring.",
          "Modular timber and bamboo structures designed around what fits on a bangka and what two people can carry up a beach.",
        ],
      },
      {
        heading: "What broke",
        body: [
          "An inverter overheating in a sealed room. A pump controller lost to a lightning strike across the bay. Salt corroding every exposed connector. A battery monitor that was wrong by 40 points. Ants in the charge controller.",
          "Every one of these is written up in the stories. None of them were the solar panels.",
        ],
      },
      {
        heading: "What’s next",
        body: [
          "Finish villas 3 and 4 before the next habagat. Run a full wet season with guests on site before opening properly. Hand more of the daily operation to the caretaker and the agent layer.",
        ],
      },
    ],
    relatedStories: ["building-a-resort-without-a-road", "what-actually-breaks-off-grid", "habagat-systems-test"],
  },
  {
    slug: "local-business-automation",
    position: 2,
    title: "Local Business Automation",
    tags: "WhatsApp flows, booking systems, AI agents",
    status: "Operational",
    location: "Puerto Princesa · El Nido · Roxas",
    since: "2024",
    summary: "Booking, messaging and payment systems for eleven local businesses — designed for one shared Android phone and prepaid data.",
    fieldSpec: "11 businesses · 1 phone each · 0 laptops",
    image: "/images/built-automation.jpg",
    imageAlt: "A shop owner checking orders on a mobile phone",
    specs: [
      { label: "Businesses live", value: "11" },
      { label: "Channels", value: "WhatsApp · Messenger · GCash" },
      { label: "Approval", value: "Human-in-the-loop by default" },
      { label: "Offline model", value: "Queue + retry" },
    ],
    sections: [
      {
        heading: "The situation",
        body: [
          "Local businesses in Palawan run on WhatsApp, Messenger and one shared Android phone. Most had already paid for booking software nobody used — built for laptops, stable internet and a full-time admin they don’t have.",
        ],
      },
      {
        heading: "What we built",
        body: [
          "WhatsApp-first flows: an agent answers availability and prices, collects details and drafts the booking. The owner approves with one tap. Deposits go out as GCash links. Everything lands in a shared sheet the owner already understands.",
          "Setup happens on-site, in the language the staff use, on the phone they already own.",
        ],
      },
      {
        heading: "What broke",
        body: [
          "Prepaid data running out on the 20th. Staff changing phones without telling anyone. An agent too polite to ask for a deposit. We fixed the first two with process and the third with a firmer template.",
        ],
      },
      {
        heading: "What’s next",
        body: [
          "A shared template library so a new guesthouse can go live in a day, and a simple monthly report showing owners what the system actually did for them.",
        ],
      },
    ],
    relatedStories: ["why-local-businesses-fail-with-tech", "ai-agents-unstable-internet"],
  },
  {
    slug: "palawan-infrastructure-layer",
    position: 3,
    title: "Palawan Infrastructure Layer",
    tags: "Transport, supply chains, coordination",
    status: "Expanding",
    location: "Taytay · El Nido · Coron routes",
    since: "2025",
    summary: "Shared coordination for what every operator on the coast needs — boats, vans and supplies — so nobody runs a half-empty bangka.",
    fieldSpec: "6 boats · 3 van operators · 1 shared queue",
    image: "/images/built-infrastructure.jpg",
    imageAlt: "Colourful outrigger boats moored in a Filipino harbour",
    specs: [
      { label: "Partner boats", value: "6" },
      { label: "Van operators", value: "3" },
      { label: "Shared runs", value: "~40 a month" },
      { label: "Coordination", value: "WhatsApp flow + tide data" },
    ],
    sections: [
      {
        heading: "The situation",
        body: [
          "Every resort and operator on the coast runs its own boats and vans, often half-empty, coordinated across dozens of WhatsApp threads. The boatman gets forty messages a day. Nobody knows who is going where tomorrow.",
        ],
      },
      {
        heading: "What we built",
        body: [
          "A shared coordination layer: tide and wind data pulled every morning, a single request queue fed by a WhatsApp flow (voice notes welcome), and one clear manifest to each boatman and driver the evening before.",
          "Operators can post spare capacity and book space on each other’s runs.",
        ],
      },
      {
        heading: "What broke",
        body: [
          "The first version tried to replace the boatman’s judgment with a schedule. He ignored it — correctly. The system now proposes; he decides.",
        ],
      },
      {
        heading: "What’s next",
        body: [
          "More operators on the queue, cold-chain runs for restaurants, and pooled supply orders so the coast buys cement once, not twelve times.",
        ],
      },
    ],
    relatedStories: ["bangka-logistics-as-a-system", "the-crew-is-the-infrastructure"],
  },
  {
    slug: "digital-physical-integration",
    position: 4,
    title: "Digital + Physical Integration",
    tags: "Agents managing real-world operations",
    status: "Pilot",
    location: "Site 01 + partner properties",
    since: "2025",
    summary: "Agents that watch batteries, water tanks, boat schedules and guest messages — and hand the right problem to the right human.",
    fieldSpec: "7 agents · 4 sensor feeds · 1 caretaker",
    image: "/images/built-integration.jpg",
    imageAlt: "A remote station with solar panels and a communications mast",
    specs: [
      { label: "Signals", value: "Battery · tank level · pump · uplink" },
      { label: "Agents in production", value: "7" },
      { label: "Escalation", value: "WhatsApp to the caretaker" },
      { label: "Human approval", value: "Money, bookings, safety" },
    ],
    sections: [
      {
        heading: "The situation",
        body: [
          "Remote sites fail quietly: a battery drifting low overnight, a tank running dry, a boat pickup nobody confirmed, a guest message unanswered at 2 a.m. The information exists — it just never reaches the right human in time.",
        ],
      },
      {
        heading: "What we built",
        body: [
          "Agents connected to real-world signals: battery state, tank levels, pump status, uplink health, the boat schedule and the guest inbox. Each one has thresholds and a named human to escalate to over WhatsApp.",
          "Agents draft; humans approve anything involving money, bookings or safety.",
        ],
      },
      {
        heading: "What broke",
        body: [
          "Too many alerts in week one — the caretaker muted everything. We cut alerts by 80% and now only page for things that need a human within the hour.",
        ],
      },
      {
        heading: "What’s next",
        body: [
          "Extending the pilot to two partner properties and publishing the playbook, including every threshold we’ve had to change.",
        ],
      },
    ],
    relatedStories: ["ai-agents-unstable-internet", "what-actually-breaks-off-grid"],
  },
];

/* ------------------------------------------------------------------ */
/* Navigating Palawan — the practical layer                              */
/* ------------------------------------------------------------------ */

export const guideSeeds: GuideSeed[] = [
  {
    slug: "getting-there",
    position: 1,
    title: "Getting There",
    kicker: "Flights, boats",
    summary: "Three airports, a handful of ferry routes and a lot of van time. How to choose an entry point based on where you’re actually going.",
    image: "/images/guide-getting-there.jpg",
    imageAlt: "A small propeller aircraft taxiing on a runway surrounded by forest",
    quickFacts: ["PPS · Puerto Princesa — main hub", "ENI · El Nido (Lio) — small, pricier", "USU · Busuanga — for Coron", "Ferries link El Nido and Coron"],
    verifiedDaysAgo: 6,
    sections: [
      {
        heading: "The three entry points",
        body: [
          "Most people fly into Puerto Princesa (PPS). It has the most flights from Manila and Cebu and is usually the cheapest option — but El Nido is five to six hours north by road.",
          "El Nido’s Lio airport (ENI) is small and served by a limited number of turboprop flights from Manila. It costs more, but it saves you most of a day. Baggage allowances are tighter.",
          "For Coron, fly into Busuanga (USU). It’s a separate island group — don’t plan to “pop over” from El Nido without allowing for a ferry day.",
        ],
      },
      {
        heading: "By sea",
        body: [
          "Ferries and fast craft link El Nido and Coron for most of the year; crossings take roughly four to eight hours depending on the vessel. Schedules change with the season and the weather — confirm locally the day before.",
          "In habagat season (roughly June to October), expect cancellations. Build a buffer day into any itinerary that depends on a boat.",
        ],
      },
      {
        heading: "What we tell friends",
        body: [],
        items: [
          "Fly to PPS unless your time is worth more than the fare difference to ENI.",
          "Never schedule an international flight on the same day as a boat crossing.",
          "Carry cash for terminal fees and small vendors — card acceptance drops fast outside Puerto Princesa.",
        ],
      },
    ],
  },
  {
    slug: "moving-around",
    position: 2,
    title: "Moving Around",
    kicker: "Vans, bikes, private",
    summary: "Shared vans, private transfers, scooters and tricycles. What each is good for — and where each will let you down.",
    image: "/images/guide-moving-around.jpg",
    imageAlt: "A tricycle on a rural road under tall green trees",
    quickFacts: ["Shared vans — cheapest, leave when full", "Private van — book the day before", "Scooters — El Nido & Port Barton", "Tricycles — short hops, agree the fare"],
    verifiedDaysAgo: 9,
    sections: [
      {
        heading: "Shared vans",
        body: [
          "The backbone of getting around Palawan. Vans run between Puerto Princesa, Port Barton, San Vicente, Taytay and El Nido. They’re cheap and usually fine — but “departure time” often means “when the van is full”, and luggage rides on the roof.",
        ],
      },
      {
        heading: "Private transfers",
        body: [
          "Worth it for groups, families or anyone with equipment. Book the day before through your accommodation or an operator you trust. Agree the price, the pickup point and whether stops are included before you get in.",
        ],
      },
      {
        heading: "Scooters and tricycles",
        body: [
          "Scooters are the best way to explore around El Nido and Port Barton if you’re an experienced rider. Roads can be steep, wet and unlit after dark. Tricycles cover short hops in town — agree the fare first.",
        ],
      },
      {
        heading: "Boats",
        body: [
          "Most island-hopping tours run on regulated, fixed routes. Private boat hire is possible — choose operators who carry life jackets and a radio, and ask to see both.",
        ],
      },
    ],
  },
  {
    slug: "where-to-stay",
    position: 3,
    title: "Where to Stay",
    kicker: "The ecosystem, eventually",
    summary: "How to choose a base, what “off-grid” should actually mean when you’re paying for it, and the places in our network we’ll vouch for.",
    image: "/images/guide-where-to-stay.jpg",
    imageAlt: "Thatched huts on a quiet beach with mountains behind",
    quickFacts: ["El Nido — busiest, widest range", "Port Barton — slower, smaller", "Taytay — the quiet middle", "Remote coves — boat access only"],
    verifiedDaysAgo: 14,
    sections: [
      {
        heading: "Choosing a base",
        body: [
          "El Nido has the most options and the most people. Port Barton is slower and smaller. Taytay sits quietly in between and is a good base for the northeast coast. Remote coves are beautiful and genuinely off-grid — which means access depends on boats and weather.",
        ],
      },
      {
        heading: "Questions to ask any “eco” resort",
        body: [],
        items: [
          "Where does the power come from at night?",
          "What happens to wastewater?",
          "How do guests get there when the sea is rough?",
          "Who works there — and are they from here?",
        ],
      },
      {
        heading: "Our network",
        body: [
          "We’re building a small network of places we’ve built, automated or stayed at often enough to vouch for. Site 01 opens to guests once its water system has survived a full season with people in it. Subscribe to the dispatch to hear first.",
        ],
      },
    ],
  },
  {
    slug: "infrastructure-realities",
    position: 4,
    title: "Infrastructure Realities",
    kicker: "Internet, power, water",
    summary: "What internet, power and water actually look like on the ground — for travellers, remote workers and anyone thinking of building here.",
    image: "/images/guide-infrastructure.jpg",
    imageAlt: "A metal water tank against a blue sky",
    quickFacts: ["Power cuts — common outside main towns", "Mobile data — decent in town, patchy between", "Satellite internet — widely used by businesses", "Water — wells, rain or trucked in"],
    verifiedDaysAgo: 4,
    sections: [
      {
        heading: "Power",
        body: [
          "Scheduled and unscheduled power interruptions are part of life in much of the province, especially outside Puerto Princesa. Many businesses run generators or solar with batteries. If you work remotely, ask what backs up the Wi-Fi router — not just whether there is Wi-Fi.",
        ],
      },
      {
        heading: "Internet",
        body: [
          "Mobile data from the two main networks is decent in towns and patchy between them. Satellite internet has changed the game for resorts and businesses. For real reliability you want two independent connections.",
        ],
      },
      {
        heading: "Water",
        body: [
          "Many properties rely on wells, rain catchment or trucked water. Drink bottled or filtered. If you’re building, design the water system before anything else — it shapes everything.",
        ],
      },
      {
        heading: "If you’re building",
        body: [],
        items: [
          "Assume no grid. Anything else is a bonus.",
          "Design for salt, heat, humidity — and ants.",
          "Budget for surge protection and keep spares on site.",
          "Plan heavy logistics for the dry season.",
        ],
      },
    ],
  },
  {
    slug: "what-people-dont-tell-you",
    position: 5,
    title: "What People Don’t Tell You",
    kicker: "The honest bits",
    summary: "The things that don’t make it into the travel reels: distances, weather, cash, land — and how long everything really takes.",
    image: "/images/guide-untold.jpg",
    imageAlt: "A dirt road winding through dense tropical jungle",
    quickFacts: ["Distances are measured in hours", "Weather overrules every schedule", "Cash still runs the province", "Everything takes longer"],
    verifiedDaysAgo: 11,
    sections: [
      {
        heading: "Distances lie",
        body: [
          "Palawan is long — over 400 km from tip to tip. A “short” trip on the map can be a five-hour van ride on a winding road.",
        ],
      },
      {
        heading: "Weather is the real schedule",
        body: [
          "The dry season (roughly November to May) is when everything works. The wet season is beautiful and quieter, but boats get cancelled and roads flood. Build buffers into everything.",
        ],
      },
      {
        heading: "Cash and connectivity",
        body: [
          "ATMs exist in the main towns but can run dry on busy weekends. E-wallets like GCash are widely used locally. Carry a cash buffer.",
        ],
      },
      {
        heading: "Land and building",
        body: [
          "Foreign ownership of land is restricted in the Philippines, titles can be complicated, and proper due diligence takes months, not weeks. Work with local lawyers and people who’ve actually built here. Talk to someone who has done it before you wire anyone money.",
        ],
      },
      {
        heading: "Respect the place",
        body: [
          "Much of Palawan’s environment is protected for good reason, and local communities were here long before the resorts. The best projects leave the place better and the people more in control.",
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Field log — short, timestamped operational notes                      */
/* ------------------------------------------------------------------ */

export const logSeeds: LogSeed[] = [
  { key: "seed-001", tag: "Power", location: "Site 01", hoursAgo: 4, text: "Battery bank at 82% at sunset. Generator hasn’t run in 19 days." },
  { key: "seed-002", tag: "Agents", location: "Site 01", hoursAgo: 13, text: "Squall 15:10–15:31. Uplink failed over to 4G; 4 guest replies queued and delivered on reconnect." },
  { key: "seed-003", tag: "Logistics", location: "Taytay", hoursAgo: 27, text: "Boat run 11 of 14 done: 60 bags of cement, 4 lengths of GI pipe, one crate of mangoes nobody ordered." },
  { key: "seed-004", tag: "Automation", location: "Roxas", hoursAgo: 41, text: "Bakery live on WhatsApp pre-orders. First three orders came in before 6 a.m." },
  { key: "seed-005", tag: "Water", location: "Site 01", hoursAgo: 56, text: "48 mm of rain overnight. Tanks at 100%, overflow diverted to the garden beds." },
  { key: "seed-006", tag: "Crew", location: "Site 01", hoursAgo: 74, text: "Caretaker reset the pump controller on his own using the Tagalog checklist. Nobody had to be called." },
  { key: "seed-007", tag: "Automation", location: "El Nido", hoursAgo: 98, text: "Van operator: zero double bookings this month. Last month there were six." },
  { key: "seed-008", tag: "Build", location: "Site 01", hoursAgo: 122, text: "Roof framing on villa 3 finished. Waiting on nipa shingles from the next cove." },
  { key: "seed-009", tag: "Agents", location: "Remote", hoursAgo: 150, text: "Cut caretaker alerts by 80%. He’s stopped muting the group chat." },
  { key: "seed-010", tag: "Logistics", location: "El Nido", hoursAgo: 171, text: "Shared run with a neighbouring resort: one boat instead of two, fuel split." },
];
